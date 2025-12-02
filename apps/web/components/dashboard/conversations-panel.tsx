"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Textarea } from "@/ui/textarea";
import { Badge } from "@/ui/badge";
import {
  Conversation,
  ConversationStatus,
  Message,
  mockConversations,
} from "@/lib/mock-data";

function getStatusLabel(status: ConversationStatus) {
  switch (status) {
    case "open":
      return "Open";
    case "waiting":
      return "Waiting";
    case "resolved":
      return "Resolved";
    default:
      return status;
  }
}

function getStatusVariant(status: ConversationStatus) {
  switch (status) {
    case "open":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "waiting":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "resolved":
      return "bg-sky-500/10 text-sky-500 border-sky-500/20";
    default:
      return "bg-muted text-muted-foreground border-border/60";
  }
}

export function ConversationsPanel() {
  const [conversations, setConversations] = useState<Conversation[]>(
    mockConversations,
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    mockConversations[0]?.id ?? null,
  );
  const [message, setMessage] = useState("");

  const selectedConversation =
    conversations.find((c) => c.id === selectedId) ?? conversations[0] ?? null;

  const handleSend = () => {
    if (!selectedConversation || !message.trim()) return;

    const newMessage: Message = {
      id: `agent-${Date.now()}`,
      sender: "agent",
      content: message.trim(),
      timestamp: "Just now",
    };

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedConversation.id
          ? {
              ...conv,
              lastMessage: newMessage.content,
              updatedAt: newMessage.timestamp,
              messages: [...conv.messages, newMessage],
              status: conv.status === "resolved" ? "open" : conv.status,
            }
          : conv,
      ),
    );

    setMessage("");
  };

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-4 md:flex-row">
      <div className="w-full md:w-72 lg:w-80">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Conversations
          </h2>
          <span className="text-xs text-muted-foreground">
            {conversations.length} active
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b bg-muted/40 p-2">
            <Input
              placeholder="Search conversations"
              className="h-8 text-xs"
              disabled
            />
          </div>
          <div className="max-h-[460px] space-y-1 overflow-y-auto p-2 text-sm">
            {conversations.map((conversation) => {
              const isActive = conversation.id === selectedConversation?.id;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "hover:bg-muted/60",
                  )}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium">
                      {conversation.customerName}
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        getStatusVariant(conversation.status),
                      )}>
                      {getStatusLabel(conversation.status)}
                    </span>
                  </div>
                  {conversation.customerEmail && (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {conversation.customerEmail}
                    </p>
                  )}
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {conversation.lastMessage}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {conversation.updatedAt}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex min-h-[320px] flex-1 flex-col rounded-xl border bg-card">
        {selectedConversation ? (
          <>
            <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium">
                    {selectedConversation.customerName}
                  </h2>
                  {selectedConversation.customerEmail && (
                    <span className="text-xs text-muted-foreground">
                      {selectedConversation.customerEmail}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Status: {getStatusLabel(selectedConversation.status)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  CSR Queue
                </Badge>
                <Button variant="outline" size="sm">
                  Mark as resolved
                </Button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-muted/40 px-4 py-3 text-sm">
              {selectedConversation.messages.map((msg) => {
                const isAgent = msg.sender === "agent" || msg.sender === "ai";

                return (
                  <div
                    key={msg.id}
                    className={cn("flex", isAgent && "justify-end")}>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2",
                        isAgent
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-background text-foreground rounded-bl-sm border",
                      )}>
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}

              {selectedConversation.messages.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No messages yet. Start the conversation below.
                </p>
              )}
            </div>

            <div className="border-t bg-card px-4 py-3">
              <div className="flex items-end gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a reply to the customer..."
                  className="min-h-[64px] resize-none text-sm"
                />
                <Button onClick={handleSend} disabled={!message.trim()}>
                  Send
                </Button>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Replies are not actually sent yet – this is mock UI for
                visualizing the helpdesk.
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Select a conversation on the left to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
