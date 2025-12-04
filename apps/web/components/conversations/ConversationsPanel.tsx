"use client";

import * as React from "react";

import type { ConversationSummary } from "./types";

import { cn } from "@/lib/utils";

type ConversationFilter = "unresolved" | "resolved" | "all";

const FILTER_OPTIONS: Array<{ value: ConversationFilter; label: string }> = [
  { value: "unresolved", label: "Unresolved" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All Conversations" },
];

export type { ConversationSummary } from "./types";

type ConversationsPanelProps = {
  conversations: ConversationSummary[];
  activeConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  isLoading?: boolean;
};

export function ConversationsPanel({
  conversations,
  activeConversationId,
  onSelectConversation,
  isLoading = false,
}: ConversationsPanelProps) {
  const [filter, setFilter] = React.useState<ConversationFilter>("unresolved");

  const filteredConversations = React.useMemo(() => {
    if (filter === "all") return conversations;

    return conversations.filter((conversation) =>
      filter === "resolved"
        ? conversation.status === "resolved"
        : conversation.status !== "resolved"
    );
  }, [conversations, filter]);

  return (
    <section className="flex h-full flex-col bg-card">
      <header className="border-border border-b px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Conversations</p>
        <p className="text-xs text-muted-foreground">
          {filteredConversations.length} conversation
          {filteredConversations.length === 1 ? "" : "s"} visible
        </p>
        <div className="mt-3">
          <FilterControls value={filter} onChange={setFilter} />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingState />
        ) : filteredConversations.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <ul className="divide-border divide-y">
            {filteredConversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    "w-full px-4 py-3 text-left transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                    "hover:bg-muted/70",
                    conversation.id === activeConversationId && "bg-muted"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 text-sm font-medium">
                    <span className="truncate text-foreground">
                      {conversation.customerName}
                    </span>
                    <span className="min-w-[64px] whitespace-nowrap text-right text-xs text-muted-foreground">
                      {formatTimestamp(conversation.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {conversation.subject}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-foreground/80">
                    {conversation.lastMessageSnippet}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <StatusPill status={conversation.status} />
                    {conversation.agentName ? (
                      <span className="text-muted-foreground/80">
                        Claimed by {conversation.agentName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/80">
                        Waiting for agent
                      </span>
                    )}
                    {conversation.unreadCount ? (
                      <span className="bg-primary text-primary-foreground inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold">
                        {conversation.unreadCount} new
                      </span>
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-muted-foreground">
      <p>Loading escalated conversations…</p>
    </div>
  );
}

function EmptyState({ filter }: { filter: ConversationFilter }) {
  const copy: Record<ConversationFilter, { title: string; subtitle: string }> =
    {
      unresolved: {
        title: "No unresolved conversations.",
        subtitle: "New or waiting chats will appear here as they escalate.",
      },
      resolved: {
        title: "No resolved conversations yet.",
        subtitle: "Close a chat to have it show up in this list.",
      },
      all: {
        title: "No conversations yet.",
        subtitle: "New chats will appear here in real time.",
      },
    };

  const { title, subtitle } = copy[filter];

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-muted-foreground">
      <p>{title}</p>
      <p>{subtitle}</p>
    </div>
  );
}

function FilterControls({
  value,
  onChange,
}: {
  value: ConversationFilter;
  onChange: (value: ConversationFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
      {FILTER_OPTIONS.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border px-3 py-1 transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground shadow"
                : "border-border text-muted-foreground hover:border-foreground/60 hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status: ConversationSummary["status"] }) {
  const statusStyles: Record<
    ConversationSummary["status"],
    { label: string; className: string }
  > = {
    open: {
      label: "Open",
      className: "border border-amber-200 bg-amber-50 text-amber-900",
    },
    waiting: {
      label: "Waiting for user",
      className: "border border-slate-200 bg-slate-100 text-slate-900",
    },
    resolved: {
      label: "Resolved",
      className: "border border-emerald-200 bg-emerald-50 text-emerald-900",
    },
  };

  const { label, className } = statusStyles[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        className
      )}
    >
      {label}
    </span>
  );
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
