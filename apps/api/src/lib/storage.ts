import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

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
