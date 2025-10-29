# Testing RAG with LangChain

## Quick Start

### Option 1: Automated Test Script

```bash
# Start the API server
turbo dev --filter=api

# In another terminal, run the test script
cd apps/api
./test-rag.sh
```

### Option 2: Manual Testing with cURL

Follow these steps to manually test the RAG implementation.

---

## Manual Testing Steps

### 1. Upload a Document

First, create a test file:

```bash
cat > /tmp/ml-test.txt << 'EOF'
Machine Learning Fundamentals

Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.

Types of Machine Learning:
1. Supervised Learning - learns from labeled data
2. Unsupervised Learning - finds patterns in unlabeled data
3. Reinforcement Learning - learns through trial and error

Neural Networks are computing systems inspired by biological neural networks.
EOF
```

Upload the file:

```bash
curl -X POST http://localhost:3001/upload \
  -F "file=@/tmp/ml-test.txt"
```

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "uuid-here",
    "filename": "ml-test.txt",
    "size": 123,
    "contentHash": "sha256-hash"
  }
}
```

⏳ **Wait 5-10 seconds** for background processing (chunking + embeddings).

---

### 2. Create a Conversation

```bash
curl -X POST http://localhost:3001/conversations \
  -H "Content-Type: application/json" \
  -d '{"title": "ML Discussion"}'
```

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": "conversation-uuid",
    "title": "ML Discussion",
    "createdAt": "2025-10-29T...",
    "updatedAt": "2025-10-29T..."
  }
}
```

💾 **Save the conversation ID** for the next step.

---

### 3. Send a Message with RAG

Replace `CONVERSATION_ID` with your conversation ID:

```bash
curl -X POST http://localhost:3001/conversations/CONVERSATION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the types of machine learning?",
    "useRAG": true,
    "ragOptions": {
      "limit": 5,
      "similarityThreshold": 0.7
    }
  }'
```

**Streaming Response (SSE format):**
```
data: {"type":"token","content":"Based"}
data: {"type":"token","content":" on"}
data: {"type":"token","content":" the"}
...
data: {"type":"done","sources":[{"id":"chunk-uuid","documentId":"doc-uuid","filename":"ml-test.txt","content":"Types of Machine Learning...","similarity":0.92}]}
```

---

### 4. Get Conversation with Messages

```bash
curl -X GET http://localhost:3001/conversations/CONVERSATION_ID
```

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": "conversation-uuid",
    "title": "ML Discussion",
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "content": "What are the types of machine learning?",
        "createdAt": "2025-10-29T..."
      },
      {
        "id": "msg-2",
        "role": "assistant",
        "content": "Based on Source 1, there are three types...",
        "createdAt": "2025-10-29T..."
      }
    ]
  }
}
```

---

### 5. Get Message Sources (Citations)

Replace `MESSAGE_ID` with the assistant message ID from step 4:

```bash
curl -X GET http://localhost:3001/messages/MESSAGE_ID/sources
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "msg-2",
    "role": "assistant",
    "content": "Based on Source 1...",
    "sources": [
      {
        "id": "source-uuid",
        "chunkId": "chunk-uuid",
        "similarityScore": 0.92,
        "content": "Types of Machine Learning:\n1. Supervised Learning...",
        "document": {
          "filename": "ml-test.txt",
          "mimetype": "text/plain"
        }
      }
    ]
  }
}
```

---

### 6. List All Conversations

```bash
curl -X GET "http://localhost:3001/conversations?limit=20&offset=0"
```

---

### 7. Delete a Conversation

```bash
curl -X DELETE http://localhost:3001/conversations/CONVERSATION_ID
```

---

## Testing RAG vs Non-RAG

### With RAG (default)

```bash
curl -X POST http://localhost:3001/conversations/CONVERSATION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is supervised learning?",
    "useRAG": true
  }'
```

✅ **Expected:** Response cites sources from uploaded documents.

### Without RAG

```bash
curl -X POST http://localhost:3001/conversations/CONVERSATION_ID/messages \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is supervised learning?",
    "useRAG": false
  }'
```

✅ **Expected:** Response uses general knowledge, no sources in `done` event.

---

## Verifying LangChain Integration

The following confirms LangChain is being used:

1. **Check logs** - You should see retrieval happening via PrismaRetriever
2. **Sources in response** - The `done` event includes document chunks
3. **Citations in database** - `message_sources` table links messages to chunks
4. **Document metadata** - Sources include `id`, `documentId`, `similarity` from LangChain Document metadata

---

## Testing with PDFs

```bash
# Upload a PDF
curl -X POST http://localhost:3001/upload \
  -F "file=@/path/to/document.pdf"

# Wait for processing, then query as above
```

---

## Troubleshooting

### No sources returned

- **Wait longer** - Inngest processing takes 5-10 seconds
- **Check Inngest dev server** - Should be running alongside API
- **Check logs** - Look for "Processing document" messages

### Low similarity scores

- **Adjust threshold** - Lower `similarityThreshold` (e.g., 0.5)
- **Increase limit** - Try `"limit": 10` for more results

### Empty response

- **Check API is running** - `curl http://localhost:3001/health`
- **Check environment variables** - `OPENAI_API_KEY` must be set
- **Check database** - Documents and chunks should exist

---

## Expected Behavior

✅ **LangChain Integration Working:**
- Vector search returns LangChain `Document` objects
- PrismaRetriever extends `BaseRetriever`
- Sources include metadata: `id`, `documentId`, `similarity`, `document`
- Retrieval uses `.invoke()` pattern

✅ **RAG Pipeline:**
1. User message → Vector search via PrismaRetriever
2. Top K similar chunks retrieved as LangChain Documents
3. Documents formatted into context string
4. System prompt + context + history → GPT-4o
5. Streaming response with citations
6. Sources saved to `message_sources` table

---

## Next Steps

- Test with multiple documents
- Test with longer conversations (history context)
- Test with different similarity thresholds
- Test document-specific search (`documentId` filter)
- Monitor token usage and costs
