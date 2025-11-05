import { PrismaClient } from '../generated/prisma/client';
import { createEmbedding } from './embeddings';
import { Document } from '@langchain/core/documents';
import { VECTOR_SEARCH_CONFIG } from '../config/rag.config';

const prisma = new PrismaClient();

/**
 * LangChain Document with similarity score
 */
export type DocumentWithScore = {
  document: Document;
  similarity: number;
};

/**
 * Raw result from pgvector similarity search query
 */
interface RawSearchResult {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number | string;
  'document.id': string;
  'document.filename': string;
  'document.mimetype': string;
  'document.createdAt': Date;
}

/**
 * Search for similar chunks across all documents using vector similarity.
 * Returns results as LangChain Documents for use with LangChain chains.
 *
 * Uses adaptive threshold strategy:
 * 1. First tries to find results above the similarity threshold
 * 2. If no results found, falls back to top-K results without threshold
 * This ensures the RAG system always has context when documents exist
 *
 * @param queryText - The text to search for
 * @param limit - Maximum number of results to return (default from config)
 * @param similarityThreshold - Minimum cosine similarity score (0-1, default from config)
 * @returns Array of LangChain Documents with similarity scores
 */
export async function searchSimilarChunks(
  queryText: string,
  limit: number = 10,
  similarityThreshold: number = VECTOR_SEARCH_CONFIG.similarityThreshold
): Promise<DocumentWithScore[]> {
  // Create embedding for the query text
  const queryEmbedding = await createEmbedding(queryText);

  // Convert embedding array to pgvector format string
  const embeddingString = `[${queryEmbedding.join(',')}]`;

  // First attempt: Search with similarity threshold
  let results = await prisma.$queryRaw<RawSearchResult[]>`
    SELECT
      c.id,
      c.document_id as "documentId",
      c.chunk_index as "chunkIndex",
      c.content,
      c.metadata,
      1 - (c.embedding <=> ${embeddingString}::vector) as similarity,
      d.id as "document.id",
      d.filename as "document.filename",
      d.mimetype as "document.mimetype",
      d.created_at as "document.createdAt"
    FROM document_chunks c
    INNER JOIN documents d ON c.document_id = d.id
    WHERE c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> ${embeddingString}::vector) >= ${similarityThreshold}
    ORDER BY c.embedding <=> ${embeddingString}::vector
    LIMIT ${limit}
  `;

  // Adaptive fallback: If no results above threshold, get top-K anyway
  if (results.length === 0) {
    console.log(`No results above threshold ${similarityThreshold}, falling back to top-${limit} results`);

    results = await prisma.$queryRaw<RawSearchResult[]>`
      SELECT
        c.id,
        c.document_id as "documentId",
        c.chunk_index as "chunkIndex",
        c.content,
        c.metadata,
        1 - (c.embedding <=> ${embeddingString}::vector) as similarity,
        d.id as "document.id",
        d.filename as "document.filename",
        d.mimetype as "document.mimetype",
        d.created_at as "document.createdAt"
      FROM document_chunks c
      INNER JOIN documents d ON c.document_id = d.id
      WHERE c.embedding IS NOT NULL
      ORDER BY c.embedding <=> ${embeddingString}::vector
      LIMIT ${limit}
    `;
  }

  // Transform to LangChain Documents
  return results.map((row: RawSearchResult) => {
    const similarity = typeof row.similarity === 'string' ? parseFloat(row.similarity) : row.similarity;

    return {
      document: new Document({
        pageContent: row.content,
        metadata: {
          id: row.id,
          documentId: row.documentId,
          chunkIndex: row.chunkIndex,
          similarity: similarity,
          document: {
            id: row['document.id'],
            filename: row['document.filename'],
            mimetype: row['document.mimetype'],
            createdAt: row['document.createdAt'],
          },
          // Include chunk metadata if present
          ...(row.metadata || {}),
        },
      }),
      similarity: similarity,
    };
  });
}

