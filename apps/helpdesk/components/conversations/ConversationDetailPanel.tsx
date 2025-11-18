"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";

import type { ConversationMessage, ConversationRecord } from "./types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDetailTimestamp } from "@/lib/utils";

const mockAgent = {
  id: "agent-8842",
  name: "John Doe",
};

type ConversationDetailPanelProps = {
  conversation?: ConversationRecord;
};

export function ConversationDetailPanel({
  conversation,
}: ConversationDetailPanelProps) {
  const [joinedConversations, setJoinedConversations] = useState<
    Record<string, boolean>
  >({});
  const [pendingDrafts, setPendingDrafts] = useState<Record<string, string>>(
    {}
  );
  const [localMessages, setLocalMessages] = useState<
    Record<string, ConversationMessage[]>
  >({});
  const [resolvedConversations, setResolvedConversations] = useState<
    Record<string, boolean>
  >({});
  const [resolveDialogConversationId, setResolveDialogConversationId] =
    useState<string | null>(null);

  const conversationId = conversation?.id;
  const hasExistingHumanAgentMessage =
    conversation?.messages.some(
      (message) => message.sender === "human_agent"
    ) ?? false;
  const joinedByUser = conversationId
    ? joinedConversations[conversationId]
    : false;
  const isJoined = !!(
    conversationId &&
    (joinedByUser || hasExistingHumanAgentMessage)
  );
  const isResolved = !!(
    conversationId && resolvedConversations[conversationId]
  );
  const pendingMessage =
    (conversationId && pendingDrafts[conversationId]) ?? "";
  const messageHistory = conversation
    ? [...conversation.messages, ...(localMessages[conversation.id] ?? [])]
    : [];

  const appendLocalMessage = (
    targetConversationId: string,
    message: ConversationMessage
  ) => {
    setLocalMessages((prev) => ({
      ...prev,
      [targetConversationId]: [...(prev[targetConversationId] ?? []), message],
    }));
  };

  const addSystemMessage = (targetConversationId: string, body: string) => {
    appendLocalMessage(targetConversationId, {
      id: `system-${targetConversationId}-${Date.now()}`,
      sender: "system",
      body,
      timestamp: new Date().toISOString(),
    });
  };

  const handleJoinChat = () => {
    if (!conversationId) return;

    setJoinedConversations((prev) => ({
      ...prev,
      [conversationId]: true,
    }));
    addSystemMessage(conversationId, `${mockAgent.name} joined the chat`);
  };

  const handleOpenResolveDialog = () => {
    if (!conversationId || isResolved) return;
    setResolveDialogConversationId(conversationId);
  };

  const handleResolveConversation = () => {
    if (!conversationId) return;

    setResolvedConversations((prev) => ({
      ...prev,
      [conversationId]: true,
    }));
    setResolveDialogConversationId(null);
    addSystemMessage(conversationId, `${mockAgent.name} resolved this chat`);
  };

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!conversationId) return;

    const trimmed = pendingMessage.trim();
    if (!trimmed) return;

    const newMessage: ConversationMessage = {
      id: `temp-${Date.now()}`,
      sender: "human_agent",
      body: trimmed,
      timestamp: new Date().toISOString(),
    };

    appendLocalMessage(conversationId, newMessage);
    setPendingDrafts((prev) => ({ ...prev, [conversationId]: "" }));
  };

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

  const renderActionButton = () => {
    if (!conversationId) return null;

    if (!isJoined) {
      return (
        <Button onClick={handleJoinChat} size="sm">
          Join chat
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        variant={isResolved ? "outline" : "destructive"}
        disabled={isResolved}
        onClick={handleOpenResolveDialog}
      >
        {isResolved ? "Resolved" : "Mark as Resolved"}
      </Button>
    );
  };

  const isResolveDialogOpen =
    !!conversationId && resolveDialogConversationId === conversationId;
  const canReply = isJoined && !isResolved;

  return (
    <section className="flex h-full flex-col">
      <header className="border-border border-b px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Conversation
            </p>
            <h1 className="text-lg font-semibold text-foreground">
              {conversation.customerName}
            </h1>
          </div>
          {renderActionButton()}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Last updated: {formatDetailTimestamp(conversation.updatedAt)}
        </div>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        {messageHistory.map((message) => {
          switch (message.sender) {
            case "system":
              return <SystemMessagePill key={message.id} message={message} />;
            case "human_agent":
              return (
                <HumanAgentBubble
                  key={message.id}
                  message={message}
                  agentName={mockAgent.name}
                />
              );
            case "assistant":
              return <AiAgentBubble key={message.id} message={message} />;
            default:
              return <CustomerBubble key={message.id} message={message} />;
          }
        })}
      </div>
      {canReply && (
        <form
          onSubmit={handleSendMessage}
          className="border-border border-t px-6 py-4"
        >
          <div className="flex gap-3">
            <Input
              value={pendingMessage}
              onChange={(event) => {
                if (!conversationId) return;
                setPendingDrafts((prev) => ({
                  ...prev,
                  [conversationId]: event.target.value,
                }));
              }}
              placeholder="Type your reply…"
              aria-label="Message to customer"
            />
            <Button type="submit" disabled={!pendingMessage.trim()}>
              Send
            </Button>
          </div>
        </form>
      )}
      {conversationId && (
        <Dialog.Root
          open={isResolveDialogOpen}
          onOpenChange={(open) => {
            if (!open) setResolveDialogConversationId(null);
          }}
        >
          <Dialog.Portal>
            <Dialog.Overlay className="bg-background/80 fixed inset-0 backdrop-blur-sm" />
            <Dialog.Content className="bg-popover text-popover-foreground shadow-xl border-border fixed left-1/2 top-1/2 w-[min(420px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border p-6">
              <Dialog.Title className="text-base font-semibold">
                Resolve conversation?
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground mt-2">
                Marking this chat as resolved will close the case for{" "}
                <span className="font-medium text-foreground">
                  {conversation.customerName}
                </span>{" "}
                and prevent further replies.
              </Dialog.Description>
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResolveDialogConversationId(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleResolveConversation}
                >
                  Mark as Resolved
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </section>
  );
}

type MessageComponentProps = {
  message: ConversationMessage;
};

type HumanAgentBubbleProps = MessageComponentProps & {
  agentName: string;
};

function SystemMessagePill({ message }: MessageComponentProps) {
  return (
    <article className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
      <div className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
        {message.body}
      </div>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
        {formatDetailTimestamp(message.timestamp)}
      </span>
    </article>
  );
}

function HumanAgentBubble({ message, agentName }: HumanAgentBubbleProps) {
  return (
    <article className="flex flex-col items-end gap-1 text-sm">
      <span className="text-xs font-semibold text-muted-foreground">
        {agentName}
      </span>
      <div className="max-w-[480px] rounded-lg bg-primary/90 px-4 py-2 text-primary-foreground shadow-sm">
        {message.body}
      </div>
      <span className="text-xs text-muted-foreground">
        {formatDetailTimestamp(message.timestamp)}
      </span>
    </article>
  );
}

function AiAgentBubble({ message }: MessageComponentProps) {
  return (
    <article className="flex flex-col items-end gap-1 text-sm">
      <div className="max-w-[480px] rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-sm">
        {message.body}
      </div>
      <span className="text-xs text-muted-foreground">
        {formatDetailTimestamp(message.timestamp)}
      </span>
    </article>
  );
}

function CustomerBubble({ message }: MessageComponentProps) {
  return (
    <article className="flex flex-col items-start gap-1 text-sm">
      <div className="max-w-[480px] rounded-lg bg-muted px-4 py-2 text-foreground shadow-sm">
        {message.body}
      </div>
      <span className="text-xs text-muted-foreground">
        {formatDetailTimestamp(message.timestamp)}
      </span>
    </article>
  );
}
