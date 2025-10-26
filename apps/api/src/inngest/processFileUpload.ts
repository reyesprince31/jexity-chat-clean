import { inngest } from "./client";
import { createEmbedding } from "../consts/embeddings";
import { PDFParse } from "pdf-parse";

export const processFileUpload = inngest.createFunction(
  {
    id: "process-file-upload",
    name: "Process File Upload",
  },
  { event: "app/file.uploaded" },
  async ({ event, step }) => {
    const { filename, mimetype, size, buffer } = event.data;

    // Step 1: Validate and decode file buffer
    await step.run("decode-file-buffer", async () => {
      const fileBuffer = Buffer.from(buffer, "base64");
      // File buffer is now ready for processing in subsequent steps
      return { decoded: true, size: fileBuffer.length };
    });

    // Step 2: Save file to storage (placeholder)
    const storageResult = await step.run("save-to-storage", async () => {
      // Here you would:
      // - Upload to S3, Google Cloud Storage, etc.
      // - Or save to local disk
      console.log(`Saving file: ${filename} (${mimetype}) - ${size} bytes`);

      return {
        saved: true,
        path: `/uploads/${Date.now()}-${filename}`,
        timestamp: new Date().toISOString(),
      };
    });

    // Step 3: Process file content and extract text
    const processResult = await step.run("process-file-content", async () => {
      console.log(`Decoding buffer for: ${filename}`);
      console.log(`Buffer length (base64): ${buffer.length}`);

      const fileBuffer = Buffer.from(buffer, "base64");
      console.log(`Decoded buffer length: ${fileBuffer.length}`);

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
        console.log(`Extracted text length: ${extractedText.length} characters`);
        console.log(`First 100 chars: ${extractedText.substring(0, 100)}`);
      } else if (isPdf) {
        try {
          console.log(`Extracting text from PDF: ${filename}`);
          // PDFParse v2 expects options object with data property (decoded buffer)
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
        processed: true,
        contentLength: size,
        extractedText,
        textLength: extractedText.length,
        canCreateEmbedding,
        processedAt: new Date().toISOString(),
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
          createdAt: new Date().toISOString(),
        };
      });
    } else {
      console.log(
        `Skipping embedding creation for unsupported file: ${filename}`
      );
    }

    // Step 5: Store metadata in database (placeholder)
    const metadataResult = await step.run("store-metadata", async () => {
      // Here you would:
      // - Save file metadata to database
      // - Create database record with file info
      console.log(`Storing metadata for: ${filename}`);

      return {
        id: `file_${Date.now()}`,
        filename,
        mimetype,
        size,
        storagePath: storageResult.path,
        uploadedAt: new Date().toISOString(),
      };
    });

    return {
      success: true,
      file: {
        filename,
        mimetype,
        size,
        storage: storageResult,
        processing: processResult,
        embedding: embeddingResult,
        metadata: metadataResult,
      },
    };
  }
);
