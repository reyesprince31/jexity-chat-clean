import { inngest } from "../client";
import { createEmbeddingsBatch } from "../../lib/embeddings";
import { PDFParse } from "pdf-parse";
import { downloadFileFromStorage } from "../../lib/storage";
import { getDocumentById } from "../../lib/database";
import { chunkText, estimateTokenCount } from "../../lib/chunking";
import { PrismaClient } from "../../generated/prisma/client";

const prisma = new PrismaClient();

export const processFileUpload = inngest.createFunction(
  {
    id: "process-document",
    name: "Process Document",
  },
  { event: "app/document.process" },
  async ({ event, step }) => {
    const { documentId } = event.data;

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

      return {
        extractedText,
        textLength: extractedText.length,
        canCreateEmbedding,
      };
    });

    // Step 4: Chunk text and create embeddings (only for supported files)
    let chunkingResult = null;

    if (processResult.canCreateEmbedding && processResult.extractedText) {
      chunkingResult = await step.run("chunk-and-embed", async () => {
        const { extractedText } = processResult;

        console.log(`Chunking text for: ${filename}`);
        const chunks = await chunkText(extractedText);
        console.log(`Created ${chunks.length} chunks for ${filename}`);

        // Extract chunk content for batch embedding
        const chunkContents = chunks.map(chunk => chunk.content);

        console.log(`Creating embeddings for ${chunks.length} chunks...`);
        const embeddings = await createEmbeddingsBatch(chunkContents);
        console.log(
          `Created ${embeddings.length} embeddings (${embeddings[0]?.length || 0} dimensions each)`
        );

        return {
          chunks,
          embeddings,
        };
      });
    } else {
      console.log(
        `Skipping embedding creation for unsupported file: ${filename}`
      );
    }

    // Step 5: Store chunks with embeddings in database
    if (chunkingResult) {
      await step.run("store-chunks", async () => {
        console.log(`Storing ${chunkingResult.chunks.length} chunks in database...`);

        // Prepare chunks for batch insert
        const chunksToInsert = chunkingResult.chunks.map((chunk, index) => {
          const embedding = chunkingResult.embeddings[index];
          if (!embedding) {
            throw new Error(`Missing embedding for chunk ${index}`);
          }
          const embeddingString = `[${embedding.join(',')}]`;

          return {
            document_id: documentId,
            chunk_index: chunk.metadata.chunkIndex,
            content: chunk.content,
            token_count: estimateTokenCount(chunk.content),
            embedding: embeddingString,
            metadata: chunk.metadata,
          };
        });

        // Delete existing chunks for this document (in case of reprocessing)
        await prisma.document_chunks.deleteMany({
          where: { document_id: documentId },
        });

        // Use raw query for batch insert with vector embeddings
        for (const chunk of chunksToInsert) {
          await prisma.$executeRaw`
            INSERT INTO document_chunks (
              id, document_id, chunk_index, content, token_count, embedding, metadata, created_at
            ) VALUES (
              gen_random_uuid(),
              ${chunk.document_id}::uuid,
              ${chunk.chunk_index},
              ${chunk.content},
              ${chunk.token_count},
              ${chunk.embedding}::vector,
              ${JSON.stringify(chunk.metadata)}::jsonb,
              NOW()
            )
          `;
        }

        console.log(`Successfully stored ${chunksToInsert.length} chunks`);

        return { chunkCount: chunksToInsert.length };
      });
    }

    // Step 6: Update document record with processing results
    const updatedDocument = await step.run(
      "update-document-metadata",
      async () => {
        console.log(`Updating document metadata for: ${filename}`);

        const document = await prisma.documents.update({
          where: { id: documentId },
          data: {
            extracted_text: processResult.extractedText || null,
            extracted_text_length: processResult.textLength,
            has_embedding: !!chunkingResult,
            updated_at: new Date(),
          },
        });

        console.log(`Document updated with ID: ${document.id}`);
        console.log(`Extracted text length: ${document.extracted_text_length}`);
        console.log(`Has embedding: ${document.has_embedding}`);

        return document;
      }
    );

    // Inngest serializes data between steps, converting Dates to ISO strings
    // Handle both Date objects and ISO string formats
    const toISOString = (dateValue: Date | string): string => {
      if (typeof dateValue === 'string') return dateValue;
      return dateValue.toISOString();
    };

    const uploadedAt = toISOString(updatedDocument.created_at);
    const updatedAt = toISOString(updatedDocument.updated_at);

    return {
      success: true,
      message: "Document processed successfully",
      document: {
        id: updatedDocument.id,
        filename: updatedDocument.filename,
        mimetype: updatedDocument.mimetype,
        size: Number(updatedDocument.size),
        contentHash: updatedDocument.content_hash,
        storagePath: updatedDocument.storage_path,
        publicUrl: updatedDocument.public_url,
        extractedTextLength: updatedDocument.extracted_text_length,
        hasEmbedding: updatedDocument.has_embedding,
        chunkCount: chunkingResult?.chunks.length || 0,
        uploadedAt,
        updatedAt,
      },
    };
  }
);
