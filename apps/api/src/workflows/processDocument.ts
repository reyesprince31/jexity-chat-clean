import { FatalError } from "workflow";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "internal-api-key-change-me";

interface DocumentData {
  id: string;
  filename: string;
  mimetype: string;
  storage_path: string;
}

interface FileData {
  base64: string;
  filename: string;
  mimetype: string;
  size: number;
}

interface ExtractResult {
  textLength: number;
  canCreateEmbedding: boolean;
  pageTexts?: string[];
}

interface ChunkResult {
  chunkCount: number;
}

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": INTERNAL_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
    throw new FatalError(`API call failed: ${errorData.error || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function processDocument(documentId: string) {
  "use workflow";

  try {
    // Step 1: Fetch document from database
    const document = await fetchDocument(documentId);

    // Step 2: Download file from storage
    const fileData = await downloadFile(documentId);

    // Step 3: Process file content and extract text
    const extractResult = await extractText(
      documentId,
      fileData.base64,
      fileData.filename,
      fileData.mimetype
    );

    // Step 4: Chunk, create embeddings, and store
    let chunkCount = 0;
    if (extractResult.canCreateEmbedding) {
      const chunkResult = await processChunks(
        documentId,
        document.filename,
        extractResult.pageTexts
      );
      chunkCount = chunkResult.chunkCount;
    } else {
      console.log(
        `Skipping embedding creation for unsupported file: ${document.filename}`
      );
    }

    // Step 5: Update document metadata with final status
    await updateMetadata(documentId, chunkCount > 0);

    return {
      success: true,
      message: "Document processed successfully",
      documentId: documentId,
      filename: document.filename,
      extractedTextLength: extractResult.textLength,
      hasEmbedding: chunkCount > 0,
      chunkCount: chunkCount,
    };
  } catch (error) {
    // If processing fails, delete the document to allow re-uploading
    console.error(`Error processing document ${documentId}:`, error);

    try {
      console.log(`Cleaning up failed document: ${documentId}`);
      await deleteDocument(documentId);
      console.log(`Successfully deleted failed document: ${documentId}`);
    } catch (deleteError) {
      console.error(`Failed to delete document ${documentId}:`, deleteError);
    }

    throw error;
  }
}

// Step functions that call internal API endpoints

async function fetchDocument(documentId: string): Promise<DocumentData> {
  "use step";
  
  console.log(`Fetching document with ID: ${documentId}`);
  const document = await apiCall<DocumentData>(`/internal/documents/${documentId}`);

  console.log(`Document found: ${document.filename} (${document.mimetype})`);
  console.log(`Storage path: ${document.storage_path}`);

  return document;
}

async function downloadFile(documentId: string): Promise<FileData> {
  "use step";
  
  console.log(`Downloading file for document: ${documentId}`);
  const fileData = await apiCall<FileData>(`/internal/documents/${documentId}/file`);
  console.log(`File downloaded: ${fileData.size} bytes`);

  return fileData;
}

async function extractText(
  documentId: string,
  fileBase64: string,
  filename: string,
  mimetype: string
): Promise<ExtractResult> {
  "use step";
  
  console.log(`Extracting text for document: ${documentId}`);
  const result = await apiCall<ExtractResult>(
    `/internal/documents/${documentId}/extract-text`,
    {
      method: "POST",
      body: JSON.stringify({ fileBase64, filename, mimetype }),
    }
  );

  console.log(`Extracted ${result.textLength} characters, can embed: ${result.canCreateEmbedding}`);
  return result;
}

async function processChunks(
  documentId: string,
  filename: string,
  pageTexts?: string[]
): Promise<ChunkResult> {
  "use step";
  
  console.log(`Processing chunks for document: ${documentId}`);
  const result = await apiCall<ChunkResult>(
    `/internal/documents/${documentId}/process-chunks`,
    {
      method: "POST",
      body: JSON.stringify({ filename, pageTexts }),
    }
  );

  console.log(`Created ${result.chunkCount} chunks`);
  return result;
}

async function updateMetadata(
  documentId: string,
  hasEmbedding: boolean
): Promise<void> {
  "use step";
  
  console.log(`Updating metadata for document: ${documentId}`);
  await apiCall<{ success: boolean }>(
    `/internal/documents/${documentId}/metadata`,
    {
      method: "PATCH",
      body: JSON.stringify({ hasEmbedding }),
    }
  );

  console.log(`Metadata updated: hasEmbedding=${hasEmbedding}`);
}

async function deleteDocument(documentId: string): Promise<void> {
  "use step";
  
  await apiCall<{ success: boolean }>(
    `/internal/documents/${documentId}`,
    { method: "DELETE" }
  );
}
