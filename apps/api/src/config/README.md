# RAG Configuration Guide

This directory contains centralized configuration for the RAG (Retrieval Augmented Generation) system.

## Overview

All RAG-related settings are now managed in `rag.config.ts`. This makes it easy to tune the system's behavior without hunting through multiple files.

## Configuration Sections

### 1. Vector Search Configuration

Controls how document chunks are retrieved from the vector database:

```typescript
VECTOR_SEARCH_CONFIG = {
  similarityThreshold: 0.6,  // 0-1 scale, balance between precision and recall
  defaultLimit: 5,           // Default number of chunks to retrieve
  maxLimit: 20,              // Maximum allowed limit
}
```

**Similarity Threshold Guidelines:**
- **1.0** - Identical embeddings (rarely used)
- **0.7-0.9** - Very similar, strict matching (high precision, may miss relevant results)
- **0.6** - Balanced (default) - good semantic relevance
- **0.5-0.6** - Broader results, more recall (may include less relevant content)
- **< 0.5** - Very broad, likely too many false positives

### 2. Embedding Configuration

Settings for OpenAI text embeddings:

```typescript
EMBEDDING_CONFIG = {
  model: 'text-embedding-3-large',  // OpenAI embedding model
  dimensions: 3072,                 // Must match model dimensions
  batchSize: 100,                   // Batch size for efficiency
}
```

**Model Options:**
- `text-embedding-3-large` - 3072 dimensions, highest quality (default)
- `text-embedding-3-small` - 1536 dimensions, faster and cheaper

### 3. Text Chunking Configuration

Settings for splitting documents into chunks:

```typescript
CHUNKING_CONFIG = {
  chunkSize: 1000,        // Target characters per chunk
  chunkOverlap: 200,      // Overlap prevents splitting context
  separators: [...]       // Priority order for splitting
}
```

**Tuning Tips:**
- Larger `chunkSize` = more context but may dilute semantic matching
- Larger `chunkOverlap` = better context preservation but more storage
- Typical ranges: chunkSize (500-2000), chunkOverlap (10-20% of chunkSize)

### 4. Chat/RAG Integration Configuration

Settings for how RAG context is used in chat:

```typescript
RAG_CHAT_CONFIG = {
  useRAGByDefault: true,         // Enable RAG for new conversations
  defaultContextLimit: 5,        // Default chunks to include
  maxContextLength: 8000,        // Max characters in context
  showSimilarityScores: true,    // Show relevance scores
}
```

### 5. Chat Model Configuration

Settings for OpenAI chat completions:

```typescript
CHAT_MODEL_CONFIG = {
  model: 'gpt-4o',
  temperature: 0.7,    // 0 = deterministic, 2 = creative
  maxTokens: 2000,
  streaming: true,
}
```

### 6. Title Generation Configuration

Settings for auto-generating conversation titles:

```typescript
TITLE_GENERATION_CONFIG = {
  model: 'gpt-4o-mini',  // Use cheaper model
  temperature: 0.5,
  maxTokens: 50,
  maxLength: 50,         // Max characters
  maxWords: 6,           // Max words
}
```

## Usage Examples

### Basic Usage (Uses Defaults)

```typescript
import { searchSimilarChunks } from './lib/vectorSearch';

// Uses default threshold (0.6) and limit (10)
const results = await searchSimilarChunks('machine learning');
```

### Override Defaults

```typescript
import { searchSimilarChunks } from './lib/vectorSearch';

// Override with custom values
const results = await searchSimilarChunks(
  'machine learning',
  15,    // limit
  0.7    // similarityThreshold
);
```

### Using RAG in Chat

```typescript
import { streamChatWithRAG } from './lib/chat';

const { stream, sourceDocuments } = await streamChatWithRAG({
  userQuery: "What is neural network?",
  conversationHistory: [],
  useRAG: true,
  ragOptions: {
    limit: 5,              // Override default
    similarityThreshold: 0.6  // Override default
  }
});
```

### Accessing Config Values

