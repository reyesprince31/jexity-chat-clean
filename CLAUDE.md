# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **Turborepo monorepo** managing multiple Next.js applications and shared packages. It uses **pnpm** as the package manager and requires Node.js >= 18.

## Monorepo Structure

```
apps/
  api/       - Fastify API server running on port 3001 (configurable via .env)
  web/       - Next.js app running on port 3000
packages/
  ui/                  - Shared React component library (@repo/ui)
  eslint-config/       - Shared ESLint configurations (@repo/eslint-config)
  typescript-config/   - Shared TypeScript configurations (@repo/typescript-config)
```

## Common Commands

### Development

```bash
# Run all apps in development mode (with Turbopack)
pnpm dev

# Run a specific app
turbo dev --filter=web    # web app on port 3000
turbo dev --filter=api    # API server on port 3001 (or PORT from .env)
```

### Building

```bash
# Build all apps and packages
pnpm build

# Build a specific app
turbo build --filter=web
turbo build --filter=api
```

### Linting

```bash
# Lint all packages and apps
pnpm lint

# Lint a specific package
turbo lint --filter=web
```

### Type Checking

```bash
# Type check all packages and apps
pnpm check-types

# Type check a specific package
turbo check-types --filter=web
```

### Formatting

```bash
# Format all TypeScript, TSX, and Markdown files
pnpm format
```

### Working with @repo/ui

```bash
# Generate a new React component in the UI package
cd packages/ui
pnpm generate:component
```

## Architecture Notes

### Workspace Dependencies

- The `web` app depends on `@repo/ui` for shared components
- All packages use `@repo/eslint-config` for linting configurations
- All packages use `@repo/typescript-config` for TypeScript configurations
- Workspace dependencies are referenced with `workspace:*` protocol

### UI Package Structure

- Components in `packages/ui/src/` are exported individually via the package.json `exports` field
- Import pattern: `import { Button } from "@repo/ui/button"`
- All UI components are client components ("use client" directive)

### Next.js App (web)

- Uses Next.js 15+ with React 19+
- Development runs with Turbopack for faster builds (`next dev --turbopack`)
- Uses the App Router (`app/` directory)
- Linting requires zero warnings (`--max-warnings 0`)

### API Server (Fastify)

- Uses Fastify framework for REST API
- Port is configurable via `PORT` environment variable in `apps/api/.env` (default: 3001)
- Development uses `tsx watch` for hot reloading
- Production builds use `tsup` for bundling
- Available endpoints:
  - `GET /` - Hello World
  - `GET /health` - Health check
  - `POST /upload` - File upload endpoint (multipart/form-data)
  - `GET /upload/info` - Upload configuration info
  - `POST /api/inngest` - Inngest webhook endpoint
  - `POST /conversations` - Create new conversation
  - `GET /conversations` - List conversations (paginated)
  - `GET /conversations/:id` - Get conversation with messages
  - `DELETE /conversations/:id` - Delete conversation
  - `POST /conversations/:id/messages` - Send message (streaming SSE)
  - `GET /conversations/:id/messages` - Get conversation messages
  - `GET /messages/:messageId/sources` - Get message citations

## Document Processing & Vector Search

The API implements a document chunking and vector search system for semantic search over uploaded documents.

### Architecture Overview

```
User uploads file (PDF/text)
  ↓
POST /upload - Validates, deduplicates, uploads to Supabase Storage
  ↓
Creates document record in database
  ↓
Triggers Inngest event: app/document.process
  ↓
Inngest Function (async):
  1. Downloads file from Supabase Storage
  2. Extracts text (PDF: pdf-parse, Text: UTF-8)
  3. Chunks text (1000 chars, 200 overlap) using LangChain
  4. Creates embeddings for each chunk (OpenAI text-embedding-3-large)
  5. Stores chunks with embeddings in document_chunks table
  6. Updates document record (extracted_text, has_embedding)
```

### Database Schema

#### documents table

- Stores document metadata and full extracted text
- `extracted_text` (TEXT) - Full document text for reference
- `has_embedding` (BOOLEAN) - Indicates if chunks exist
- `chunks` - Relation to document_chunks

#### document_chunks table

- Stores text chunks with vector embeddings for semantic search
- `document_id` (UUID) - Foreign key to parent document
- `chunk_index` (INT) - Position in document (0, 1, 2...)
- `content` (TEXT) - Chunk text content (1000 chars)
- `embedding` (vector(3072)) - OpenAI embedding for similarity search
- `token_count` (INT) - Estimated tokens for cost tracking
- `metadata` (JSONB) - Position info: chunkIndex, startPosition, endPosition, length

