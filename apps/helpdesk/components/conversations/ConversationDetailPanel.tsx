"use client";

import type { ConversationRecord } from "./types";

import { capitalize, cn, formatDetailTimestamp } from "@/lib/utils";

type ConversationDetailPanelProps = {
  conversation?: ConversationRecord;
};

export function ConversationDetailPanel({
  conversation,
}: ConversationDetailPanelProps) {
  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <p className="text-base font-semibold text-foreground">
          Select a conversation
        </p>
        <p className="text-sm text-muted-foreground">
          Choose a thread from the left pane to see the full history.
        </p>
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col">
      <header className="border-border border-b px-6 py-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Conversation
        </p>
        <h1 className="text-lg font-semibold text-foreground">
          {conversation.customerName}
        </h1>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>Channel: {conversation.channel}</span>
          <span>Priority: {capitalize(conversation.priority)}</span>
          <span>
            Last updated: {formatDetailTimestamp(conversation.updatedAt)}
          </span>
        </div>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        {conversation.messages.map((message) => (
          <article
            key={message.id}
            className={cn(
              "flex flex-col gap-1 text-sm",
              message.sender === "assistant" ? "items-end" : "items-start"
            )}
          >
            <div
              className={cn(
                "max-w-[480px] rounded-lg px-4 py-2 shadow-sm",
                message.sender === "assistant"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {message.body}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDetailTimestamp(message.timestamp)}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