```typescript
import { RAG_CONFIG } from './config/rag.config';

// Access individual configs
console.log('Similarity threshold:', RAG_CONFIG.vectorSearch.similarityThreshold);
console.log('Chunk size:', RAG_CONFIG.chunking.chunkSize);

// Or import specific configs
import { VECTOR_SEARCH_CONFIG, CHUNKING_CONFIG } from './config/rag.config';
```

### Using Helper Functions

```typescript
import { validateSimilarityThreshold, validateLimit } from './config/rag.config';

// Validate and clamp user input
const threshold = validateSimilarityThreshold(userInput.threshold); // 0-1
const limit = validateLimit(userInput.limit); // 1-maxLimit
```

## Modifying Configuration

To change default behavior, edit `rag.config.ts`:

```typescript
// Example: Make search more strict
export const VECTOR_SEARCH_CONFIG = {
  similarityThreshold: 0.7,  // Changed from 0.6
  defaultLimit: 3,           // Changed from 5
  maxLimit: 20,
} as const;
```

**Important:** After changing config values, restart your development server for changes to take effect.

## Common Tuning Scenarios

### Scenario 1: Not Getting Relevant Results

**Problem:** RAG returns "no context found" or irrelevant results

**Solution:** Lower the similarity threshold
```typescript
// In rag.config.ts
similarityThreshold: 0.5,  // More lenient
```

### Scenario 2: Getting Too Many Irrelevant Results

**Problem:** Context includes off-topic information

**Solution:** Raise the similarity threshold
```typescript
// In rag.config.ts
similarityThreshold: 0.75,  // Stricter matching
```

### Scenario 3: Responses Missing Context

**Problem:** AI response doesn't include enough information

**Solution:** Increase context limit and chunk size
```typescript
// In rag.config.ts
defaultContextLimit: 10,   // More chunks
chunkSize: 1500,           // Larger chunks
```

### Scenario 4: Token Limit Errors

**Problem:** Context exceeds model's token limit

**Solution:** Reduce context limit or max context length
```typescript
// In rag.config.ts
defaultContextLimit: 3,      // Fewer chunks
maxContextLength: 4000,      // Shorter context
```

### Scenario 5: Reduce Costs

**Problem:** High OpenAI API costs

**Solution:** Use smaller models and reduce context
```typescript
// In rag.config.ts
EMBEDDING_CONFIG = {
  model: 'text-embedding-3-small',  // Cheaper embedding model
  dimensions: 1536,
};

CHAT_MODEL_CONFIG = {
  model: 'gpt-4o-mini',  // Cheaper chat model
};

defaultContextLimit: 3,  // Fewer chunks per query
```

## Testing Configuration Changes

After modifying the config, test the changes:

```bash
# Run type check
pnpm exec tsc --noEmit

# Restart dev server
pnpm dev

# Test a query via API
curl -X POST http://localhost:3001/conversations/:id/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "test query"}'
```

## Migration from Hardcoded Values

If you're migrating from hardcoded values in your code:

**Before:**
```typescript
const results = await searchSimilarChunks(query, 5, 0.7);
```

**After (using defaults):**
```typescript
const results = await searchSimilarChunks(query);
```

**After (with overrides):**
```typescript
const results = await searchSimilarChunks(query, 10, 0.6);
```

All defaults are now managed in `rag.config.ts`, so you can remove hardcoded values and rely on the centralized configuration.

## Best Practices

1. **Start with defaults** - The default values are balanced for most use cases
2. **Test incrementally** - Change one value at a time and measure impact
3. **Monitor performance** - Track metrics like:
   - Retrieval accuracy (are relevant docs returned?)
   - Response quality (are answers grounded in context?)
   - Cost (tokens used per query)
4. **Document changes** - Add comments explaining why you changed specific values
5. **Use environment-specific configs** - Consider different configs for dev/staging/prod

## Environment Variables

The config file uses environment variables for API keys:
- `OPENAI_API_KEY` - Required for embeddings and chat completions

Make sure these are set in your `.env` file.
