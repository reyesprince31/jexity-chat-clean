import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "preact/hooks";
import type {
  ComponentChildren,
  FunctionalComponent,
  JSX,
  Ref,
} from "preact";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ApiClient, apiClient } from "../lib/api-client";
import type {
  Conversation,
  Message,
  MessageWithSources,
  Source,
  StreamEvent,
} from "../types/api";
import type { ChatWidgetTheme } from "../types/theme";
import { cn } from "../lib/utils";
import { Content } from "./Content";
import { JexityLogo } from "./JexityLogo";
import "../styles.css";
import type { IconProps } from "./icons/types";
import { ChatbotIcon } from "./icons/ChatbotIcon";
import { OptionsVerticalIcon } from "./icons/OptionsVerticalIcon";
import { ExpandIcon } from "./icons/ExpandIcon";
import { CollapseIcon } from "./icons/CollapseIcon";
import { CloseIcon } from "./icons/CloseIcon";
import { ArrowUpIcon } from "./icons/ArrowUpIcon";

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Floating button that summons the chat widget when it is closed.
 */
function ChatBoxTrigger({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-5 right-5 z-50",
        "w-14 h-14 rounded-full",
        "bg-black hover:bg-slate-900",
        "text-white border-0 cursor-pointer",
        "shadow-lg hover:shadow-xl",
        "flex items-center justify-center",
        className
      )}
      aria-label="Open chat"
    >
      <ChatbotIcon size={28} />
    </button>
  );
}

/**
 * Helper type for header menu icon components.
 */
type HeaderMenuOptionIcon = FunctionalComponent<IconProps>;

/**
 * Configuration for an action inside the chat header popover menu.
 */
interface HeaderMenuOption {
  id: string;
  label: string;
  icon: HeaderMenuOptionIcon;
  onClick: () => void;
}

/**
 * Popover-based menu that surfaces contextual actions for the chat header.
 */
function ChatBoxHeaderMenu({ options }: { options: HeaderMenuOption[] }) {
  const [open, setOpen] = useState(false);

  const handleOptionClick = (onClickHandler: () => void) => {
    onClickHandler();
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 disabled:pointer-events-none disabled:opacity-50 h-9 w-9 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Options"
        >
          <OptionsVerticalIcon size={20} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content
        align="end"
        className="z-50 w-48 rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
      >
        <div className="flex flex-col">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.onClick)}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 hover:text-gray-900 transition-colors justify-start"
            >
              <option.icon size={16} className="mr-2" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}

/**
 * Renders the assistant identity row with controls for expanding or closing the widget.
 */
function ChatBoxHeader({
  title = "Jexity Chat Assistant",
  isExpanded,
  onExpandClick,
  onCloseClick,
  className,
}: {
  title?: string;
  isExpanded?: boolean;
  onExpandClick?: () => void;
  onCloseClick?: () => void;
  className?: string;
}) {
  const menuOptions: HeaderMenuOption[] = [
    {
      id: "expand",
      label: isExpanded ? "Collapse" : "Expand",
      icon: isExpanded ? CollapseIcon : ExpandIcon,
      onClick: onExpandClick || (() => {}),
    },
  ];

  return (
    <div
      className={cn(
        "bg-white text-black px-5 py-3",
        "border-b border-gray-200",
        "flex items-center justify-between",
        className
      )}
    >
      <div className="flex items-center">
        <JexityLogo className="mr-1" />
        <p className="m-0 text-md font-medium">{title}</p>
      </div>
      <div className="flex items-center gap-1">
        <ChatBoxHeaderMenu options={menuOptions} />

        <button
          onClick={onCloseClick}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 disabled:pointer-events-none disabled:opacity-50 h-9 w-9 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Close"
        >
          <CloseIcon size={20} />
        </button>
      </div>
    </div>
  );
}

/**
 * Formats outbound user messages with right alignment and theme colors.
 */
function ChatBoxMessageUser({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col max-w-[80%] self-end", className)}>
      <div className="px-4 py-3 rounded-[20px] wrap-break-word leading-relaxed text-(--jexity-assistant-text-chat-message-user) rounded-br-md text-sm bg-(--jexity-assistant-bg-chat-message-user) hover:opacity-90 transition-opacity">
        {content}
      </div>
    </div>
  );
}

/**
 * Assistant bubble that renders branding plus either markdown content or custom children.
 */
