// API Response Types
export interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface Source {
  id: string;
  chunkId: string;
  similarityScore: number;
  content: string;
  document: {
    filename: string;
    mimetype: string;
  };
}

export interface MessageWithSources extends Message {
  sources?: Source[];
}

export interface CreateConversationRequest {
  title?: string;
}

export interface CreateConversationResponse {
  success: boolean;
  conversation: Conversation;
}

export interface SendMessageRequest {
  message: string;
  useRAG?: boolean;
  ragOptions?: {
    limit?: number;
    similarityThreshold?: number;
  };
}

export interface StreamEvent {
  type: 'token' | 'done' | 'title' | 'error';
  content?: string;
  sources?: Source[];
  title?: string;
  message?: string;
}

export interface GetConversationResponse {
  success: boolean;
  conversation: Conversation & {
    messages: Message[];
  };
}

export interface ListConversationsResponse {
  success: boolean;
  conversations: Conversation[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
}
