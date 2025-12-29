"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";

import type { ConversationMessage, ConversationRecord } from "./types";
import { Content } from "./Content";

import { Button } from "@/components/ui/button";
import { cn, formatDetailTimestamp } from "@/lib/utils";

const COMPOSER_CHARACTER_LIMIT = 2000;

type ConversationPanelProps = {
  conversation?: ConversationRecord;
  currentAgentName: string;
  onJoinConversation?: (conversationId: string) => Promise<void> | void;
  joiningConversationId?: string | null;
  draft?: string;
  onDraftChange?: (conversationId: string, value: string) => void;
  onSendMessage?: (
    conversationId: string,
    body: string
  ) => Promise<void> | void;
  sendingConversationId?: string | null;
  onResolveConversation?: (conversationId: string) => Promise<void> | void;
  resolvingConversationId?: string | null;
};

type PendingMessage = {
  id: string;
  body: string;
  timestamp: string;
  status: "sending" | "error";
  error?: string;
};

export function ConversationPanel({
  conversation,
  currentAgentName,
  onJoinConversation,
  joiningConversationId,
  draft,
  onDraftChange,
  onSendMessage,
  onResolveConversation,
  resolvingConversationId,
}: ConversationPanelProps) {
  const [resolveDialogConversationId, setResolveDialogConversationId] =
    React.useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = React.useState<
    PendingMessage[]
  >([]);
  // Combine canonical transcript with local system announcements so agents
  // can see escalation/join/resolve breadcrumbs inline.
  const messageHistory = React.useMemo(() => {
    if (!conversation) return [];

    const combined: ConversationMessage[] = [...conversation.messages];

    if (conversation.escalatedAt) {
      combined.push({
        id: `system-escalated-${conversation.id}`,
        sender: "system",
        body: "Chat has been escalated",
        timestamp: conversation.escalatedAt,
      });
    }

    if (conversation.agentJoinedAt && conversation.agentName) {
      combined.push({
        id: `system-joined-${conversation.id}`,
        sender: "system",
        body: `${conversation.agentName} has joined this conversation`,
        timestamp: conversation.agentJoinedAt,
      });
    }

    if (conversation.resolvedAt) {
      combined.push({
        id: `system-resolved-${conversation.id}`,
        sender: "system",
        body: `${conversation.resolvedBy ?? conversation.agentName ?? currentAgentName} resolved this chat`,
        timestamp: conversation.resolvedAt,
      });
    }

    return combined.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [conversation, currentAgentName]);

  const conversationId = conversation?.id;
  const isClaimed = Boolean(conversation?.agentName);
  const isClaimedByUser = conversation?.agentName === currentAgentName;
  const isJoining = conversationId
    ? joiningConversationId === conversationId
    : false;
  const agentLabel = conversation?.agentName || currentAgentName;
  const draftValue = draft ?? "";
  const isResolved = conversation?.isResolved ?? false;
  const canReply = Boolean(isClaimedByUser && onSendMessage && !isResolved);
  const composerInputId = React.useId();
  const composerInstructionId = React.useId();
  const composerStatusId = React.useId();
  const charactersRemaining = Math.max(
    0,
    COMPOSER_CHARACTER_LIMIT - draftValue.length
  );
  const composerRef = React.useRef<HTMLTextAreaElement | null>(null);
  const transcriptRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setPendingMessages([]);
  }, [conversationId]);

  const scrollTranscriptToBottom = React.useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const node = transcriptRef.current;
      if (!node) return;
      try {
        node.scrollTo({ top: node.scrollHeight, behavior });
      } catch {
        node.scrollTop = node.scrollHeight;
      }
    },
    []
  );

  const transmitPendingMessage = React.useCallback(
    (pendingId: string, body: string) => {
      if (!conversationId || !onSendMessage) return;
      const handleError = (error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to send. Try again.";
        setPendingMessages((prev) =>
          prev.map((pending) =>
            pending.id === pendingId
              ? { ...pending, status: "error", error: errorMessage }
              : pending
          )
        );
        scrollTranscriptToBottom();
      };

      try {
        const result = onSendMessage(conversationId, body);
        Promise.resolve(result)
          .then(() => {
            setPendingMessages((prev) =>
              prev.filter((pending) => pending.id !== pendingId)
            );
          })
          .catch(handleError);
      } catch (error) {
        handleError(error);
      }
    },
    [conversationId, onSendMessage, scrollTranscriptToBottom]
  );

  const adjustComposerHeight = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      if (!node) return;
      node.style.height = "auto";
      node.style.height = `${Math.min(node.scrollHeight, 240)}px`;
    },
    []
  );

  React.useEffect(() => {
    adjustComposerHeight(composerRef.current);
  }, [draftValue, adjustComposerHeight]);

  React.useEffect(() => {
    scrollTranscriptToBottom("auto");
  }, [messageHistory.length, scrollTranscriptToBottom]);

  React.useEffect(() => {
    if (pendingMessages.length > 0) {
      scrollTranscriptToBottom();
    }
  }, [pendingMessages.length, scrollTranscriptToBottom]);

  const handleJoinClick = () => {
    if (!conversationId || isClaimed || !onJoinConversation) return;
    onJoinConversation(conversationId);
  };

  const renderActionButton = () => {
    if (!onJoinConversation || !conversationId) return null;
    const claimedByLabel = conversation?.agentName ?? "Another agent";

    if (!isClaimed) {
      return (
        <Button onClick={handleJoinClick} size="sm" disabled={isJoining}>
          {isJoining ? "Joining…" : "Join chat"}
        </Button>
      );
    }

    if (isClaimedByUser) {
      return (
        <Button
          size="sm"
          variant={isResolved ? "outline" : "default"}
          className={cn(
            !isResolved &&
              "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600"
          )}
          disabled={isResolved}
          onClick={() => setResolveDialogConversationId(conversationId)}
        >
          {isResolved ? "Resolved" : "Resolve"}
        </Button>
      );
    }

    return (
      <Button size="sm" variant="outline" disabled>
        Claimed by {claimedByLabel}
      </Button>
    );
  };

  const sendCurrentDraft = React.useCallback(() => {
    if (!conversationId || !onSendMessage) return;
    const trimmed = draftValue.trim();
    if (!trimmed) return;

    const pendingId = `pending-${conversationId}-${Date.now()}`;
    const timestamp = new Date().toISOString();

    setPendingMessages((prev) => [
      ...prev,
      {
        id: pendingId,
        body: trimmed,
        timestamp,
        status: "sending",
      },
    ]);
    scrollTranscriptToBottom();
    onDraftChange?.(conversationId, "");
    transmitPendingMessage(pendingId, trimmed);
  }, [
    conversationId,
    draftValue,
    onDraftChange,
    onSendMessage,
    scrollTranscriptToBottom,
    transmitPendingMessage,
  ]);

  const handleSendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendCurrentDraft();
  };

  const handleComposerKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === "Enter" &&
      (event.metaKey || (event.ctrlKey && !event.shiftKey))
    ) {
      event.preventDefault();
      sendCurrentDraft();
    }
  };

  const retryPendingMessage = React.useCallback(
    (pendingMessage: PendingMessage) => {
      if (!conversationId || !onSendMessage) return;
      setPendingMessages((prev) =>
        prev.map((message) =>
          message.id === pendingMessage.id
            ? {
                ...message,
                status: "sending",
                error: undefined,
                timestamp: new Date().toISOString(),
              }
            : message
        )
      );
      scrollTranscriptToBottom();
      transmitPendingMessage(pendingMessage.id, pendingMessage.body);
    },
    [
      conversationId,
      onSendMessage,
      scrollTranscriptToBottom,
      transmitPendingMessage,
    ]
  );

  const handleResolveConversation = async () => {
    if (!conversationId || !onResolveConversation) return;
    await onResolveConversation(conversationId);
    setResolveDialogConversationId(null);
  };

  const renderComposer = () => {
    if (!conversationId || !canReply) return null;

    return (
      <form
        onSubmit={handleSendMessage}
        className="border-border border-t px-6 py-4 space-y-2"
      >
        <label htmlFor={composerInputId} className="sr-only">
          Reply to customer
        </label>
        <div className="flex items-end gap-3">
          <textarea
            id={composerInputId}
            ref={(node) => {
              composerRef.current = node;
              adjustComposerHeight(node);
            }}
            value={draftValue}
            onChange={(event) => {
              adjustComposerHeight(event.currentTarget);
              onDraftChange?.(conversationId, event.target.value);
            }}
            placeholder="Type your reply…"
            aria-describedby={`${composerInstructionId} ${composerStatusId}`}
            className="min-h-[40px] flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            onKeyDown={handleComposerKeyDown}
            rows={1}
            maxLength={COMPOSER_CHARACTER_LIMIT}
          />
          <Button
            type="submit"
            disabled={!draftValue.trim()}
            className="block h-10 w-24 self-end px-4"
            aria-label="Send message"
          >
            Send
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span id={composerInstructionId}>Press ⌘/Ctrl + Enter to send</span>
          <span id={composerStatusId} aria-live="polite">
            {`${charactersRemaining} characters remaining`}
          </span>
        </div>
      </form>
    );
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
            <p className="text-sm text-muted-foreground">
              {conversation.subject}
            </p>
          </div>
          {renderActionButton()}
        </div>
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <p>Last updated: {formatDetailTimestamp(conversation.updatedAt)}</p>
          <p>
            Escalation reason: {conversation.escalatedReason || "Not provided"}
          </p>
          {conversation.agentName ? (
            <p>
              Claimed by {conversation.agentName} at{" "}
              {formatDetailTimestamp(
                conversation.agentJoinedAt || conversation.updatedAt
              )}
            </p>
          ) : conversation.isResolved && conversation.resolvedAt ? (
            <p>
              Resolved at {formatDetailTimestamp(conversation.resolvedAt)}
              {conversation.resolvedBy ? ` by ${conversation.resolvedBy}` : ""}
            </p>
          ) : (
            <p>Waiting for an agent to join</p>
          )}
        </div>
      </header>
      <div
        ref={transcriptRef}
        className="flex-1 space-y-4 overflow-y-auto px-6 py-6"
      >
        {messageHistory.length === 0 && pendingMessages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No messages yet. New activity will appear here automatically.
          </div>
        ) : (
          <>
            {messageHistory.map((message, index) => {
              const key = `${conversation.id}-${message.id}-${message.timestamp}-${message.sender}-${index}`;
              switch (message.sender) {
                case "system":
                  return <SystemMessagePill key={key} message={message} />;
                case "human_agent":
                  return (
                    <HumanAgentBubble
                      key={key}
                      message={message}
                      agentName={agentLabel}
                    />
                  );
                case "assistant":
                  return <AiAgentBubble key={key} message={message} />;
                default:
                  return <CustomerBubble key={key} message={message} />;
              }
            })}
            {pendingMessages.map((pending) => (
              <HumanAgentBubble
                key={pending.id}
                message={{
                  id: pending.id,
                  body: pending.body,
                  sender: "human_agent",
                  timestamp: pending.timestamp,
                }}
                agentName={agentLabel}
                pendingState={{
                  status: pending.status,
                  errorMessage: pending.error,
                  onRetry:
                    pending.status === "error"
                      ? () => retryPendingMessage(pending)
                      : undefined,
                }}
              />
            ))}
            {conversation.isCustomerTyping ? <CustomerTypingIndicator /> : null}
          </>
        )}
      </div>
      {renderComposer()}
      {conversationId ? (
        <Dialog.Root
          open={resolveDialogConversationId === conversationId}
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
                  disabled={resolvingConversationId === conversationId}
                  onClick={handleResolveConversation}
                >
                  {resolvingConversationId === conversationId
                    ? "Resolving…"
                    : "Mark as Resolved"}
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : null}
    </section>
  );
}

