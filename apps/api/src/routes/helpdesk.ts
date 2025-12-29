import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  createMessage,
  getConversation,
  listEscalatedConversations,
  setConversationResolutionStatus,
} from "../lib/database.js";
import {
  serializeConversation,
  serializeConversationWithMessages,
  serializeMessage,
} from "../lib/serializers.js";
import { realtimeGateway } from "../lib/realtime.js";
import { conversationEventHub } from "../lib/conversation-events.js";

interface ListEscalationsRequest {
  Querystring: {
    limit?: string;
    organizationId?: string;
  };
}

interface HelpdeskSendMessageRequest {
  Params: {
    id: string;
  };
  Body: {
    agentName?: string;
    content?: string;
  };
}

interface ResolveConversationRequest {
  Params: {
    id: string;
  };
  Body: {
    agentName?: string;
  };
}

interface HelpdeskTypingIndicatorRequest {
  Params: {
    id: string;
  };
  Body: {
    agentName?: string;
    isTyping?: boolean;
  };
}

export default async function helpdeskRoutes(
  fastify: FastifyInstance
): Promise<void> {
  fastify.get<ListEscalationsRequest>(
    "/helpdesk/escalations",
    async (
      request: FastifyRequest<ListEscalationsRequest>,
      reply: FastifyReply
    ) => {
      try {
        const limit = parseInt(request.query.limit || "50", 10);
        const { organizationId } = request.query;
        const conversations = await listEscalatedConversations(limit, organizationId);

        return reply.send({
          success: true,
          conversations: conversations.map((conversation) =>
            serializeConversationWithMessages(conversation)
          ),
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to load escalations",
        });
      }
    }
  );

  /**
   * POST /helpdesk/conversations/:id/messages
   * Persists a human-agent reply and replays it to both helpdesk dashboards
   * and the original chat widget via websocket.
   */
  fastify.post<HelpdeskSendMessageRequest>(
    "/helpdesk/conversations/:id/messages",
    async (
      request: FastifyRequest<HelpdeskSendMessageRequest>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { agentName, content } = request.body ?? {};

        if (!agentName || typeof agentName !== "string") {
          return reply.code(400).send({
            success: false,
            message: "agentName is required",
          });
        }

        if (!content || typeof content !== "string" || !content.trim()) {
          return reply.code(400).send({
            success: false,
            message: "content is required",
          });
        }

        const conversation = await getConversation(id);
        if (!conversation) {
          return reply.code(404).send({
            success: false,
            message: "Conversation not found",
          });
        }

        if (!conversation.is_escalated) {
          return reply.code(409).send({
            success: false,
            message: "Conversation is not escalated",
          });
        }

        if (conversation.is_resolved) {
          return reply.code(409).send({
            success: false,
            message: "Conversation has already been resolved",
          });
        }

        if (conversation.agent_name !== agentName) {
          return reply.code(403).send({
            success: false,
            message: "Conversation is assigned to another agent",
          });
        }

        const message = await createMessage({
          conversation_id: id,
          role: "human_agent",
          content: content.trim(),
        });

        const serializedMessage = serializeMessage(message);

        realtimeGateway.broadcastHelpdesk({
          type: "helpdesk.message_created",
          conversationId: id,
          message: serializedMessage,
        });

        realtimeGateway.emitConversationEvent(id, {
          type: "agent_message",
          conversationId: id,
          message: serializedMessage,
        });

        conversationEventHub.emit(id, {
          type: "agent_message",
          conversationId: id,
          message: serializedMessage,
        });

        return reply.send({
          success: true,
          message: serializedMessage,
        });
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
   * POST /helpdesk/conversations/:id/typing
   * Broadcasts that a human agent is actively composing a response.
   */
  fastify.post<HelpdeskTypingIndicatorRequest>(
    "/helpdesk/conversations/:id/typing",
    async (
      request: FastifyRequest<HelpdeskTypingIndicatorRequest>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { agentName, isTyping } = request.body ?? {};

        if (!agentName || typeof agentName !== "string") {
          return reply.code(400).send({
            success: false,
            message: "agentName is required",
          });
        }

        if (typeof isTyping !== "boolean") {
          return reply.code(400).send({
            success: false,
            message: "isTyping is required",
          });
        }

        const conversation = await getConversation(id);
        if (!conversation) {
          return reply.code(404).send({
            success: false,
            message: "Conversation not found",
          });
        }

        if (!conversation.is_escalated) {
          return reply.code(409).send({
            success: false,
            message: "Conversation has not been escalated",
          });
        }

        if (!conversation.agent_name) {
          return reply.code(409).send({
            success: false,
            message: "Conversation has not been claimed",
          });
        }

        if (conversation.agent_name !== agentName) {
          return reply.code(403).send({
            success: false,
            message: "Conversation is assigned to another agent",
          });
        }

        if (conversation.is_resolved) {
          return reply.code(409).send({
            success: false,
            message: "Conversation has already been resolved",
          });
        }

        const emittedAt = new Date().toISOString();
        const typingEvent = {
          type: "typing",
          conversationId: id,
          actor: "human_agent",
          isTyping,
          emittedAt,
        } as const;

        conversationEventHub.emit(id, typingEvent);
        realtimeGateway.emitConversationEvent(id, typingEvent);
        realtimeGateway.broadcastHelpdesk({
          type: "helpdesk.typing",
          conversationId: id,
          actor: "human_agent",
          isTyping,
          emittedAt,
        });

        return reply.send({ success: true });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to record typing indicator",
        });
      }
    }
  );

  /**
   * POST /helpdesk/conversations/:id/resolve
   * Marks an escalated conversation as resolved and notifies all websocket
   * subscribers (widget + dashboards) so the UI can lock immediately.
   */
  fastify.post<ResolveConversationRequest>(
    "/helpdesk/conversations/:id/resolve",
    async (
      request: FastifyRequest<ResolveConversationRequest>,
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

        if (!conversation.is_escalated) {
          return reply.code(409).send({
            success: false,
            message: "Conversation has not been escalated",
          });
        }

        if (conversation.agent_name && conversation.agent_name !== agentName) {
          return reply.code(403).send({
            success: false,
            message: `Conversation already assigned to ${conversation.agent_name}`,
          });
        }

        if (conversation.is_resolved) {
          return reply.code(409).send({
            success: false,
            message: "Conversation already resolved",
          });
        }

        const resolved = await setConversationResolutionStatus(id, {
          resolvedBy: agentName,
        });

        const resolvedAt = resolved.resolved_at?.toISOString();
        if (!resolvedAt) {
          return reply.code(500).send({
            success: false,
            message: "Conversation resolution timestamp missing",
          });
        }

        const resolvedEvent = {
          type: "resolved",
          conversationId: id,
          resolvedBy: resolved.resolved_by,
          resolvedAt,
        } as const;

        conversationEventHub.emit(id, resolvedEvent);
        realtimeGateway.emitConversationEvent(id, resolvedEvent);
        realtimeGateway.broadcastHelpdesk({
          type: "helpdesk.conversation_resolved",
          conversationId: id,
          resolvedBy: resolved.resolved_by ?? agentName,
          resolvedAt,
        });

        return reply.send({
          success: true,
          conversation: serializeConversation(resolved),
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          message: "Failed to resolve conversation",
        });
      }
    }
  );
}
