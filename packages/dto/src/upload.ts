import { z } from "zod";

/**
 * Document schema
 */
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  mimetype: z.string(),
  size: z.number().int().positive(),
  storagePath: z.string(),
  publicUrl: z.string().url(),
  contentHash: z.string(),
  isDuplicate: z.boolean(),
  uploadedAt: z.string().datetime(),
});

export type Document = z.infer<typeof DocumentSchema>;

/**
 * Upload response schema
 */
export const UploadResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  document: DocumentSchema.optional(),
  eventId: z.string().optional(),
});

export type UploadResponse = z.infer<typeof UploadResponseSchema>;

/**
 * Upload info response schema (GET /upload/info)
 */
export const UploadInfoResponseSchema = z.object({
  maxFileSize: z.number().int().positive(),
  maxFileSizeMB: z.number().positive(),
  allowedMimeTypes: z.array(z.string()),
  allowedExtensions: z.array(z.string()),
});

export type UploadInfoResponse = z.infer<typeof UploadInfoResponseSchema>;
