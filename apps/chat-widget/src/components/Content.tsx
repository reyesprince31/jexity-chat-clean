import { Fragment } from "preact";
import type { ComponentChildren } from "preact";
import { useMemo } from "preact/hooks";
import type { Source } from "../types/api";
import {
  getContentSegments,
  type ContentValue,
  type MessageSegment,
} from "@repo/ui/content";
import { cn } from "../lib/utils";
import { InlineCitation } from "./InlineCitation";

const INLINE_MARKDOWN_REGEX =
  // eslint-disable-next-line no-useless-escape
  /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+?\*|_[^_]+?_|\~\~[^~]+?\~\~|`[^`]+`|\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s<]+))/g;

function parseInlineMarkdown(text: string, keyPrefix: string) {
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

function renderTextContent(content: string, key: string) {
  if (content.length === 0) {
    return null;
  }

  const lines = content.split(/\n/);
  return lines.map((line, lineIndex) => (
    <Fragment key={`${key}-line-${lineIndex}`}>
      {parseInlineMarkdown(line, `${key}-line-${lineIndex}`)}
      {lineIndex < lines.length - 1 ? <br /> : null}
    </Fragment>
  ));
}

export interface ContentProps {
  value: ContentValue;
  sources?: Source[];
  hideIncompleteCitations?: boolean;
  className?: string;
}

export function Content({
  value,
  sources = [],
  hideIncompleteCitations = false,
  className,
}: ContentProps) {
  const segments = useMemo(
    () =>
      getContentSegments(value, {
        hideIncompleteCitations,
      }),
    [value, hideIncompleteCitations]
  );

  if (segments.length === 0) {
    return null;
  }

  return (
    <div className={cn("content-renderer whitespace-pre-wrap", className)}>
      {segments.map((segment: MessageSegment, idx: number) =>
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
              (citationIndex: number) => sources?.[citationIndex]
            )}
            supportingTexts={segment.supportingTexts}
            filenames={segment.filenames}
          />
        )
      )}
    </div>
  );
}
