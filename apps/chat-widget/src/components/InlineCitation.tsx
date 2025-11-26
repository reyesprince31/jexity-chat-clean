import { useState } from "preact/hooks";
import * as Popover from "@radix-ui/react-popover";
import type { Source } from "../types/api";
import { cn } from "../lib/utils";

interface InlineCitationProps {
  content: string;
  indices: number[];
  sources?: (Source | undefined)[];
  supportingTexts?: (string | undefined)[];
  filenames?: (string | undefined)[];
  className?: string;
}

export function InlineCitation({
  content,
  indices,
  sources = [],
  supportingTexts = [],
  filenames = [],
  className,
}: InlineCitationProps) {
  const [open, setOpen] = useState(false);

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
          "bg-(--jexity-assistant-bg-citation-pill-muted)",
          "text-(--jexity-assistant-text-citation-pill-muted)",
          "border border-(--jexity-assistant-border-citation-pill-muted)",
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
            "bg-(--jexity-assistant-bg-citation-pill)",
            "text-(--jexity-assistant-text-citation-pill)",
            "border-(--jexity-assistant-border-citation-pill)",
            "px-2 py-0.5 text-xs font-medium mx-1",
            "hover:bg-(--jexity-assistant-bg-citation-pill-hover)",
            "hover:border-(--jexity-assistant-border-citation-pill-hover)",
            "hover:text-(--jexity-assistant-text-citation-pill-hover)",
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
