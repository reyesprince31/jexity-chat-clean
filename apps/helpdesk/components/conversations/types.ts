export type ConversationSummary = {
  id: string;
  customerName: string;
  subject: string;
  lastMessageSnippet: string;
  updatedAt: string;
  unreadCount?: number;
  status: "open" | "waiting" | "resolved";
};

export type ConversationMessage = {
  id: string;
  sender: "customer" | "assistant" | "human_agent" | "system";
  body: string;
  timestamp: string;
};

export type ConversationRecord = ConversationSummary & {
  messages: ConversationMessage[];
};
