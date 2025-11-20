"use client";

import * as React from "react";

import type {
  HelpdeskConversation,
  HelpdeskSocketEvent,
  Message,
} from "@repo/dto";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ConversationDetailPanel } from "@/components/conversations/ConversationDetailPanel";
import { ConversationsPanel } from "@/components/conversations/ConversationsPanel";
import type {
  ConversationMessage,
  ConversationRecord,
} from "@/components/conversations/types";
import {
  claimConversation,
  fetchEscalatedConversations,
  openHelpdeskSocket,
  sendAgentMessage,
  resolveConversation,
} from "@/lib/api";

const AGENT_NAME = process.env.NEXT_PUBLIC_AGENT_NAME || "First Agent";

const ROLE_TO_SENDER: Record<Message["role"], ConversationMessage["sender"]> = {
  user: "customer",
  assistant: "assistant",
  system: "system",
  human_agent: "human_agent",
};

const sortConversations = (items: ConversationRecord[]) =>
  [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

export default function Home() {
  const [conversations, setConversations] = React.useState<
    ConversationRecord[]
  >([]);
  const [activeConversationId, setActiveConversationId] =
    React.useState<string>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [joiningConversationId, setJoiningConversationId] = React.useState<
    string | null
  >(null);
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [sendingConversationId, setSendingConversationId] = React.useState<
    string | null
  >(null);
  const [resolvingConversationId, setResolvingConversationId] = React.useState<
    string | null
  >(null);

  const upsertConversation = React.useCallback((record: ConversationRecord) => {
    setConversations((prev) => {
      const next = [...prev];
      const index = next.findIndex(
        (conversation) => conversation.id === record.id
      );
      if (index === -1) {
        next.push(record);
      } else {
        next[index] = record;
      }
      return sortConversations(next);
    });
  }, []);

  const updateConversationMetadata = React.useCallback(
    (conversationId: string, updates: Partial<ConversationRecord>) => {
      setConversations((prev) => {
        const index = prev.findIndex(
          (conversation) => conversation.id === conversationId
        );
        if (index === -1) {
          return prev;
        }

        const next = [...prev];
        const merged = { ...next[index], ...updates } as ConversationRecord;
        if (merged.isResolved) {
          merged.status = "resolved";
        }
        next[index] = merged;
        return sortConversations(next);
      });
    },
    []
  );

  /**
   * Inserts a freshly streamed message (widget/user/agent) into the cached
   * transcript while keeping derived fields like snippet/updatedAt in sync.
   */
  const appendMessageToConversation = React.useCallback(
    (conversationId: string, message: Message) => {
      setConversations((prev) => {
        const index = prev.findIndex(
          (conversation) => conversation.id === conversationId
        );
        if (index === -1) {
          return prev;
        }

        const mappedMessage = mapMessageToRecord(message);
        const next = [...prev];

        if (next[index].messages.some((msg) => msg.id === mappedMessage.id)) {
          return prev;
        }

        next[index] = {
          ...next[index],
          messages: [...next[index].messages, mappedMessage],
          lastMessageSnippet: mappedMessage.body,
          updatedAt: mappedMessage.timestamp,
        };

        return sortConversations(next);
      });
    },
    []
  );

  React.useEffect(() => {
    let cancelled = false;

    async function loadEscalations() {
      try {
        setIsLoading(true);
        const response = await fetchEscalatedConversations();
        if (cancelled) return;
        const normalized = response.map(normalizeConversation);
        setConversations(sortConversations(normalized));
        setActiveConversationId((prev) => prev ?? normalized[0]?.id);
      } catch (error) {
        console.error("Failed to load escalated conversations", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadEscalations();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const dispose = openHelpdeskSocket((event: HelpdeskSocketEvent) => {
      switch (event.type) {
        case "helpdesk.conversation_escalated": {
          upsertConversation(normalizeConversation(event.conversation));
          setActiveConversationId((prev) => prev ?? event.conversation.id);
          return;
        }
        case "helpdesk.conversation_claimed": {
          updateConversationMetadata(event.conversationId, {
            agentName: event.agentName,
            agentJoinedAt: event.agentJoinedAt,
            status: "waiting",
          });
          return;
        }
        case "helpdesk.message_created": {
          appendMessageToConversation(event.conversationId, event.message);
          return;
        }
        case "helpdesk.conversation_resolved": {
          updateConversationMetadata(event.conversationId, {
            isResolved: true,
            resolvedAt: event.resolvedAt,
            resolvedBy: event.resolvedBy,
            status: "resolved",
          });
          return;
        }
        default:
          return;
      }
    });

    return () => {
      dispose();
    };
  }, [
    appendMessageToConversation,
    upsertConversation,
    updateConversationMetadata,
  ]);

  const handleJoinConversation = React.useCallback(
    async (conversationId: string) => {
      try {
        setJoiningConversationId(conversationId);
        const updated = await claimConversation(conversationId, AGENT_NAME);
        updateConversationMetadata(conversationId, {
          agentName: updated.agentName ?? AGENT_NAME,
          agentJoinedAt: updated.agentJoinedAt ?? new Date().toISOString(),
          status: "waiting",
        });
      } catch (error) {
        console.error("Failed to claim conversation", error);
      } finally {
        setJoiningConversationId(null);
      }
    },
    [updateConversationMetadata]
  );

  const handleDraftChange = React.useCallback(
    (conversationId: string, value: string) => {
      setDrafts((prev) => ({ ...prev, [conversationId]: value }));
    },
    []
  );

  const handleSendAgentMessage = React.useCallback(
    async (conversationId: string, body: string) => {
      try {
        setSendingConversationId(conversationId);
        const message = await sendAgentMessage(
          conversationId,
          AGENT_NAME,
          body
        );
        appendMessageToConversation(conversationId, message);
        setDrafts((prev) => ({ ...prev, [conversationId]: "" }));
      } catch (error) {
        console.error("Failed to send agent message", error);
      } finally {
        setSendingConversationId((current) =>
          current === conversationId ? null : current
        );
      }
    },
    []
  );

  /**
   * Marks a conversation as resolved via the API so every client instantly
   * locks the UI. Errors are logged but left unobtrusive for MVP.
   */
  const handleResolveConversation = React.useCallback(
    async (conversationId: string) => {
      try {
        setResolvingConversationId(conversationId);
        await resolveConversation(conversationId, AGENT_NAME);
      } catch (error) {
        console.error("Failed to resolve conversation", error);
      } finally {
        setResolvingConversationId((current) =>
          current === conversationId ? null : current
        );
      }
    },
    []
  );

  const selectedConversation = React.useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId
      ),
    [activeConversationId, conversations]
  );

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-2xl">
      <ResizablePanel
        defaultSize={28}
        minSize={22}
        className="min-w-[280px] border-border/80 border-r bg-card"
      >
        <ConversationsPanel
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
          isLoading={isLoading}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel className="min-w-0 bg-background">
        <ConversationDetailPanel
          conversation={selectedConversation}
          currentAgentName={AGENT_NAME}
          onJoinConversation={handleJoinConversation}
          joiningConversationId={joiningConversationId}
          draft={selectedConversation ? drafts[selectedConversation.id] : ""}
          onDraftChange={handleDraftChange}
          onSendMessage={handleSendAgentMessage}
          sendingConversationId={sendingConversationId}
          onResolveConversation={handleResolveConversation}
          resolvingConversationId={resolvingConversationId}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function normalizeConversation(
  conversation: HelpdeskConversation
): ConversationRecord {
  const lastMessage = conversation.messages.at(-1);
  const isResolved = conversation.isResolved;
  const status: ConversationRecord["status"] = isResolved
    ? "resolved"
    : conversation.agentName
      ? "waiting"
      : "open";

  return {
    id: conversation.id,
    customerName: conversation.title || "Site visitor",
    subject:
      conversation.escalatedReason ||
      `Escalated conversation ${conversation.id.slice(0, 8)}`,
    lastMessageSnippet: lastMessage?.content || "Awaiting context",
    updatedAt: conversation.updatedAt,
    status,
    messages: conversation.messages.map(mapMessageToRecord),
    escalatedReason: conversation.escalatedReason,
    agentName: conversation.agentName,
    agentJoinedAt: conversation.agentJoinedAt,
    escalatedAt: conversation.escalatedAt,
    isResolved,
    resolvedAt: conversation.resolvedAt,
    resolvedBy: conversation.resolvedBy,
  };
}

function mapMessageToRecord(message: Message): ConversationMessage {
  const sender = ROLE_TO_SENDER[message.role] || "system";

  return {
    id: message.id,
    sender,
    body: message.content,
    timestamp: message.createdAt,
  };
}
