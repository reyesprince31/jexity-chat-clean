import { PrismaRetriever } from "./retriever";
import { Document } from "@langchain/core/documents";
import {
  VECTOR_SEARCH_CONFIG,
  RAG_CHAT_CONFIG,
  type CitationStyle,
} from "../config/rag.config";

export interface RAGOptions {
  limit?: number;
  similarityThreshold?: number;
  documentId?: string;
  citationStyle?: CitationStyle;
}

/**
 * Create a PrismaRetriever instance with the given options
 * @param options - Configuration for the retriever
 * @returns Configured PrismaRetriever
 */
export function createRetriever(options: RAGOptions = {}): PrismaRetriever {
  const {
    limit = RAG_CHAT_CONFIG.defaultContextLimit,
    similarityThreshold = VECTOR_SEARCH_CONFIG.similarityThreshold,
    documentId,
  } = options;

  return PrismaRetriever.create({
    k: limit,
    similarityThreshold,
    documentId,
  });
}

/**
 * Format LangChain Documents into a structured context string
 * @param documents - Array of LangChain Documents with metadata
 * @param citationStyle - Citation numbering style: 'inline' (0-indexed) or 'natural' (1-indexed)
 * @returns Formatted context string with source numbers
 */
export function formatDocumentsForContext(
  documents: Document[],
  citationStyle: CitationStyle = RAG_CHAT_CONFIG.defaultCitationStyle
): string {
  if (documents.length === 0) {
    return "No relevant context found in the knowledge base.";
  }

  const contextParts = documents.map((doc, index) => {
    const docName = doc.metadata?.document?.filename || "Unknown Document";

    // Use 0-indexed for inline citations, 1-indexed for natural language citations
    const sourceNumber = citationStyle === "inline" ? index : index + 1;
    let header = `[Source ${sourceNumber}] ${docName}`;

    if (RAG_CHAT_CONFIG.showSimilarityScores && doc.metadata?.similarity) {
      const similarity = (doc.metadata.similarity * 100).toFixed(1);
      header += ` (Relevance: ${similarity}%)`;
    }

    return `${header}\n${doc.pageContent}`;
  });

  return contextParts.join("\n\n---\n\n");
}

/**
 * Retrieve documents for a query using the PrismaRetriever.
 * Returns both the documents and extracts metadata for compatibility.
 *
 * @param query - The user's query
 * @param options - Retrieval configuration
 * @returns Object with documents and formatted context
 */
export async function retrieveDocuments(
  query: string,
  options: RAGOptions = {}
): Promise<{ documents: Document[]; context: string }> {
  try {
    const {
      citationStyle = RAG_CHAT_CONFIG.defaultCitationStyle,
      ...retrieverOptions
    } = options;

    const retriever = createRetriever(retrieverOptions);
    // Use invoke() which is the standard LangChain method for retrievers
    const documents = await retriever.invoke(query);
    const context = formatDocumentsForContext(documents, citationStyle);

    return { documents, context };
  } catch (error) {
    console.error("Error retrieving documents:", error);
    throw new Error(`Failed to retrieve documents: ${error}`);
  }
}
