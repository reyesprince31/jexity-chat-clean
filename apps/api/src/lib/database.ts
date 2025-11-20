import { PrismaClient } from "../generated/prisma/client";
import type {
  CreateMessageRecordInput,
  MessageRecord,
  MessageRole,
  MessageWithSourcesRecord,
} from "@repo/dto";

const prisma = new PrismaClient();

// Database types
export interface Document {
  id: string;
  content_hash: string;
  filename: string;
  mimetype: string;
  size: bigint;
  storage_path: string;
  public_url: string;
  storage_bucket: string;
  extracted_text_length: number | null;
  has_embedding: boolean | null;
  user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDocumentInput {
  content_hash: string;
  filename: string;
  mimetype: string;
  size: number;
  storage_path: string;
  public_url: string;
  storage_bucket: string;
  extracted_text_length: number;
  has_embedding: boolean;
  user_id?: string;
}

/**
 * Find a document by its content hash using Prisma
 * @param contentHash - The SHA-256 hash of the file content
 * @returns The document if found, null otherwise
 */
export async function findDocumentByHash(
  contentHash: string
): Promise<Document | null> {
  try {
    const document = await prisma.documents.findUnique({
      where: {
        content_hash: contentHash,
      },
    });

    return document;
  } catch (error) {
    throw new Error(`Failed to query document: ${error}`);
  }
}

/**
 * Create a new document record in the database using Prisma
 * @param input - Document data to insert
 * @returns The created document
 */
export async function createDocumentRecord(
  input: CreateDocumentInput
): Promise<Document> {
  try {
    const document = await prisma.documents.create({
      data: {
        content_hash: input.content_hash,
        filename: input.filename,
        mimetype: input.mimetype,
        size: BigInt(input.size),
        storage_path: input.storage_path,
        public_url: input.public_url,
        storage_bucket: input.storage_bucket,
        extracted_text_length: input.extracted_text_length,
        has_embedding: input.has_embedding,
        user_id: input.user_id || null,
      },
    });

    return document;
  } catch (error) {
    throw new Error(`Failed to create document record: ${error}`);
  }
}

/**
 * Get a document by its ID using Prisma
 * @param id - The document ID
 * @returns The document if found, null otherwise
 */
export async function getDocumentById(id: string): Promise<Document | null> {
  try {
    const document = await prisma.documents.findUnique({
      where: {
        id: id,
      },
    });

    return document;
  } catch (error) {
    throw new Error(`Failed to get document: ${error}`);
  }
}

/**
 * Update a document record with processing results using Prisma
 * @param id - The document ID
 * @param updates - Partial document data to update
 * @returns The updated document
 */
export async function updateDocumentRecord(
  id: string,
  updates: Partial<Omit<Document, "id" | "created_at" | "updated_at">>
): Promise<Document> {
  try {
    const document = await prisma.documents.update({
      where: {
        id: id,
      },
      data: {
        ...updates,
        updated_at: new Date(),
      },
    });

    return document;
  } catch (error) {
    throw new Error(`Failed to update document record: ${error}`);
  }
}

// ============================================================================
// CHAT DATABASE OPERATIONS
// ============================================================================

export interface Conversation {
  id: string;
  title: string | null;
  is_escalated: boolean;
  escalated_reason: string | null;
  escalated_at: Date | null;
  is_resolved: boolean;
  resolved_at: Date | null;
  resolved_by: string | null;
  agent_name: string | null;
  agent_joined_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ConversationWithMessages extends Conversation {
  messages: MessageRecord[];
}

function withMessageRole<T extends { role: string }>(
  message: T
): Omit<T, "role"> & { role: MessageRole } {
  return {
    ...message,
    role: message.role as MessageRole,
  };
}

/**
 * Create a new conversation
 * @param title - Optional title for the conversation
 * @returns The created conversation
 */
export async function createConversation(
  title?: string
): Promise<Conversation> {
  try {
    const conversation = await prisma.conversations.create({
      data: {
        title: title || null,
      },
    });

    return conversation;
  } catch (error) {
    throw new Error(`Failed to create conversation: ${error}`);
  }
}

/**
 * Get a conversation by ID
 * @param id - The conversation ID
 * @returns The conversation if found, null otherwise
 */
export async function getConversation(
  id: string
): Promise<Conversation | null> {
  try {
    const conversation = await prisma.conversations.findUnique({
      where: {
        id: id,
      },
    });

    return conversation;
  } catch (error) {
    throw new Error(`Failed to get conversation: ${error}`);
  }
}

/**
 * Get a conversation with all its messages
 * @param id - The conversation ID
 * @returns The conversation with messages, or null if not found
 */
export async function getConversationWithMessages(
  id: string
): Promise<ConversationWithMessages | null> {
  try {
    const conversation = await prisma.conversations.findUnique({
      where: {
        id: id,
      },
      include: {
        messages: {
          orderBy: {
            created_at: "asc",
          },
        },
      },
    });

    if (!conversation) {
      return null;
    }

    return {
      ...conversation,
      messages: conversation.messages.map((message) =>
        withMessageRole(message)
      ),
    };
  } catch (error) {
    throw new Error(`Failed to get conversation with messages: ${error}`);
  }
}

/**
 * List all conversations with pagination
 * @param limit - Maximum number of conversations to return (default: 20)
 * @param offset - Number of conversations to skip (default: 0)
 * @returns Array of conversations ordered by updated_at DESC
 */
export async function listConversations(
  limit: number = 20,
  offset: number = 0
): Promise<Conversation[]> {
  try {
    const conversations = await prisma.conversations.findMany({
      orderBy: {
        updated_at: "desc",
      },
      take: limit,
      skip: offset,
    });

    return conversations;
  } catch (error) {
    throw new Error(`Failed to list conversations: ${error}`);
  }
}

/**
 * List escalated conversations with their messages for the helpdesk dashboard.
 */
export async function listEscalatedConversations(
  limit: number = 50
): Promise<ConversationWithMessages[]> {
  try {
    const conversations = await prisma.conversations.findMany({
      where: {
        is_escalated: true,
        is_resolved: false,
      },
      orderBy: {
        escalated_at: "desc",
      },
      take: limit,
      include: {
        messages: {
          orderBy: {
            created_at: "asc",
          },
          take: 200,
        },
      },
    });

    return conversations.map((conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) =>
        withMessageRole(message)
      ),
    }));
  } catch (error) {
    throw new Error(`Failed to list escalated conversations: ${error}`);
  }
}