function ChatBoxMessageAgent({
  content,
  sources = [],
  children,
  footer,
  className,
  hideIncompleteCitations = false,
}: {
  content?: string;
  sources?: Source[];
  children?: ComponentChildren;
  footer?: ComponentChildren;
  className?: string;
  hideIncompleteCitations?: boolean;
}) {
  const bodyContent =
    children ??
    (content ? (
      <Content
        value={content}
        sources={sources}
        className="text-sm"
        hideIncompleteCitations={hideIncompleteCitations}
      />
    ) : null);

  return (
    <div className={cn("flex flex-col max-w-[80%] self-start", className)}>
      <div className="px-4 py-3 rounded-[20px] wrap-break-word leading-relaxed bg-gray-100 text-gray-900 border border-gray-200 rounded-bl-md">
        <div className="mb-2 flex items-center">
          <JexityLogo />

          <p className="inline font-medium text-sm">
            Jexity
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="8"
              height="8"
              viewBox="0 0 48 48"
              className="inline mx-1"
            >
              <path
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="4"
                d="M24 33a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z"
              />
            </svg>
            AI Agent
          </p>
        </div>
        {bodyContent}
      </div>
      {footer}
    </div>
  );
}

/**
 * Streaming placeholder that switches between a spinner and partial assistant output.
 */
function ChatBoxMessageLoading({
  content,
  className,
  isEscalated,
}: {
  content?: string;
  className?: string;
  isEscalated?: boolean;
}) {
  const hasContent = Boolean(content && content.trim().length > 0);

  if (!hasContent) {
    if (isEscalated) {
      return null;
    }

    return (
      <div
        className={cn(
          "flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gray-500",
          className
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={"thinking-spinner"}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Thinking
      </div>
    );
  }

  return (
    <ChatBoxMessageAgent
      className={className}
      content={content}
      hideIncompleteCitations
    />
  );
}

/**
 * Lightweight inline error banner shown beneath the transcript.
 */
function ChatBoxError({
  error,
  onRetry,
  className,
}: {
  error?: string | null;
  onRetry?: (() => void) | null;
  className?: string;
}) {
  if (!error) return null;

  return (
    <div
      className={cn(
        "p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 text-sm",
        className
      )}
    >
      <div>{error}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center justify-center rounded-full border border-gray-400 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-200 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Communicates that the automation handed the conversation to a human teammate.
 */
function ChatBoxEscalationBanner({
  reason,
  className,
}: {
  reason?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-4 mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900",
        className
      )}
    >
      <p className="m-0 font-semibold">Connecting you with a human agent.</p>
      <p className="m-0 mt-1 text-amber-900/90">
        {reason || "Hang tight - someone will reply shortly."}
      </p>
    </div>
  );
}

/**
 * Highlights that a named human agent has entered the conversation.
 */
function ChatBoxAgentBanner({
  agentName,
  className,
}: {
  agentName: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-4 mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900",
        className
      )}
    >
      <p className="m-0 font-semibold">{agentName} has joined the chat.</p>
    </div>
  );
}

/** Informs the user that a teammate closed the conversation. */
function ChatBoxResolvedBanner({
  resolvedBy,
  resolvedAt,
  className,
}: {
  resolvedBy?: string | null;
  resolvedAt?: string;
  className?: string;
}) {
  const displayName = resolvedBy || "our support team";
  const timestamp = resolvedAt
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(resolvedAt))
    : undefined;

  return (
    <div
      className={cn(
        "mx-4 mb-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800",
        className
      )}
    >
      <p className="m-0 font-semibold">Conversation closed by {displayName}.</p>
      {timestamp && (
        <p className="m-0 mt-1 text-gray-600">Resolved on {timestamp}.</p>
      )}
    </div>
  );
}

/**
 * Textarea plus send control used for composing user prompts.
 */
