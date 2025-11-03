import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ApiClient, apiClient } from "../lib/api-client";
import type { Message, Source } from "../types/api";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize API client with custom URL if provided
  const client = useMemo(
    () => (apiUrl ? new ApiClient(apiUrl) : apiClient),
    [apiUrl]
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

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
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingContent("");

          // Store sources
          if (event.sources) {
            setSources(event.sources);
          }
        } else if (event.type === "error") {
          setError(event.message || "An error occurred");
        }
      }
    } catch (err) {
      setError("Failed to send message");
      console.error(err);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="tw:flex tw:flex-col tw:h-[600px] tw:max-w-[500px] tw:w-full tw:border tw:border-gray-300 tw:rounded-xl tw:bg-white tw:shadow-lg tw:overflow-hidden">
        <div className="tw:flex tw:items-center tw:justify-center tw:h-full tw:text-gray-600 tw:text-base">
          Initializing chat...
        </div>
      </div>
    );
  }

  return (
    <div className="tw:flex tw:flex-col tw:h-[600px] tw:max-w-[500px] tw:w-full tw:border tw:border-gray-300 tw:rounded-xl tw:bg-white tw:shadow-lg tw:overflow-hidden">
      <div className="tw:bg-linear-to-br tw:from-indigo-500 tw:to-purple-600 tw:text-white tw:px-5 tw:py-4 tw:border-b tw:border-gray-300">
        <h3 className="tw:m-0 tw:text-lg tw:font-semibold">
          AI Chat Assistant
        </h3>
      </div>

      <div className="tw:flex-1 tw:overflow-y-auto tw:px-5 tw:py-5 tw:flex tw:flex-col tw:gap-4 tw:bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`tw:flex tw:flex-col tw:max-w-[80%] tw:animate-fadeIn ${
              message.role === "user" ? "tw:self-end" : "tw:self-start"
            }`}
          >
            <div
              className={`tw:px-4 tw:py-3 tw:rounded-xl tw:wrap-break-word tw:leading-relaxed ${
                message.role === "user"
                  ? "tw:bg-linear-to-br tw:from-indigo-500 tw:to-purple-600 tw:text-white tw:rounded-br-sm"
                  : "tw:bg-white tw:text-gray-800 tw:border tw:border-gray-300 tw:rounded-bl-sm"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isStreaming && streamingContent && (
          <div className="tw:flex tw:flex-col tw:max-w-[80%] tw:self-start tw:animate-fadeIn">
            <div className="tw:px-4 tw:py-3 tw:rounded-xl tw:wrap-break-word tw:leading-relaxed tw:bg-white tw:text-gray-800 tw:border tw:border-gray-300 tw:rounded-bl-sm">
              {streamingContent}
            </div>
            <div className="tw:flex tw:gap-1 tw:pt-2 tw:pl-4">
              <span className="tw:w-2 tw:h-2 tw:rounded-full tw:bg-gray-400 tw:animate-typing"></span>
              <span className="tw:w-2 tw:h-2 tw:rounded-full tw:bg-gray-400 tw:animate-typing [animation-delay:0.2s]"></span>
              <span className="tw:w-2 tw:h-2 tw:rounded-full tw:bg-gray-400 tw:animate-typing [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className="tw:p-3 tw:bg-amber-50 tw:border tw:border-amber-400 tw:rounded-lg tw:text-sm tw:mt-2">
            <div className="tw:font-semibold tw:mb-2 tw:text-amber-800">
              Sources:
            </div>
            {sources.map((source, idx) => (
              <div key={source.id} className="tw:py-1 tw:text-amber-800">
                <strong>Source {idx + 1}:</strong>{" "}
                {source.filename} (Relevance:{" "}
                {(source.similarity * 100).toFixed(1)}%)
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="tw:p-3 tw:bg-red-50 tw:border tw:border-red-300 tw:rounded-lg tw:text-red-800 tw:text-sm">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="tw:flex tw:gap-3 tw:p-4 tw:bg-white tw:border-t tw:border-gray-300">
        <textarea
          className="tw:flex-1 tw:p-3 tw:border tw:border-gray-300 tw:rounded-lg tw:text-sm tw:resize-none tw:outline-none tw:transition-colors focus:tw:border-indigo-500 disabled:tw:bg-gray-100 disabled:tw:cursor-not-allowed"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isStreaming}
          rows={2}
        />
        <button
          className="tw:px-6 tw:py-3 tw:bg-linear-to-br tw:from-indigo-500 tw:to-purple-600 tw:text-white tw:border-0 tw:rounded-lg tw:font-semibold tw:cursor-pointer tw:transition-opacity tw:whitespace-nowrap hover:tw:opacity-90 disabled:tw:opacity-50 disabled:tw:cursor-not-allowed"
          onClick={sendMessage}
          disabled={!input.trim() || isStreaming}
        >
          {isStreaming ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
