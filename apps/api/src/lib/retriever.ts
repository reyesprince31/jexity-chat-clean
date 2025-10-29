import { BaseRetriever, type BaseRetrieverInput } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';
import { CallbackManagerForRetrieverRun } from '@langchain/core/callbacks/manager';
import { searchSimilarChunks, searchWithinDocument } from './vectorSearch';

/**
 * Configuration for PrismaRetriever
 */
export interface PrismaRetrieverConfig extends BaseRetrieverInput {
  /** Number of documents to retrieve (default: 5) */
  k?: number;
  /** Minimum similarity threshold 0-1 (default: 0.7) */
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
    this.k = config.k ?? 5;
    this.similarityThreshold = config.similarityThreshold ?? 0.7;
    this.documentId = config.documentId;
  }

  /**
   * Core retrieval method required by LangChain.
   * Retrieves relevant documents based on a query string.
   *
   * @param query - The search query
   * @param runManager - Callback manager for tracing (optional)
   * @returns Array of relevant Documents
   */
  async _getRelevantDocuments(
    query: string,
    runManager?: CallbackManagerForRetrieverRun
  ): Promise<Document[]> {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Factory method to create a retriever with custom configuration
   */
  static create(config: PrismaRetrieverConfig = {}): PrismaRetriever {
    return new PrismaRetriever(config);
  }
}
