import { Fragment } from "preact";
import { useMemo } from "preact/hooks";
import type { ComponentChildren } from "preact";
import type { Source } from "../types/api";
import {
  parseCitationsInText,
  type MessageSegment,
} from "../lib/citationParser";
import { cn } from "../lib/utils";
import { InlineCitation } from "./InlineCitation";

/**
 * Truncates text that ends with an unfinished `{{cite` block so partially streamed tokens stay hidden.
 */
function stripIncompleteCitationContent(text: string): string {
  // Guard against streaming tokens that haven't closed their {{cite }} block yet.
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
 * Produces display-friendly message segments by cloning the input, folding punctuation,
 * and pruning empty text nodes.
 */
function normalizeSegmentsForDisplay(
  segments: MessageSegment[]
): MessageSegment[] {
  // Clone so downstream callers can reuse MessageSegment arrays without mutations.
  const cloned = segments.map((segment) =>
    segment.type === "text" ? { ...segment } : segment
  );
  const result: MessageSegment[] = [];

  for (let i = 0; i < cloned.length; i += 1) {
    const segment = cloned[i];
    if (!segment) {
      continue;
    }

    if (segment.type === "citation") {
      const next = cloned[i + 1];

      if (next?.type === "text" && next.content.length > 0) {
        const punctuationMatch = next.content.match(/^([.,!?;:]+)/);
        if (punctuationMatch && punctuationMatch[1]) {
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

const INLINE_MARKDOWN_REGEX =
  // eslint-disable-next-line no-useless-escape
  /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+?\*|_[^_]+?_|\~\~[^~]+?\~\~|`[^`]+`|\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s<]+))/g;

/**
 * Turns supported inline markdown tokens into lightweight Preact nodes while preserving surrounding text.
 */
function parseInlineMarkdown(text: string, keyPrefix: string): ComponentChildren[] {
  // Single-pass tokenizer turns inline markdown tokens into lightweight Preact nodes.
  const nodes: ComponentChildren[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let elementIndex = 0;

  while ((match = INLINE_MARKDOWN_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={`${keyPrefix}-text-${elementIndex}`}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
      elementIndex += 1;
    }

    const { 0: token, 2: linkText, 3: linkHref, 4: autoHref } = match;
    let content: ComponentChildren;

    if (token.startsWith("**") || token.startsWith("__")) {
      content = (
        <strong key={`${keyPrefix}-strong-${elementIndex}`}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("~~")) {
      content = (
        <del key={`${keyPrefix}-del-${elementIndex}`}>{token.slice(2, -2)}</del>
      );
    } else if (token.startsWith("`")) {
      content = (
        <code
          key={`${keyPrefix}-code-${elementIndex}`}
          className="inline-code whitespace-pre-wrap"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*") || token.startsWith("_")) {
      content = (
        <em key={`${keyPrefix}-em-${elementIndex}`}>{token.slice(1, -1)}</em>
      );
    } else if (linkText && linkHref) {
      content = (
        <a
          key={`${keyPrefix}-link-${elementIndex}`}
          href={linkHref}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline hover:text-blue-700"
        >
          {linkText}
        </a>
      );
    } else if (autoHref) {
      content = (
        <a
          key={`${keyPrefix}-autolink-${elementIndex}`}
          href={autoHref}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline hover:text-blue-700"
        >
          {autoHref}
        </a>
      );
    } else {
      content = <span key={`${keyPrefix}-text-${elementIndex}`}>{token}</span>;
    }

    nodes.push(content);
    elementIndex += 1;
    lastIndex = INLINE_MARKDOWN_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <span key={`${keyPrefix}-text-${elementIndex}`}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return nodes;
}

/**
 * Renders a text segment with inline markdown support and `<br />` separators for line breaks.
 */
function renderTextContent(content: string, key: string) {
  if (content.length === 0) {
    return null;
  }

  // Preserve line breaks while letting inline markdown render within each line.
  const lines = content.split(/\n/);
  return lines.map((line, lineIndex) => (
    <Fragment key={`${key}-line-${lineIndex}`}>
      {parseInlineMarkdown(line, `${key}-line-${lineIndex}`)}
      {lineIndex < lines.length - 1 ? <br /> : null}
    </Fragment>
  ));
}

/** Permitted value types accepted by the Content renderer. */
export type ContentValue = string | MessageSegment[] | null | undefined;

/** Props for the shared content renderer used by the chat widget. */
export interface ContentProps {
  value: ContentValue;
  sources?: Source[];
  hideIncompleteCitations?: boolean;
  className?: string;
}

/**
 * Renders assistant text with inline markdown, newline preservation, and interactive citations.
 */
export function Content({
  value,
  sources = [],
  hideIncompleteCitations = false,
  className,
}: ContentProps) {
  // Strings flow through the markdown/citation parser; pre-tokenized segments can be reused as-is.
  const sanitizedText = useMemo(() => {
    if (Array.isArray(value)) {
      return null;
    }
    const text = value ?? "";
    return hideIncompleteCitations
      ? stripIncompleteCitationContent(text)
      : text;
  }, [value, hideIncompleteCitations]);

  const segments = useMemo(() => {
    if (Array.isArray(value)) {
      return normalizeSegmentsForDisplay(value);
    }
    if (!sanitizedText) {
      return [];
    }
    return normalizeSegmentsForDisplay(parseCitationsInText(sanitizedText));
  }, [value, sanitizedText]);

  if (segments.length === 0) {
    return null;
  }

  return (
    <div className={cn("content-renderer whitespace-pre-wrap", className)}>
      {segments.map((segment, idx) =>
        segment.type === "text" ? (
          <Fragment key={`text-${idx}`}>
            {renderTextContent(segment.content, `segment-${idx}`)}
          </Fragment>
        ) : (
          <InlineCitation
            key={`citation-${idx}`}
            content={segment.content}
            indices={segment.indices}
            sources={segment.indices.map(
              (citationIndex) => sources?.[citationIndex]
            )}
            supportingTexts={segment.supportingTexts}
          />
        )
      )}
    </div>
  );
}
