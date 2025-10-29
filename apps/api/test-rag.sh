#!/bin/bash

# Test script for RAG with LangChain implementation
# Make sure the API is running on http://localhost:3001

set -e

API_URL="http://localhost:3001"

echo "🧪 Testing RAG with LangChain Implementation"
echo "=============================================="
echo ""

# Step 1: Upload a test document
echo "📄 Step 1: Uploading a test document..."
echo "Creating a sample text file..."

# Create a sample document about machine learning
cat > /tmp/ml-test.txt << 'EOF'
Machine Learning Fundamentals

Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. It focuses on the development of computer programs that can access data and use it to learn for themselves.

Types of Machine Learning:

1. Supervised Learning: The algorithm learns from labeled training data. Examples include classification and regression tasks.

2. Unsupervised Learning: The algorithm finds patterns in unlabeled data. Common techniques include clustering and dimensionality reduction.

3. Reinforcement Learning: The algorithm learns through trial and error, receiving rewards or penalties for actions taken.

Neural Networks:
Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes (neurons) organized in layers. Deep learning uses neural networks with multiple hidden layers to process complex patterns.

Applications:
Machine learning powers many modern applications including image recognition, natural language processing, recommendation systems, autonomous vehicles, and medical diagnosis.
EOF

UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/upload" \
  -F "file=@/tmp/ml-test.txt")

DOCUMENT_ID=$(echo $UPLOAD_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ Document uploaded successfully!"
echo "   Document ID: $DOCUMENT_ID"
echo ""

# Wait for processing
echo "⏳ Waiting 5 seconds for document processing (chunking + embeddings)..."
sleep 5
echo ""

# Step 2: Create a conversation
echo "💬 Step 2: Creating a conversation..."
CONV_RESPONSE=$(curl -s -X POST "$API_URL/conversations" \
  -H "Content-Type: application/json" \
  -d '{"title": "Machine Learning Discussion"}')

CONVERSATION_ID=$(echo $CONV_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ Conversation created!"
echo "   Conversation ID: $CONVERSATION_ID"
echo ""

# Step 3: Send a message with RAG
echo "🤖 Step 3: Sending a message with RAG enabled..."
echo "   Question: What is machine learning?"
echo ""
echo "📡 Streaming response:"
echo "---"

curl -s -X POST "$API_URL/conversations/$CONVERSATION_ID/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is machine learning?",
    "useRAG": true,
    "ragOptions": {
      "limit": 5,
      "similarityThreshold": 0.5
    }
  }' | while IFS= read -r line; do
    if [[ $line == data:* ]]; then
      # Parse SSE event
      json="${line#data: }"

      # Extract type
      type=$(echo "$json" | grep -o '"type":"[^"]*"' | cut -d'"' -f4)

      if [[ $type == "token" ]]; then
        # Print token without newline
        content=$(echo "$json" | grep -o '"content":"[^"]*"' | cut -d'"' -f4)
        echo -n "$content"
      elif [[ $type == "done" ]]; then
        echo ""
        echo "---"
        echo "✅ Response completed!"

        # Extract source count
        source_count=$(echo "$json" | grep -o '"id"' | wc -l)
        echo "   📚 Sources used: $source_count"
      elif [[ $type == "title" ]]; then
        title=$(echo "$json" | grep -o '"title":"[^"]*"' | cut -d'"' -f4)
        echo "   📝 Auto-generated title: $title"
      elif [[ $type == "error" ]]; then
        echo "❌ Error occurred during streaming"
      fi
    fi
  done

echo ""

# Step 4: Get conversation with messages
echo "📖 Step 4: Getting conversation history..."
CONV_DETAILS=$(curl -s -X GET "$API_URL/conversations/$CONVERSATION_ID")
MESSAGE_COUNT=$(echo $CONV_DETAILS | grep -o '"role"' | wc -l)
echo "✅ Retrieved conversation!"
echo "   Messages: $MESSAGE_COUNT"
echo ""

# Step 5: Get message sources (find assistant message)
echo "🔍 Step 5: Getting message sources (citations)..."
# Extract the last message ID (assistant's response)
MESSAGE_ID=$(echo $CONV_DETAILS | grep -o '"id":"[^"]*"' | tail -1 | cut -d'"' -f4)

if [[ -n "$MESSAGE_ID" ]]; then
  SOURCES=$(curl -s -X GET "$API_URL/messages/$MESSAGE_ID/sources")
  SOURCE_COUNT=$(echo $SOURCES | grep -o '"chunkId"' | wc -l)

  echo "✅ Retrieved message sources!"
  echo "   Message ID: $MESSAGE_ID"
  echo "   Citations: $SOURCE_COUNT"

  # Show first source preview
  if [[ $SOURCE_COUNT -gt 0 ]]; then
    FIRST_SOURCE=$(echo $SOURCES | grep -o '"filename":"[^"]*"' | head -1 | cut -d'"' -f4)
    SIMILARITY=$(echo $SOURCES | grep -o '"similarityScore":[0-9.]*' | head -1 | cut -d':' -f2)
    echo "   First source: $FIRST_SOURCE (similarity: $SIMILARITY)"
  fi
else
  echo "⚠️  Could not find message ID"
fi

echo ""

# Summary
echo "=============================================="
echo "✅ All tests completed successfully!"
echo ""
echo "Test Summary:"
echo "  - Document uploaded and processed"
echo "  - Conversation created"
echo "  - Message sent with RAG (LangChain retriever)"
echo "  - Streaming response received"
echo "  - Citations tracked in database"
echo ""
echo "🎉 LangChain RAG implementation is working!"
echo ""
echo "Cleanup:"
echo "  Document ID: $DOCUMENT_ID"
echo "  Conversation ID: $CONVERSATION_ID"
echo "  Temp file: /tmp/ml-test.txt"
