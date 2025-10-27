import { inngest } from "./client";
import { createEmbedding } from "../lib/embeddings";
import { PDFParse } from "pdf-parse";
import {
  getDocumentById,
  updateDocumentRecord,
  downloadFileFromStorage,
} from "../lib/supabase";

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

      console.log(`Document found: ${document.filename} (${document.mimetype})`);
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

    // Step 4: Create embeddings from file content (only for supported files)
    let embeddingResult = null;

    if (processResult.canCreateEmbedding && processResult.extractedText) {
      embeddingResult = await step.run("create-embeddings", async () => {
        const { extractedText } = processResult;

        // Create embedding from the extracted text
        console.log(`Creating embedding for: ${filename}`);
        const embedding = await createEmbedding(extractedText);

        console.log(
          `Embedding created: ${embedding.length} dimensions for ${filename}`
        );

        return {
          embedding,
          dimensions: embedding.length,
        };
      });
    } else {
      console.log(
        `Skipping embedding creation for unsupported file: ${filename}`
      );
    }

    // Step 5: Update document record with processing results
    const updatedDocument = await step.run("update-document-metadata", async () => {
      console.log(`Updating document metadata for: ${filename}`);

      const document = await updateDocumentRecord(documentId, {
        extracted_text_length: processResult.textLength,
        has_embedding: !!embeddingResult,
        embedding_dimensions: embeddingResult?.dimensions,
      });

      console.log(`Document updated with ID: ${document.id}`);
      console.log(`Extracted text length: ${document.extracted_text_length}`);
      console.log(`Has embedding: ${document.has_embedding}`);

      return document;
    });

    return {
      success: true,
      message: "Document processed successfully",
      document: {
        id: updatedDocument.id,
        filename: updatedDocument.filename,
        mimetype: updatedDocument.mimetype,
        size: updatedDocument.size,
        contentHash: updatedDocument.content_hash,
        storagePath: updatedDocument.storage_path,
        publicUrl: updatedDocument.public_url,
        extractedTextLength: updatedDocument.extracted_text_length,
        hasEmbedding: updatedDocument.has_embedding,
        embeddingDimensions: updatedDocument.embedding_dimensions,
        uploadedAt: updatedDocument.created_at,
        updatedAt: updatedDocument.updated_at,
      },
    };
  }
);
