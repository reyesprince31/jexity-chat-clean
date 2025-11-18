"use client";

import type { ConversationSummary } from "./types";

import { cn } from "@/lib/utils";

export type { ConversationSummary } from "./types";

type ConversationsPanelProps = {
  conversations: ConversationSummary[];
  activeConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
};

export function ConversationsPanel({
  conversations,
  activeConversationId,
  onSelectConversation,
}: ConversationsPanelProps) {
  return (
    <section className="flex h-full flex-col bg-card">
      <header className="border-border border-b px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Conversations</p>
        <p className="text-xs text-muted-foreground">
          {conversations.length} active conversation
          {conversations.length === 1 ? "" : "s"}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-border divide-y">
            {conversations.map((conversation) => (
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
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(conversation.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {conversation.subject}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-foreground/80">
                    {conversation.lastMessageSnippet}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <StatusPill status={conversation.status} />
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

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-muted-foreground">
      <p>No conversations yet.</p>
      <p>New chats will appear here in real time.</p>
    </div>
  );
}

function StatusPill({ status }: { status: ConversationSummary["status"] }) {
  const labelMap: Record<ConversationSummary["status"], string> = {
    open: "Open",
    waiting: "Waiting on user",
    resolved: "Resolved",
  };

  return (
    <span className="bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-0.5">
      {labelMap[status]}
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