**Why chunking?** Large documents are split into overlapping chunks to:

- Enable precise semantic search (find specific passages)
- Handle embedding token limits
- Provide better context in search results

### Text Chunking Strategy

**Implementation:** `apps/api/src/lib/chunking.ts`

- **Chunk size:** 1000 characters
- **Overlap:** 200 characters (prevents splitting important context)
- **Splitter:** LangChain's `RecursiveCharacterTextSplitter`
- **Separators:** `['\n\n', '\n', '. ', '! ', '? ', ', ', ' ', '']`

Example: A 5000 char document produces ~5 overlapping chunks

```
Chunk 0: chars 0-1000
Chunk 1: chars 800-1800    (200 char overlap with chunk 0)
Chunk 2: chars 1600-2600   (200 char overlap with chunk 1)
...
```

### Vector Search Functions

**Implementation:** `apps/api/src/lib/vectorSearch.ts`

Uses **Prisma with raw SQL** (not Supabase client) for pgvector operations. Returns **LangChain Documents** for seamless integration with LangChain chains and retrievers.

#### searchSimilarChunks(queryText, limit, similarityThreshold)

- Searches across all documents using vector similarity
- Returns LangChain Documents with similarity scores
- Default: top 10 results with similarity >= 0.6
- Returns: `DocumentWithScore[]` (LangChain Documents + similarity metadata)

#### searchWithinDocument(documentId, queryText, limit, similarityThreshold)

- Searches within a specific document using vector similarity
- Returns LangChain Documents from that document only
- Default: top 5 results with similarity >= 0.6
- Returns: `DocumentWithScore[]` (LangChain Documents + similarity metadata)

**pgvector operator:** Uses `<=>` for cosine distance (lower = more similar)

```sql
1 - (embedding <=> query_embedding) AS similarity
ORDER BY embedding <=> query_embedding
```

**Return format:** All search results are returned as LangChain `Document` objects with metadata:
- `pageContent` - The chunk text content
- `metadata.id` - Chunk ID
- `metadata.documentId` - Parent document ID
- `metadata.chunkIndex` - Position in document
- `metadata.similarity` - Similarity score (0-1)
- `metadata.document` - Document metadata (filename, mimetype, etc.)

### Embeddings Configuration

**Provider:** OpenAI via `@langchain/openai`
**Model:** `text-embedding-3-large`
**Dimensions:** 3072
**File:** `apps/api/src/lib/embeddings.ts`

Functions:

- `createEmbedding(text)` - Single embedding
- `createEmbeddingsBatch(texts[])` - Batch processing (used for chunks)

### File Upload Endpoint

**POST /upload**

- **Content-Type:** `multipart/form-data`
- **Field name:** `file`
- **Max size:** 10MB
- **Allowed types:** PDF, text/plain, text/csv, text/markdown
- **Features:**
  - SHA-256 content hash for duplicate detection
  - Returns existing document if duplicate found
  - Uploads to Supabase Storage
  - Triggers async processing via Inngest

**Example cURL:**

```bash
curl -X POST http://localhost:3001/upload \
  -F "file=@/path/to/document.pdf"
```

**Example Fetch API:**

```javascript
const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch("http://localhost:3001/upload", {
  method: "POST",
  body: formData,
});
```

### Async Processing with Inngest

**Function:** `processFileUpload` in `apps/api/src/inngest/functions/processFileUpload.ts`
**Event:** `app/document.process`
**Endpoint:** `POST /api/inngest` (webhook for Inngest)

Steps:

1. **fetch-document** - Get document from database
2. **download-file** - Download from Supabase Storage
3. **process-file-content** - Extract text (PDF or text)
4. **chunk-and-embed** - Chunk text and create embeddings
5. **store-chunks** - Store chunks with embeddings in database
6. **update-document-metadata** - Update document record

### Environment Variables

Required in `apps/api/.env`:

```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=documents
DATABASE_URL=postgresql://...  (transaction pooler)
DIRECT_URL=postgresql://...    (session pooler)
```

### Key Dependencies

- `@langchain/openai` - OpenAI embeddings
- `@langchain/textsplitters` - Text chunking
- `@prisma/client` - Database access
- `@supabase/supabase-js` - File storage
- `@fastify/multipart` - File uploads
- `inngest` - Async job processing
- `pdf-parse` - PDF text extraction

### Usage Examples

**Upload a document:**

```typescript
const formData = new FormData();
formData.append("file", pdfFile);
const response = await fetch("/upload", { method: "POST", body: formData });
```

**Search across all documents:**

