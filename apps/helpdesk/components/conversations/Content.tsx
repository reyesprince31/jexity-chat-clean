"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import type { Source } from "@repo/dto";
import {
  getContentSegments,
  type ContentValue,
  type MessageSegment,
} from "@repo/ui/content";
import { cn } from "@/lib/utils";

const INLINE_MARKDOWN_REGEX =
  /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+?\*|_[^_]+?_|\~\~[^~]+?\~\~|`[^`]+`|\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s<]+))/g;

function parseInlineMarkdown(text: string, keyPrefix: string) {
  const nodes: React.ReactNode[] = [];
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
    let content: React.ReactNode;

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
    <React.Fragment key={`${key}-line-${lineIndex}`}>
      {parseInlineMarkdown(line, `${key}-line-${lineIndex}`)}
      {lineIndex < lines.length - 1 ? <br /> : null}
    </React.Fragment>
  ));
}

interface ContentProps {
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
  const segments = React.useMemo(
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
          <React.Fragment key={`text-${idx}`}>
            {renderTextContent(segment.content, `segment-${idx}`)}
          </React.Fragment>
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

interface InlineCitationProps {
  content: string;
  indices: number[];
  sources?: (Source | undefined)[];
  supportingTexts?: (string | undefined)[];
  filenames?: (string | undefined)[];
  className?: string;
}

function InlineCitation({
  content,
  indices,
  sources = [],
  supportingTexts = [],
  filenames = [],
  className,
}: InlineCitationProps) {
  const [open, setOpen] = React.useState(false);

  const sourceEntries = indices.map((citationIndex, idx) => {
    const rawFilename = filenames[idx];
    const normalizedFilename =
      typeof rawFilename === "string" && rawFilename.trim().length > 0
        ? rawFilename.trim()
        : undefined;

    return {
      citationIndex,
      displayNumber: idx + 1,
      source: sources?.[idx],
      supportingText: supportingTexts[idx]?.trim(),
      filename: normalizedFilename,
    };
  });

  const hasAnySource = sourceEntries.some((entry) => entry.source);
  const displayNumbers = sourceEntries.map((entry) => entry.displayNumber);
  const citationText =
    displayNumbers.length > 0 ? displayNumbers.join(", ") : content || "";

  const primaryEntry =
    sourceEntries.find((entry) => entry.source) ?? sourceEntries[0];
  const extraSourceCount =
    sourceEntries.length > 1 ? sourceEntries.length - 1 : 0;

  const fallbackPrimaryLabel = primaryEntry?.source?.filename
    ? primaryEntry.source.filename
    : primaryEntry?.filename ?? citationText;

  const shouldShowExtraCount = extraSourceCount > 0 && hasAnySource;

  const titleParts: string[] = [];
  const nonEmptySupporting = sourceEntries
    .map((entry) => entry.supportingText)
    .filter((text): text is string => Boolean(text));

  if (nonEmptySupporting.length > 0) {
    titleParts.push(...nonEmptySupporting);
  }

  if (sourceEntries.length > 0) {
    titleParts.push(
      ...sourceEntries.map(
        (entry) =>
          entry.source?.filename ?? entry.filename ?? "Source unavailable"
      )
    );
  }

  const pillTitle =
    titleParts.length > 0 ? titleParts.join(" | ") : citationText;

  if (!hasAnySource) {
    return (
      <span
        className={cn(
          "citation-marker",
          "inline-flex items-center justify-center rounded-full",
          "bg-gray-100 text-gray-700 border border-gray-200",
          "px-2 py-0.5 text-xs font-medium mx-1",
          "max-w-32 min-w-11",
          className
        )}
        title={pillTitle}
      >
        <span className="inline-flex items-center gap-1 min-w-0">
          <span className="truncate">{fallbackPrimaryLabel}</span>
          {shouldShowExtraCount ? (
            <span className="shrink-0 whitespace-nowrap">
              + {extraSourceCount}
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            "citation-marker citation-marker--clickable",
            "inline-flex items-center justify-center rounded-full border",
            "bg-white text-gray-700 border-gray-300",
            "px-2 py-0.5 text-xs font-medium mx-1",
            "hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900",
            "transition-colors duration-150 cursor-pointer",
            "max-w-32 min-w-11",
            className
          )}
          onClick={(event) => {
            event.preventDefault();
            setOpen((current) => !current);
          }}
          aria-label={`View citation for ${pillTitle}`}
        >
          <span
            className="inline-flex items-center gap-1 min-w-0"
            title={pillTitle}
          >
            <span className="truncate">{fallbackPrimaryLabel}</span>
            {shouldShowExtraCount ? (
              <span className="shrink-0 whitespace-nowrap">
                + {extraSourceCount}
              </span>
            ) : null}
          </span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="citation-popover z-50 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg outline-none"
          sideOffset={5}
          align="start"
        >
          <div className="space-y-4">
            {sourceEntries.map((entry, idx) => (
              <div
                key={`${entry.citationIndex}-${idx}`}
                className={cn("pt-0", idx > 0 && "border-t border-gray-200 pt-3")}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm mb-1">
                      {entry.source?.filename ??
                        entry.filename ??
                        "Source unavailable"}
                    </div>
                    {entry.source ? (
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {entry.source.pageNumber && (
                          <div>
                            {entry.source.pageEnd &&
                            entry.source.pageEnd !== entry.source.pageNumber
                              ? `Pages ${entry.source.pageNumber}-${entry.source.pageEnd}`
                              : `Page ${entry.source.pageNumber}`}
                          </div>
                        )}
                        <div>
                          Relevance:{" "}
                          {(entry.source.similarity * 100).toFixed(1)}%
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                {entry.supportingText ? (
                  <div className="mt-3 text-sm text-gray-700 leading-relaxed">
                    {entry.supportingText}
                  </div>
                ) : entry.source ? (
                  <div className="mt-3 text-sm text-gray-700 leading-relaxed">
                    <div className="line-clamp-4">{entry.source.content}</div>
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-gray-500">
                    Source details are not available.
                  </div>
                )}
              </div>
            ))}
          </div>

          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
