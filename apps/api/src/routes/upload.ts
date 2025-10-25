import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

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
  file?: {
    filename: string;
    mimetype: string;
    size: number;
  };
}

export default async function uploadRoutes(
  fastify: FastifyInstance
): Promise<void> {
  // File upload endpoint
  fastify.post<{
    Reply: UploadResponse;
  }>("/upload", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // This method is provided byt he @fastify/multipart plugin
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

      // Here you would typically:
      // 1. Save the file to disk or cloud storage
      // 2. Process the file content
      // 3. Store metadata in a database
      // For now, we'll just return success with file info

      fastify.log.info(`File uploaded: ${data.filename} (${data.mimetype})`);

      return reply.code(200).send({
        success: true,
        message: "File uploaded successfully",
        file: {
          filename: data.filename,
          mimetype: data.mimetype,
          size: buffer.length,
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
