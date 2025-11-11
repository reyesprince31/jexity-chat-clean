/**
 * Prompts Configuration
 *
 * Centralized location for all system prompts used in the RAG system.
 * Prompts are organized by feature and can be easily maintained and updated.
 */

/**
 * Base guidelines shared across all prompts
 */
const BASE_GUIDELINES = `1. **Use the context**: Base your answers primarily on the information provided in the context below
3. **Be honest**: If the context doesn't contain relevant information to answer the question, clearly state that
4. **Don't hallucinate**: Don't make up information that isn't in the provided context
5. **Be conversational**: While being accurate, maintain a natural and helpful tone
6. **Synthesize information**: If multiple sources provide relevant information, combine them into a coherent answer`;

/**
 * Inline citation instructions (0-indexed)
 */
const INLINE_CITATION_INSTRUCTIONS = `2. **Cite sources with inline numbers and rewritten chunk text**: When referencing information, use inline numeric citations immediately after the claim.
   - Citations are 0-indexed (first source is {{cite:0}}, second is {{cite:1}}, etc.)
   - Place citations right after the relevant statement and after the punctuation: "Machine learning is a subset of AI. {{cite:0, text:"[rewritten chunk content]"}}"
   - The \`text\` field should contain a **concise, rewritten version of the source chunk**, capturing the main point clearly. Do not use the raw chunk text verbatim, and ensure the rewritten sentence ends with proper punctuation (. ? !).
   - Multiple sources supporting the same claim can be grouped: 
     "This is widely accepted. {{cite:0, text:"[rewritten chunk 0]"}, {cite:1, text:"[rewritten chunk 1]"}, {cite:2}}"
   - If no text is provided, only use the index.
   - Always cite specific sources when using information from the context

**Examples of proper inline citations:**
- "The transformer architecture was introduced in 2017. {{cite:0, text:"Introduced the Transformer model for sequence processing"}}"
- "Deep learning has revolutionized computer vision. {{cite:1, text:"AlexNet improved image recognition accuracy"}, {cite:2, text:"ResNet enabled deeper networks"}}"
- "According to the research {{cite:0, text:"Experiment showed 15% improvement"}}, accuracy improved significantly."`;

/**
 * Generate RAG system prompt with inline citation instructions
 *
 * @param context - Formatted context string with sources
 * @returns Complete system prompt for the LLM
 */
export function generateRAGPrompt(
  context: string
): string {
  return `You are a helpful AI assistant with access to a knowledge base of documents.

Your task is to answer user questions based on the provided context from the knowledge base. Follow these guidelines:

${BASE_GUIDELINES}
${INLINE_CITATION_INSTRUCTIONS}

---

**Available Context:**

${context}

---

Now, answer the user's question using the context above with inline citations.`;
}

/**
 * Generate conversation title from first user message
 * Used for auto-generating descriptive conversation titles
 *
 * @param firstMessage - The first user message in the conversation
 * @returns System prompt for title generation
 */
export function generateTitlePrompt(firstMessage: string): string {
  return `Generate a short, descriptive title (max 6 words, 50 characters) for a conversation that starts with the following user message. Only respond with the title, nothing else.

User message: "${firstMessage}"`;
}
