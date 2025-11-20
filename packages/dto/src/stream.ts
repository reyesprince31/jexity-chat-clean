import { z } from "zod";
import { SourceSchema } from "./source";
import { MessageSchema } from "./message";

/**
 * Token event schema (streaming text chunks)
 */
export const TokenEventSchema = z.object({
  type: z.literal("token"),
  content: z.string(),
});

export type TokenEvent = z.infer<typeof TokenEventSchema>;

/**
 * Done event schema (streaming complete with sources)
 */
export const DoneEventSchema = z.object({
  type: z.literal("done"),
  sources: z.array(SourceSchema).optional(),
});

export type DoneEvent = z.infer<typeof DoneEventSchema>;

/**
 * Title event schema (auto-generated conversation title)
 */
export const TitleEventSchema = z.object({
  type: z.literal("title"),
  title: z.string(),
});

export type TitleEvent = z.infer<typeof TitleEventSchema>;

/**
 * Error event schema (streaming error)
 */
export const ErrorEventSchema = z.object({
  type: z.literal("error"),
  message: z.string(),
});

export type ErrorEvent = z.infer<typeof ErrorEventSchema>;

/**
 * Escalation event schema (conversation routed to human agent)
 */
export const EscalatedEventSchema = z.object({
  type: z.literal("escalated"),
  conversationId: z.string().uuid(),
  reason: z.string().optional(),
  escalatedAt: z.string().datetime(),
});

export type EscalatedEvent = z.infer<typeof EscalatedEventSchema>;

/**
 * Agent joined event schema (human agent picked up chat)
 */
export const AgentJoinedEventSchema = z.object({
  type: z.literal("agent_joined"),
  conversationId: z.string().uuid(),
  agentName: z.string(),
  joinedAt: z.string().datetime(),
});

export type AgentJoinedEvent = z.infer<typeof AgentJoinedEventSchema>;

/**
 * Broadcast whenever a human agent sends a message. Keeps both the widget and
 * helpdesk in sync with the authoritative transcript stored in the API.
 */
export const AgentMessageEventSchema = z.object({
  type: z.literal("agent_message"),
  conversationId: z.string().uuid(),
  message: MessageSchema,
});

export type AgentMessageEvent = z.infer<typeof AgentMessageEventSchema>;

/**
 * Emitted once a human agent resolves the conversation, instructing the widget
 * to lock the UI and surface the closure timestamp.
 */
export const ResolvedEventSchema = z.object({
  type: z.literal("resolved"),
  conversationId: z.string().uuid(),
  resolvedBy: z.string().nullable(),
  resolvedAt: z.string().datetime(),
});

export type ResolvedEvent = z.infer<typeof ResolvedEventSchema>;

/**
 * Stream event discriminated union
 * Use this to parse SSE events from the API
 */
export const StreamEventSchema = z.discriminatedUnion("type", [
  TokenEventSchema,
  DoneEventSchema,
  TitleEventSchema,
  ErrorEventSchema,
  EscalatedEventSchema,
  AgentJoinedEventSchema,
  AgentMessageEventSchema,
  ResolvedEventSchema,
]);

export type StreamEvent = z.infer<typeof StreamEventSchema>;
