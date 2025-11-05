import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Icon } from "@iconify/react";
import { ApiClient, apiClient } from "../lib/api-client";
import type { Message, Source } from "../types/api";
import type { ChatWidgetTheme } from "../types/theme";
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
        "fixed bottom-5 right-5 z-50",
        "w-14 h-14 rounded-full",
        "bg-indigo-600 hover:bg-indigo-700",
        "text-white border-0 cursor-pointer",
        "shadow-lg hover:shadow-xl",
        "transition-all duration-200",
        "flex items-center justify-center",
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
        "bg-white text-black px-5 py-4",
        "border-b border-gray-300",
        "flex items-center justify-between",
        className
      )}
    >
      <p className="m-0 text-md font-normal">{title}</p>
      <div className="flex items-center gap-2">
        <button
          className="p-1 bg-transparent border-0 cursor-pointer text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Options"
        >
          <Icon icon="mi:options-vertical" width={20} height={20} />
        </button>
        <button
          onClick={onExpandClick}
          className="p-1 bg-transparent border-0 cursor-pointer text-gray-600 hover:text-gray-900 transition-colors"
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
          className="p-1 bg-transparent border-0 cursor-pointer text-gray-600 hover:text-gray-900 transition-colors"
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
        "flex flex-col max-w-[80%]",
        isUser ? "self-end" : "self-start",
        className
      )}
    >
      <div
        className={cn(
          "px-4 py-3 rounded-xl wrap-break-word leading-relaxed",
          isUser
            ? "bg-linear-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm"
            : "bg-white text-gray-800 border border-gray-300 rounded-bl-sm"
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
        "flex flex-col max-w-[80%] self-start",
        className
      )}
    >
      <div className="px-4 py-3 rounded-xl wrap-break-word leading-relaxed bg-white text-gray-800 border border-gray-300 rounded-bl-sm">
        {content ? (
          content
        ) : (
          <span className="inline-block w-0.5 h-5 bg-indigo-600 animate-blink"></span>
        )}
      </div>
      {content && (
        <div className="flex gap-1 pt-2 pl-4">
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-typing"></span>
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-typing [animation-delay:0.2s]"></span>
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-typing [animation-delay:0.4s]"></span>
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
        "p-3 bg-amber-50 border border-amber-400 rounded-lg text-sm mt-2",
        className
      )}
    >
      <div className="font-semibold mb-2 text-amber-800">Sources:</div>
      {sources.map((source, idx) => (
        <div key={source.id} className="py-1 text-amber-800">
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
        "p-3 bg-red-50 border border-red-300 rounded-lg text-red-800 text-sm",
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
        "flex gap-3 p-4 bg-white border-t border-gray-300",
        className
      )}
    >
      <textarea
        className="flex-1 p-3 border border-gray-300 rounded-lg text-sm resize-none outline-none transition-colors focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Type your message..."
        disabled={disabled}
        rows={2}
      />
      <button
        className="px-6 py-3 bg-linear-to-br from-indigo-500 to-purple-600 text-white border-0 rounded-lg font-semibold cursor-pointer transition-opacity whitespace-nowrap hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
        "flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 bg-gray-50",
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
        "flex flex-col w-full border border-gray-300 rounded-xl bg-white shadow-lg overflow-hidden transition-all duration-300",
        "fixed bottom-5 right-5 z-50",
        "animate-slideUp",
        isExpanded
          ? "h-[95vh] max-w-[45vw] min-w-[300px]"
          : "h-[550px] max-w-[400px]",
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
  theme?: ChatWidgetTheme;
}

export function ChatWidget({
  apiUrl,
  conversationId: initialConversationId,
  onConversationCreate,
  // Note: theme prop exists in ChatWidgetProps but is applied at the Shadow DOM level in main.tsx
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
