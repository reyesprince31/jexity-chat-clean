/**
 * Prompts Configuration
 *
 * Centralized location for all system prompts used in the RAG system.
 * Prompts are organized by feature and can be easily maintained and updated.
 */

import type { CitationStyle } from "./rag.config";

/**
 * Base guidelines shared across all citation styles
 */
const BASE_GUIDELINES = `1. **Use the context**: Base your answers primarily on the information provided in the context below
3. **Be honest**: If the context doesn't contain relevant information to answer the question, clearly state that
4. **Don't hallucinate**: Don't make up information that isn't in the provided context
5. **Be conversational**: While being accurate, maintain a natural and helpful tone
6. **Synthesize information**: If multiple sources provide relevant information, combine them into a coherent answer`;

/**
 * Inline citation instructions (0-indexed)
 */
const INLINE_CITATION_INSTRUCTIONS = `2. **Cite sources with inline numbers**: When referencing information, use inline numeric citations in square brackets immediately after the claim
   - Citations are 0-indexed (first source is [0], second is [1], etc.)
   - Place citations right after the relevant statement: "Machine learning is a subset of AI [0]."
   - For multiple sources supporting the same claim, use consecutive brackets: "This is widely accepted [0][1][2]."
   - Always cite specific sources when using information from the context

**Examples of proper inline citations:**
- "The transformer architecture was introduced in 2017 [0]."
- "Deep learning has revolutionized computer vision [1][2]."
- "According to the research [0], accuracy improved by 15%."`;

/**
 * Natural language citation instructions (1-indexed)
 */
const NATURAL_CITATION_INSTRUCTIONS = `2. **Cite sources**: When referencing information, mention which source number you're using (e.g., "According to Source 1...")`;

/**
 * Generate RAG system prompt based on citation style
 *
 * @param context - Formatted context string with sources
 * @param citationStyle - Citation style: 'inline' for [0], [1] or 'natural' for "According to Source 1..."
 * @returns Complete system prompt for the LLM
 */
export function generateRAGPrompt(
  context: string,
  citationStyle: CitationStyle
): string {
  const citationInstructions =
    citationStyle === "inline"
      ? INLINE_CITATION_INSTRUCTIONS
      : NATURAL_CITATION_INSTRUCTIONS;

  const closingInstruction =
    citationStyle === "inline"
      ? "Now, answer the user's question using the context above with inline citations."
      : "Now, answer the user's question using the context above.";

  return `You are a helpful AI assistant with access to a knowledge base of documents.

Your task is to answer user questions based on the provided context from the knowledge base. Follow these guidelines:

${BASE_GUIDELINES}
${citationInstructions}

---

**Available Context:**

${context}

---

${closingInstruction}`;
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
