# Page Number Tracking System

## Overview

This document explains how the AI chat system tracks page numbers in PDF documents, enabling users to see which page a piece of information came from when the AI cites a source.

When you ask the AI a question like "What is machine learning?", and it responds with a citation like `[Source 1] ml-guide.pdf (page 5)`, this system is what makes showing "page 5" possible.

---

## The Problem

When we chunk a PDF document for vector search, we need to answer this question:

**"If a chunk starts at character 12,450 in the full document text, which PDF page does that correspond to?"**

Without tracking page numbers, we only knew:

- ✅ The chunk's text content
- ✅ The chunk's character position in the full document (e.g., chars 12,450 - 13,450)
- ❌ Which page(s) the chunk came from

---

## The Solution: Character-to-Page Mapping

We create a **mapping** that links character positions to page numbers. Think of it like a lookup table:

```
Character Range  →  Page Number
0 - 5,000        →  Page 1
5,000 - 12,000   →  Page 2
12,000 - 15,000  →  Page 3
```

When a chunk spans characters 12,450 to 13,450, we can look up:

- Character 12,450 = Page 3 (start page)
- Character 13,449 = Page 3 (end page)
- Result: Chunk is on **page 3**

If a chunk spans 11,800 to 12,800:

- Character 11,800 = Page 2 (start page)
- Character 12,799 = Page 3 (end page)
- Result: Chunk spans **pages 2-3**

---

## How It Works: Step-by-Step

### Step 1: Extract Per-Page Text from PDF

**File:** `apps/api/src/inngest/functions/processFileUpload.ts`

When processing a PDF, instead of just getting all the text concatenated together, we extract text **per-page**:

```typescript
// OLD: Just get concatenated text
const result = await parser.getText();
const text = result.text; // All pages combined

// NEW: Get per-page text array
const result = await parser.getText();
const pageTexts = result.pages.map((page) => page.text); // Array of page texts

// Example result:
pageTexts = [
  "This is the text on page 1...", // 5,000 characters
  "This is the text on page 2...", // 7,000 characters
  "This is the text on page 3...", // 3,000 characters
];
```

The `pdf-parse` library's `.pages` array gives us:

- `page.num` - The page number (1, 2, 3, ...)
- `page.text` - The text content of that specific page

### Step 2: Build Character-to-Page Mapping

**File:** `apps/api/src/lib/chunking.ts`
**Function:** `buildPageMapping(pageTexts: string[])`

We concatenate the page texts together while tracking where each page starts and ends in terms of character positions:

```typescript
function buildPageMapping(pageTexts: string[]): PageMapping {
  const pageInfos: PageInfo[] = [];
  let currentPosition = 0;

  for (let i = 0; i < pageTexts.length; i++) {
    const pageText = pageTexts[i];
    const startPosition = currentPosition;
    const endPosition = startPosition + pageText.length;

    pageInfos.push({
      pageNumber: i + 1, // 1-indexed (page 1, 2, 3...)
      startPosition: startPosition, // Character start
      endPosition: endPosition, // Character end
      text: pageText, // Original page text
    });

    currentPosition = endPosition; // Move position for next page
  }

  return { pages: pageInfos, totalPages: pageTexts.length };
}
```

**Example with a 3-page PDF:**

```
Input:
pageTexts[0] = "Machine learning is..." (5,000 chars)
pageTexts[1] = "Deep learning uses..." (7,000 chars)
pageTexts[2] = "Neural networks are..." (3,000 chars)

Output mapping:
[
  { pageNumber: 1, startPosition: 0,     endPosition: 5000,  text: "..." },
  { pageNumber: 2, startPosition: 5000,  endPosition: 12000, text: "..." },
  { pageNumber: 3, startPosition: 12000, endPosition: 15000, text: "..." }
]
```

### Step 3: Chunk Text with Page Tracking

**File:** `apps/api/src/lib/chunking.ts`
**Function:** `chunkText(text: string, pageMapping?: PageMapping)`

When creating chunks, we:

1. Use LangChain's text splitter (1000 chars, 200 overlap)
2. Track each chunk's character positions
3. **Calculate which page(s) each chunk belongs to**