```typescript
import { searchSimilarChunks } from "./lib/vectorSearch";
const results = await searchSimilarChunks("machine learning", 10, 0.7);
// Returns DocumentWithScore[] - LangChain Documents with similarity scores
// Access via: results[0].document.pageContent, results[0].document.metadata, results[0].similarity
```

**Search within specific document:**

```typescript
import { searchWithinDocument } from "./lib/vectorSearch";
const results = await searchWithinDocument(docId, "neural networks", 5, 0.7);
// Returns DocumentWithScore[] - LangChain Documents from specified document
```

### File Organization

- **`src/lib/database.ts`** - All database operations using Prisma
  - Document CRUD operations: find, create, get, update
  - Returns Prisma types with proper TypeScript support
- **`src/lib/storage.ts`** - File storage operations using Supabase Storage
  - Upload, download, delete files from Supabase Storage
  - Separate from database layer for clean architecture
- **`src/lib/vectorSearch.ts`** - Vector search queries using Prisma + pgvector
  - Returns LangChain Documents for seamless integration with retrieval chains
- **`src/lib/retriever.ts`** - Custom LangChain retriever (PrismaRetriever)
  - Wraps vector search in LangChain's BaseRetriever interface
- **`src/lib/embeddings.ts`** - OpenAI embedding generation
- **`src/lib/chunking.ts`** - Text splitting logic

### Important Notes

- **Use Prisma for database operations** via `src/lib/database.ts`
- **Use Supabase only for file storage** via `src/lib/storage.ts`
- **Chunks are deleted** when parent document is deleted (CASCADE)
- **Overlapping chunks** ensure important context isn't split
- **Similarity threshold** defaults to 0.6 (0-1 scale, 1 = identical). This is a balanced threshold that captures semantically relevant content. For stricter matching, use 0.7+; for broader results, use 0.5-0.6. Adjust based on your use case.
- **Legacy embedding field** in documents table is no longer used

## Chat System with RAG (Retrieval Augmented Generation)

The API implements a conversational AI system using LangChain and OpenAI GPT-4o, with RAG to ground responses in uploaded document knowledge.

### Architecture Overview

```
User sends message to conversation
  ↓
POST /conversations/:id/messages
  ↓
1. Save user message to database
2. Retrieve conversation history
3. Perform vector search for relevant document chunks (RAG)
4. Build system prompt with retrieved context
5. Stream AI response using LangChain + GPT-4o
6. Save assistant message with source citations
7. Auto-generate conversation title (first message only)
  ↓
Client receives Server-Sent Events stream
```

### Database Schema

#### conversations table

- Stores chat sessions
- `id` (UUID) - Primary key
- `title` (TEXT, nullable) - Conversation title (auto-generated or user-provided)
- `created_at`, `updated_at` (TIMESTAMP) - Tracking timestamps

#### messages table

- Stores individual messages (user/assistant/system)
- `id` (UUID) - Primary key
- `conversation_id` (UUID) - Foreign key to conversations
- `role` (TEXT) - Message role: "user", "assistant", or "system"
- `content` (TEXT) - Message text content
- `created_at` (TIMESTAMP) - Message timestamp
- Relation: `sources` - Links to message_sources for citations

#### message_sources table

- Links messages to document chunks used as context (citation tracking)
- `id` (UUID) - Primary key
- `message_id` (UUID) - Foreign key to messages
- `chunk_id` (UUID) - Foreign key to document_chunks
- `similarity_score` (FLOAT) - Cosine similarity score from vector search (0-1)
- Enables displaying which documents were used to generate each response

**Cascading deletes:** Deleting a conversation deletes all messages and message_sources

### RAG Service with LangChain

**Implementation:** `apps/api/src/lib/rag.ts`

The RAG (Retrieval Augmented Generation) service uses **LangChain abstractions** for retrieval and prompt management.

#### createRetriever(options)

- Factory function that creates a `PrismaRetriever` instance
- Configures: `k` (limit), `similarityThreshold`, optional `documentId`
- Returns: LangChain `BaseRetriever` for use with chains

#### retrieveDocuments(query, options)

- Main retrieval function using PrismaRetriever
- Uses LangChain's `.invoke()` pattern for standardization
- Default: top 5 documents with similarity >= 0.6
- Returns: `{ documents: Document[], context: string }`
  - `documents` - Array of LangChain Documents with metadata
  - `context` - Formatted context string ready for prompt injection

#### formatDocumentsForContext(documents)

- Formats LangChain Documents into structured context string
- Includes source numbers, document names, and relevance scores
- Format: `[Source 1] filename.pdf (Relevance: 87.5%)\n<chunk content>`

