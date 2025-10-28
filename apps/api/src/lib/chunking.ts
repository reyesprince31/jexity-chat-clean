import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

interface ChunkMetadata {
  chunkIndex: number;
  startPosition: number;
  endPosition: number;
  length: number;
}

export interface DocumentChunk {
  content: string;
  metadata: ChunkMetadata;
}

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export async function chunkText(text: string): Promise<DocumentChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ['\n\n', '\n', '. ', '! ', '? ', ', ', ' ', ''],
    keepSeparator: false,
  });

  const chunks = await splitter.createDocuments([text]);

  let currentPosition = 0;
  const documentChunks: DocumentChunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;
    const chunkText = chunk.pageContent;
    const startPosition = currentPosition;
    const endPosition = startPosition + chunkText.length;

    documentChunks.push({
      content: chunkText,
      metadata: {
        chunkIndex: i,
        startPosition,
        endPosition,
        length: chunkText.length,
      },
    });

    // Move position forward, accounting for overlap
    currentPosition = endPosition - CHUNK_OVERLAP;
  }

  return documentChunks;
}

export function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}
