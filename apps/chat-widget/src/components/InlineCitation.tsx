/**
 * InlineCitation Component
 *
 * Renders an inline citation with optional popover showing source details.
 * Citations are colored and become clickable when source data is available.
 */

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import type { Source } from "../types/api";
import { cn } from "../lib/utils";

interface InlineCitationProps {
  content: string;
  indices: number[];
  sources?: (Source | undefined)[];
  supportingTexts?: (string | undefined)[];
  className?: string;
}

export function InlineCitation({
  content,
  indices,
  sources = [],
  supportingTexts = [],
  className,
}: InlineCitationProps) {
  const [open, setOpen] = useState(false);

  const sourceEntries = indices.map((citationIndex, idx) => {
    return {
      citationIndex,
      displayNumber: citationIndex,
      source: sources?.[idx],
      supportingText: supportingTexts[idx]?.trim(),
    };
  });

  const hasAnySource = sourceEntries.some((entry) => entry.source);
  const displayNumbers = sourceEntries.map((entry) => entry.displayNumber);
  const citationText =
    displayNumbers.length > 0
      ? `[${displayNumbers.join(", ")}]`
      : content || "";

  const primaryEntry =
    sourceEntries.find((entry) => entry.source) ?? sourceEntries[0];
  const extraSourceCount =
    sourceEntries.length > 1 ? sourceEntries.length - 1 : 0;

  const fallbackPrimaryLabel = primaryEntry?.source?.filename
    ? primaryEntry.source.filename
    : citationText;

  const shouldShowExtraCount = extraSourceCount > 0 && hasAnySource;

  const pillLabel =
    fallbackPrimaryLabel && shouldShowExtraCount
      ? `${fallbackPrimaryLabel} + ${extraSourceCount}`
      : fallbackPrimaryLabel;

  const titleParts: string[] = [];
  const nonEmptySupporting = sourceEntries
    .map((entry) => entry.supportingText)
    .filter((text): text is string => Boolean(text));

  if (nonEmptySupporting.length > 0) {
    titleParts.push(...nonEmptySupporting);
  }

  if (sourceEntries.length > 0) {
    titleParts.push(
      ...sourceEntries.map((entry) =>
        entry.source
          ? entry.source.filename
          : `Reference [${entry.displayNumber}]`
      )
    );
  }

  const pillTitle =
    titleParts.length > 0 ? titleParts.join(" | ") : citationText;

  // If no source data available, render as colored text (not clickable)
  if (!hasAnySource) {
    return (
      <span
        className={cn(
          "citation-marker",
          "inline-flex items-center justify-center rounded-full",
          "bg-blue-50 text-blue-700 border border-blue-100",
          "px-2 py-0.5 text-xs font-medium",
          className
        )}
      >
        {pillLabel}
      </span>
    );
  }

  // With source data, render with interactive popover
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            "citation-marker citation-marker--clickable",
            "inline-flex items-center justify-center rounded-full border",
            "bg-white text-blue-700 border-blue-200",
            "px-2 py-0.5 text-xs font-medium",
            "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800",
            "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1",
            "transition-colors duration-150 cursor-pointer",
            className
          )}
          onClick={(e) => {
            e.preventDefault();
            setOpen(!open);
          }}
          aria-label={`View citation for ${pillTitle}`}
        >
          <span className="max-w-48 truncate" title={pillTitle}>
            {pillLabel}
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
                className={cn(
                  "pt-0",
                  idx > 0 && "border-t border-gray-200 pt-3"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs font-medium uppercase text-gray-500 mb-1">
                      Reference [{entry.displayNumber}]
                    </div>
                    <div className="font-semibold text-gray-900 text-sm mb-1">
                      {entry.source?.filename ?? "Source unavailable"}
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

          {/* Arrow pointing to citation */}
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
