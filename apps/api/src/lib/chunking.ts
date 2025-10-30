import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { CHUNKING_CONFIG } from '../config/rag.config';

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

export async function chunkText(text: string): Promise<DocumentChunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNKING_CONFIG.chunkSize,
    chunkOverlap: CHUNKING_CONFIG.chunkOverlap,
    separators: [...CHUNKING_CONFIG.separators],
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
    currentPosition = endPosition - CHUNKING_CONFIG.chunkOverlap;
  }

  return documentChunks;
}

export function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}
