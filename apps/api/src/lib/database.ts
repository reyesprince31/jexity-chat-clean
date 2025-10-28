import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient();

// Database types
export interface Document {
  id: string;
  content_hash: string;
  filename: string;
  mimetype: string;
  size: bigint;
  storage_path: string;
  public_url: string;
  storage_bucket: string;
  extracted_text_length: number | null;
  has_embedding: boolean | null;
  user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDocumentInput {
  content_hash: string;
  filename: string;
  mimetype: string;
  size: number;
  storage_path: string;
  public_url: string;
  storage_bucket: string;
  extracted_text_length: number;
  has_embedding: boolean;
  user_id?: string;
}

/**
 * Find a document by its content hash using Prisma
 * @param contentHash - The SHA-256 hash of the file content
 * @returns The document if found, null otherwise
 */
export async function findDocumentByHash(
  contentHash: string
): Promise<Document | null> {
  try {
    const document = await prisma.documents.findUnique({
      where: {
        content_hash: contentHash,
      },
    });

    return document;
  } catch (error) {
    throw new Error(`Failed to query document: ${error}`);
  }
}

/**
 * Create a new document record in the database using Prisma
 * @param input - Document data to insert
 * @returns The created document
 */
export async function createDocumentRecord(
  input: CreateDocumentInput
): Promise<Document> {
  try {
    const document = await prisma.documents.create({
      data: {
        content_hash: input.content_hash,
        filename: input.filename,
        mimetype: input.mimetype,
        size: BigInt(input.size),
        storage_path: input.storage_path,
        public_url: input.public_url,
        storage_bucket: input.storage_bucket,
        extracted_text_length: input.extracted_text_length,
        has_embedding: input.has_embedding,
        user_id: input.user_id || null,
      },
    });

    return document;
  } catch (error) {
    throw new Error(`Failed to create document record: ${error}`);
  }
}

/**
 * Get a document by its ID using Prisma
 * @param id - The document ID
 * @returns The document if found, null otherwise
 */
export async function getDocumentById(id: string): Promise<Document | null> {
  try {
    const document = await prisma.documents.findUnique({
      where: {
        id: id,
      },
    });

    return document;
  } catch (error) {
    throw new Error(`Failed to get document: ${error}`);
  }
}

/**
 * Update a document record with processing results using Prisma
 * @param id - The document ID
 * @param updates - Partial document data to update
 * @returns The updated document
 */
export async function updateDocumentRecord(
  id: string,
  updates: Partial<Omit<Document, "id" | "created_at" | "updated_at">>
): Promise<Document> {
  try {
    const document = await prisma.documents.update({
      where: {
        id: id,
      },
      data: {
        ...updates,
        updated_at: new Date(),
      },
    });

    return document;
  } catch (error) {
    throw new Error(`Failed to update document record: ${error}`);
  }
}