```typescript
export async function chunkText(
  text: string,
  pageMapping?: PageMapping
): Promise<DocumentChunk[]> {
  // ... chunk the text using LangChain ...

  for (let i = 0; i < chunks.length; i++) {
    const startPosition = currentPosition;
    const endPosition = startPosition + chunkText.length;

    // NEW: Calculate page numbers
    if (pageMapping) {
      const startPage = calculatePageForPosition(startPosition, pageMapping);
      const endPage = calculatePageForPosition(endPosition - 1, pageMapping);

      if (startPage !== null) {
        pageNumber = startPage;
        // Only set pageEnd if chunk spans multiple pages
        if (endPage !== null && endPage !== startPage) {
          pageEnd = endPage;
        }
      }
    }

    documentChunks.push({
      content: chunkText,
      metadata: {
        chunkIndex: i,
        startPosition,
        endPosition,
        length: chunkText.length,
        pageNumber, // 👈 NEW
        pageEnd, // 👈 NEW (if spans multiple pages)
      },
    });
  }
}
```

### Step 4: Look Up Page for Character Position

**File:** `apps/api/src/lib/chunking.ts`
**Function:** `calculatePageForPosition(position: number, pageMapping: PageMapping)`

This is the **key lookup function** that answers: "What page is character position X on?"

```typescript
function calculatePageForPosition(
  position: number,
  pageMapping: PageMapping
): number | null {
  // Loop through each page's boundaries
  for (const page of pageMapping.pages) {
    // Check if position falls within this page's range
    if (position >= page.startPosition && position < page.endPosition) {
      return page.pageNumber;
    }
  }
  return null; // Position not found
}
```

**Example lookups:**

```
Mapping:
Page 1: chars 0 - 5,000
Page 2: chars 5,000 - 12,000
Page 3: chars 12,000 - 15,000

calculatePageForPosition(3000, mapping)    → 1  (char 3000 is in range 0-5000)
calculatePageForPosition(8000, mapping)    → 2  (char 8000 is in range 5000-12000)
calculatePageForPosition(12450, mapping)   → 3  (char 12450 is in range 12000-15000)
```

---

## Complete Example Walkthrough

Let's trace through a complete example:

### 1. PDF Upload

User uploads `ml-guide.pdf` (3 pages):

```
Page 1: "Machine learning is a subset of AI..." (5,000 chars)
Page 2: "Deep learning uses neural networks..." (7,000 chars)
Page 3: "Convolutional networks process images..." (3,000 chars)
```

### 2. Extract Per-Page Text

```typescript
const result = await parser.getText();
const pageTexts = result.pages.map((p) => p.text);

// pageTexts = [
//   "Machine learning is...",  // 5,000 chars
//   "Deep learning uses...",   // 7,000 chars
//   "Convolutional networks...", // 3,000 chars
// ]
```

### 3. Build Page Mapping

```typescript
const pageMapping = buildPageMapping(pageTexts);

// Result:
// {
//   pages: [
//     { pageNumber: 1, startPosition: 0,     endPosition: 5000  },
//     { pageNumber: 2, startPosition: 5000,  endPosition: 12000 },
//     { pageNumber: 3, startPosition: 12000, endPosition: 15000 }
//   ],
//   totalPages: 3
// }
```

### 4. Concatenate Text

The full document text is created by joining all page texts:

```typescript
const fullText = pageTexts.join(""); // 15,000 characters total
```

### 5. Chunk with LangChain (1000 chars, 200 overlap)

```
Chunk 0: chars 0-1000       → Page 1
Chunk 1: chars 800-1800     → Page 1
Chunk 2: chars 1600-2600    → Page 1
Chunk 3: chars 2400-3400    → Page 1
Chunk 4: chars 3200-4200    → Page 1
Chunk 5: chars 4000-5000    → Pages 1-2 (spans boundary!)
Chunk 6: chars 4800-5800    → Page 2
...
Chunk 15: chars 11800-12800 → Pages 2-3 (spans boundary!)
...
```

### 6. Calculate Page Numbers for Chunk 5

Chunk 5: chars 4000-5000

```typescript
const startPage = calculatePageForPosition(4000, pageMapping);
// 4000 is in range 0-5000 → returns 1

const endPage = calculatePageForPosition(4999, pageMapping);
// 4999 is in range 0-5000 → returns 1

// Result: { pageNumber: 1, pageEnd: undefined }
// This chunk is entirely on page 1
```

### 7. Calculate Page Numbers for Chunk 5 (Actually Spans Pages)

Let's say Chunk 5 is actually chars 4900-5900:

```typescript
const startPage = calculatePageForPosition(4900, pageMapping);
// 4900 is in range 0-5000 → returns 1

const endPage = calculatePageForPosition(5899, pageMapping);
// 5899 is in range 5000-12000 → returns 2

// Result: { pageNumber: 1, pageEnd: 2 }
// This chunk spans pages 1-2!
```

### 8. Store in Database

The chunk is stored with metadata:

```json
{
  "chunkIndex": 5,
  "content": "...text spanning pages 1-2...",
  "startPosition": 4900,
  "endPosition": 5900,
  "length": 1000,
  "pageNumber": 1,
  "pageEnd": 2,
  "locationType": "page"
}
```

### 9. RAG Search & Display

When user asks "What is machine learning?" and Chunk 5 is retrieved:

```
API Response:
{
  type: "done",
  sources: [
    {
      filename: "ml-guide.pdf",
      pageNumber: 1,
      pageEnd: 2,
      similarity: 0.875,
      content: "...chunk content..."
    }
  ]
}

Chat Widget Displays:
Source 0: ml-guide.pdf (pages 1-2) (Relevance: 87.5%)
```

---

## Key Data Structures

### PageInfo

Represents a single page with its character boundaries:

```typescript
interface PageInfo {
  pageNumber: number; // 1-indexed page number (1, 2, 3...)
  startPosition: number; // Character position where page starts
  endPosition: number; // Character position where page ends
  text: string; // The original page text
}
```

### PageMapping

Contains all pages and total count:

```typescript
interface PageMapping {
  pages: PageInfo[]; // Array of page info objects
  totalPages: number; // Total number of pages
}
```

### ChunkMetadata

Stored in database's `document_chunks.metadata` JSONB field:

```typescript
interface ChunkMetadata {
  chunkIndex: number; // Position in chunk sequence
  startPosition: number; // Character start in full text
  endPosition: number; // Character end in full text
  length: number; // Length in characters
  pageNumber?: number; // Starting page (optional, 1-indexed)
  pageEnd?: number; // Ending page if multi-page (optional)
  locationType?: "page"; // Type of location tracking
}
```

---

## Visual Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ PDF Document: ml-guide.pdf                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Page 1: "Machine learning is..."                              │
│  (5,000 characters)                                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Page 2: "Deep learning uses..."                               │
│  (7,000 characters)                                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Page 3: "Convolutional networks..."                           │
│  (3,000 characters)                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
        ↓ Extract per-page text
┌─────────────────────────────────────────────────────────────────┐
│ pageTexts Array                                                 │
│ [0]: "Machine learning is..." (5,000 chars)                    │
│ [1]: "Deep learning uses..." (7,000 chars)                     │
│ [2]: "Convolutional networks..." (3,000 chars)                 │
└─────────────────────────────────────────────────────────────────┘
        ↓ Build page mapping
┌─────────────────────────────────────────────────────────────────┐
│ PageMapping                                                     │
│ Page 1: chars 0 ──────────────────► 5,000                      │
│ Page 2: chars 5,000 ───────────────► 12,000                    │
│ Page 3: chars 12,000 ──────────────► 15,000                    │
└─────────────────────────────────────────────────────────────────┘
        ↓ Concatenate & chunk
┌─────────────────────────────────────────────────────────────────┐
│ Full Text (15,000 chars)                                        │
│ "Machine learning is...Deep learning uses...Convolutional..."   │
└─────────────────────────────────────────────────────────────────┘
        ↓ Chunk with overlap (1000 chars, 200 overlap)
┌─────────────────────────────────────────────────────────────────┐
│ Chunks                                                          │
│ Chunk 0:  chars 0-1000      │ Page 1                           │
│ Chunk 1:  chars 800-1800    │ Page 1                           │
│ Chunk 5:  chars 4900-5900   │ Pages 1-2 ← Spans boundary!     │
│ Chunk 6:  chars 5700-6700   │ Page 2                           │
│ Chunk 15: chars 11800-12800 │ Pages 2-3 ← Spans boundary!     │
│ ...                                                             │
└─────────────────────────────────────────────────────────────────┘
        ↓ Store with page metadata