#### createRAGPromptTemplate()

- Creates a LangChain `ChatPromptTemplate` configured for RAG
- Returns template with system instructions and placeholders
- Ready to use with LangChain chains (e.g., `createStuffDocumentsChain`)
- System prompt instructs model to:
  - Base answers on provided context
  - Cite sources by number (e.g., "According to Source 1...")
  - Admit when context doesn't contain relevant information
  - Not hallucinate information beyond the context

### Chat Service with LangChain

**Implementation:** `apps/api/src/lib/chat.ts`

Uses **LangChain** with **OpenAI GPT-4o** for conversational AI with streaming.

**Configuration:**
- Model: `gpt-4o`
- Temperature: 0.7 (configurable)
- Max tokens: 2000 (configurable)
- Streaming: enabled

#### streamChatWithRAG(params)

Main streaming function that:
1. Retrieves RAG context using LangChain retriever if enabled (useRAG: true)
2. Builds conversation history from database
3. Constructs message array (system + history + user query)
4. Streams response tokens using LangChain's `stream()` method
5. Returns: `{ stream: AsyncIterable<string>, sourceDocuments: Document[] }`

**Parameters:**
- `userQuery` - Current user message
- `conversationHistory` - Array of prior messages: `{ role, content }[]`
- `useRAG` - Enable/disable RAG context retrieval (default: true)
- `ragOptions` - Configure vector search: `{ limit?, similarityThreshold? }`

**Return value:**
- `stream` - AsyncIterable of response tokens for streaming
- `sourceDocuments` - Array of LangChain Documents used as context (includes similarity in metadata)

#### generateConversationTitle(firstMessage)

- Auto-generates conversation title from first user message
- Uses GPT-4o-mini for cost efficiency
- Limits: 6 words, 50 characters max
- Fallback: first 50 chars of message if generation fails

#### chatWithRAG(params)

- Non-streaming version (collects all tokens into single response)
- Useful for testing or non-interactive use cases
- Returns: `{ response: string, sourceDocuments: Document[] }`

### Chat API Endpoints

**Implementation:** `apps/api/src/routes/chat.ts`

All endpoints follow RESTful conventions with JSON responses.

#### POST /conversations

Create a new conversation.

**Request body:**
```json
{ "title": "Optional title" }
```

**Response:** 201 Created
```json
{
  "success": true,
  "conversation": {
    "id": "uuid",
    "title": "Optional title",
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp"
  }
}
```

#### POST /conversations/:id/messages

Send a message and receive streaming AI response with RAG context.

**Request body:**
```json
{
  "message": "What is machine learning?",
  "useRAG": true,
  "ragOptions": {
    "limit": 5,
    "similarityThreshold": 0.6
  }
}
```

**Response:** Server-Sent Events (SSE) stream

Event types:
- `{ type: "token", content: "..." }` - Individual response tokens
- `{ type: "done", sources: [...] }` - Completion with citations
- `{ type: "title", title: "..." }` - Auto-generated title (first message only)
- `{ type: "error", message: "..." }` - Error during streaming

**Example client (JavaScript):**
```javascript
const response = await fetch(`/conversations/${id}/messages`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Your question?' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  const lines = text.split('\n\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const event = JSON.parse(line.slice(6));

      if (event.type === 'token') {
        console.log(event.content); // Display token
      } else if (event.type === 'done') {
        console.log('Sources:', event.sources); // Show citations
      }
    }
  }
}
```

#### GET /conversations

List all conversations with pagination.

**Query params:**
- `limit` (default: 20) - Max conversations to return
- `offset` (default: 0) - Skip N conversations

**Response:** 200 OK
```json
{
  "success": true,
  "conversations": [
    { "id": "uuid", "title": "...", "createdAt": "...", "updatedAt": "..." }
  ],
  "pagination": { "limit": 20, "offset": 0, "count": 15 }
}
```

#### GET /conversations/:id

Get a conversation with all its messages.

**Response:** 200 OK
```json
{
  "success": true,
  "conversation": {
    "id": "uuid",
    "title": "Machine Learning Discussion",
    "messages": [
      { "id": "uuid", "role": "user", "content": "...", "createdAt": "..." },
      { "id": "uuid", "role": "assistant", "content": "...", "createdAt": "..." }
    ]
  }
}
```

#### GET /conversations/:id/messages

Get only the messages for a conversation (lightweight endpoint).

**Response:** Same as above but only `messages` array.

#### DELETE /conversations/:id

Delete a conversation and all its messages (cascading).

**Response:** 200 OK
```json
{ "success": true, "message": "Conversation deleted successfully" }
```