/**
 * Search for similar chunks within a specific document using vector similarity.
 * Returns results as LangChain Documents for use with LangChain chains.
 *
 * Uses adaptive threshold strategy:
 * 1. First tries to find results above the similarity threshold
 * 2. If no results found, falls back to top-K results without threshold
 * This ensures the RAG system always has context when documents exist
 *
 * @param documentId - The ID of the document to search within
 * @param queryText - The text to search for
 * @param limit - Maximum number of results to return (default from config)
 * @param similarityThreshold - Minimum cosine similarity score (0-1, default from config)
 * @returns Array of LangChain Documents with similarity scores
 */
export async function searchWithinDocument(
  documentId: string,
  queryText: string,
  limit: number = VECTOR_SEARCH_CONFIG.defaultLimit,
  similarityThreshold: number = VECTOR_SEARCH_CONFIG.similarityThreshold
): Promise<DocumentWithScore[]> {
  // Create embedding for the query text
  const queryEmbedding = await createEmbedding(queryText);

  // Convert embedding array to pgvector format string
  const embeddingString = `[${queryEmbedding.join(',')}]`;

  // First attempt: Search with similarity threshold
  let results = await prisma.$queryRaw<RawSearchResult[]>`
    SELECT
      c.id,
      c.document_id as "documentId",
      c.chunk_index as "chunkIndex",
      c.content,
      c.metadata,
      1 - (c.embedding <=> ${embeddingString}::vector) as similarity,
      d.id as "document.id",
      d.filename as "document.filename",
      d.mimetype as "document.mimetype",
      d.created_at as "document.createdAt"
    FROM document_chunks c
    INNER JOIN documents d ON c.document_id = d.id
    WHERE c.document_id = ${documentId}::uuid
      AND c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> ${embeddingString}::vector) >= ${similarityThreshold}
    ORDER BY c.embedding <=> ${embeddingString}::vector
    LIMIT ${limit}
  `;

  // Adaptive fallback: If no results above threshold, get top-K anyway
  if (results.length === 0) {
    console.log(`No results above threshold ${similarityThreshold} for document ${documentId}, falling back to top-${limit} results`);

    results = await prisma.$queryRaw<RawSearchResult[]>`
      SELECT
        c.id,
        c.document_id as "documentId",
        c.chunk_index as "chunkIndex",
        c.content,
        c.metadata,
        1 - (c.embedding <=> ${embeddingString}::vector) as similarity,
        d.id as "document.id",
        d.filename as "document.filename",
        d.mimetype as "document.mimetype",
        d.created_at as "document.createdAt"
      FROM document_chunks c
      INNER JOIN documents d ON c.document_id = d.id
      WHERE c.document_id = ${documentId}::uuid
        AND c.embedding IS NOT NULL
      ORDER BY c.embedding <=> ${embeddingString}::vector
      LIMIT ${limit}
    `;
  }

  // Transform to LangChain Documents
  return results.map((row: RawSearchResult) => {
    const similarity = typeof row.similarity === 'string' ? parseFloat(row.similarity) : row.similarity;

    return {
      document: new Document({
        pageContent: row.content,
        metadata: {
          id: row.id,
          documentId: row.documentId,
          chunkIndex: row.chunkIndex,
          similarity: similarity,
          document: {
            id: row['document.id'],
            filename: row['document.filename'],
            mimetype: row['document.mimetype'],
            createdAt: row['document.createdAt'],
          },
          // Include chunk metadata if present
          ...(row.metadata || {}),
        },
      }),
      similarity: similarity,
    };
  });
}

/**
 * Get all chunks for a specific document (ordered by chunk index).
 * Useful for retrieving the full chunked content of a document.
 *
 * @param documentId - The ID of the document
 * @returns Array of chunks with their metadata
 */
export async function getDocumentChunks(documentId: string) {
  return await prisma.document_chunks.findMany({
    where: {
      document_id: documentId,
    },
    orderBy: {
      chunk_index: 'asc',
    },
  });
}

/**
 * Close Prisma client connection
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
