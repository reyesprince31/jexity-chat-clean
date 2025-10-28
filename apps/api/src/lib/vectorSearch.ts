import { PrismaClient } from '../generated/prisma/client';
import { createEmbedding } from './embeddings';

const prisma = new PrismaClient();

export interface SearchResult {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  similarity: number;
  metadata: any;
  document?: {
    id: string;
    filename: string;
    mimetype: string;
    createdAt: Date;
  };
}

interface RawSearchResult {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  metadata: any;
  similarity: number | string;
  'document.id': string;
  'document.filename': string;
  'document.mimetype': string;
  'document.createdAt': Date;
}

/**
 * Search for similar chunks across all documents using vector similarity
 * @param queryText - The text to search for
 * @param limit - Maximum number of results to return (default: 10)
 * @param similarityThreshold - Minimum cosine similarity score (0-1, default: 0.7)
 * @returns Array of matching chunks with similarity scores
 */
export async function searchSimilarChunks(
  queryText: string,
  limit: number = 10,
  similarityThreshold: number = 0.7
): Promise<SearchResult[]> {
  // Create embedding for the query text
  const queryEmbedding = await createEmbedding(queryText);

  // Convert embedding array to pgvector format string
  const embeddingString = `[${queryEmbedding.join(',')}]`;

  // Use Prisma raw query with pgvector's cosine similarity operator (<=>)
  // Lower distance = higher similarity, so we use 1 - distance to get similarity score
  const results = await prisma.$queryRaw<RawSearchResult[]>`
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

  // Transform results to match SearchResult interface
  return results.map((row: RawSearchResult) => ({
    id: row.id,
    documentId: row.documentId,
    chunkIndex: row.chunkIndex,
    content: row.content,
    similarity: typeof row.similarity === 'string' ? parseFloat(row.similarity) : row.similarity,
    metadata: row.metadata,
    document: {
      id: row['document.id'],
      filename: row['document.filename'],
      mimetype: row['document.mimetype'],
      createdAt: row['document.createdAt'],
    },
  }));
}

/**
 * Search for similar chunks within a specific document
 * @param documentId - The ID of the document to search within
 * @param queryText - The text to search for
 * @param limit - Maximum number of results to return (default: 5)
 * @param similarityThreshold - Minimum cosine similarity score (0-1, default: 0.7)
 * @returns Array of matching chunks from the specified document
 */
export async function searchWithinDocument(
  documentId: string,
  queryText: string,
  limit: number = 5,
  similarityThreshold: number = 0.7
): Promise<SearchResult[]> {
  // Create embedding for the query text
  const queryEmbedding = await createEmbedding(queryText);

  // Convert embedding array to pgvector format string
  const embeddingString = `[${queryEmbedding.join(',')}]`;

  // Use Prisma raw query with pgvector's cosine similarity operator (<=>)
  const results = await prisma.$queryRaw<any[]>`
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

  // Transform results to match SearchResult interface
  return results.map((row: RawSearchResult) => ({
    id: row.id,
    documentId: row.documentId,
    chunkIndex: row.chunkIndex,
    content: row.content,
    similarity: typeof row.similarity === 'string' ? parseFloat(row.similarity) : row.similarity,
    metadata: row.metadata,
    document: {
      id: row['document.id'],
      filename: row['document.filename'],
      mimetype: row['document.mimetype'],
      createdAt: row['document.createdAt'],
    },
  }));
}

/**
 * Get all chunks for a specific document (ordered by chunk index)
 * @param documentId - The ID of the document
 * @returns Array of chunks
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
