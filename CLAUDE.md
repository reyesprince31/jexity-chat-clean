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

Uses **Prisma with raw SQL** (not Supabase client) for pgvector operations.

#### searchSimilarChunks(queryText, limit, similarityThreshold)

- Searches across all documents
- Returns chunks sorted by cosine similarity
- Default: top 10 results with similarity >= 0.7

#### searchWithinDocument(documentId, queryText, limit, similarityThreshold)

- Searches within a specific document
- Returns chunks from that document only
- Default: top 5 results with similarity >= 0.7

**pgvector operator:** Uses `<=>` for cosine distance (lower = more similar)

```sql
1 - (embedding <=> query_embedding) AS similarity
ORDER BY embedding <=> query_embedding
```

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
// Returns array of SearchResult with content, similarity, documentId, etc.
```

**Search within specific document:**

```typescript
import { searchWithinDocument } from "./lib/vectorSearch";
const results = await searchWithinDocument(docId, "neural networks", 5, 0.7);
```

### File Organization

- **`src/lib/database.ts`** - All database operations using Prisma
  - Document CRUD operations: find, create, get, update
  - Returns Prisma types with proper TypeScript support
- **`src/lib/storage.ts`** - File storage operations using Supabase Storage
  - Upload, download, delete files from Supabase Storage
  - Separate from database layer for clean architecture
- **`src/lib/vectorSearch.ts`** - Vector search queries using Prisma + pgvector
- **`src/lib/embeddings.ts`** - OpenAI embedding generation
- **`src/lib/chunking.ts`** - Text splitting logic

### Important Notes

- **Use Prisma for database operations** via `src/lib/database.ts`
- **Use Supabase only for file storage** via `src/lib/storage.ts`
- **Chunks are deleted** when parent document is deleted (CASCADE)
- **Overlapping chunks** ensure important context isn't split
- **Similarity threshold** 0.7 is recommended (0-1 scale, 1 = identical)
- **Legacy embedding field** in documents table is no longer used

### Turborepo Configuration

- Build tasks depend on upstream builds (`^build` dependency)
- Dev tasks are persistent and uncached
- Build outputs are cached in `.next/` for Next.js apps and `dist/` for Node.js apps
- Uses TUI (Terminal UI) mode for better task visualization
