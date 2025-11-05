/**
 * Citation Parser
 *
 * Utility for parsing inline citations in message text.
 * Supports IEEE-style numeric citations like [0], [1], [2]
 */

export type TextSegment = {
  type: 'text';
  content: string;
};

export type CitationSegment = {
  type: 'citation';
  content: string;  // Original text like "[0]"
  index: number;    // Citation number (0, 1, 2, etc.)
};

export type MessageSegment = TextSegment | CitationSegment;

/**
 * Parse message content to extract inline citations
 *
 * @param text - Message text potentially containing citations like [0], [1]
 * @returns Array of text and citation segments in order
 *
 * @example
 * parseCitationsInText("Text[0] more[1]") returns:
 * [
 *   { type: 'text', content: 'Text' },
 *   { type: 'citation', content: '[0]', index: 0 },
 *   { type: 'text', content: ' more' },
 *   { type: 'citation', content: '[1]', index: 1 }
 * ]
 */
export function parseCitationsInText(text: string): MessageSegment[] {
  if (!text) return [];

  const segments: MessageSegment[] = [];
  const citationRegex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const citationNumberStr = match[1];
    if (!citationNumberStr) continue; // Skip if capture group is undefined
    const citationNumber = parseInt(citationNumberStr, 10);

    // Add text before citation (if any)
    if (matchStart > lastIndex) {
      segments.push({
        type: 'text',
        content: text.substring(lastIndex, matchStart),
      });
    }

    // Add citation
    segments.push({
      type: 'citation',
      content: match[0], // e.g., "[0]"
      index: citationNumber,
    });

    lastIndex = citationRegex.lastIndex;
  }

  // Add remaining text after last citation
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return segments;
}

/**
 * Check if a string contains any citations
 *
 * @param text - Text to check
 * @returns true if text contains at least one citation like [0], [1]
 */
export function hasCitations(text: string): boolean {
  return /\[\d+\]/.test(text);
}

/**
 * Extract all citation indices from text
 *
 * @param text - Message text
 * @returns Array of citation numbers found (e.g., [0, 1, 2])
 */
export function extractCitationIndices(text: string): number[] {
  const matches = text.matchAll(/\[(\d+)\]/g);
  return Array.from(matches, (match) => {
    const num = match[1];
    return num ? parseInt(num, 10) : 0;
  });
}
