import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';
import { buildRAGPrompt } from './rag';
import type { SearchResult } from './vectorSearch';

// Chat model configuration
export const CHAT_CONFIG = {
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2000,
  streaming: true,
} as const;

// Initialize ChatOpenAI with streaming enabled
export const chatModel = new ChatOpenAI({
  model: CHAT_CONFIG.model,
  temperature: CHAT_CONFIG.temperature,
  maxTokens: CHAT_CONFIG.maxTokens,
  streaming: CHAT_CONFIG.streaming,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamChatParams {
  userQuery: string;
  conversationHistory?: ChatMessage[];
  useRAG?: boolean;
  ragOptions?: {
    limit?: number;
    similarityThreshold?: number;
  };
}

export interface StreamChatResult {
  stream: AsyncIterable<string>;
  sourceChunks: SearchResult[];
}

/**
 * Convert chat message format to LangChain message format
 * @param message - Chat message object
 * @returns LangChain BaseMessage
 */
function convertToLangChainMessage(message: ChatMessage): BaseMessage {
  switch (message.role) {
    case 'user':
      return new HumanMessage(message.content);
    case 'assistant':
      return new AIMessage(message.content);
    case 'system':
      return new SystemMessage(message.content);
    default:
      throw new Error(`Unknown message role: ${message.role}`);
  }
}

/**
 * Stream chat completion with optional RAG context
 * @param params - Chat parameters including query, history, and RAG options
 * @returns Async iterator of response chunks and source documents
 */
export async function streamChatWithRAG(params: StreamChatParams): Promise<StreamChatResult> {
  const { userQuery, conversationHistory = [], useRAG = true, ragOptions = {} } = params;

  let messages: BaseMessage[] = [];
  let sourceChunks: SearchResult[] = [];

  // If RAG is enabled, retrieve relevant context and build system prompt
  if (useRAG) {
    try {
      const { systemPrompt, sourceChunks: chunks } = await buildRAGPrompt(userQuery, ragOptions);
      sourceChunks = chunks;

      // Add system prompt with RAG context
      messages.push(new SystemMessage(systemPrompt));
    } catch (error) {
      console.error('Error building RAG prompt:', error);
      // Continue without RAG if retrieval fails
      messages.push(
        new SystemMessage(
          'You are a helpful AI assistant. Answer the user\'s questions to the best of your ability.'
        )
      );
    }
  } else {
    // Use basic system prompt if RAG is disabled
    messages.push(
      new SystemMessage(
        'You are a helpful AI assistant. Answer the user\'s questions to the best of your ability.'
      )
    );
  }

  // Add conversation history
  for (const msg of conversationHistory) {
    messages.push(convertToLangChainMessage(msg));
  }

  // Add current user query
  messages.push(new HumanMessage(userQuery));

  // Create an async generator that yields string tokens
  async function* tokenGenerator(): AsyncIterable<string> {
    try {
      // Stream the response
      const stream = await chatModel.stream(messages);

      for await (const chunk of stream) {
        // Extract the content from the chunk
        const content = chunk.content;
        if (typeof content === 'string' && content.length > 0) {
          yield content;
        }
      }
    } catch (error) {
      console.error('Error during streaming:', error);
      throw new Error(`Streaming failed: ${error}`);
    }
  }

  return {
    stream: tokenGenerator(),
    sourceChunks,
  };
}

/**
 * Generate a conversation title from the first user message
 * @param firstMessage - The first user message in the conversation
 * @returns A short, descriptive title (max 50 characters)
 */
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  try {
    const titleModel = new ChatOpenAI({
      model: 'gpt-4o-mini', // Use smaller model for title generation
      temperature: 0.5,
      maxTokens: 50,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const messages = [
      new SystemMessage(
        'Generate a short, descriptive title (max 6 words) for a conversation that starts with the following user message. Only respond with the title, nothing else.'
      ),
      new HumanMessage(firstMessage),
    ];

    const response = await titleModel.invoke(messages);
    const title = response.content.toString().trim();

    // Ensure title is not too long
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  } catch (error) {
    console.error('Error generating conversation title:', error);
    // Fallback: use first 50 characters of the message
    return firstMessage.length > 50 ? firstMessage.substring(0, 47) + '...' : firstMessage;
  }
}

/**
 * Non-streaming chat completion (useful for testing or simple use cases)
 * @param params - Chat parameters
 * @returns Complete response text and source chunks
 */
export async function chatWithRAG(
  params: StreamChatParams
): Promise<{ response: string; sourceChunks: SearchResult[] }> {
  const { stream, sourceChunks } = await streamChatWithRAG(params);

  // Collect all chunks into a single response
  let fullResponse = '';
  for await (const chunk of stream) {
    fullResponse += chunk;
  }

  return {
    response: fullResponse,
    sourceChunks,
  };
}
