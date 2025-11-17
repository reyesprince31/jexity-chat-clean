/**
 * Chat Routes - RESTful API for conversational AI with RAG (Retrieval Augmented Generation)
 *
 * This module provides endpoints for:
 * - Creating and managing conversations
 * - Sending messages with streaming responses
 * - Retrieving conversation history
 * - Accessing source document citations
 *
 * The chat system uses:
 * - LangChain + OpenAI GPT-4o for AI responses
 * - Vector search for retrieving relevant document context (RAG)
 * - Server-Sent Events (SSE) for real-time token streaming
 * - PostgreSQL for conversation/message storage
 * - pgvector for semantic similarity search
 *
 * @module routes/chat
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  CreateConversationRequestSchema,
  SendMessageRequestSchema,
} from "@repo/dto";
import {
  createConversation,
  getConversation,
  getConversationWithMessages,
  listConversations,
  updateConversationTitle,
  deleteConversation,
  createMessage,
  getMessages,
  getMessageWithSources,
  setConversationEscalationStatus,
  setConversationAgentJoin,
  type Conversation,
} from "../lib/database.js";
import {
  streamChatWithRAG,
  generateConversationTitle,
  type ChatMessage,
} from "../lib/chat.js";
import { evaluateEscalationNeed } from "../lib/escalation.js";
import { conversationEventHub } from "../lib/conversation-events.js";

// Request/Response Types (Fastify-specific structure)
interface CreateConversationRequest {
  Body: {
    title?: string;
  };
}

interface SendMessageRequest {
  Params: {
    id: string;
  };
  Body: {
    message: string;
    useRAG?: boolean;
    ragOptions?: {
      limit?: number;
      similarityThreshold?: number;
    };
  };
}

interface GetConversationRequest {
  Params: {
    id: string;
  };
}

interface DeleteConversationRequest {
  Params: {
    id: string;
  };
}

interface ListConversationsRequest {
  Querystring: {
    limit?: string;
    offset?: string;
  };
}

interface AgentJoinRequest {
  Params: {
    id: string;
  };
  Body: {
    agentName?: string;
  };
}

/**
 * Convert a database conversation record into the DTO returned by the API.
 */
function serializeConversation(conversation: Conversation) {
  return {
    id: conversation.id,
    title: conversation.title,
    isEscalated: conversation.is_escalated,
    escalatedReason: conversation.escalated_reason,
    escalatedAt: conversation.escalated_at
      ? conversation.escalated_at.toISOString()
      : null,
    agentName: conversation.agent_name,
    agentJoinedAt: conversation.agent_joined_at
      ? conversation.agent_joined_at.toISOString()
      : null,
    createdAt: conversation.created_at.toISOString(),
    updatedAt: conversation.updated_at.toISOString(),
  };
}

/** Apply the headers Fastify needs for Server-Sent Events. */
function setSseHeaders(reply: FastifyReply) {
  reply.raw.setHeader("Content-Type", "text/event-stream");
  reply.raw.setHeader("Cache-Control", "no-cache");
  reply.raw.setHeader("Connection", "keep-alive");
  reply.raw.setHeader("Access-Control-Allow-Origin", "*");
}

/**
 * Register all chat-related routes
 *
 * Available endpoints:
 * - POST   /conversations                    - Create new conversation
 * - GET    /conversations                    - List conversations (paginated)
 * - GET    /conversations/:id                - Get conversation with messages
 * - DELETE /conversations/:id                - Delete conversation
 * - POST   /conversations/:id/messages       - Send message (streaming SSE response)
 * - GET    /conversations/:id/messages       - Get messages for conversation
 * - GET    /messages/:messageId/sources      - Get message with source citations
 *
 * @param fastify - Fastify instance
 */
