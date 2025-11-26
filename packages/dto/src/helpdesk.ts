import { z } from "zod";
import { ConversationSchema } from "./conversation";
import { MessageSchema } from "./message";

/**
 * Expanded conversation payload that powers the helpdesk dashboard.
 * Includes full message history so the UI can render transcripts offline and
 * fold in realtime message events as they arrive.
 */
export const HelpdeskConversationSchema = ConversationSchema.extend({
  messages: z.array(MessageSchema),
});

export type HelpdeskConversation = z.infer<typeof HelpdeskConversationSchema>;

/**
 * Response structure returned by `GET /helpdesk/escalations`.
 */
export const HelpdeskEscalationListResponseSchema = z.object({
  success: z.literal(true),
  conversations: z.array(HelpdeskConversationSchema),
});

export type HelpdeskEscalationListResponse = z.infer<
  typeof HelpdeskEscalationListResponseSchema
>;

/**
 * Realtime events pushed over the helpdesk websocket feed.
 */
export const HelpdeskSocketEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("helpdesk.conversation_escalated"),
    conversation: HelpdeskConversationSchema,
  }),
  z.object({
    type: z.literal("helpdesk.conversation_claimed"),
    conversationId: z.string().uuid(),
    agentName: z.string(),
    agentJoinedAt: z.string().datetime(),
  }),
  z.object({
    type: z.literal("helpdesk.message_created"),
    conversationId: z.string().uuid(),
    message: MessageSchema,
  }),
  z.object({
    type: z.literal("helpdesk.conversation_resolved"),
    conversationId: z.string().uuid(),
    resolvedBy: z.string(),
    resolvedAt: z.string().datetime(),
  }),
  z.object({
    type: z.literal("helpdesk.typing"),
    conversationId: z.string().uuid(),
    actor: z.enum(["user", "human_agent"]),
    isTyping: z.boolean(),
    emittedAt: z.string().datetime(),
  }),
]);

export type HelpdeskSocketEvent = z.infer<typeof HelpdeskSocketEventSchema>;
