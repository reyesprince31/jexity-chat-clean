import { z } from "zod";

/**
 * Source citation schema (for streaming responses)
 * Used when AI responds with document citations
 */
export const SourceSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  similarity: z.number().min(0).max(1),
  content: z.string(),
  filename: z.string(),
  pageNumber: z.number().int().positive().optional(),
  pageEnd: z.number().int().positive().optional(),
});

export type Source = z.infer<typeof SourceSchema>;

/**
 * Detailed source schema (for /messages/:messageId/sources endpoint)
 * Includes more detailed document information
 */
export const MessageSourceDetailSchema = z.object({
  id: z.string().uuid(),
  chunkId: z.string().uuid(),
  similarityScore: z.number().min(0).max(1),
  content: z.string(),
  pageNumber: z.number().int().positive().optional(),
  pageEnd: z.number().int().positive().optional(),
  document: z.object({
    filename: z.string(),
    mimetype: z.string(),
  }),
});

export type MessageSourceDetail = z.infer<typeof MessageSourceDetailSchema>;

/**
 * Get message sources response schema
 */
export const GetMessageSourcesResponseSchema = z.object({
  success: z.literal(true),
  message: z.object({
    id: z.string().uuid(),
    role: z.enum(["user", "assistant", "system", "human_agent"]),
    content: z.string(),
    sources: z.array(MessageSourceDetailSchema),
  }),
});

export type GetMessageSourcesResponse = z.infer<
  typeof GetMessageSourcesResponseSchema
>;