/**
 * Update a conversation's title
 * @param id - The conversation ID
 * @param title - New title for the conversation
 * @returns The updated conversation
 */
export async function updateConversationTitle(
  id: string,
  title: string
): Promise<Conversation> {
  try {
    const conversation = await prisma.conversations.update({
      where: {
        id: id,
      },
      data: {
        title: title,
        updated_at: new Date(),
      },
    });

    return conversation;
  } catch (error) {
    throw new Error(`Failed to update conversation title: ${error}`);
  }
}

/**
 * Update the escalation metadata for a conversation. Used when the AI hands the
 * session off to a human so downstream clients can lock the transcript.
 */
export async function setConversationEscalationStatus(
  id: string,
  options: {
    isEscalated: boolean;
    reason?: string | null;
    escalatedAt?: Date;
  }
): Promise<Conversation> {
  const { isEscalated, reason = null, escalatedAt = new Date() } = options;

  try {
    const conversation = await prisma.conversations.update({
      where: {
        id,
      },
      data: {
        is_escalated: isEscalated,
        escalated_reason: isEscalated ? reason : null,
        escalated_at: isEscalated ? escalatedAt : null,
        agent_name: isEscalated ? undefined : null,
        agent_joined_at: isEscalated ? undefined : null,
        is_resolved: isEscalated ? undefined : false,
        resolved_at: isEscalated ? undefined : null,
        resolved_by: isEscalated ? undefined : null,
        updated_at: new Date(),
      },
    });

    return conversation;
  } catch (error) {
    throw new Error(`Failed to update conversation escalation: ${error}`);
  }
}

