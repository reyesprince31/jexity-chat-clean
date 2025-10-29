import { PrismaRetriever } from './retriever';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Document } from '@langchain/core/documents';
import type { DocumentWithScore } from './vectorSearch';

export interface RAGOptions {
  limit?: number;
  similarityThreshold?: number;
  documentId?: string;
}

/**
 * Create a PrismaRetriever instance with the given options
 * @param options - Configuration for the retriever
 * @returns Configured PrismaRetriever
 */
export function createRetriever(options: RAGOptions = {}): PrismaRetriever {
  const { limit = 5, similarityThreshold = 0.7, documentId } = options;

  return PrismaRetriever.create({
    k: limit,
    similarityThreshold,
    documentId,
  });
}

/**
 * Format LangChain Documents into a structured context string
 * @param documents - Array of LangChain Documents with metadata
 * @returns Formatted context string with source numbers
 */
export function formatDocumentsForContext(documents: Document[]): string {
  if (documents.length === 0) {
    return 'No relevant context found in the knowledge base.';
  }

  const contextParts = documents.map((doc, index) => {
    const docName = doc.metadata?.document?.filename || 'Unknown Document';
    const similarity = doc.metadata?.similarity
      ? (doc.metadata.similarity * 100).toFixed(1)
      : 'N/A';

    return `[Source ${index + 1}] ${docName} (Relevance: ${similarity}%)
${doc.pageContent}`;
  });

  return contextParts.join('\n\n---\n\n');
}

/**
 * Create a ChatPromptTemplate for RAG that works with LangChain chains.
 * This template expects context (formatted documents) and a question.
 *
 * @returns ChatPromptTemplate configured for RAG
 */
export function createRAGPromptTemplate(): ChatPromptTemplate {
  const systemTemplate = `You are a helpful AI assistant with access to a knowledge base of documents.

Your task is to answer user questions based on the provided context from the knowledge base. Follow these guidelines:

1. **Use the context**: Base your answers primarily on the information provided in the context below
2. **Cite sources**: When referencing information, mention which source number you're using (e.g., "According to Source 1...")
3. **Be honest**: If the context doesn't contain relevant information to answer the question, clearly state that
4. **Don't hallucinate**: Don't make up information that isn't in the provided context
5. **Be conversational**: While being accurate, maintain a natural and helpful tone
6. **Synthesize information**: If multiple sources provide relevant information, combine them into a coherent answer

---

**Available Context:**

{context}

---

Now, answer the user's question using the context above.`;

  return ChatPromptTemplate.fromMessages([
    ['system', systemTemplate],
    ['human', '{question}'],
  ]);
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
    const retriever = createRetriever(options);
    // Use invoke() which is the standard LangChain method for retrievers
    const documents = await retriever.invoke(query);
    const context = formatDocumentsForContext(documents);

    return { documents, context };
  } catch (error) {
    console.error('Error retrieving documents:', error);
    throw new Error(`Failed to retrieve documents: ${error}`);
  }
}
