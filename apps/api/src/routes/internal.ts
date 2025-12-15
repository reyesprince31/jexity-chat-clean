import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@repo/db";
import { getDocumentById } from "../lib/database.js";
import { downloadFileFromStorage } from "../lib/storage.js";
import { createEmbeddingsBatch } from "../lib/embeddings.js";
import { chunkText, estimateTokenCount, buildPageMapping } from "../lib/chunking.js";
import { PDFParse } from "pdf-parse";

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "internal-api-key-change-me";

function validateInternalKey(request: FastifyRequest, reply: FastifyReply): boolean {
  const apiKey = request.headers["x-internal-api-key"];
  if (apiKey !== INTERNAL_API_KEY) {
    reply.code(401).send({ error: "Unauthorized" });
    return false;
  }
  return true;
}

export default async function internalRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /internal/documents/:id - Fetch document details
  fastify.get<{
    Params: { id: string };
  }>("/internal/documents/:id", async (request, reply) => {
    if (!validateInternalKey(request, reply)) return;

    const { id } = request.params;
    
    try {
      const document = await getDocumentById(id);
      
      if (!document) {
        return reply.code(404).send({ error: "Document not found" });
      }

      return reply.send({
        id: document.id,
        filename: document.filename,
        mimetype: document.mimetype,
        storage_path: document.storage_path,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: "Failed to fetch document" });
    }
  });

  // GET /internal/documents/:id/file - Download file and return as base64
  fastify.get<{
    Params: { id: string };
  }>("/internal/documents/:id/file", async (request, reply) => {
    if (!validateInternalKey(request, reply)) return;

    const { id } = request.params;

    try {
      const document = await getDocumentById(id);
      
      if (!document) {
        return reply.code(404).send({ error: "Document not found" });
      }

      const buffer = await downloadFileFromStorage(document.storage_path);
      const base64 = buffer.toString("base64");

      return reply.send({
        base64,
        filename: document.filename,
        mimetype: document.mimetype,
        size: buffer.length,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: "Failed to download file" });
    }
  });

  // POST /internal/documents/:id/extract-text - Extract text from file and store
  fastify.post<{
    Params: { id: string };
    Body: { fileBase64: string; filename: string; mimetype: string };
  }>("/internal/documents/:id/extract-text", async (request, reply) => {
    if (!validateInternalKey(request, reply)) return;

    const { id } = request.params;
    const { fileBase64, filename, mimetype } = request.body;

    try {
      const fileBuffer = Buffer.from(fileBase64, "base64");

      const isTextFile =
        mimetype.includes("text") ||
        mimetype.includes("markdown") ||
        filename.endsWith(".md") ||
        filename.endsWith(".txt");

      const isPdf = mimetype === "application/pdf" || filename.endsWith(".pdf");

      let extractedText = "";
      let canCreateEmbedding = false;
      let pageTexts: string[] | undefined;

      if (isTextFile) {
        extractedText = fileBuffer.toString("utf-8");
        canCreateEmbedding = true;
        fastify.log.info(`Extracted ${extractedText.length} characters from text file`);
      } else if (isPdf) {
        try {
          const parser = new PDFParse({ data: fileBuffer });
          const result = await parser.getText();

          if (result.pages && Array.isArray(result.pages)) {
            pageTexts = result.pages.map((page: { text?: string }) => page.text || "");
          }

          extractedText = result.text;
          canCreateEmbedding = true;

          const info = await parser.getInfo();
          fastify.log.info(`Extracted ${extractedText.length} characters from PDF (${info.pages} pages)`);
        } catch (error) {
          fastify.log.error(`Error extracting text from PDF: ${error}`);
          extractedText = "";
          canCreateEmbedding = false;
        }
      }

      const textLength = extractedText.length;

      // Store extracted text in database
      await prisma.documents.update({
        where: { id },
        data: {
          extracted_text: extractedText || null,
          extracted_text_length: textLength,
          updated_at: new Date(),
        },
      });

      return reply.send({
        textLength,
        canCreateEmbedding,
        pageTexts,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: "Failed to extract text" });
    }
  });

  // POST /internal/documents/:id/process-chunks - Create chunks, embeddings, and store
  fastify.post<{
    Params: { id: string };
    Body: { filename: string; pageTexts?: string[] };
  }>("/internal/documents/:id/process-chunks", async (request, reply) => {
    if (!validateInternalKey(request, reply)) return;

    const { id } = request.params;
    const { filename, pageTexts } = request.body;

    try {
      // Fetch the extracted text from database
      const doc = await prisma.documents.findUnique({
        where: { id },
        select: { extracted_text: true },
      });

      if (!doc?.extracted_text) {
        return reply.code(400).send({ error: "No extracted text found" });
      }

      // Build page mapping if page texts are available (PDFs)
      let pageMapping;
      if (pageTexts && pageTexts.length > 0) {
        pageMapping = buildPageMapping(pageTexts);
        fastify.log.info(`Built page mapping with ${pageMapping.totalPages} pages`);
      }

      // Chunk the text with optional page mapping
      fastify.log.info(`Chunking text for: ${filename}`);
      const chunks = await chunkText(doc.extracted_text, pageMapping);
      fastify.log.info(`Created ${chunks.length} chunks`);

      const chunkContents = chunks.map((chunk) => chunk.content);

      // Create embeddings in batch
      fastify.log.info(`Creating embeddings for ${chunks.length} chunks...`);
      const embeddingStartTime = Date.now();
      const embeddings = await createEmbeddingsBatch(chunkContents);
      const embeddingTime = ((Date.now() - embeddingStartTime) / 1000).toFixed(2);
      fastify.log.info(
        `✓ Created ${embeddings.length} embeddings in ${embeddingTime}s`
      );

      // Delete existing chunks for this document (in case of reprocessing)
      await prisma.document_chunks.deleteMany({
        where: { document_id: id },
      });

      fastify.log.info(`Storing ${chunks.length} chunks in database...`);
      const storeStartTime = Date.now();

      // Build VALUES rows for bulk insert
      const values: string[] = [];
      const params: (string | number)[] = [];
      let paramIndex = 1;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];

        if (!chunk || !embedding) {
          return reply.code(500).send({ error: `Missing chunk or embedding at index ${i}` });
        }

        const embeddingString = `[${embedding.join(",")}]`;

        values.push(
          `(gen_random_uuid(), $${paramIndex}::uuid, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}::vector, $${paramIndex + 5}::jsonb, NOW())`
        );

        params.push(
          id,
          chunk.metadata.chunkIndex,
          chunk.content,
          estimateTokenCount(chunk.content),
          embeddingString,
          JSON.stringify(chunk.metadata)
        );

        paramIndex += 6;
      }

      // Execute bulk insert
      await prisma.$executeRawUnsafe(
        `INSERT INTO document_chunks (id, document_id, chunk_index, content, token_count, embedding, metadata, created_at)
         VALUES ${values.join(", ")}`,
        ...params
      );

      const storeTime = ((Date.now() - storeStartTime) / 1000).toFixed(2);
      fastify.log.info(`✓ Stored ${chunks.length} chunks in ${storeTime}s`);

      return reply.send({ chunkCount: chunks.length });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: "Failed to process chunks" });
    }
  });

  // PATCH /internal/documents/:id/metadata - Update document metadata
  fastify.patch<{
    Params: { id: string };
    Body: { hasEmbedding: boolean };
  }>("/internal/documents/:id/metadata", async (request, reply) => {
    if (!validateInternalKey(request, reply)) return;

    const { id } = request.params;
    const { hasEmbedding } = request.body;

    try {
      await prisma.documents.update({
        where: { id },
        data: {
          has_embedding: hasEmbedding,
          updated_at: new Date(),
        },
      });

      return reply.send({ success: true });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: "Failed to update metadata" });
    }
  });

  // DELETE /internal/documents/:id - Delete document (for cleanup on failure)
  fastify.delete<{
    Params: { id: string };
  }>("/internal/documents/:id", async (request, reply) => {
    if (!validateInternalKey(request, reply)) return;

    const { id } = request.params;

    try {
      await prisma.documents.delete({
        where: { id },
      });

      return reply.send({ success: true });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: "Failed to delete document" });
    }
  });
}
