import { z } from "zod";
import { PaginationSchema } from "./common";

/**
 * Base Conversation schema
 */
export const ConversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

/**
 * Create conversation request schema
 */
export const CreateConversationRequestSchema = z.object({
  title: z.string().optional(),
});

export type CreateConversationRequest = z.infer<
  typeof CreateConversationRequestSchema
>;

/**
 * Create conversation response schema
 */
export const CreateConversationResponseSchema = z.object({
  success: z.literal(true),
  conversation: ConversationSchema,
});

export type CreateConversationResponse = z.infer<
  typeof CreateConversationResponseSchema
>;

/**
 * Get conversation response schema (with messages)
 * Note: Messages are defined in message.ts to avoid circular dependency
 */
export const GetConversationResponseSchema = z.object({
  success: z.literal(true),
  conversation: ConversationSchema.extend({
    messages: z.array(z.any()), // Will be properly typed when imported with MessageSchema
  }),
});

export type GetConversationResponse = z.infer<
  typeof GetConversationResponseSchema
>;

/**
 * List conversations response schema
 */
export const ListConversationsResponseSchema = z.object({
  success: z.literal(true),
  conversations: z.array(ConversationSchema),
  pagination: PaginationSchema,
});

export type ListConversationsResponse = z.infer<
  typeof ListConversationsResponseSchema
>;

/**
 * Delete conversation response schema
 */
export const DeleteConversationResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

export type DeleteConversationResponse = z.infer<
  typeof DeleteConversationResponseSchema
>;