function ChatBoxInput({
  value,
  onChange,
  onKeyDown,
  onSend,
  disabled,
  isSendDisabled,
  textareaRef,
  maxLength = MAX_MESSAGE_LENGTH,
  className,
}: {
  value: string;
  onChange: (e: JSX.TargetedEvent<HTMLTextAreaElement, Event>) => void;
  onKeyDown: (e: JSX.TargetedKeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  disabled?: boolean;
  isSendDisabled?: boolean;
  textareaRef?: Ref<HTMLTextAreaElement>;
  maxLength?: number;
  className?: string;
}) {
  return (
    <div className={cn("px-4 py-3 bg-white", className)}>
      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-full pl-5 pr-2 py-2">
        <textarea
          className="flex-1 bg-transparent text-[15px] resize-none outline-none placeholder:text-gray-400 disabled:bg-transparent disabled:cursor-not-allowed max-h-24 leading-5 py-1.5"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Message..."
          disabled={disabled}
          maxLength={maxLength}
          rows={1}
          ref={textareaRef}
          style={{
            scrollbarWidth: "none",
          }}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled || isSendDisabled}
          className="shrink-0 inline-flex items-center justify-center rounded-full w-[30px] h-[30px] transition-all disabled:bg-gray-300 disabled:text-white bg-black text-white hover:bg-gray-800 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <ArrowUpIcon size={16} />
        </button>
      </div>
      <div className="mt-1 text-right text-xs text-gray-500">
        {value.length}/{maxLength}
      </div>
    </div>
  );
}

/**
 * Scrollable transcript area that stacks chat bubbles.
 */
function ChatBoxMessages({
  children,
  className,
}: {
  children: ComponentChildren;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 bg-white",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Outer shell that controls the widget’s floating positioning and sizing.
 */
function ChatBoxContainer({
  children,
  isExpanded,
  className,
}: {
  children: ComponentChildren;
  isExpanded?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col w-full border border-gray-200 rounded-2xl bg-white shadow-lg overflow-hidden transition-all duration-300",
        "fixed bottom-5 right-5 z-50",
        "animate-slideUp",
        isExpanded
          ? "h-[95vh] max-w-[45vw] min-w-[300px]"
          : "h-[75vh] max-w-[400px]",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Public configuration options for embedding the chat widget.
 */
export interface ChatWidgetProps {
  apiUrl?: string;
  conversationId?: string;
  onConversationCreate?: (conversationId: string) => void;
  theme?: ChatWidgetTheme;
}

interface EscalationState {
  isEscalated: boolean;
  reason?: string;
  escalatedAt?: string;
  agentName?: string;
  agentJoinedAt?: string;
  isResolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string | null;
}

/**
 * Normalizes conversation metadata from the API into a widget-friendly structure.
 */
function extractEscalationState(
  conversation?: Conversation | null
): EscalationState {
  if (!conversation) {
    return { isEscalated: false };
  }

  return {
    isEscalated: conversation.isEscalated,
    reason: conversation.escalatedReason ?? undefined,
    escalatedAt: conversation.escalatedAt ?? undefined,
    agentName: conversation.agentName ?? undefined,
    agentJoinedAt: conversation.agentJoinedAt ?? undefined,
    isResolved: conversation.isResolved,
    resolvedAt: conversation.resolvedAt ?? undefined,
    resolvedBy: conversation.resolvedBy ?? undefined,
  };
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingRetryMessage, setPendingRetryMessage] = useState<string | null>(
    null
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [escalationState, setEscalationState] = useState<EscalationState>({
    isEscalated: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
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
      setIsLoading(true);
      const response = await client.createConversation();
      setConversationId(response.conversation.id);
      setEscalationState(extractEscalationState(response.conversation));
      onConversationCreate?.(response.conversation.id);
    } catch (err) {
      setError("Failed to create conversation");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [client, onConversationCreate]);

  // Create conversation on mount if none provided
  useEffect(() => {
    if (!conversationId) {
      createConversation();
    }
  }, [conversationId, createConversation]);

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

    if (!userMessage || !conversationId || isStreaming) {
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

    setPendingRetryMessage(null);
    setError(null);
    setIsStreaming(true);
    setStreamingContent("");
    focusInput();

    if (!messageOverride) {
      const userMsg: Message = {
        id: `temp-${Date.now()}`,
        conversationId: conversationId,
        role: "user",
        content: userMessage,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    try {
      let fullResponse = "";

      for await (const event of client.streamMessage(conversationId, {
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
            conversationId: conversationId,
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
          setError(event.message || "Failed to send message. Please try again.");
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
  };

  const handleKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  // Show trigger button when chat is closed
  if (!isOpen) {
    return <ChatBoxTrigger onClick={() => setIsOpen(true)} />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <ChatBoxContainer isExpanded={isExpanded}>
        <div className="flex items-center justify-center h-full text-gray-600 text-base">
          Initializing chat...
        </div>
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
