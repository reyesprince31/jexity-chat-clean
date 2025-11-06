import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { CHUNKING_CONFIG } from '../config/rag.config';

/**
 * Represents a page in a document with its character position boundaries
 */
export interface PageInfo {
  pageNumber: number;
  startPosition: number;
  endPosition: number;
  text: string;
}

/**
 * Mapping of character positions to page numbers
 */
export interface PageMapping {
  pages: PageInfo[];
  totalPages: number;
}

interface ChunkMetadata {
  chunkIndex: number;
  startPosition: number;
  endPosition: number;
  length: number;
  pageNumber?: number;
  pageEnd?: number;
  locationType?: 'page' | 'section' | 'line';
}

export interface DocumentChunk {
  content: string;
  metadata: ChunkMetadata;
}

export async function chunkText(
  text: string,
  pageMapping?: PageMapping
): Promise<DocumentChunk[]> {
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

    // Calculate page numbers if pageMapping is provided
    let pageNumber: number | undefined;
    let pageEnd: number | undefined;
    let locationType: 'page' | 'section' | 'line' | undefined;

    if (pageMapping) {
      const startPage = calculatePageForPosition(startPosition, pageMapping);
      const endPage = calculatePageForPosition(endPosition - 1, pageMapping);

      if (startPage !== null) {
        pageNumber = startPage;
        locationType = 'page';
        // Only set pageEnd if chunk spans multiple pages
        if (endPage !== null && endPage !== startPage) {
          pageEnd = endPage;
        }
      }
    }

    documentChunks.push({
      content: chunkText,
      metadata: {
        chunkIndex: i,
        startPosition,
        endPosition,
        length: chunkText.length,
        ...(pageNumber !== undefined && { pageNumber }),
        ...(pageEnd !== undefined && { pageEnd }),
        ...(locationType !== undefined && { locationType }),
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

/**
 * Calculate which page a given character position belongs to
 * @param position Character position in the full text
 * @param pageMapping Mapping of character positions to pages
 * @returns Page number (1-indexed) or null if not found
 */
export function calculatePageForPosition(
  position: number,
  pageMapping: PageMapping
): number | null {
  for (const page of pageMapping.pages) {
    if (position >= page.startPosition && position < page.endPosition) {
      return page.pageNumber;
    }
  }
  return null;
}

/**
 * Format page reference for display
 * @param pageNumber Starting page number
 * @param pageEnd Ending page number (if chunk spans multiple pages)
 * @returns Formatted string like "page 5" or "pages 5-6"
 */
export function formatPageReference(
  pageNumber?: number,
  pageEnd?: number
): string {
  if (pageNumber === undefined) {
    return '';
  }

  if (pageEnd !== undefined && pageEnd !== pageNumber) {
    return `pages ${pageNumber}-${pageEnd}`;
  }

  return `page ${pageNumber}`;
}

/**
 * Build page mapping from per-page text array
 * @param pages Array of page text strings
 * @returns PageMapping object with character position boundaries
 */
export function buildPageMapping(pages: string[]): PageMapping {
  const pageInfos: PageInfo[] = [];
  let currentPosition = 0;

  for (let i = 0; i < pages.length; i++) {
    const pageText = pages[i];
    if (!pageText) continue;

    const startPosition = currentPosition;
    const endPosition = startPosition + pageText.length;

    pageInfos.push({
      pageNumber: i + 1, // 1-indexed page numbers
      startPosition,
      endPosition,
      text: pageText,
    });

    currentPosition = endPosition;
  }

  return {
    pages: pageInfos,
    totalPages: pages.length,
  };
}
