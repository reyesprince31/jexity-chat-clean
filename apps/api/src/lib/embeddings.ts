import { OpenAIEmbeddings } from "@langchain/openai";
import { EMBEDDING_CONFIG } from '../config/rag.config';

// Re-export for backward compatibility
export { EMBEDDING_CONFIG };

// Initialize OpenAI embeddings with LangChain
export const embeddings = new OpenAIEmbeddings({
  model: EMBEDDING_CONFIG.model,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Helper function to create embedding for a single document
export async function createEmbedding(text: string): Promise<number[]> {
  try {
    const embedding = await embeddings.embedQuery(text);
    return embedding;
  } catch (error) {
    console.error("Error creating embedding:", error);
    throw error;
  }
}

// Helper function to create embeddings in batches
export async function createEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  try {
    const embeddingResults = await embeddings.embedDocuments(texts);
    return embeddingResults;
  } catch (error) {
    console.error("Error creating batch embeddings:", error);
    throw error;
  }
}
