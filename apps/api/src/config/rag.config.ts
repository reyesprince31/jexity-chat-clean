/**
 * RAG (Retrieval Augmented Generation) Configuration
 *
 * Centralized configuration for vector search, embeddings, and RAG behavior.
 * Adjust these settings to tune the performance and accuracy of your RAG system.
 */

/**
 * Vector Search Configuration
 * Controls how documents are retrieved from the vector database
 */
export const VECTOR_SEARCH_CONFIG = {
  /**
   * Default similarity threshold for vector search (0-1 scale)
   * - 1.0 = Identical embeddings
   * - 0.7+ = Very similar, strict matching
   * - 0.6 = Balanced (default) - good semantic relevance
   * - 0.5-0.6 = Broader results, more recall
   * - <0.5 = May include less relevant results
   */
  similarityThreshold: 0.6,

  /**
   * Default number of document chunks to retrieve
   * Higher values provide more context but may include less relevant information
   */
  defaultLimit: 5,

  /**
   * Maximum number of results to return from vector search
   * Prevents excessive results from being processed
   */
  maxLimit: 20,
} as const;

/**
 * Embedding Configuration
 * Settings for OpenAI text embeddings
 */
export const EMBEDDING_CONFIG = {
  /**
   * OpenAI embedding model to use
   * - text-embedding-3-large: 3072 dimensions, highest quality
   * - text-embedding-3-small: 1536 dimensions, faster/cheaper
   */
  model: "text-embedding-3-large" as const,

  /**
   * Embedding dimensions (must match model)
   */
  dimensions: 3072,

  /**
   * Batch size for creating embeddings
   * Higher values are more efficient but use more memory
   */
  batchSize: 100,
} as const;

/**
 * Text Chunking Configuration
 * Settings for splitting documents into chunks
 */
export const CHUNKING_CONFIG = {
  /**
   * Target size for each text chunk in characters
   * Larger chunks provide more context but may dilute semantic matching
   */
  chunkSize: 1000,

  /**
   * Overlap between chunks in characters
   * Prevents important context from being split across chunk boundaries
   */
  chunkOverlap: 200,

  /**
   * Separator priority for splitting text
   * Text is split by these separators in order of preference
   */
  separators: ["\n\n", "\n", ". ", "! ", "? ", ", ", " ", ""],
} as const;

/**
 * Chat/RAG Integration Configuration
 * Settings for how RAG context is used in chat
 */
export const RAG_CHAT_CONFIG = {
  /**
   * Enable RAG by default for new conversations
   */
  useRAGByDefault: true,

  /**
   * Default limit for retrieving context in chat
   */
  defaultContextLimit: 5,

  /**
   * Maximum length of formatted context to include in prompt (characters)
   * Prevents token limit issues with very large context
   */
  maxContextLength: 8000,

  /**
   * Include similarity scores in context formatting
   */
  showSimilarityScores: true,
} as const;

/**
 * OpenAI Chat Model Configuration
 * Settings for the chat completion model
 */
export const CHAT_MODEL_CONFIG = {
  /**
   * OpenAI model to use for chat completions
   */
  model: "gpt-5-mini" as const,

  /**
   * Temperature for response generation (0-2)
   * GPT-5 only supports the default (1), so keep it fixed to avoid 400 errors.
   */
  temperature: 1,

  /**
   * Maximum tokens in response
   */
  maxTokens: 2000,

  /**
   * Enable streaming responses
   */
  streaming: true,
} as const;

/**
 * Title Generation Configuration
 * Settings for auto-generating conversation titles
 */
export const TITLE_GENERATION_CONFIG = {
  /**
   * Model to use for title generation (use cheaper model)
   */
  model: "gpt-4o-mini" as const,

  /**
   * Temperature for title generation
   */
  temperature: 0.5,

  /**
   * Maximum tokens for title
   */
  maxTokens: 50,

  /**
   * Maximum length of title in characters
   */
  maxLength: 50,

  /**
   * Maximum words in title
   */
  maxWords: 6,
} as const;

/**
 * Helper function to validate and clamp similarity threshold
 */
export function validateSimilarityThreshold(threshold?: number): number {
  if (threshold === undefined) {
    return VECTOR_SEARCH_CONFIG.similarityThreshold;
  }

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, threshold));
}

/**
 * Helper function to validate and clamp limit
 */
export function validateLimit(limit?: number): number {
  if (limit === undefined) {
    return VECTOR_SEARCH_CONFIG.defaultLimit;
  }

  // Clamp between 1 and maxLimit
  return Math.max(1, Math.min(VECTOR_SEARCH_CONFIG.maxLimit, limit));
}

/**
 * Export all configs as a single object for convenience
 */
export const RAG_CONFIG = {
  vectorSearch: VECTOR_SEARCH_CONFIG,
  embedding: EMBEDDING_CONFIG,
  chunking: CHUNKING_CONFIG,
  ragChat: RAG_CHAT_CONFIG,
  chatModel: CHAT_MODEL_CONFIG,
  titleGeneration: TITLE_GENERATION_CONFIG,
  helpers: {
    validateSimilarityThreshold,
    validateLimit,
  },
} as const;
