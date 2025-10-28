import { searchSimilarChunks, SearchResult } from './vectorSearch';

export interface RAGContext {
  chunks: SearchResult[];
  formattedContext: string;
}

export interface RAGOptions {
  limit?: number;
  similarityThreshold?: number;
}

/**
 * Retrieve relevant document chunks for a query using vector search
 * @param query - The user's query text
 * @param options - Optional configuration (limit, similarityThreshold)
 * @returns Array of relevant chunks with similarity scores
 */
export async function retrieveRelevantContext(
  query: string,
  options: RAGOptions = {}
): Promise<SearchResult[]> {
  const { limit = 5, similarityThreshold = 0.7 } = options;

  try {
    const chunks = await searchSimilarChunks(query, limit, similarityThreshold);
    return chunks;
  } catch (error) {
    console.error('Error retrieving relevant context:', error);
    throw new Error(`Failed to retrieve context: ${error}`);
  }
}

/**
 * Format retrieved chunks into a structured context string for prompt injection
 * @param chunks - Array of search results with document metadata
 * @returns Formatted context string with document references
 */
export function formatContextForPrompt(chunks: SearchResult[]): string {
  if (chunks.length === 0) {
    return 'No relevant context found in the knowledge base.';
  }

  const contextParts = chunks.map((chunk, index) => {
    const docName = chunk.document?.filename || 'Unknown Document';
    const similarity = (chunk.similarity * 100).toFixed(1);

    return `[Source ${index + 1}] ${docName} (Relevance: ${similarity}%)
${chunk.content}`;
  });

  return contextParts.join('\n\n---\n\n');
}

/**
 * Build a system prompt that instructs the model to use retrieved context
 * @param context - Formatted context string from retrieved chunks
 * @returns System prompt string
 */
export function buildRAGSystemPrompt(context: string): string {
  return `You are a helpful AI assistant with access to a knowledge base of documents.

Your task is to answer user questions based on the provided context from the knowledge base. Follow these guidelines:

1. **Use the context**: Base your answers primarily on the information provided in the context below
2. **Cite sources**: When referencing information, mention which source number you're using (e.g., "According to Source 1...")
3. **Be honest**: If the context doesn't contain relevant information to answer the question, clearly state that
4. **Don't hallucinate**: Don't make up information that isn't in the provided context
5. **Be conversational**: While being accurate, maintain a natural and helpful tone
6. **Synthesize information**: If multiple sources provide relevant information, combine them into a coherent answer

---

**Available Context:**

${context}

---

Now, answer the user's question using the context above.`;
}

/**
 * Complete RAG pipeline: retrieve context, format it, and build the system prompt
 * @param query - The user's query text
 * @param options - Optional configuration for retrieval
 * @returns RAG context with chunks and formatted prompt
 */
export async function prepareRAGContext(
  query: string,
  options: RAGOptions = {}
): Promise<RAGContext> {
  // Retrieve relevant chunks
  const chunks = await retrieveRelevantContext(query, options);

  // Format context for prompt
  const formattedContext = formatContextForPrompt(chunks);

  return {
    chunks,
    formattedContext,
  };
}

/**
 * Build a complete system message for LangChain chat
 * @param query - The user's query
 * @param options - Optional RAG configuration
 * @returns Object with system prompt and source chunks
 */
export async function buildRAGPrompt(
  query: string,
  options: RAGOptions = {}
): Promise<{ systemPrompt: string; sourceChunks: SearchResult[] }> {
  const { chunks, formattedContext } = await prepareRAGContext(query, options);
  const systemPrompt = buildRAGSystemPrompt(formattedContext);

  return {
    systemPrompt,
    sourceChunks: chunks,
  };
}
