/**
 * Shared content parsing utilities used by the chat widget (Preact).
 * These helpers perform all string tokenization and citation normalization
 * so the UI can render identical output with its preferred component tree.
 */

export type TextSegment = {
  type: "text";
  content: string;
};

export type CitationSegment = {
  type: "citation";
  content: string;
  indices: number[];
  supportingTexts?: (string | undefined)[];
  filenames?: (string | undefined)[];
};

export type MessageSegment = TextSegment | CitationSegment;

export type ContentValue = string | MessageSegment[] | null | undefined;

export interface SegmentOptions {
  hideIncompleteCitations?: boolean;
}

/**
 * Truncates text that ends with an unfinished `{{cite` block so partially
 * streamed tokens stay hidden.
 */
export function stripIncompleteCitationContent(text: string): string {
  if (!text) {
    return text;
  }

  const citationStartRegex = /\{\{\s*cite\b/gi;
  let match: RegExpExecArray | null;

  while ((match = citationStartRegex.exec(text)) !== null) {
    const citationStart = match.index;
    const closingIndex = text.indexOf("}}", citationStartRegex.lastIndex);

    if (closingIndex === -1) {
      return text.slice(0, citationStart);
    }

    citationStartRegex.lastIndex = closingIndex + 2;
  }

  return text;
}

/**
 * Produces display-friendly message segments by cloning the input, folding
 * punctuation, and pruning empty text nodes.
 */
export function normalizeSegmentsForDisplay(
  segments: MessageSegment[]
): MessageSegment[] {
  const cloned = segments.map((segment) =>
    segment.type === "text" ? { ...segment } : segment
  );
  const result: MessageSegment[] = [];

  for (let i = 0; i < cloned.length; i += 1) {
    const segment = cloned[i];
    if (!segment) continue;

    if (segment.type === "citation") {
      const next = cloned[i + 1];

      if (next?.type === "text" && next.content.length > 0) {
        const punctuationMatch = next.content.match(/^([.,!?;:]+)/);
        if (punctuationMatch?.[1]) {
          const punctuation = punctuationMatch[1];
          const punctuationWithSpace = /\s$/.test(punctuation)
            ? punctuation
            : `${punctuation} `;

          let insertAt = result.length - 1;
          while (insertAt >= 0 && result[insertAt]?.type !== "text") {
            insertAt -= 1;
          }

          if (insertAt >= 0) {
            const target = result[insertAt];
            if (target?.type === "text") {
              const updatedContent = target.content.replace(/[ \t]+$/, "");
              result[insertAt] = {
                type: "text",
                content: `${updatedContent}${punctuationWithSpace}`,
              };
            }
          }

          next.content = next.content
            .slice(punctuation.length)
            .replace(/^[ \t]+/, "");
        }
      }

      result.push(segment);
      continue;
    }

    if (segment.content.length > 0) {
      result.push(segment);
    }
  }

  return result.filter(
    (segment) => segment.type !== "text" || segment.content.length > 0
  );
}

/**
 * Parse message content to extract inline citations.
 */
export function parseCitationsInText(text: string): MessageSegment[] {
  if (!text) return [];

  const segments: MessageSegment[] = [];
  const citationRegex = /\{\{([\s\S]*?)\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const citationBody = match[1];
    if (!citationBody) continue;

    const entryRegex =
      /cite:\s*([0-9]+(?:\s*,\s*[0-9]+)*)((?:,\s*(?:filename|text):"[^"]*")*)/g;
    const citationNumbers: number[] = [];
    const supportingTexts: (string | undefined)[] = [];
    const filenames: (string | undefined)[] = [];
    let entryMatch: RegExpExecArray | null;

    while ((entryMatch = entryRegex.exec(citationBody)) !== null) {
      const indicesString = entryMatch[1];
      if (!indicesString) {
        continue;
      }
      const optionsString = entryMatch[2] || "";
      const supportingTextRaw =
        optionsString.match(/text:"([^"]*)"/)?.[1] ?? undefined;
      const filenameRaw =
        optionsString.match(/filename:"([^"]*)"/)?.[1] ?? undefined;
      const parsedIndices = indicesString
        .split(",")
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

    if (matchStart > lastIndex) {
      segments.push({
        type: "text",
        content: text.substring(lastIndex, matchStart),
      });
    }

    segments.push({
      type: "citation",
      content: match[0],
      indices: citationNumbers,
      supportingTexts,
      filenames,
    });

    lastIndex = citationRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.substring(lastIndex),
    });
  }

  return segments;
}

/**
 * Shared helper that turns arbitrary content values into normalized segments.
 * Downstream renderers can map over the segments without duplicating parser
 * logic.
 */
export function getContentSegments(
  value: ContentValue,
  options: SegmentOptions = {}
): MessageSegment[] {
  let sanitizedText: string | null = null;

  if (Array.isArray(value)) {
    return normalizeSegmentsForDisplay(value);
  }

  const rawText = value ?? "";
  sanitizedText = options.hideIncompleteCitations
    ? stripIncompleteCitationContent(rawText)
    : rawText;

  if (!sanitizedText) {
    return [];
  }

  return normalizeSegmentsForDisplay(parseCitationsInText(sanitizedText));
}
