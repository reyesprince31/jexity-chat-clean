import type {
  CreateConversationRequest,
  CreateConversationResponse,
  GetConversationResponse,
  ListConversationsResponse,
  SendMessageRequest,
  StreamEvent,
} from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_URL;
  }

  private buildWsUrl(path: string): string {
    const normalizedBase = this.baseUrl.replace(/\/+$/, "");

    if (normalizedBase.startsWith("http")) {
      return normalizedBase.replace(/^http/, "ws") + path;
    }

    if (normalizedBase.startsWith("ws")) {
      return normalizedBase + path;
    }

    return path;
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    data?: CreateConversationRequest
  ): Promise<CreateConversationResponse> {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data || {}),
    });

    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a conversation with its messages
   */
  async getConversation(id: string): Promise<GetConversationResponse> {
    const response = await fetch(`${this.baseUrl}/conversations/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to get conversation: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List all conversations
   */
  async listConversations(
    limit = 20,
    offset = 0
  ): Promise<ListConversationsResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    const response = await fetch(
      `${this.baseUrl}/conversations?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Failed to list conversations: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/conversations/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.statusText}`);
    }
  }

  /**
   * Emit a typing indicator for the current end-user once a chat is escalated.
   */
  async sendTypingIndicator(
    conversationId: string,
    isTyping: boolean
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/conversations/${conversationId}/typing`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isTyping }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to send typing indicator: ${response.statusText}`
      );
    }
  }

  /**
   * Send a message and receive streaming response
   * Returns an async iterator of stream events
   */
  async *streamMessage(
    conversationId: string,
    data: SendMessageRequest
  ): AsyncGenerator<StreamEvent, void, unknown> {
    const response = await fetch(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const event = JSON.parse(data) as StreamEvent;
              yield event;
            } catch (err) {
              console.error('Failed to parse SSE event:', err);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Subscribe to conversation-level events (agent joined, etc.). Returns an unsubscribe function.
   */
  subscribeToConversationEvents(
    conversationId: string,
    onEvent: (event: StreamEvent) => void
  ): () => void {
    const url = this.buildWsUrl(`/ws/conversations/${conversationId}`);
    const socket = new WebSocket(url);

    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(event.data) as StreamEvent;
        onEvent(parsed);
      } catch (error) {
        console.error('Failed to parse conversation websocket event:', error);
      }
    };

    const handleError = (error: Event) => {
      console.error('Conversation websocket error:', error);
    };

    socket.addEventListener('message', handleMessage);
    socket.addEventListener('error', handleError);

    return () => {
      socket.removeEventListener('message', handleMessage);
      socket.removeEventListener('error', handleError);
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    };
  }
}

// Export a default instance
export const apiClient = new ApiClient();
