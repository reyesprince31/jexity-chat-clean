import { BaseRetriever, type BaseRetrieverInput } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';
import { searchSimilarChunks, searchWithinDocument } from './vectorSearch';
import { VECTOR_SEARCH_CONFIG, RAG_CHAT_CONFIG } from '../config/rag.config';

/**
 * Configuration for PrismaRetriever
 */
export interface PrismaRetrieverConfig extends BaseRetrieverInput {
  /** Number of documents to retrieve (default from config) */
  k?: number;
  /** Minimum similarity threshold 0-1 (default from config) */
  similarityThreshold?: number;
  /** Optional: limit search to a specific document */
  documentId?: string;
}

/**
 * Custom LangChain retriever that wraps our Prisma/pgvector search.
 * This allows us to use LangChain's retrieval chains while keeping
 * our existing database schema and optimized queries.
 */
export class PrismaRetriever extends BaseRetriever {
  lc_namespace = ['langchain', 'retrievers', 'prisma'];

  private k: number;
  private similarityThreshold: number;
  private documentId?: string;

  constructor(config: PrismaRetrieverConfig = {}) {
    super(config);
    this.k = config.k ?? RAG_CHAT_CONFIG.defaultContextLimit;
    this.similarityThreshold =
      config.similarityThreshold ?? VECTOR_SEARCH_CONFIG.similarityThreshold;
    this.documentId = config.documentId;
  }

  /**
   * Core retrieval method required by LangChain.
   * Retrieves relevant documents based on a query string.
   *
   * @param query - The search query
   * @returns Array of relevant Documents
   */
  async _getRelevantDocuments(
    query: string
  ): Promise<Document[]> {
    let results;

    if (this.documentId) {
      // Search within specific document
      results = await searchWithinDocument(
        this.documentId,
        query,
        this.k,
        this.similarityThreshold
      );
    } else {
      // Search across all documents
      results = await searchSimilarChunks(
        query,
        this.k,
        this.similarityThreshold
      );
    }

    // Extract just the documents (similarity scores are in metadata)
    const documents = results.map((r) => r.document);

    return documents;
  }

  /**
   * Factory method to create a retriever with custom configuration
   */
  static create(config: PrismaRetrieverConfig = {}): PrismaRetriever {
    return new PrismaRetriever(config);
  }
}