/**
 * Record when a human agent joins an escalated conversation.
 */
export async function setConversationAgentJoin(
  id: string,
  options: {
    agentName: string;
    joinedAt?: Date;
  }
): Promise<Conversation> {
  const { agentName, joinedAt = new Date() } = options;

  try {
    const conversation = await prisma.conversations.update({
      where: {
        id,
      },
      data: {
        agent_name: agentName,
        agent_joined_at: joinedAt,
        updated_at: new Date(),
      },
    });

    return conversation;
  } catch (error) {
    throw new Error(`Failed to update conversation agent join: ${error}`);
  }
}

/**
 * Mark a conversation as resolved by a human agent.
 */
export async function setConversationResolutionStatus(
  id: string,
  options: {
    resolvedBy: string;
    resolvedAt?: Date;
  }
): Promise<Conversation> {
  const { resolvedBy, resolvedAt = new Date() } = options;

  try {
    const conversation = await prisma.conversations.update({
      where: { id },
      data: {
        is_resolved: true,
        resolved_at: resolvedAt,
        resolved_by: resolvedBy,
        updated_at: new Date(),
      },
    });

    return conversation;
  } catch (error) {
    throw new Error(`Failed to resolve conversation: ${error}`);
  }
}

/**
 * Delete a conversation (cascades to messages and message_sources)
 * @param id - The conversation ID
 * @returns The deleted conversation
 */
export async function deleteConversation(id: string): Promise<Conversation> {
  try {
    const conversation = await prisma.conversations.delete({
      where: {
        id: id,
      },
    });

    return conversation;
  } catch (error) {
    throw new Error(`Failed to delete conversation: ${error}`);
  }
}

/**
 * Create a new message in a conversation
 * @param input - Message data including optional sources
 * @returns The created message
 */
export async function createMessage(
  input: CreateMessageRecordInput
): Promise<MessageRecord> {
  try {
    const message = await prisma.messages.create({
      data: {
        conversation_id: input.conversation_id,
        role: input.role,
        content: input.content,
        sources: input.sources
          ? {
              create: input.sources.map((source) => ({
                chunk_id: source.chunk_id,
                similarity_score: source.similarity_score,
              })),
            }
          : undefined,
      },
    });

    // Update conversation's updated_at timestamp
    await prisma.conversations.update({
      where: {
        id: input.conversation_id,
      },
      data: {
        updated_at: new Date(),
      },
    });

    return withMessageRole(message);
  } catch (error) {
    throw new Error(`Failed to create message: ${error}`);
  }
}

/**
 * Get all messages for a conversation
 * @param conversationId - The conversation ID
 * @param limit - Maximum number of messages to return (optional)
 * @returns Array of messages ordered by created_at ASC
 */
export async function getMessages(
  conversationId: string,
  limit?: number
): Promise<MessageRecord[]> {
  try {
    const messages = await prisma.messages.findMany({
      where: {
        conversation_id: conversationId,
      },
      orderBy: {
        created_at: "asc",
      },
      take: limit,
    });

    return messages.map((message) => withMessageRole(message));
  } catch (error) {
    throw new Error(`Failed to get messages: ${error}`);
  }
}

/**
 * Get a message with its source chunks (for citations)
 * @param messageId - The message ID
 * @returns The message with sources, or null if not found
 */
export async function getMessageWithSources(
  messageId: string
): Promise<MessageWithSourcesRecord | null> {
  try {
    const message = await prisma.messages.findUnique({
      where: {
        id: messageId,
      },
      include: {
        sources: {
          include: {
            chunk: {
              include: {
                document: {
                  select: {
                    filename: true,
                    mimetype: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return message
      ? (withMessageRole(message) as MessageWithSourcesRecord)
      : null;
  } catch (error) {
    throw new Error(`Failed to get message with sources: ${error}`);
  }
}