export default async function chatRoutes(
  fastify: FastifyInstance
): Promise<void> {
  /**
   * POST /conversations
   * Create a new conversation
   *
   * Request body:
   *   - title?: string (optional conversation title)
   *
   * Response: 201 Created
   *   { success: true, conversation: { id, title, createdAt, updatedAt } }
   */
  fastify.post<CreateConversationRequest>(
    "/conversations",
    async (
      request: FastifyRequest<CreateConversationRequest>,
      reply: FastifyReply
    ) => {
      try {
        // Validate request body
        const validation = CreateConversationRequestSchema.safeParse(
          request.body
        );
        if (!validation.success) {
          return reply.code(400).send({
            success: false,
            message: "Invalid request body",
            error: validation.error.message,
          });
        }

        const { title } = validation.data;

        const conversation = await createConversation(title);

        fastify.log.info(`Created conversation: ${conversation.id}`);

        return reply.code(201).send({
          success: true,
          conversation: serializeConversation(conversation),
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to create conversation",
        });
      }
    }
  );

  /**
   * POST /conversations/:id/messages
   * Send a message and receive streaming AI response with RAG context
   *
   * This endpoint:
   * 1. Saves user message to database
   * 2. Retrieves relevant document chunks via vector search (if useRAG=true)
   * 3. Builds conversation context with history
   * 4. Streams AI response using Server-Sent Events (SSE)
   * 5. Saves assistant message with source citations
   * 6. Auto-generates conversation title on first message
   *
   * Request params:
   *   - id: conversation ID
   *
   * Request body:
   *   - message: string (user's message)
   *   - useRAG?: boolean (default: true) - enable RAG context retrieval
   *   - ragOptions?: {
   *       limit?: number,
   *       similarityThreshold?: number
   *     }
   *
   * Response: Server-Sent Events stream with JSON data:
   *   - { type: 'token', content: string } - individual tokens
   *   - { type: 'done', sources: [...] } - completion with source citations
   *   - { type: 'title', title: string } - auto-generated title (first message only)
   *   - { type: 'error', message: string } - error during streaming
   */
  fastify.post<SendMessageRequest>(
    "/conversations/:id/messages",
    async (
      request: FastifyRequest<SendMessageRequest>,
      reply: FastifyReply
    ) => {
      try {
        const { id: conversationId } = request.params;

        // Validate request body
        const validation = SendMessageRequestSchema.safeParse(request.body);
        if (!validation.success) {
          return reply.code(400).send({
            success: false,
            message: "Invalid request body",
            error: validation.error.message,
          });
        }

        const {
          message: userMessage,
          useRAG = true,
          ragOptions,
        } = validation.data;

        // Validate conversation exists
        const conversation = await getConversation(conversationId);
        if (!conversation) {
          return reply.code(404).send({
            success: false,
            message: "Conversation not found",
          });
        }

        // Prevent AI responses if conversation already escalated.
        if (conversation.is_escalated) {
          setSseHeaders(reply);
          reply.raw.write(
            `data: ${JSON.stringify({
              type: "escalated",
              conversationId,
              reason: conversation.escalated_reason ?? undefined,
              escalatedAt: (conversation.escalated_at ?? new Date()).toISOString(),
            })}\n\n`
          );
          reply.raw.end();
          return;
        }

        // Save user message to database
        await createMessage({
          conversation_id: conversationId,
          role: "user",
          content: userMessage,
        });

        fastify.log.info(
          `User message saved to conversation: ${conversationId}`
        );

        // Get conversation history (excluding the just-added user message for now)
        const messages = await getMessages(conversationId);
        const conversationHistory: ChatMessage[] = messages
          .slice(0, -1) // Exclude the last message (just added)
          .map((msg) => ({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content,
          }));

        const escalationDecision = evaluateEscalationNeed({
          userMessage,
          conversationHistory,
        });

        if (escalationDecision.shouldEscalate) {
          const escalatedAt = new Date();
          await setConversationEscalationStatus(conversationId, {
            isEscalated: true,
            reason: escalationDecision.reason,
            escalatedAt,
          });

          fastify.log.info(
            `Conversation ${conversationId} escalated: ${escalationDecision.reason}`
          );

          setSseHeaders(reply);
          reply.raw.write(
            `data: ${JSON.stringify({
              type: "escalated",
              conversationId,
              reason: escalationDecision.reason,
              escalatedAt: escalatedAt.toISOString(),
            })}\n\n`
          );
          reply.raw.end();
          return;
        }

        // Stream chat response with RAG
        const { stream, sourceDocuments } = await streamChatWithRAG({
          userQuery: userMessage,
          conversationHistory,
          useRAG,
          ragOptions,
        });

        // Set headers for Server-Sent Events (SSE)
        setSseHeaders(reply);

        // Stream tokens to client
        let fullResponse = "";

        try {
          for await (const chunk of stream) {
            fullResponse += chunk.content;
            // Send token as SSE event
            reply.raw.write(
              `data: ${JSON.stringify({
                type: "token",
                content: chunk.content,
              })}\n\n`
            );
          }

          // Save complete assistant message with sources to database
          // Extract chunk IDs and similarity scores from Document metadata
          const sources = sourceDocuments.map((doc) => ({
            chunk_id: doc.metadata.id,
            similarity_score: doc.metadata.similarity,
          }));

          await createMessage({
            conversation_id: conversationId,
            role: "assistant",
            content: fullResponse,
            sources: sources.length > 0 ? sources : undefined,
          });

          fastify.log.info(
            `Assistant message saved to conversation: ${conversationId}`
          );

          // Send completion event with metadata
          reply.raw.write(
            `data: ${JSON.stringify({
              type: "done",
              sources: sourceDocuments.map((doc) => ({
                id: doc.metadata.id,
                documentId: doc.metadata.documentId,
                filename: doc.metadata.document?.filename,
                content: doc.pageContent.substring(0, 200), // Preview
                similarity: doc.metadata.similarity,
                pageNumber: doc.metadata.pageNumber,
                pageEnd: doc.metadata.pageEnd,
              })),
            })}\n\n`
          );

          // Auto-generate title if this is the first message
          if (messages.length === 1 && !conversation.title) {
            const title = await generateConversationTitle(userMessage);
            await updateConversationTitle(conversationId, title);
            fastify.log.info(
              `Generated title for conversation ${conversationId}: ${title}`
            );

            // Send title update event
            reply.raw.write(
              `data: ${JSON.stringify({
                type: "title",
                title,
              })}\n\n`
            );
          }

          reply.raw.end();
        } catch (streamError) {
          fastify.log.error({ err: streamError }, "Streaming error");
          reply.raw.write(
            `data: ${JSON.stringify({
              type: "error",
              message: "Streaming failed",
            })}\n\n`
          );
          reply.raw.end();
        }
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to send message",
        });
      }
    }
  );

  /**
   * GET /conversations/:id
   * Get a conversation with all its messages
   *
   * Response: 200 OK
   *   { success: true, conversation: { id, title, messages: [...] } }
   */
  fastify.get<GetConversationRequest>(
    "/conversations/:id",
    async (
      request: FastifyRequest<GetConversationRequest>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        const conversation = await getConversationWithMessages(id);

        if (!conversation) {
          return reply.code(404).send({
            success: false,
            message: "Conversation not found",
          });
        }

        return reply.code(200).send({
          success: true,
          conversation: {
            ...serializeConversation(conversation),
            messages: conversation.messages.map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              createdAt: msg.created_at.toISOString(),
            })),
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to get conversation",
        });
      }
    }
  );

  /**
   * GET /conversations
   * List all conversations with pagination
   *
   * Query params:
   *   - limit?: number (default: 20)
   *   - offset?: number (default: 0)
   *
   * Response: 200 OK
   *   { success: true, conversations: [...], pagination: { limit, offset, count } }
   */
  fastify.get<ListConversationsRequest>(
    "/conversations",
    async (
      request: FastifyRequest<ListConversationsRequest>,
      reply: FastifyReply
    ) => {
      try {
        const limit = parseInt(request.query.limit || "20", 10);
        const offset = parseInt(request.query.offset || "0", 10);

        const conversations = await listConversations(limit, offset);

        return reply.code(200).send({
          success: true,
          conversations: conversations.map((conv) =>
            serializeConversation(conv)
          ),
          pagination: {
            limit,
            offset,
            count: conversations.length,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to list conversations",
        });
      }
    }
  );

  /**
   * GET /conversations/:id/messages
   * Get all messages for a conversation (lightweight endpoint, no full conversation data)
   */
  fastify.get<GetConversationRequest>(
    "/conversations/:id/messages",
    async (
      request: FastifyRequest<GetConversationRequest>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        const messages = await getMessages(id);

        return reply.code(200).send({
          success: true,
          messages: messages.map((msg) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.created_at.toISOString(),
          })),
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to get messages",
        });
      }
    }
  );

  /**
   * DELETE /conversations/:id
   * Delete a conversation and all its messages (cascading delete)
   */
  fastify.delete<DeleteConversationRequest>(
    "/conversations/:id",
    async (
      request: FastifyRequest<DeleteConversationRequest>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        // Check if conversation exists
        const conversation = await getConversation(id);
        if (!conversation) {
          return reply.code(404).send({
            success: false,
            message: "Conversation not found",
          });
        }

        await deleteConversation(id);

        fastify.log.info(`Deleted conversation: ${id}`);

        return reply.code(200).send({
          success: true,
          message: "Conversation deleted successfully",
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to delete conversation",
        });
      }
    }
  );

  /**
   * GET /messages/:messageId/sources
   * Get a message with its source document chunks (for displaying citations)
   *
   * Response includes:
   * - Message content
   * - Source chunks that were used to generate the response
   * - Similarity scores
   * - Document metadata (filename, mimetype)
   */
  fastify.get<{ Params: { messageId: string } }>(
    "/messages/:messageId/sources",
    async (
      request: FastifyRequest<{ Params: { messageId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { messageId } = request.params;

        const message = await getMessageWithSources(messageId);

        if (!message) {
          return reply.code(404).send({
            success: false,
            message: "Message not found",
          });
        }

        return reply.code(200).send({
          success: true,
          message: {
            id: message.id,
            role: message.role,
            content: message.content,
            createdAt: message.created_at.toISOString(),
            sources: message.sources.map((source) => {
              const sourceWithChunk = source as unknown as {
                id: string;
                chunk_id: string;
                similarity_score: number;
                chunk: {
                  content: string;
                  metadata: {
                    pageNumber?: number;
                    pageEnd?: number;
                  };
                  document: {
                    filename: string;
                    mimetype: string;
                  };
                };
              };
              return {
                id: sourceWithChunk.id,
                chunkId: sourceWithChunk.chunk_id,
                similarityScore: sourceWithChunk.similarity_score,
                content: sourceWithChunk.chunk.content,
                pageNumber: sourceWithChunk.chunk.metadata?.pageNumber,
                pageEnd: sourceWithChunk.chunk.metadata?.pageEnd,
                document: {
                  filename: sourceWithChunk.chunk.document.filename,
                  mimetype: sourceWithChunk.chunk.document.mimetype,
                },
              };
            }),
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to get message sources",
        });
      }
    }
  );

  /**
   * GET /conversations/:id/events
   * Persistent SSE stream that emits conversation-level events (agent joined, etc.).
   */
  fastify.get<GetConversationRequest>(
    "/conversations/:id/events",
    async (
      request: FastifyRequest<GetConversationRequest>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const conversation = await getConversation(id);

        if (!conversation) {
          return reply.code(404).send({
            success: false,
            message: "Conversation not found",
          });
        }

        setSseHeaders(reply);
        reply.raw.write(": connected\n\n");
        conversationEventHub.subscribe(id, reply);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to subscribe to events",
        });
      }
    }
  );

  /**
   * POST /conversations/:id/agent/join
   * Mark that a human agent has joined and broadcast an SSE event.
   */
  fastify.post<AgentJoinRequest>(
    "/conversations/:id/agent/join",
    async (
      request: FastifyRequest<AgentJoinRequest>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { agentName } = request.body ?? {};

        if (!agentName || typeof agentName !== "string") {
          return reply.code(400).send({
            success: false,
            message: "agentName is required",
          });
        }

        const conversation = await getConversation(id);
        if (!conversation) {
          return reply.code(404).send({
            success: false,
            message: "Conversation not found",
          });
        }

        const updated = await setConversationAgentJoin(id, {
          agentName,
        });

        const joinedAt = updated.agent_joined_at?.toISOString();
        if (joinedAt) {
          conversationEventHub.emit(id, {
            type: "agent_joined",
            conversationId: id,
            agentName,
            joinedAt,
          });
        }

        return reply.code(200).send({
          success: true,
          conversation: serializeConversation(updated),
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to record agent join",
        });
      }
    }
  );
}
