import type { Conversation, ConversationWithMessages } from "./database.js";
import type { MessageRecord } from "@repo/dto";

/**
 * Convert a raw conversation row into the camelCase DTO shared across clients.
 */
export function serializeConversation(conversation: Conversation) {
  return {
    id: conversation.id,
    title: conversation.title,
    isEscalated: conversation.is_escalated,
    escalatedReason: conversation.escalated_reason,
    escalatedAt: conversation.escalated_at
      ? conversation.escalated_at.toISOString()
      : null,
    isResolved: conversation.is_resolved,
    resolvedAt: conversation.resolved_at
      ? conversation.resolved_at.toISOString()
      : null,
    resolvedBy: conversation.resolved_by,
    agentName: conversation.agent_name,
    agentJoinedAt: conversation.agent_joined_at
      ? conversation.agent_joined_at.toISOString()
      : null,
    createdAt: conversation.created_at.toISOString(),
    updatedAt: conversation.updated_at.toISOString(),
  };
}

/**
 * Normalize a message row so downstream consumers receive consistent fields.
 */
export function serializeMessage(message: MessageRecord) {
  return {
    id: message.id,
    conversationId: message.conversation_id,
    role: message.role,
    content: message.content,
    createdAt: message.created_at.toISOString(),
  };
}

/**
 * Convenience helper for endpoints that need to bundle message history with
 * conversation metadata (e.g., helpdesk escalations API).
 */
export function serializeConversationWithMessages(
  conversation: ConversationWithMessages
) {
  return {
    ...serializeConversation(conversation),
    messages: conversation.messages.map((message) =>
      serializeMessage(message)
    ),
  };
}
