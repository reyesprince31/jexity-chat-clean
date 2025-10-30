import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ApiClient, apiClient } from '../lib/api-client';
import type { Message, Source } from '../types/api';
import './ChatWidget.css';

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
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize API client with custom URL if provided
  const client = useMemo(() => apiUrl ? new ApiClient(apiUrl) : apiClient, [apiUrl]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const createConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await client.createConversation();
      setConversationId(response.conversation.id);
      onConversationCreate?.(response.conversation.id);
    } catch (err) {
      setError('Failed to create conversation');
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
    setInput('');
    setError(null);
    setIsStreaming(true);
    setStreamingContent('');
    setSources([]);

    // Add user message optimistically
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      let fullResponse = '';

      for await (const event of client.streamMessage(conversationId, {
        message: userMessage,
        useRAG: true,
      })) {
        if (event.type === 'token' && event.content) {
          fullResponse += event.content;
          setStreamingContent(fullResponse);
        } else if (event.type === 'done') {
          // Add assistant message
          const assistantMsg: Message = {
            id: `temp-${Date.now()}`,
            conversation_id: conversationId,
            role: 'assistant',
            content: fullResponse,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingContent('');

          // Store sources
          if (event.sources) {
            setSources(event.sources);
          }
        } else if (event.type === 'error') {
          setError(event.message || 'An error occurred');
        }
      }
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="chat-widget">
        <div className="chat-loading">Initializing chat...</div>
      </div>
    );
  }

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <h3>AI Chat Assistant</h3>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message chat-message-${message.role}`}
          >
            <div className="chat-message-content">{message.content}</div>
          </div>
        ))}

        {isStreaming && streamingContent && (
          <div className="chat-message chat-message-assistant">
            <div className="chat-message-content">{streamingContent}</div>
            <div className="chat-typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className="chat-sources">
            <div className="chat-sources-title">Sources:</div>
            {sources.map((source, idx) => (
              <div key={source.id} className="chat-source">
                <strong>Source {idx + 1}:</strong> {source.document.filename}{' '}
                (Relevance: {(source.similarityScore * 100).toFixed(1)}%)
              </div>
            ))}
          </div>
        )}

        {error && <div className="chat-error">{error}</div>}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isStreaming}
          rows={2}
        />
        <button
          className="chat-send-button"
          onClick={sendMessage}
          disabled={!input.trim() || isStreaming}
        >
          {isStreaming ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
