import { OpenAIEmbeddings } from "@langchain/openai";

// Embedding model configuration
export const EMBEDDING_CONFIG = {
  model: "text-embedding-3-large",
  dimensions: 3072, // text-embedding-3-large has 3072 dimensions
  // Alternative: "text-embedding-3-small" with 1536 dimensions (more cost-effective)
} as const;

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
