/**
 * Re-export all API types from @repo/dto
 * This provides a single source of truth for API types across the monorepo
 */

export type {
  // Common types
  Pagination,
  RAGOptions,
  ErrorResponse,

  // Conversation types
  Conversation,
  CreateConversationRequest,
  CreateConversationResponse,
  GetConversationResponse,
  ListConversationsResponse,
  DeleteConversationResponse,

  // Message types
  Message,
  MessageRole,
  MessageWithSources,
  SendMessageRequest,
  GetMessagesResponse,

  // Source types
  Source,
  MessageSourceDetail,
  GetMessageSourcesResponse,

  // Stream event types
  StreamEvent,
  TokenEvent,
  DoneEvent,
  TitleEvent,
  ErrorEvent,
  EscalatedEvent,
  AgentJoinedEvent,
  AgentMessageEvent,
  TypingEvent,
  ResolvedEvent,

  // Upload types
  Document,
  UploadResponse,
  UploadInfoResponse,
} from '@repo/dto';

// Re-export schemas for runtime validation if needed
export {
  // Common schemas
  PaginationSchema,
  RAGOptionsSchema,
  ErrorResponseSchema,

  // Conversation schemas
  ConversationSchema,
  CreateConversationRequestSchema,
  CreateConversationResponseSchema,

  // Message schemas
  MessageSchema,
  MessageWithSourcesSchema,
  SendMessageRequestSchema,

  // Source schemas
  SourceSchema,

  // Stream event schemas
  StreamEventSchema,
  TokenEventSchema,
  DoneEventSchema,
  TitleEventSchema,
  ErrorEventSchema,
  EscalatedEventSchema,
  AgentJoinedEventSchema,
  AgentMessageEventSchema,
  TypingEventSchema,
  ResolvedEventSchema,
} from '@repo/dto';
