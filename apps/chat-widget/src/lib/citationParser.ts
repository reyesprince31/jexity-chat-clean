/**
 * Citation Parser
 *
 * Utility for parsing inline citations in message text.
 * Supports handlebar-style citations like {{cite:0}}, {{cite:1,2}}
 */

export type TextSegment = {
  type: 'text';
  content: string;
};

export type CitationSegment = {
  type: 'citation';
  content: string;            // Original text containing citation markup
  indices: number[];          // Citation numbers included in the group
  supportingTexts?: (string | undefined)[]; // Optional supporting text per citation
  filenames?: (string | undefined)[];        // Optional source filename per citation
};

export type MessageSegment = TextSegment | CitationSegment;

/**
 * Parse message content to extract inline citations
 *
 * @param text - Message text potentially containing citations like {{cite:0}}
 * @returns Array of text and citation segments in order
 *
 * @example
 * parseCitationsInText('Text{{cite:0, filename:"doc.pdf", text:"Citation A"}} more{{cite:1, filename:"backup.pdf"}}') returns:
 * [
 *   { type: 'text', content: 'Text' },
 *   {
 *     type: 'citation',
 *     content: '{{cite:0, filename:"doc.pdf", text:"Citation A"}}',
 *     indices: [0],
 *     supportingTexts: ['Citation A'],
 *     filenames: ['doc.pdf']
 *   },
 *   { type: 'text', content: ' more' },
 *   {
 *     type: 'citation',
 *     content: '{{cite:1, filename:"backup.pdf"}}',
 *     indices: [1],
 *     supportingTexts: [undefined],
 *     filenames: ['backup.pdf']
 *   }
 * ]
 *
 * parseCitationsInText('{{cite:0, filename:"first.pdf", text:"First"}, {cite:1, filename:"second.pdf", text:"Second"}}') returns:
 * [
 *   {
 *     type: 'citation',
 *     content: '{{cite:0, filename:"first.pdf", text:"First"}, {cite:1, filename:"second.pdf", text:"Second"}}',
 *     indices: [0, 1],
 *     supportingTexts: ['First', 'Second'],
 *     filenames: ['first.pdf', 'second.pdf']
 *   }
 * ]
 */
export function parseCitationsInText(text: string): MessageSegment[] {
  if (!text) return [];

  const segments: MessageSegment[] = [];
  const citationRegex = /\{\{([\s\S]*?)\}\}/g;
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const citationBody = match[1];
    if (!citationBody) continue;

    const entryRegex =
      /cite:\s*([0-9]+(?:\s*,\s*[0-9]+)*)((?:,\s*(?:filename|text):"[^"]*")*)/g;
    const citationNumbers: number[] = [];
    const supportingTexts: (string | undefined)[] = [];
    const filenames: (string | undefined)[] = [];
    let entryMatch;

    while ((entryMatch = entryRegex.exec(citationBody)) !== null) {
      const indicesString = entryMatch[1];
      if (!indicesString) {
        continue;
      }
      const optionsString = entryMatch[2] || '';
      const supportingTextRaw =
        optionsString.match(/text:"([^"]*)"/)?.[1] ?? undefined;
      const filenameRaw =
        optionsString.match(/filename:"([^"]*)"/)?.[1] ?? undefined;
      const parsedIndices = indicesString
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .map((value) => parseInt(value, 10))
        .filter((value) => !Number.isNaN(value));

      if (parsedIndices.length === 0) continue;

      parsedIndices.forEach((idx) => {
        citationNumbers.push(idx);
        supportingTexts.push(supportingTextRaw?.trim() || undefined);
        filenames.push(filenameRaw?.trim() || undefined);
      });
    }

    if (citationNumbers.length === 0) continue;

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
      content: match[0], // e.g., "{{cite:0}}"
      indices: citationNumbers,
      supportingTexts,
      filenames,
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
 * @returns true if text contains at least one citation like {{cite:0}}
 */
export function hasCitations(text: string): boolean {
  return /\{\{[\s\S]*?cite:[\s\S]*?\}\}/.test(text);
}

/**
 * Extract all citation indices from text
 *
 * @param text - Message text
 * @returns Array of citation numbers found (e.g., [0, 1, 2])
 */
export function extractCitationIndices(text: string): number[] {
  if (!text) return [];

  const matches = text.matchAll(/\{\{([\s\S]*?)\}\}/g);
  const indices: number[] = [];

  for (const match of matches) {
    const body = match[1];
    if (!body) continue;

    const entryRegex =
      /cite:\s*([0-9]+(?:\s*,\s*[0-9]+)*)(?:,\s*text:"[^"]*")?/g;
    let entryMatch;

    while ((entryMatch = entryRegex.exec(body)) !== null) {
      const indicesString = entryMatch[1];
      if (!indicesString) {
        continue;
      }
      indicesString
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .forEach((value) => {
          const parsed = parseInt(value, 10);
          if (!Number.isNaN(parsed)) {
            indices.push(parsed);
          }
        });
    }
  }

  return indices;
}
