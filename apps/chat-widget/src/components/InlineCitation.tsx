/**
 * InlineCitation Component
 *
 * Renders an inline citation with optional popover showing source details.
 * Citations are colored and become clickable when source data is available.
 */

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import type { Source } from '../types/api';
import { cn } from '../lib/utils';

interface InlineCitationProps {
  index: number;
  source?: Source;
  citationStyle: 'inline' | 'natural';
  className?: string;
}

export function InlineCitation({
  index,
  source,
  citationStyle,
  className,
}: InlineCitationProps) {
  const [open, setOpen] = useState(false);

  // Determine the display number based on citation style
  const displayNumber = citationStyle === 'inline' ? index : index + 1;
  const citationText = `[${displayNumber}]`;

  // If no source data available, render as colored text (not clickable)
  if (!source) {
    return (
      <span
        className={cn(
          'citation-marker',
          'text-blue-600 font-medium',
          className
        )}
      >
        {citationText}
      </span>
    );
  }

  // With source data, render with interactive popover
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={cn(
            'citation-marker citation-marker--clickable',
            'text-blue-600 hover:text-blue-800 font-medium',
            'hover:underline cursor-pointer',
            'bg-transparent border-0 p-0',
            'transition-colors duration-150',
            className
          )}
          onClick={(e) => {
            e.preventDefault();
            setOpen(!open);
          }}
        >
          {citationText}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="citation-popover z-50 w-80 rounded-lg border border-gray-200 bg-white p-4 shadow-lg outline-none"
          sideOffset={5}
          align="start"
        >
          {/* Source header */}
          <div className="mb-2 flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold text-gray-900 text-sm mb-1">
                {source.filename}
              </div>
              <div className="text-xs text-gray-500 space-y-0.5">
                {source.pageNumber && (
                  <div>
                    {source.pageEnd && source.pageEnd !== source.pageNumber
                      ? `Pages ${source.pageNumber}-${source.pageEnd}`
                      : `Page ${source.pageNumber}`}
                  </div>
                )}
                <div>
                  Relevance: {(source.similarity * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Source content preview */}
          <div className="mt-3 text-sm text-gray-700 leading-relaxed">
            <div className="line-clamp-4">
              {source.content}
            </div>
          </div>

          {/* Arrow pointing to citation */}
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
