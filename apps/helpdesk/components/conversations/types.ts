export type ConversationSummary = {
  id: string;
  customerName: string;
  subject: string;
  lastMessageSnippet: string;
  updatedAt: string;
  unreadCount?: number;
  status: "open" | "waiting" | "resolved";
  priority: "low" | "medium" | "high";
};

export type ConversationMessage = {
  id: string;
  sender: "customer" | "assistant";
  body: string;
  timestamp: string;
};

export type ConversationRecord = ConversationSummary & {
  channel: "chat" | "email";
  messages: ConversationMessage[];
};
