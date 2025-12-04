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
import { ConversationPanel } from "@/components/conversations/Conversation";
import { ConversationsPanel } from "@/components/conversations/ConversationsPanel";
import type {
  ConversationMessage,
  ConversationRecord,
} from "@/components/conversations/types";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  claimConversation,
  fetchEscalatedConversations,
  openHelpdeskSocket,
  sendAgentMessage,
  sendAgentTypingIndicator,
  resolveConversation,
} from "@/lib/api";

interface ConversationsContentProps {
  user: {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
    role?: string | null;
  };
}

const DEFAULT_AGENT_NAME = "Agent";
const CUSTOMER_TYPING_RESET_MS = 4500;
const AGENT_TYPING_RESET_MS = 3200;

const ROLE_TO_SENDER: Record<Message["role"], ConversationMessage["sender"]> = {
  user: "customer",
  assistant: "assistant",
  system: "system",
  human_agent: "human_agent",
};

export const CONVERSATIONS_SHOW_LIST_EVENT = "conversations:showList";
export const CONVERSATIONS_DETAIL_VISIBILITY_EVENT =
  "conversations:detailVisibility";

const sortConversations = (items: ConversationRecord[]) =>
  [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

export function ConversationsContent({ user }: ConversationsContentProps) {
  const isMobile = useIsMobile();
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
  const [isMobileDetailVisible, setIsMobileDetailVisible] =
    React.useState(false);
  const customerTypingResetTimers = React.useRef<Record<string, number>>({});
  const agentTypingDispatchTimers = React.useRef<Record<string, number>>({});
  const agentTypingResetTimers = React.useRef<Record<string, number>>({});
  const agentTypingState = React.useRef<Record<string, boolean>>({});
  const agentName = user?.name ?? DEFAULT_AGENT_NAME;

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

        const existingConversation = next[index];
        if (!existingConversation) return prev;

        if (
          existingConversation.messages.some(
            (msg) => msg.id === mappedMessage.id
          )
        ) {
          return prev;
        }

        next[index] = {
          ...existingConversation,
          messages: [...existingConversation.messages, mappedMessage],
          lastMessageSnippet: mappedMessage.body,
          updatedAt: mappedMessage.timestamp,
        };

        return sortConversations(next);
      });
    },
    []
  );

  React.useEffect(() => {
    const customerTimers = customerTypingResetTimers.current;
    const agentDispatchTimers = agentTypingDispatchTimers.current;
    const agentResetTimers = agentTypingResetTimers.current;

    return () => {
      Object.values(customerTimers).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      Object.values(agentDispatchTimers).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      Object.values(agentResetTimers).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
    };
  }, []);

  const scheduleAgentTypingIndicator = React.useCallback(
    (conversationId: string) => {
      if (!conversationId) {
        return;
      }

      if (!agentTypingState.current[conversationId]) {
        agentTypingState.current[conversationId] = true;
        sendAgentTypingIndicator(conversationId, agentName, true).catch(
          (error) => {
            console.error("Failed to start typing indicator", error);
            agentTypingState.current[conversationId] = false;
          }
        );
      }

      if (agentTypingDispatchTimers.current[conversationId]) {
        window.clearTimeout(agentTypingDispatchTimers.current[conversationId]);
      }

      agentTypingDispatchTimers.current[conversationId] = window.setTimeout(
        () => {
          agentTypingState.current[conversationId] = false;
          sendAgentTypingIndicator(conversationId, agentName, false).catch(
            (error) => {
              console.error("Failed to stop typing indicator", error);
            }
          );
          delete agentTypingDispatchTimers.current[conversationId];
          delete agentTypingState.current[conversationId];
        },
        AGENT_TYPING_RESET_MS
      );
    },
    [agentName]
  );

  const stopAgentTypingIndicator = React.useCallback(
    (conversationId: string) => {
      if (!conversationId) {
        return;
      }

      if (agentTypingDispatchTimers.current[conversationId]) {
        window.clearTimeout(agentTypingDispatchTimers.current[conversationId]);
        delete agentTypingDispatchTimers.current[conversationId];
      }

      if (!agentTypingState.current[conversationId]) {
        return;
      }

      agentTypingState.current[conversationId] = false;
      delete agentTypingState.current[conversationId];
      sendAgentTypingIndicator(conversationId, agentName, false).catch(
        (error) => {
          console.error("Failed to stop typing indicator", error);
        }
      );
    },
    [agentName]
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
            isCustomerTyping: false,
            isAgentTyping: false,
          });
          if (customerTypingResetTimers.current[event.conversationId]) {
            window.clearTimeout(
              customerTypingResetTimers.current[event.conversationId]
            );
            delete customerTypingResetTimers.current[event.conversationId];
          }
          if (agentTypingResetTimers.current[event.conversationId]) {
            window.clearTimeout(
              agentTypingResetTimers.current[event.conversationId]
            );
            delete agentTypingResetTimers.current[event.conversationId];
          }
          return;
        }
        case "helpdesk.typing": {
          if (event.actor === "user") {
            updateConversationMetadata(event.conversationId, {
              isCustomerTyping: event.isTyping,
            });
            if (customerTypingResetTimers.current[event.conversationId]) {
              window.clearTimeout(
                customerTypingResetTimers.current[event.conversationId]
              );
              delete customerTypingResetTimers.current[event.conversationId];
            }

            if (event.isTyping) {
              customerTypingResetTimers.current[event.conversationId] =
                window.setTimeout(() => {
                  updateConversationMetadata(event.conversationId, {
                    isCustomerTyping: false,
                  });
                  delete customerTypingResetTimers.current[
                    event.conversationId
                  ];
                }, CUSTOMER_TYPING_RESET_MS);
            }
          } else {
            updateConversationMetadata(event.conversationId, {
              isAgentTyping: event.isTyping,
            });
            if (agentTypingResetTimers.current[event.conversationId]) {
              window.clearTimeout(
                agentTypingResetTimers.current[event.conversationId]
              );
              delete agentTypingResetTimers.current[event.conversationId];
            }

            if (event.isTyping) {
              agentTypingResetTimers.current[event.conversationId] =
                window.setTimeout(() => {
                  updateConversationMetadata(event.conversationId, {
                    isAgentTyping: false,
                  });
                  delete agentTypingResetTimers.current[event.conversationId];
                }, AGENT_TYPING_RESET_MS);
            }
          }
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
        const updated = await claimConversation(conversationId, agentName);
        updateConversationMetadata(conversationId, {
          agentName: updated.agentName ?? agentName,
          agentJoinedAt: updated.agentJoinedAt ?? new Date().toISOString(),
          status: "waiting",
        });
      } catch (error) {
        console.error("Failed to claim conversation", error);
      } finally {
        setJoiningConversationId(null);
      }
    },
    [agentName, updateConversationMetadata]
  );

  const handleDraftChange = React.useCallback(
    (conversationId: string, value: string) => {
      setDrafts((prev) => ({ ...prev, [conversationId]: value }));
      if (!value.trim()) {
        stopAgentTypingIndicator(conversationId);
        return;
      }
      scheduleAgentTypingIndicator(conversationId);
    },
    [scheduleAgentTypingIndicator, stopAgentTypingIndicator]
  );

  const handleSendAgentMessage = React.useCallback(
    async (conversationId: string, body: string) => {
      try {
        setSendingConversationId(conversationId);
        const message = await sendAgentMessage(conversationId, agentName, body);
        appendMessageToConversation(conversationId, message);
        setDrafts((prev) => ({ ...prev, [conversationId]: "" }));
        stopAgentTypingIndicator(conversationId);
      } catch (error) {
        console.error("Failed to send agent message", error);
      } finally {
        setSendingConversationId((current) =>
          current === conversationId ? null : current
        );
      }
    },
    [agentName, appendMessageToConversation, stopAgentTypingIndicator]
  );

  const handleResolveConversation = React.useCallback(
    async (conversationId: string) => {
      try {
        setResolvingConversationId(conversationId);
        await resolveConversation(conversationId, agentName);
        stopAgentTypingIndicator(conversationId);
      } catch (error) {
        console.error("Failed to resolve conversation", error);
      } finally {
        setResolvingConversationId((current) =>
          current === conversationId ? null : current
        );
      }
    },
    [agentName, stopAgentTypingIndicator]
  );

  const selectedConversation = React.useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === activeConversationId
      ),
    [activeConversationId, conversations]
  );

  React.useEffect(() => {
    if (!isMobile) {
      setIsMobileDetailVisible(false);
      return;
    }
    if (!selectedConversation) {
      setIsMobileDetailVisible(false);
    }
  }, [isMobile, selectedConversation]);

  React.useEffect(() => {
    const handler = () => {
      setIsMobileDetailVisible(false);
    };

    if (typeof window !== "undefined") {
      window.addEventListener(
        CONVERSATIONS_SHOW_LIST_EVENT,
        handler as EventListener
      );
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          CONVERSATIONS_SHOW_LIST_EVENT,
          handler as EventListener
        );
      }
    };
  }, []);

  React.useEffect(() => {
    if (isMobile) {
      return;
    }
    setActiveConversationId((current) => {
      if (
        current &&
        conversations.some((conversation) => conversation.id === current)
      ) {
        return current;
      }
      return conversations[0]?.id;
    });
  }, [isMobile, conversations]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(CONVERSATIONS_DETAIL_VISIBILITY_EVENT, {
        detail: {
          isDetailVisible: Boolean(
            isMobile && isMobileDetailVisible && selectedConversation
          ),
        },
      })
    );
  }, [isMobile, isMobileDetailVisible, selectedConversation]);

  const handleSelectConversation = React.useCallback(
    (conversationId: string) => {
      setActiveConversationId(conversationId);
      if (isMobile) {
        setIsMobileDetailVisible(true);
      }
    },
    [isMobile]
  );

  if (isMobile) {
    return (
      <div className="h-full rounded-2xl bg-background">
        {isMobileDetailVisible && selectedConversation ? (
          <ConversationPanel
            conversation={selectedConversation}
            currentAgentName={agentName}
            onJoinConversation={handleJoinConversation}
            joiningConversationId={joiningConversationId}
            draft={selectedConversation ? drafts[selectedConversation.id] : ""}
            onDraftChange={handleDraftChange}
            onSendMessage={handleSendAgentMessage}
            sendingConversationId={sendingConversationId}
            onResolveConversation={handleResolveConversation}
            resolvingConversationId={resolvingConversationId}
          />
        ) : (
          <ConversationsPanel
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            isLoading={isLoading}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-full rounded-2xl">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel
          defaultSize={28}
          minSize={15}
          className="min-w-[280px] border-border/80 border-r bg-card"
        >
          <ConversationsPanel
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            isLoading={isLoading}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={72} className="min-w-0 bg-background">
          <ConversationPanel
            conversation={selectedConversation}
            currentAgentName={agentName}
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
    </div>
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
    isCustomerTyping: false,
    isAgentTyping: false,
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
