import { z } from "zod";

/**
 * Pagination schema for list endpoints
 */
export const PaginationSchema = z.object({
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * Citation style for source references
 */
export const CitationStyleSchema = z.enum(["inline", "natural"]);

export type CitationStyle = z.infer<typeof CitationStyleSchema>;

/**
 * RAG (Retrieval Augmented Generation) options schema
 */
export const RAGOptionsSchema = z.object({
  limit: z.number().int().min(1).max(50).default(5).optional(),
  similarityThreshold: z.number().min(0).max(1).default(0.6).optional(),
  citationStyle: CitationStyleSchema.default("natural").optional(),
});

export type RAGOptions = z.infer<typeof RAGOptionsSchema>;

/**
 * Generic success response wrapper
 */
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

/**
 * Generic error response schema
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  error: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
