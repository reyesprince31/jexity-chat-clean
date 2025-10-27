import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

// Database types
export interface Document {
  id: string;
  content_hash: string;
  filename: string;
  mimetype: string;
  size: number;
  storage_path: string;
  public_url: string;
  storage_bucket: string;
  extracted_text_length: number;
  has_embedding: boolean;
  embedding_dimensions: number | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
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
  embedding_dimensions?: number;
  user_id?: string;
}

function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
    );
  }

  // Use service role key for server-side operations (bypasses RLS)
  supabaseInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return supabaseInstance;
}

export function getStorageBucket() {
  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!storageBucket) {
    throw new Error("SUPABASE_STORAGE_BUCKET is not defined in .env");
  }
  return storageBucket;
}

/**
 * Upload a file buffer to Supabase Storage
 * @param buffer - The file buffer to upload
 * @param filename - The name of the file
 * @param mimetype - The MIME type of the file
 * @returns Object containing the file path and public URL
 */
export async function uploadFileToStorage(
  buffer: Buffer,
  filename: string,
  mimetype: string
) {
  const client = getSupabaseClient();
  const storageBucket = getStorageBucket();

  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `${timestamp}-${sanitizedFilename}`;

  const { data, error } = await client.storage
    .from(storageBucket)
    .upload(filePath, buffer, {
      contentType: mimetype,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file to Supabase: ${error.message}`);
  }

  // Get public URL for the uploaded file
  const {
    data: { publicUrl },
  } = client.storage.from(storageBucket).getPublicUrl(filePath);

  return {
    path: data.path,
    publicUrl,
    bucket: storageBucket,
  };
}

/**
 * Delete a file from Supabase Storage
 * @param filePath - The path of the file to delete
 */
export async function deleteFileFromStorage(filePath: string) {
  const client = getSupabaseClient();
  const storageBucket = getStorageBucket();

  const { error } = await client.storage
    .from(storageBucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete file from Supabase: ${error.message}`);
  }

  return { deleted: true };
}

/**
 * Find a document by its content hash
 * @param contentHash - The SHA-256 hash of the file content
 * @returns The document if found, null otherwise
 */
export async function findDocumentByHash(
  contentHash: string
): Promise<Document | null> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("documents")
    .select("*")
    .eq("content_hash", contentHash)
    .single();

  if (error) {
    // If no rows found, return null (not an error)
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to query document: ${error.message}`);
  }

  return data as Document;
}

/**
 * Create a new document record in the database
 * @param input - Document data to insert
 * @returns The created document
 */
export async function createDocumentRecord(
  input: CreateDocumentInput
): Promise<Document> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("documents")
    .insert({
      content_hash: input.content_hash,
      filename: input.filename,
      mimetype: input.mimetype,
      size: input.size,
      storage_path: input.storage_path,
      public_url: input.public_url,
      storage_bucket: input.storage_bucket,
      extracted_text_length: input.extracted_text_length,
      has_embedding: input.has_embedding,
      embedding_dimensions: input.embedding_dimensions || null,
      user_id: input.user_id || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create document record: ${error.message}`);
  }

  return data as Document;
}

/**
 * Get a document by its ID
 * @param id - The document ID
 * @returns The document if found, null otherwise
 */
export async function getDocumentById(id: string): Promise<Document | null> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    // If no rows found, return null (not an error)
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get document: ${error.message}`);
  }

  return data as Document;
}

/**
 * Update a document record with processing results
 * @param id - The document ID
 * @param updates - Partial document data to update
 * @returns The updated document
 */
export async function updateDocumentRecord(
  id: string,
  updates: Partial<Omit<Document, "id" | "created_at" | "updated_at">>
): Promise<Document> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("documents")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update document record: ${error.message}`);
  }

  return data as Document;
}

/**
 * Download a file from Supabase Storage
 * @param filePath - The path of the file to download
 * @returns The file buffer
 */
export async function downloadFileFromStorage(
  filePath: string
): Promise<Buffer> {
  const client = getSupabaseClient();
  const storageBucket = getStorageBucket();

  const { data, error } = await client.storage
    .from(storageBucket)
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download file from Supabase: ${error.message}`);
  }

  // Convert Blob to Buffer
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
