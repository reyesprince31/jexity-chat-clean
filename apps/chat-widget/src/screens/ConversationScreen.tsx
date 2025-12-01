import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "preact/hooks";
import type { JSX } from "preact";
import { ApiClient, apiClient } from "../lib/api-client";
import type { Message, MessageWithSources, StreamEvent } from "../types/api";
import "../styles.css";
import { HomeScreen } from "./HomeScreen";
import {
  ChatBoxAgentBanner,
  ChatBoxContainer,
  ChatBoxError,
  ChatBoxEscalationBanner,
  ChatBoxHeader,
  ChatBoxInput,
  ChatBoxMessageAgent,
  ChatBoxMessageLoading,
  ChatBoxMessages,
  ChatBoxMessageUser,
  ChatBoxResolvedBanner,
  ChatBoxTrigger,
  ChatBoxTypingIndicator,
  ChatWidgetProps,
  EscalationState,
  extractEscalationState,
  MAX_MESSAGE_LENGTH,
} from "../components/ChatBox";

/**
 * Entry component that wires together API calls, window chrome, and chat state.
 */
export function ChatWidget({
  apiUrl,
  conversationId: initialConversationId,
  onConversationCreate,
  // Note: theme prop exists in ChatWidgetProps but is applied at the Shadow DOM level in main.tsx
}: ChatWidgetProps) {
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [messages, setMessages] = useState<MessageWithSources[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingRetryMessage, setPendingRetryMessage] = useState<string | null>(
    null
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isOnHomeScreen, setIsOnHomeScreen] = useState(true);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [escalationState, setEscalationState] = useState<EscalationState>({
    isEscalated: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const agentTypingTimeoutRef = useRef<number | undefined>(undefined);
  const userTypingTimeoutRef = useRef<number | undefined>(undefined);
  const userTypingStateRef = useRef(false);
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (agentTypingTimeoutRef.current) {
        window.clearTimeout(agentTypingTimeoutRef.current);
      }
      if (userTypingTimeoutRef.current) {
        window.clearTimeout(userTypingTimeoutRef.current);
      }
    };
  }, []);

  // Initialize API client with custom URL if provided
  const client = useMemo(
    () => (apiUrl ? new ApiClient(apiUrl) : apiClient),
    [apiUrl]
  );

  /**
   * Locks the widget once the backend signals that a human agent resolved the
   * chat. Keeps the transcript but prevents further input.
   */
  const handleResolution = useCallback(
    (payload: { resolvedAt: string; resolvedBy?: string | null }) => {
      setEscalationState((prev) => ({
        ...prev,
        isEscalated: true,
        isResolved: true,
        resolvedAt: payload.resolvedAt,
        resolvedBy:
          payload.resolvedBy ?? prev.resolvedBy ?? prev.agentName ?? null,
      }));
      setInput("");
      setStreamingContent("");
      setIsStreaming(false);
      setError(
        "This conversation was resolved by our team. Start a new chat if you need more help."
      );
    },
    []
  );

  const emitUserTypingState = useCallback(
    (nextState: boolean) => {
      if (
        !conversationId ||
        !escalationState.isEscalated ||
        escalationState.isResolved
      ) {
        return;
      }

      if (userTypingStateRef.current === nextState) {
        return;
      }

      userTypingStateRef.current = nextState;
      client.sendTypingIndicator(conversationId, nextState).catch((error) => {
        console.error("Failed to send typing indicator", error);
      });
    },
    [
      client,
      conversationId,
      escalationState.isEscalated,
      escalationState.isResolved,
    ]
  );

  const scheduleUserTypingReset = useCallback(() => {
    if (
      !conversationId ||
      !escalationState.isEscalated ||
      escalationState.isResolved
    ) {
      return;
    }

    emitUserTypingState(true);
    if (userTypingTimeoutRef.current) {
      window.clearTimeout(userTypingTimeoutRef.current);
    }
    userTypingTimeoutRef.current = window.setTimeout(() => {
      emitUserTypingState(false);
    }, 3000);
  }, [
    conversationId,
    escalationState.isEscalated,
    escalationState.isResolved,
    emitUserTypingState,
  ]);

  // Instant scroll to bottom when chat is opened
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [isOpen]);

  // Smooth scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && (messages.length > 0 || streamingContent)) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent, isOpen]);

  const createConversation = useCallback(async () => {
    try {
      const response = await client.createConversation();
      const newConversationId = response.conversation.id;
      setConversationId(newConversationId);
      setEscalationState(extractEscalationState(response.conversation));
      onConversationCreate?.(newConversationId);
      return newConversationId;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, [client, onConversationCreate]);

  useEffect(() => {
    userTypingStateRef.current = false;
    if (userTypingTimeoutRef.current) {
      window.clearTimeout(userTypingTimeoutRef.current);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!escalationState.isEscalated || escalationState.isResolved) {
      userTypingStateRef.current = false;
      if (userTypingTimeoutRef.current) {
        window.clearTimeout(userTypingTimeoutRef.current);
      }
    }
  }, [escalationState.isEscalated, escalationState.isResolved]);

  useEffect(() => {
    if (!escalationState.isEscalated || escalationState.isResolved) {
      setIsAgentTyping(false);
      if (agentTypingTimeoutRef.current) {
        window.clearTimeout(agentTypingTimeoutRef.current);
      }
    }
  }, [escalationState.isEscalated, escalationState.isResolved]);

  useEffect(() => {
    if (!conversationId) {
      return undefined;
    }

    const unsubscribe = client.subscribeToConversationEvents(
      conversationId,
      (event: StreamEvent) => {
        if (event.type === "agent_joined") {
          setEscalationState((prev) => ({
            ...prev,
            agentName: event.agentName,
            agentJoinedAt: event.joinedAt,
            isEscalated: true,
          }));
          return;
        }

        if (event.type === "agent_message") {
          setMessages((prev) => [
            ...prev,
            {
              id: event.message.id,
              conversationId: event.conversationId,
              role: event.message.role,
              content: event.message.content,
              createdAt: event.message.createdAt,
            },
          ]);
          return;
        }

        if (event.type === "typing") {
          if (event.actor === "human_agent") {
            setIsAgentTyping(event.isTyping);
            if (agentTypingTimeoutRef.current) {
              window.clearTimeout(agentTypingTimeoutRef.current);
            }
            if (event.isTyping) {
              agentTypingTimeoutRef.current = window.setTimeout(() => {
                setIsAgentTyping(false);
              }, 4000);
            }
          }
          return;
        }

        if (event.type === "resolved") {
          handleResolution({
            resolvedAt: event.resolvedAt,
            resolvedBy: event.resolvedBy,
          });
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversationId, client, handleResolution]);

  /**
   * Sends the current draft unless the transcript is already locked. Users are
   * nudged to open a new chat instead of replying to resolved threads.
   */
  const sendMessage = async (messageOverride?: string) => {
    const draft = messageOverride ?? input;
    const userMessage = draft.trim();

    if (!userMessage || isStreaming) {
      focusInput();
      return;
    }

    if (escalationState.isResolved) {
      setError(
        "This conversation has been resolved. Start a new chat to continue."
      );
      focusInput();
      return;
    }

    if (!messageOverride) {
      setInput("");
    }

    if (userTypingTimeoutRef.current) {
      window.clearTimeout(userTypingTimeoutRef.current);
    }
    emitUserTypingState(false);

    setPendingRetryMessage(null);
    setError(null);

    let optimisticMessageId: string | null = null;

    if (!messageOverride) {
      optimisticMessageId = `temp-${Date.now()}`;
      const userMsg: Message = {
        id: optimisticMessageId,
        conversationId: conversationId ?? "pending",
        role: "user",
        content: userMessage,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    let activeConversationId = conversationId;

    if (!activeConversationId) {
      try {
        activeConversationId = await createConversation();
        if (optimisticMessageId) {
          const finalizedConversationId = activeConversationId;
          setMessages((prev) =>
            prev.map((message) =>
              message.id === optimisticMessageId
                ? { ...message, conversationId: finalizedConversationId }
                : message
            )
          );
        }
      } catch (err) {
        if (optimisticMessageId) {
          const failedMessageId = optimisticMessageId;
          setMessages((prev) =>
            prev.filter((message) => message.id !== failedMessageId)
          );
        }
        setPendingRetryMessage(userMessage);
        setError("Failed to start conversation. Please try again.");
        console.error(err);
        focusInput();
        return;
      }
    }

    setIsStreaming(true);
    setStreamingContent("");
    focusInput();

    try {
      let fullResponse = "";

      for await (const event of client.streamMessage(activeConversationId, {
        message: userMessage,
        useRAG: true,
      })) {
        if (event.type === "token" && event.content) {
          console.log("[ChatWidget] Token chunk:", event.content);
          fullResponse += event.content;
          setStreamingContent(fullResponse);
        } else if (event.type === "done") {
          // Add assistant message with sources
          console.log(
            "[ChatWidget] Streaming complete. Assistant message:",
            fullResponse
          );
          const assistantMsg: MessageWithSources = {
            id: `temp-${Date.now()}`,
            conversationId: activeConversationId,
            role: "assistant",
            content: fullResponse,
            createdAt: new Date().toISOString(),
            sources: event.sources || [],
          };

          // Update all states together - Preact batches state updates during event loops
          setIsStreaming(false);
          setStreamingContent("");
          setMessages((prev) => [...prev, assistantMsg]);
        } else if (event.type === "escalated") {
          setEscalationState((prev) => ({
            ...prev,
            isEscalated: true,
            reason: event.reason,
            escalatedAt: event.escalatedAt,
          }));
          setIsStreaming(false);
          setStreamingContent("");
          break;
        } else if (event.type === "resolved") {
          handleResolution({
            resolvedAt: event.resolvedAt,
            resolvedBy: event.resolvedBy,
          });
          break;
        } else if (event.type === "error") {
          setError(
            event.message || "Failed to send message. Please try again."
          );
          setPendingRetryMessage(userMessage);
          setStreamingContent("");
          setIsStreaming(false);
          break;
        }
      }
    } catch (err) {
      setPendingRetryMessage(userMessage);
      setStreamingContent("");
      setError("Failed to send message. Please try again.");
      console.error(err);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleInputChange = (
    e: JSX.TargetedEvent<HTMLTextAreaElement, Event>
  ) => {
    const nextValue = e.currentTarget.value;
    const safeValue =
      nextValue.length > MAX_MESSAGE_LENGTH
        ? nextValue.slice(0, MAX_MESSAGE_LENGTH)
        : nextValue;
    setInput(safeValue);
    if (pendingRetryMessage) {
      setPendingRetryMessage(null);
    }
    scheduleUserTypingReset();
  };

  const handleKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleStartConversation = useCallback(() => {
    setIsOnHomeScreen(false);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        focusInput();
      });
    } else {
      focusInput();
    }
  }, [focusInput]);

  const handleBackToHome = useCallback(() => {
    setIsOnHomeScreen(true);
  }, []);

  // Show trigger button when chat is closed
  if (!isOpen) {
    return <ChatBoxTrigger onClick={() => setIsOpen(true)} />;
  }

  if (isOnHomeScreen) {
    return (
      <ChatBoxContainer isExpanded={isExpanded}>
        <HomeScreen
          onStart={handleStartConversation}
          onClose={() => setIsOpen(false)}
        />
      </ChatBoxContainer>
    );
  }

  // Show full chat widget
  return (
    <ChatBoxContainer isExpanded={isExpanded}>
      <ChatBoxHeader
        isExpanded={isExpanded}
        onExpandClick={() => setIsExpanded(!isExpanded)}
        onCloseClick={() => setIsOpen(false)}
        onBackClick={handleBackToHome}
      />

      <ChatBoxMessages>
        {messages.map((message) =>
          message.role === "user" ? (
            <ChatBoxMessageUser key={message.id} content={message.content} />
          ) : (
            <ChatBoxMessageAgent
              key={message.id}
              content={message.content}
              sources={message.sources}
            />
          )
        )}

        {isStreaming && (
          <ChatBoxMessageLoading
            content={streamingContent || undefined}
            isEscalated={escalationState.isEscalated}
          />
        )}
        <ChatBoxError
          error={error}
          onRetry={
            pendingRetryMessage
              ? () => {
                  void sendMessage(pendingRetryMessage);
                }
              : null
          }
        />
        {isAgentTyping && !escalationState.isResolved && (
          <ChatBoxTypingIndicator
            label={`${
              escalationState.agentName?.trim() || "Agent"
            } is typing...`}
          />
        )}

        <div ref={messagesEndRef} />
      </ChatBoxMessages>

      {escalationState.isEscalated && (
        <ChatBoxEscalationBanner reason={escalationState.reason} />
      )}
      {escalationState.agentName && (
        <ChatBoxAgentBanner agentName={escalationState.agentName} />
      )}
      {escalationState.isResolved && (
        <ChatBoxResolvedBanner
          resolvedBy={escalationState.resolvedBy}
          resolvedAt={escalationState.resolvedAt}
        />
      )}

      <ChatBoxInput
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onSend={() => {
          void sendMessage();
        }}
        disabled={escalationState.isResolved}
        isSendDisabled={isStreaming || escalationState.isResolved}
        textareaRef={inputRef}
        maxLength={MAX_MESSAGE_LENGTH}
      />
    </ChatBoxContainer>
  );
}
