import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import { ApiClient, apiClient } from "../lib/api-client";
import type { Message, Source } from "../types/api";
import { cn } from "../lib/utils";

/**
 * TODO:
 *
 * - Set title config
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
        "tw:fixed tw:bottom-5 tw:right-5 tw:z-50",
        "tw:w-14 tw:h-14 tw:rounded-full",
        "tw:bg-indigo-600 hover:tw:bg-indigo-700",
        "tw:text-white tw:border-0 tw:cursor-pointer",
        "tw:shadow-lg hover:tw:shadow-xl",
        "tw:transition-all tw:duration-200",
        "tw:flex tw:items-center tw:justify-center",
        className
      )}
      aria-label="Open chat"
    >
      <Icon icon="tabler:message-chatbot" width={28} height={28} />
    </button>
  );
}

function ChatBoxHeader({
  title = "Chat Assist",
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
  return (
    <div
      className={cn(
        "tw:bg-white tw:text-black tw:px-5 tw:py-4",
        "tw:border-b tw:border-gray-300",
        "tw:flex tw:items-center tw:justify-between",
        className
      )}
    >
      <p className="tw:m-0 tw:text-md tw:font-normal">{title}</p>
      <div className="tw:flex tw:items-center tw:gap-2">
        <button
          className="tw:p-1 tw:bg-transparent tw:border-0 tw:cursor-pointer tw:text-gray-600 hover:tw:text-gray-900 tw:transition-colors"
          aria-label="Options"
        >
          <Icon icon="mi:options-vertical" width={20} height={20} />
        </button>
        <button
          onClick={onExpandClick}
          className="tw:p-1 tw:bg-transparent tw:border-0 tw:cursor-pointer tw:text-gray-600 hover:tw:text-gray-900 tw:transition-colors"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <Icon
            icon={
              isExpanded
                ? "mingcute:fullscreen-exit-line"
                : "mingcute:fullscreen-2-line"
            }
            width={20}
            height={20}
          />
        </button>
        <button
          onClick={onCloseClick}
          className="tw:p-1 tw:bg-transparent tw:border-0 tw:cursor-pointer tw:text-gray-600 hover:tw:text-gray-900 tw:transition-colors"
          aria-label="Close"
        >
          <Icon icon="mingcute:close-line" width={20} height={20} />
        </button>
      </div>
    </div>
  );
}

function ChatBoxMessage({
  message,
  className,
}: {
  message: Message;
  className?: string;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "tw:flex tw:flex-col tw:max-w-[80%]",
        isUser ? "tw:self-end" : "tw:self-start",
        className
      )}
    >
      <div
        className={cn(
          "tw:px-4 tw:py-3 tw:rounded-xl tw:wrap-break-word tw:leading-relaxed",
          isUser
            ? "tw:bg-linear-to-br tw:from-indigo-500 tw:to-purple-600 tw:text-white tw:rounded-br-sm"
            : "tw:bg-white tw:text-gray-800 tw:border tw:border-gray-300 tw:rounded-bl-sm"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function ChatBoxMessageLoading({
  content,
  className,
}: {
  content?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "tw:flex tw:flex-col tw:max-w-[80%] tw:self-start",
        className
      )}
    >
      <div className="tw:px-4 tw:py-3 tw:rounded-xl tw:wrap-break-word tw:leading-relaxed tw:bg-white tw:text-gray-800 tw:border tw:border-gray-300 tw:rounded-bl-sm">
        {content ? (
          content
        ) : (
          <span className="tw:inline-block tw:w-0.5 tw:h-5 tw:bg-indigo-600 tw:animate-blink"></span>
        )}
      </div>
      {content && (
        <div className="tw:flex tw:gap-1 tw:pt-2 tw:pl-4">
          <span className="tw:w-2 tw:h-2 tw:rounded-full tw:bg-gray-400 tw:animate-typing"></span>
          <span className="tw:w-2 tw:h-2 tw:rounded-full tw:bg-gray-400 tw:animate-typing [animation-delay:0.2s]"></span>
          <span className="tw:w-2 tw:h-2 tw:rounded-full tw:bg-gray-400 tw:animate-typing [animation-delay:0.4s]"></span>
        </div>
      )}
    </div>
  );
}

function ChatBoxSources({
  sources,
  className,
}: {
  sources: Source[];
  className?: string;
}) {
  if (sources.length === 0) return null;

  return (
    <div
      className={cn(
        "tw:p-3 tw:bg-amber-50 tw:border tw:border-amber-400 tw:rounded-lg tw:text-sm tw:mt-2",
        className
      )}
    >
      <div className="tw:font-semibold tw:mb-2 tw:text-amber-800">Sources:</div>
      {sources.map((source, idx) => (
        <div key={source.id} className="tw:py-1 tw:text-amber-800">
          <strong>Source {idx + 1}:</strong> {source.filename} (Relevance:{" "}
          {(source.similarity * 100).toFixed(1)}%)
        </div>
      ))}
    </div>
  );
}

function ChatBoxError({
  error,
  className,
}: {
  error?: string | null;
  className?: string;
}) {
  if (!error) return null;

  return (
    <div
      className={cn(
        "tw:p-3 tw:bg-red-50 tw:border tw:border-red-300 tw:rounded-lg tw:text-red-800 tw:text-sm",
        className
      )}
    >
      {error}
    </div>
  );
}

function ChatBoxInput({
  value,
  onChange,
  onKeyDown,
  onSend,
  disabled,
  className,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "tw:flex tw:gap-3 tw:p-4 tw:bg-white tw:border-t tw:border-gray-300",
        className
      )}
    >
      <textarea
        className="tw:flex-1 tw:p-3 tw:border tw:border-gray-300 tw:rounded-lg tw:text-sm tw:resize-none tw:outline-none tw:transition-colors focus:tw:border-indigo-500 disabled:tw:bg-gray-100 disabled:tw:cursor-not-allowed"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Type your message..."
        disabled={disabled}
        rows={2}
      />
      <button
        className="tw:px-6 tw:py-3 tw:bg-linear-to-br tw:from-indigo-500 tw:to-purple-600 tw:text-white tw:border-0 tw:rounded-lg tw:font-semibold tw:cursor-pointer tw:transition-opacity tw:whitespace-nowrap hover:tw:opacity-90 disabled:tw:opacity-50 disabled:tw:cursor-not-allowed"
        onClick={onSend}
        disabled={!value.trim() || disabled}
      >
        {disabled ? "Sending..." : "Send"}
      </button>
    </div>
  );
}

function ChatBoxMessages({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "tw:flex-1 tw:overflow-y-auto tw:px-5 tw:py-5 tw:flex tw:flex-col tw:gap-4 tw:bg-gray-50",
        className
      )}
    >
      {children}
    </div>
  );
}

function ChatBoxContainer({
  children,
  isExpanded,
  className,
}: {
  children: React.ReactNode;
  isExpanded?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "tw:flex tw:flex-col tw:w-full tw:border tw:border-gray-300 tw:rounded-xl tw:bg-white tw:shadow-lg tw:overflow-hidden tw:transition-all tw:duration-300",
        "tw:fixed tw:bottom-5 tw:right-5 tw:z-50",
        "tw:animate-slideUp",
        isExpanded
          ? "tw:h-[95vh] tw:max-w-[45vw] tw:min-w-[300px]"
          : "tw:h-[550px] tw:max-w-[400px]",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface ChatWidgetProps {
  apiUrl?: string;
  conversationId?: string;
  onConversationCreate?: (conversationId: string) => void;
}

export function ChatWidget({
  apiUrl,
  conversationId: initialConversationId,
  onConversationCreate,
}: ChatWidgetProps) {
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize API client with custom URL if provided
  const client = useMemo(
    () => (apiUrl ? new ApiClient(apiUrl) : apiClient),
    [apiUrl]
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

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setIsStreaming(true);
    setStreamingContent("");
    setSources([]);

    // Add user message optimistically
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: conversationId,
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      let fullResponse = "";

      for await (const event of client.streamMessage(conversationId, {
        message: userMessage,
        useRAG: true,
      })) {
        if (event.type === "token" && event.content) {
          fullResponse += event.content;
          setStreamingContent(fullResponse);
        } else if (event.type === "done") {
          // Add assistant message
          const assistantMsg: Message = {
            id: `temp-${Date.now()}`,
            conversationId: conversationId,
            role: "assistant",
            content: fullResponse,
            createdAt: new Date().toISOString(),
          };

          // Update all states together - React will batch these
          setIsStreaming(false);
          setStreamingContent("");
          setMessages((prev) => [...prev, assistantMsg]);

          // Store sources
          if (event.sources) {
            setSources(event.sources);
          }
        } else if (event.type === "error") {
          setError(event.message || "An error occurred");
          setIsStreaming(false);
        }
      }
    } catch (err) {
      setError("Failed to send message");
      console.error(err);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
        <div className="tw:flex tw:items-center tw:justify-center tw:h-full tw:text-gray-600 tw:text-base">
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
        {messages.map((message) => (
          <ChatBoxMessage key={message.id} message={message} />
        ))}

        {isStreaming && (
          <ChatBoxMessageLoading content={streamingContent || undefined} />
        )}

        <ChatBoxSources sources={sources} />

        <ChatBoxError error={error} />

        <div ref={messagesEndRef} />
      </ChatBoxMessages>

      <ChatBoxInput
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onSend={sendMessage}
        disabled={isStreaming}
      />
    </ChatBoxContainer>
  );
}
