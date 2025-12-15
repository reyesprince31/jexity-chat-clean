# Migration Guide: Inngest → useworkflow.dev

This document outlines the migration from Inngest to [useworkflow.dev](https://useworkflow.dev/) (Workflow DevKit) for the API background job processing.

## Why Migrate?

- **Module resolution issues**: Inngest was causing `ERR_MODULE_NOT_FOUND` errors in Vercel serverless deployment
- **Simpler syntax**: useworkflow.dev uses directive-based syntax (`"use workflow"`, `"use step"`)
- **Vercel-native**: Works seamlessly with Vercel deployments

## Overview

| Aspect | Inngest | useworkflow.dev |
|--------|---------|-----------------|
| **Build System** | tsup | Nitro |
| **Workflow Definition** | `inngest.createFunction()` | `"use workflow"` directive |
| **Step Definition** | `step.run("name", async () => {})` | `"use step"` directive in function |
| **Triggering** | `inngest.send({ name, data })` | `start(workflowFn, [args])` |
| **Sleep/Delay** | `step.sleep("1h")` | `sleep("1h")` |

## ⚠️ Important: HTTP-based Architecture

useworkflow.dev runs workflows in a sandboxed environment that **does not support Node.js modules**. This means:
- ❌ Direct Prisma usage in workflows
- ❌ Direct file system access
- ❌ Node.js built-in modules (`node:path`, `node:url`, etc.)

**Solution**: All database and heavy operations are exposed via internal API endpoints, and the workflow calls these via `fetch()`.

---

## Architecture Diagram

```
┌─────────────────┐     ┌──────────────────────────────────────┐
│  Upload Route   │     │           Workflow Runtime           │
│  /upload        │     │  (Sandboxed - No Node.js modules)    │
└────────┬────────┘     └──────────────────┬───────────────────┘
         │                                 │
         │ start(processDocument, [id])    │ fetch() calls
         ▼                                 ▼
┌─────────────────┐     ┌──────────────────────────────────────┐
│  Workflow       │────▶│       Internal API Endpoints         │
│  DevKit         │     │  /internal/documents/:id/*           │
└─────────────────┘     │  (Full Node.js - Prisma, PDF, etc.)  │
                        └──────────────────────────────────────┘
```

---

## Migration Steps

### Step 1: Update Dependencies

```bash
cd apps/api

# Remove Inngest
pnpm remove inngest

# Add Workflow DevKit dependencies
pnpm add workflow nitro rollup
```

**package.json changes:**
```json
{
  "dependencies": {
    // Remove: "inngest": "3.44.3",
    // Add:
    "workflow": "latest",
    "nitro": "latest",
    "rollup": "latest"
  }
}
```

### Step 2: Create Nitro Configuration

Create `apps/api/nitro.config.ts`:

```typescript
import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  modules: ["workflow/nitro"],
  vercel: {
    entryFormat: "node"
  },
  routes: {
    "/**": {
      handler: "./src/index.ts",
      format: "node"
    },
  },
});
```

### Step 3: Update package.json Scripts

```json
{
  "scripts": {
    "dev": "nitro dev",
    "build": "nitro build",
    "start": "node .output/server/index.mjs"
  }
}
```

### Step 4: Convert Workflow Functions

**Before (Inngest):**
```typescript
// src/inngest/functions/processFileUpload.ts
import { inngest } from "../client";

export const processFileUpload = inngest.createFunction(
  { id: "process-document", name: "Process Document" },
  { event: "app/document.process" },
  async ({ event, step }) => {
    const { documentId } = event.data;

    const document = await step.run("fetch-document", async () => {
      return await getDocumentById(documentId);
    });

    const fileBuffer = await step.run("download-file", async () => {
      return await downloadFileFromStorage(document.storage_path);
    });

    // ... more steps
  }
);
```

**After (useworkflow.dev):**
```typescript
// src/workflows/processDocument.ts
import { FatalError } from "workflow";

export async function processDocument(documentId: string) {
  "use workflow";
  
  const document = await fetchDocument(documentId);
  const fileBuffer = await downloadFile(document.storage_path);
  const processResult = await processFileContent(fileBuffer, document);
  
  if (processResult.canCreateEmbedding) {
    await chunkEmbedStore(documentId, processResult);
  }
  
  await updateDocumentMetadata(documentId);
  
  return { success: true, documentId };
}

// Step functions
async function fetchDocument(documentId: string) {
  "use step";
  const document = await getDocumentById(documentId);
  if (!document) {
    throw new FatalError(`Document not found: ${documentId}`);
  }
  return document;
}

async function downloadFile(storagePath: string) {
  "use step";
  return await downloadFileFromStorage(storagePath);
}

// ... more step functions
```

### Step 5: Update Trigger Code

**Before (Inngest):**
```typescript
// src/routes/upload.ts
import { inngest } from "../inngest/client.js";

// Trigger processing
const eventId = await inngest.send({
  name: "app/document.process",
  data: { documentId: document.id },
});
```

**After (useworkflow.dev):**
```typescript
// src/routes/upload.ts
import { start } from "workflow/api";
import { processDocument } from "../workflows/processDocument.js";

// Trigger processing
await start(processDocument, [document.id]);
```

### Step 6: Update Main Entry Point

**Before:**
```typescript
// src/index.ts
import { fastifyPlugin } from "inngest/fastify";
import { functions } from "./inngest/index";
import { inngest } from "./inngest/client";

fastify.register(fastifyPlugin, {
  client: inngest,
  functions,
  options: {},
});

const start = async () => {
  await fastify.listen({ port: Number(PORT), host: "0.0.0.0" });
};

start();
```

**After:**
```typescript
// src/index.ts
// Remove all Inngest imports and registration

// For Nitro compatibility, export the handler
await fastify.ready();

export default (req: any, res: any) => {
  fastify.server.emit("request", req, res);
};
```

### Step 7: Clean Up

Delete the old Inngest files:
```
apps/api/src/inngest/
├── client.ts          # DELETE
├── index.ts           # DELETE
└── functions/
    └── processFileUpload.ts  # CONVERT → src/workflows/
```

---

## File Structure After Migration

```
apps/api/
├── nitro.config.ts              # NEW: Nitro configuration
├── src/
│   ├── index.ts                 # MODIFIED: Remove Inngest, add Nitro export
│   ├── routes/
│   │   └── upload.ts            # MODIFIED: Use start() instead of inngest.send()
│   └── workflows/               # NEW: Workflow directory
│       └── processDocument.ts   # NEW: Converted workflow
```

---

## Key Differences to Remember

### 1. Directive-Based Steps
Instead of wrapping code in `step.run()`, add `"use step"` directive at the start of a function:

```typescript
// Inngest
await step.run("step-name", async () => {
  return await someOperation();
});

// useworkflow.dev
async function stepName() {
  "use step";
  return await someOperation();
}
```

### 2. Error Handling
Use `FatalError` to prevent retries on intentional errors:

```typescript
import { FatalError } from "workflow";

async function validateInput(data: unknown) {
  "use step";
  if (!data) {
    throw new FatalError("Invalid input - no retry");
  }
}
```

### 3. Sleep/Delays
```typescript
import { sleep } from "workflow";

async function myWorkflow() {
  "use workflow";
  await doSomething();
  await sleep("5m"); // Pause for 5 minutes without consuming resources
  await doSomethingElse();
}
```

---

## Environment Variables

No special Inngest environment variables needed. Remove from `.env`:
```
# INNGEST_EVENT_KEY=...     # Remove if present
# INNGEST_SIGNING_KEY=...   # Remove if present
```

---

## Testing Locally

```bash
# Start development server
pnpm run dev

# Trigger a workflow via API call
curl -X POST http://localhost:3000/upload -F "file=@test.pdf"

# Inspect workflow runs
npx workflow inspect runs --web
```

---

## Deployment

useworkflow.dev works best with Vercel. No special configuration needed - just deploy as usual.

---

## Rollback Plan

If issues arise, revert by:
1. `git checkout` to previous commit
2. Re-run `pnpm install` to restore Inngest dependencies

---

---

## Implementation Details (Completed)

### Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `src/routes/internal.ts` | **Created** | Internal API endpoints for workflow operations |
| `src/workflows/processDocument.ts` | **Refactored** | Workflow using fetch() instead of Prisma |
| `src/routes/upload.ts` | **Modified** | Uses `start()` to trigger workflow |
| `src/index.ts` | **Modified** | Registers internal routes, exports Nitro handler |
| `nitro.config.ts` | **Created** | Nitro build configuration |
| `package.json` | **Modified** | Updated dependencies and scripts |

### Internal API Endpoints

All endpoints require `x-internal-api-key` header for authentication.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/internal/documents/:id` | GET | Fetch document details |
| `/internal/documents/:id/file` | GET | Download file as base64 |
| `/internal/documents/:id/extract-text` | POST | Extract text from PDF/text file |
| `/internal/documents/:id/process-chunks` | POST | Chunk text, create embeddings, store |
| `/internal/documents/:id/metadata` | PATCH | Update has_embedding flag |
| `/internal/documents/:id` | DELETE | Delete document (cleanup on failure) |

### Workflow Steps

The `processDocument` workflow orchestrates these steps via HTTP calls:

1. **fetchDocument** - GET document details from database
2. **downloadFile** - GET file content as base64
3. **extractText** - POST to extract text from PDF/text and store
4. **processChunks** - POST to chunk, embed, and store (if embeddable)
5. **updateMetadata** - PATCH to set has_embedding flag

### Environment Variables

Add these to your `.env`:

```bash
# Required for workflow to call internal endpoints
API_BASE_URL=https://your-api-domain.vercel.app  # Production URL
INTERNAL_API_KEY=your-secure-random-key-here     # Generate a strong key
```

For local development:
```bash
API_BASE_URL=http://localhost:3001
INTERNAL_API_KEY=internal-api-key-change-me
```

### Build Commands

```bash
# Development
pnpm run dev      # Starts Nitro dev server

# Production build
pnpm run build    # Builds with Nitro

# Start production
pnpm run start    # Runs .output/server/index.mjs
```

---

## References

- [useworkflow.dev Documentation](https://useworkflow.dev/docs)
- [Fastify Integration Guide](https://useworkflow.dev/docs/getting-started/fastify)
- [Workflow Foundations](https://useworkflow.dev/docs/foundations)
- [API Reference](https://useworkflow.dev/docs/api-reference)