#### GET /messages/:messageId/sources

Get a message with its source document chunks (for displaying citations).

**Response:** 200 OK
```json
{
  "success": true,
  "message": {
    "id": "uuid",
    "role": "assistant",
    "content": "According to Source 1...",
    "sources": [
      {
        "id": "uuid",
        "chunkId": "uuid",
        "similarityScore": 0.87,
        "content": "Machine learning is...",
        "document": {
          "filename": "ml-guide.pdf",
          "mimetype": "application/pdf"
        }
      }
    ]
  }
}
```

### Chat Database Operations

**Implementation:** `apps/api/src/lib/database.ts` (extended)

All chat operations follow the same patterns as document operations:
- Proper TypeScript types
- Try-catch error handling
- Descriptive error messages

**Conversation operations:**
- `createConversation(title?)` - Create new conversation
- `getConversation(id)` - Get conversation by ID
- `getConversationWithMessages(id)` - Get with messages (includes relation)
- `listConversations(limit, offset)` - Paginated list (ordered by updated_at DESC)
- `updateConversationTitle(id, title)` - Update title
- `deleteConversation(id)` - Delete (cascades to messages/sources)

**Message operations:**
- `createMessage(input)` - Create message with optional sources
  - Input: `{ conversation_id, role, content, sources?: [{ chunk_id, similarity_score }] }`
  - Auto-updates conversation's `updated_at` timestamp
- `getMessages(conversationId, limit?)` - Get messages (ordered by created_at ASC)
- `getMessageWithSources(messageId)` - Get message with full source details

### File Organization

- **`src/lib/rag.ts`** - LangChain RAG service (retriever, prompts, document formatting)
- **`src/lib/retriever.ts`** - Custom PrismaRetriever extending LangChain BaseRetriever
- **`src/lib/chat.ts`** - LangChain chat service with streaming
- **`src/lib/database.ts`** - Extended with conversation/message operations
- **`src/routes/chat.ts`** - RESTful chat endpoints with SSE streaming

### Key Dependencies

- `@langchain/openai` - ChatOpenAI for GPT-4o integration, OpenAI embeddings
- `@langchain/core` - Core abstractions:
  - Message types (HumanMessage, AIMessage, SystemMessage)
  - Document type for RAG
  - BaseRetriever interface
  - ChatPromptTemplate for prompts
- `langchain` - Main LangChain package with retrieval chains
- Reuses existing: `@prisma/client` for database, pgvector for search

### Environment Variables

Same as document processing (no additional variables required):
- `OPENAI_API_KEY` - Used for both embeddings and chat completions

### Usage Flow Example

```typescript
// 1. Create conversation
const conv = await createConversation();

// 2. Send first message (streaming with LangChain RAG)
const { stream, sourceDocuments } = await streamChatWithRAG({
  userQuery: "What is machine learning?",
  conversationHistory: [],
  useRAG: true,
  ragOptions: { limit: 5, similarityThreshold: 0.6 }
});

// 3. Collect response
let fullResponse = '';
for await (const token of stream) {
  fullResponse += token;
  // Display token in real-time
}

// 4. Save messages with citations
// sourceDocuments are LangChain Documents with metadata
await createMessage({
  conversation_id: conv.id,
  role: 'user',
  content: "What is machine learning?"
});

await createMessage({
  conversation_id: conv.id,
  role: 'assistant',
  content: fullResponse,
  sources: sourceDocuments.map(doc => ({
    chunk_id: doc.metadata.id,
    similarity_score: doc.metadata.similarity
  }))
});
```

### Important Notes

- **Uses LangChain abstractions** - Custom PrismaRetriever wraps pgvector search in LangChain's BaseRetriever interface
- **Returns LangChain Documents** - All search results and RAG sources use LangChain's Document type with metadata
- **Streaming uses Server-Sent Events (SSE)** - Client must parse `data: {...}` format
- **RAG is optional** - Set `useRAG: false` to disable context retrieval
- **Conversation history is automatic** - Retrieved from database before streaming
- **Citations are tracked** - message_sources links responses to document chunks via Document metadata
- **Title auto-generation** - Only happens on first message if no title provided
- **All database writes use transactions** - Message creation updates conversation timestamps
- **LangChain-compatible** - Easy to extend with chains, agents, and other LangChain features

### Turborepo Configuration

- Build tasks depend on upstream builds (`^build` dependency)
- Dev tasks are persistent and uncached
- Build outputs are cached in `.next/` for Next.js apps and `dist/` for Node.js apps
- Uses TUI (Terminal UI) mode for better task visualization