┌─────────────────────────────────────────────────────────────────┐
│ Database: document_chunks                                       │
│ {                                                               │
│   content: "...chunk text...",                                  │
│   metadata: {                                                   │
│     chunkIndex: 5,                                              │
│     startPosition: 4900,                                        │
│     endPosition: 5900,                                          │
│     pageNumber: 1,      ← Stored!                               │
│     pageEnd: 2          ← Stored!                               │
│   }                                                             │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
        ↓ RAG retrieval
┌─────────────────────────────────────────────────────────────────┐
│ Chat Widget Display                                             │
│ Source 0: ml-guide.pdf (pages 1-2) (Relevance: 87.5%)          │
│           ^^^^^^^^^^^^^^^^^^^^^ From metadata!                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files Involved

| File                                                  | Purpose                                                                       |
| ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| `apps/api/src/inngest/functions/processFileUpload.ts` | Extracts per-page text from PDFs, builds page mapping                         |
| `apps/api/src/lib/chunking.ts`                        | Core logic: `buildPageMapping()`, `calculatePageForPosition()`, `chunkText()` |
| `apps/api/src/lib/rag.ts`                             | Formats page references in RAG context display                                |
| `apps/api/src/routes/chat.ts`                         | Returns page numbers in streaming SSE responses                               |
| `packages/dto/src/source.ts`                          | TypeScript types for Source with pageNumber/pageEnd                           |
| `apps/chat-widget/src/components/ChatWidget.tsx`      | Displays page numbers in UI                                                   |

---

## Helper Functions

### `buildPageMapping(pages: string[])`

Creates character-to-page mapping from per-page text array.

**Input:** Array of page text strings
**Output:** PageMapping object with boundaries

### `calculatePageForPosition(position: number, pageMapping: PageMapping)`

Determines which page a character position belongs to.

**Input:** Character position and page mapping
**Output:** Page number (1-indexed) or null

### `formatPageReference(pageNumber?: number, pageEnd?: number)`

Formats page reference for display.

**Input:** Starting page and optional ending page
**Output:** Formatted string: "page 5" or "pages 5-6"

---

## Limitations & Edge Cases

### ✅ What Works

- **PDF files** - Full page tracking support
- **Single-page chunks** - Most chunks fit on one page
- **Multi-page chunks** - Chunks spanning 2-3 pages tracked correctly
- **Backward compatible** - Old chunks without page data still work

### ❌ What Doesn't Work

- **Text files** - No natural page boundaries (could use line numbers in future)
- **Existing documents** - Only new uploads have page tracking
- **Complex PDFs** - Multi-column layouts or tables might have odd page boundaries

### Edge Cases

1. **Empty pages** - Handled gracefully (page has 0 characters, next page starts at same position)
2. **Very short pages** - Works fine (page could be 1 character)
3. **Chunk at exact page boundary** - Chunk at chars 4999-5999 correctly spans pages 1-2

---

## Future Enhancements

### Line Number Tracking (Text Files)

Could track line numbers for text files:

```typescript
interface ChunkMetadata {
  locationType: "page" | "line";
  pageNumber?: number; // For PDFs
  lineNumber?: number; // For text files
  lineEnd?: number; // For multi-line chunks
}
```

### Section Tracking (Markdown)

Could track markdown sections:

```typescript
interface ChunkMetadata {
  locationType: "page" | "line" | "section";
  sectionName?: string; // e.g., "## Introduction"
  sectionLevel?: number; // Heading level (1-6)
}
```

### Multiple Documents

Handle merged documents with per-document page tracking.

---

## Testing

To test page number tracking:

1. **Upload a PDF** (at least 3 pages):

   ```bash
   curl -X POST http://localhost:3001/upload \
     -F "file=@path/to/document.pdf"
   ```

2. **Wait for processing** (check Inngest logs)

3. **Check database** to see page metadata:

   ```sql
   SELECT
     chunk_index,
     metadata->>'pageNumber' as page,
     metadata->>'pageEnd' as page_end,
     LEFT(content, 50) as preview
   FROM document_chunks
   WHERE document_id = 'your-doc-id'
   ORDER BY chunk_index;
   ```

4. **Ask a question** in the chat widget

5. **Verify display** shows page numbers in citations

---

## Conclusion

The page number tracking system works by:

1. **Extracting text per-page** from PDFs (not concatenated)
2. **Building a character-to-page map** (character ranges → page numbers)
3. **Calculating page numbers** during chunking (lookup character positions)
4. **Storing page metadata** in JSONB field
5. **Displaying page references** in RAG citations

This allows users to easily locate information in the original PDF document when the AI cites a source!
