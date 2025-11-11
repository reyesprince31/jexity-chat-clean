import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';
import { retrieveDocuments } from './rag';
import type { Document } from '@langchain/core/documents';
import {
  CHAT_MODEL_CONFIG,
  TITLE_GENERATION_CONFIG,
  RAG_CHAT_CONFIG,
} from '../config/rag.config';
import { generateRAGPrompt, generateTitlePrompt } from '../config/prompts';

// Re-export for backward compatibility
export const CHAT_CONFIG = CHAT_MODEL_CONFIG;

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
  sourceDocuments: Document[];
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
 * Stream chat completion with optional RAG context using LangChain retriever
 * @param params - Chat parameters including query, history, and RAG options
 * @returns Async iterator of response chunks and source documents
 */
export async function streamChatWithRAG(params: StreamChatParams): Promise<StreamChatResult> {
  const {
    userQuery,
    conversationHistory = [],
    useRAG = RAG_CHAT_CONFIG.useRAGByDefault,
    ragOptions = {},
  } = params;

  const messages: BaseMessage[] = [];
  let sourceDocuments: Document[] = [];

  // If RAG is enabled, retrieve relevant context using LangChain retriever
  if (useRAG) {
    try {
      const { documents, context } = await retrieveDocuments(userQuery, ragOptions);
      sourceDocuments = documents;

      // Build system prompt with retrieved context using inline citation instructions
      const systemPrompt = generateRAGPrompt(context);

      // Add system prompt with RAG context
      messages.push(new SystemMessage(systemPrompt));
    } catch (error) {
      console.error('Error retrieving documents:', error);
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
    sourceDocuments,
  };
}

/**
 * Generate a conversation title from the first user message
 * @param firstMessage - The first user message in the conversation
 * @returns A short, descriptive title (max characters from config)
 */
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  try {
    const titleModel = new ChatOpenAI({
      model: TITLE_GENERATION_CONFIG.model,
      temperature: TITLE_GENERATION_CONFIG.temperature,
      maxTokens: TITLE_GENERATION_CONFIG.maxTokens,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const messages = [
      new SystemMessage(generateTitlePrompt(firstMessage)),
    ];

    const response = await titleModel.invoke(messages);
    const title = response.content.toString().trim();

    // Ensure title is not too long
    const maxLength = TITLE_GENERATION_CONFIG.maxLength;
    return title.length > maxLength ? title.substring(0, maxLength - 3) + '...' : title;
  } catch (error) {
    console.error('Error generating conversation title:', error);
    // Fallback: use first N characters of the message
    const maxLength = TITLE_GENERATION_CONFIG.maxLength;
    return firstMessage.length > maxLength
      ? firstMessage.substring(0, maxLength - 3) + '...'
      : firstMessage;
  }
}

/**
 * Non-streaming chat completion (useful for testing or simple use cases)
 * @param params - Chat parameters
 * @returns Complete response text and source documents
 */
export async function chatWithRAG(
  params: StreamChatParams
): Promise<{ response: string; sourceDocuments: Document[] }> {
  const { stream, sourceDocuments } = await streamChatWithRAG(params);

  // Collect all chunks into a single response
  let fullResponse = '';
  for await (const chunk of stream) {
    fullResponse += chunk;
  }

  return {
    response: fullResponse,
    sourceDocuments,
  };
}