type MessageComponentProps = {
  message: ConversationMessage;
};

type PendingBubbleState = {
  status: "sending" | "error";
  errorMessage?: string;
  onRetry?: () => void;
};

type HumanAgentBubbleProps = MessageComponentProps & {
  agentName: string;
  pendingState?: PendingBubbleState;
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

function HumanAgentBubble({
  message,
  agentName,
  pendingState,
}: HumanAgentBubbleProps) {
  return (
    <article className="flex flex-col items-end gap-1 text-sm">
      <span className="text-xs font-semibold text-muted-foreground">
        {agentName}
      </span>
      <div className="max-w-[480px] rounded-lg bg-primary/90 px-4 py-2 text-primary-foreground shadow-sm">
        <Content value={message.body} />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-muted-foreground">
        {pendingState?.status === "sending" ? (
          <span>Sending…</span>
        ) : (
          <span>{formatDetailTimestamp(message.timestamp)}</span>
        )}
        {pendingState?.status === "error" && (
          <div className="flex items-center gap-2 text-destructive">
            <span>{pendingState.errorMessage ?? "Failed to send"}</span>
            {pendingState.onRetry ? (
              <button
                type="button"
                onClick={pendingState.onRetry}
                className="rounded border border-destructive px-2 py-0.5 text-[11px] font-semibold text-destructive hover:bg-destructive/10"
              >
                Retry
              </button>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}

function AiAgentBubble({ message }: MessageComponentProps) {
  return (
    <article className="flex flex-col items-end gap-1 text-sm">
      <div className="max-w-[480px] rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-sm">
        <Content value={message.body} />
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
        <Content value={message.body} />
      </div>
      <span className="text-xs text-muted-foreground">
        {formatDetailTimestamp(message.timestamp)}
      </span>
    </article>
  );
}

function CustomerTypingIndicator() {
  return (
    <div
      className="flex items-center gap-2 text-xs font-medium text-emerald-600"
      aria-live="polite"
    >
      <div className="flex items-center gap-1">
        {Array.from({ length: 3 }).map((_, index) => (
          <span
            key={index}
            className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
            style={{ animationDelay: `${index * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
