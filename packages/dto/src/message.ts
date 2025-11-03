import { z } from "zod";
import { RAGOptionsSchema } from "./common";
import { SourceSchema } from "./source";

/**
 * Message role enum
 */
export const MessageRoleSchema = z.enum(["user", "assistant", "system"]);

export type MessageRole = z.infer<typeof MessageRoleSchema>;

/**
 * Base Message schema
 * Note: Using conversationId (camelCase) for consistency
 */
export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  role: MessageRoleSchema,
  content: z.string(),
  createdAt: z.string().datetime(),
});

export type Message = z.infer<typeof MessageSchema>;

/**
 * Message with sources schema
 */
export const MessageWithSourcesSchema = MessageSchema.extend({
  sources: z.array(SourceSchema).optional(),
});

export type MessageWithSources = z.infer<typeof MessageWithSourcesSchema>;

/**
 * Send message request schema
 */
export const SendMessageRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  useRAG: z.boolean().default(true).optional(),
  ragOptions: RAGOptionsSchema.optional(),
});

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

/**
 * Get messages response schema
 */
export const GetMessagesResponseSchema = z.object({
  success: z.literal(true),
  messages: z.array(MessageSchema),
});

export type GetMessagesResponse = z.infer<typeof GetMessagesResponseSchema>;
