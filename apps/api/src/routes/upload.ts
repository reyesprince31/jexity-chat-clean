import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createHash } from "crypto";
import { start } from "workflow/api";
import { processDocument } from "../workflows/processDocument.js";
import { uploadFileToStorage } from "../lib/storage.js";
import {
  findDocumentByHash,
  createDocumentRecord,
} from "../lib/database.js";

// Allowed file types
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "text/markdown",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadResponse {
  success: boolean;
  message: string;
  document?: {
    id: string;
    filename: string;
    mimetype: string;
    size: number;
    storagePath: string;
    publicUrl: string;
    contentHash: string;
    isDuplicate: boolean;
    uploadedAt: string;
  };
  eventId?: string;
}

export default async function uploadRoutes(
  fastify: FastifyInstance
): Promise<void> {
  // File upload endpoint
  fastify.post<{
    Reply: UploadResponse;
  }>("/upload", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // This method is provided by the @fastify/multipart plugin
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({
          success: false,
          message: "No file uploaded",
        });
      }

      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(data.mimetype)) {
        return reply.code(400).send({
          success: false,
          message: `Invalid file type. Allowed types: PDF, Text, CSV, Markdown. Received: ${data.mimetype}`,
        });
      }

      // Read the file buffer
      const buffer = await data.toBuffer();

      // Validate file size
      if (buffer.length > MAX_FILE_SIZE) {
        return reply.code(400).send({
          success: false,
          message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        });
      }

      // Compute content hash for duplicate detection
      const hash = createHash("sha256");
      hash.update(buffer);
      const contentHash = hash.digest("hex");

      fastify.log.info(
        `Processing file upload: ${data.filename} (${data.mimetype}), Hash: ${contentHash}`
      );

      // Check for duplicate document
      const existingDoc = await findDocumentByHash(contentHash);

      if (existingDoc) {
        fastify.log.info(
          `Duplicate file detected: ${data.filename}. Returning existing document ID: ${existingDoc.id}`
        );

        return reply.code(200).send({
          success: true,
          message: "File already exists. Returning existing document.",
          document: {
            id: existingDoc.id,
            filename: existingDoc.filename,
            mimetype: existingDoc.mimetype,
            size: Number(existingDoc.size),
            storagePath: existingDoc.storage_path,
            publicUrl: existingDoc.public_url,
            contentHash: existingDoc.content_hash,
            isDuplicate: true,
            uploadedAt: existingDoc.created_at.toISOString(),
          },
        });
      }

      // Upload file to Supabase Storage
      fastify.log.info(`Uploading file to storage: ${data.filename}`);
      const uploadResult = await uploadFileToStorage(
        buffer,
        data.filename,
        data.mimetype
      );

      fastify.log.info(
        `File uploaded to storage: ${uploadResult.path}, Public URL: ${uploadResult.publicUrl}`
      );

      // Create document record in database
      const document = await createDocumentRecord({
        content_hash: contentHash,
        filename: data.filename,
        mimetype: data.mimetype,
        size: buffer.length,
        storage_path: uploadResult.path,
        public_url: uploadResult.publicUrl,
        storage_bucket: uploadResult.bucket,
        extracted_text_length: 0, // Will be updated by workflow
        has_embedding: false, // Will be updated by workflow
      });

      fastify.log.info(`Document record created with ID: ${document.id}`);

      // Trigger workflow for post-upload processing (embeddings, text extraction)
      await start(processDocument, [document.id]);

      fastify.log.info(
        `Triggered post-upload processing for document ${document.id}`
      );

      return reply.code(201).send({
        success: true,
        message: "File uploaded successfully and queued for processing",
        document: {
          id: document.id,
          filename: document.filename,
          mimetype: document.mimetype,
          size: Number(document.size),
          storagePath: document.storage_path,
          publicUrl: document.public_url,
          contentHash: document.content_hash,
          isDuplicate: false,
          uploadedAt: document.created_at.toISOString(),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        message: "Failed to upload file",
      });
    }
  });

  // Get upload configuration info
  fastify.get(
    "/upload/info",
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.code(200).send({
        maxFileSize: MAX_FILE_SIZE,
        maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
        allowedMimeTypes: ALLOWED_MIME_TYPES,
        allowedExtensions: [".pdf", ".txt", ".csv", ".md"],
      });
    }
  );
}
