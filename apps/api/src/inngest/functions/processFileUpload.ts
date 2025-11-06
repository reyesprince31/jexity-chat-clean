import { inngest } from "../client";
import { createEmbeddingsBatch } from "../../lib/embeddings";
import { PDFParse } from "pdf-parse";
import { downloadFileFromStorage } from "../../lib/storage";
import { getDocumentById } from "../../lib/database";
import { chunkText, estimateTokenCount, buildPageMapping } from "../../lib/chunking";
import { PrismaClient } from "../../generated/prisma/client";

// Reuse single Prisma instance to avoid connection pool issues
const prisma = new PrismaClient();

export const processFileUpload = inngest.createFunction(
  {
    id: "process-document",
    name: "Process Document",
  },
  { event: "app/document.process" },
  async ({ event, step }) => {
    const { documentId } = event.data;

    try {
      // Step 1: Fetch document from database
      const documentResult = await step.run("fetch-document", async () => {
      console.log(`Fetching document with ID: ${documentId}`);

      const document = await getDocumentById(documentId);

      if (!document) {
        throw new Error(`Document not found with ID: ${documentId}`);
      }

      console.log(
        `Document found: ${document.filename} (${document.mimetype})`
      );
      console.log(`Storage path: ${document.storage_path}`);

      return document;
    });

    const { filename, mimetype, storage_path: storagePath } = documentResult;

    // Step 2: Download file from storage
    const fileBufferBase64 = await step.run("download-file", async () => {
      console.log(`Downloading file from storage: ${storagePath}`);

      const buffer = await downloadFileFromStorage(storagePath);

      console.log(`File downloaded: ${buffer.length} bytes`);

      // Return as base64 to ensure proper serialization across Inngest steps
      return buffer.toString("base64");
    });

    // Step 3: Process file content and extract text
    const processResult = await step.run("process-file-content", async () => {
      // Convert base64 back to Buffer
      const fileBuffer = Buffer.from(fileBufferBase64, "base64");

      console.log(`Processing file content for: ${filename}`);
      console.log(`Buffer length: ${fileBuffer.length} bytes`);

      // Check if file is text-based or PDF
      const isTextFile =
        mimetype.includes("text") ||
        mimetype.includes("markdown") ||
        filename.endsWith(".md") ||
        filename.endsWith(".txt");

      const isPdf = mimetype === "application/pdf" || filename.endsWith(".pdf");

      console.log(`Filename: ${filename}`);
      console.log(`Mimetype: ${mimetype}`);
      console.log(`Is text file: ${isTextFile}`);
      console.log(`Is PDF: ${isPdf}`);

      let extractedText = "";
      let canCreateEmbedding = false;
      let pageTexts: string[] | undefined;

      if (isTextFile) {
        extractedText = fileBuffer.toString("utf-8");
        canCreateEmbedding = true;
        console.log(`Processing text content for: ${filename}`);
        console.log(
          `Extracted text length: ${extractedText.length} characters`
        );
        console.log(`First 100 chars: ${extractedText.substring(0, 100)}`);
      } else if (isPdf) {
        try {
          console.log(`Extracting text from PDF: ${filename}`);
          // PDFParse v2 expects options object with data property
          const parser = new PDFParse({ data: fileBuffer });
          const result = await parser.getText();

          // Extract per-page text for page tracking
          if (result.pages && Array.isArray(result.pages)) {
            pageTexts = result.pages.map(page => page.text || '');
            console.log(`Extracted ${result.pages.length} pages from PDF`);
          }

          extractedText = result.text;
          canCreateEmbedding = true;

          const info = await parser.getInfo();
          console.log(
            `Extracted ${extractedText.length} characters from PDF (${info.pages} pages)`
          );
          console.log(`First 100 chars: ${extractedText.substring(0, 100)}`);
        } catch (error) {
          console.error(`Error extracting text from PDF: ${error}`);
          extractedText = "";
          canCreateEmbedding = false;
        }
      } else {
        // Skip text extraction for non-text, non-PDF files
        console.log(
          `Unsupported file type (${mimetype}). Skipping text extraction.`
        );
      }

      const textLength = extractedText.length;

      // Store extracted text in database immediately to avoid returning large text
      await prisma.documents.update({
        where: { id: documentId },
        data: {
          extracted_text: extractedText || null,
          extracted_text_length: textLength,
          updated_at: new Date(),
        },
      });

      console.log(`Stored extracted text (${textLength} characters)`);

      // Return metadata and page texts (for page mapping)
      return {
        textLength,
        canCreateEmbedding,
        pageTexts, // Array of per-page text (PDFs only)
      };
    });

    // Step 4: Chunk, create embeddings, and store
    let chunkCount = 0;

    if (processResult.canCreateEmbedding) {
      chunkCount = await step.run("chunk-embed-store", async () => {
        // Fetch the extracted text from database
        const doc = await prisma.documents.findUnique({
          where: { id: documentId },
          select: { extracted_text: true },
        });

        if (!doc?.extracted_text) {
          throw new Error("No extracted text found in database");
        }

        // Build page mapping if page texts are available (PDFs)
        let pageMapping;
        if (processResult.pageTexts && processResult.pageTexts.length > 0) {
          pageMapping = buildPageMapping(processResult.pageTexts);
          console.log(`Built page mapping with ${pageMapping.totalPages} pages`);
        }

        // Chunk the text with optional page mapping
        console.log(`Chunking text for: ${filename}`);
        const chunks = await chunkText(doc.extracted_text, pageMapping);
        console.log(`Created ${chunks.length} chunks`);

        // Log page number info for first few chunks
        if (pageMapping && chunks.length > 0) {
          const sampleSize = Math.min(3, chunks.length);
          console.log(`Sample chunks with page numbers:`);
          for (let i = 0; i < sampleSize; i++) {
            const chunk = chunks[i];
            if (chunk?.metadata.pageNumber) {
              const pageInfo = chunk.metadata.pageEnd
                ? `pages ${chunk.metadata.pageNumber}-${chunk.metadata.pageEnd}`
                : `page ${chunk.metadata.pageNumber}`;
              console.log(`  Chunk ${i}: ${pageInfo}`);
            }
          }
        }

        const chunkContents = chunks.map(chunk => chunk.content);

        // Create embeddings in batch (THIS IS THE SLOW PART - ~60-90 seconds)
        console.log(`Creating embeddings for ${chunks.length} chunks...`);
        const embeddingStartTime = Date.now();
        const embeddings = await createEmbeddingsBatch(chunkContents);
        const embeddingTime = ((Date.now() - embeddingStartTime) / 1000).toFixed(2);
        console.log(
          `✓ Created ${embeddings.length} embeddings in ${embeddingTime}s (${embeddings[0]?.length || 0} dimensions)`
        );

        // Delete existing chunks for this document (in case of reprocessing)
        await prisma.document_chunks.deleteMany({
          where: { document_id: documentId },
        });

        console.log(`Storing ${chunks.length} chunks in database...`);
        const storeStartTime = Date.now();

        // Build VALUES rows for bulk insert (10x faster than individual inserts)
        const values: string[] = [];
        const params: (string | number)[] = [];
        let paramIndex = 1;

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = embeddings[i];

          if (!chunk) {
            throw new Error(`Missing chunk at index ${i}`);
          }

          if (!embedding) {
            throw new Error(`Missing embedding for chunk ${i}`);
          }

          const embeddingString = `[${embedding.join(',')}]`;

          values.push(
            `(gen_random_uuid(), $${paramIndex}::uuid, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}::vector, $${paramIndex + 5}::jsonb, NOW())`
          );

          params.push(
            documentId,
            chunk.metadata.chunkIndex,
            chunk.content,
            estimateTokenCount(chunk.content),
            embeddingString,
            JSON.stringify(chunk.metadata)
          );

          paramIndex += 6;
        }

        // Execute bulk insert with all chunks in a single query
        await prisma.$executeRawUnsafe(
          `INSERT INTO document_chunks (id, document_id, chunk_index, content, token_count, embedding, metadata, created_at)
           VALUES ${values.join(', ')}`,
          ...params
        );

        const storeTime = ((Date.now() - storeStartTime) / 1000).toFixed(2);
        console.log(`✓ Stored ${chunks.length} chunks in ${storeTime}s (bulk insert)`);

        return chunks.length;
      });
    } else {
      console.log(
        `Skipping embedding creation for unsupported file: ${filename}`
      );
    }

    // Step 5: Update document metadata with final status
    await step.run("update-document-metadata", async () => {
      console.log(`Updating document metadata for: ${filename}`);

      await prisma.documents.update({
        where: { id: documentId },
        data: {
          has_embedding: chunkCount > 0,
          updated_at: new Date(),
        },
      });

      console.log(`Document updated with ID: ${documentId}`);
      console.log(`Has embedding: ${chunkCount > 0}`);
      console.log(`Chunk count: ${chunkCount}`);
    });

    // Return minimal data to avoid "request body too large" error
    return {
      success: true,
      message: "Document processed successfully",
      documentId: documentId,
      filename: filename,
      extractedTextLength: processResult.textLength,
      hasEmbedding: chunkCount > 0,
      chunkCount: chunkCount,
    };
    } catch (error) {
      // If processing fails, delete the document to allow re-uploading
      console.error(`Error processing document ${documentId}:`, error);

      try {
        console.log(`Cleaning up failed document: ${documentId}`);
        await prisma.documents.delete({
          where: { id: documentId },
        });
        console.log(`Successfully deleted failed document: ${documentId}`);
      } catch (deleteError) {
        console.error(`Failed to delete document ${documentId}:`, deleteError);
        // Continue to throw the original error even if cleanup fails
      }

      // Re-throw the original error
      throw error;
    }
  }
);
