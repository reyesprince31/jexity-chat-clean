export type ConversationSummary = {
  id: string;
  customerName: string;
  subject: string;
  lastMessageSnippet: string;
  updatedAt: string;
  unreadCount?: number;
  status: "open" | "waiting" | "resolved";
  escalatedReason?: string | null;
  agentName?: string | null;
  escalatedAt?: string | null;
  isResolved?: boolean;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
};

export type ConversationMessage = {
  id: string;
  sender: "customer" | "assistant" | "human_agent" | "system";
  body: string;
  timestamp: string;
};

export type ConversationRecord = ConversationSummary & {
  messages: ConversationMessage[];
  agentJoinedAt?: string | null;
};
