"use client";

import * as React from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ConversationDetailPanel } from "@/components/conversations/ConversationDetailPanel";
import { ConversationsPanel } from "@/components/conversations/ConversationsPanel";
import type { ConversationRecord } from "@/components/conversations/types";

const mockConversations: ConversationRecord[] = [
  {
    id: "conv-1",
    customerName: "Jasmine Patel",
    subject: "Widget onboarding question",
    lastMessageSnippet:
      "I can't find the billing tab anywhere inside the widget.",
    updatedAt: "2024-11-18T10:24:00Z",
    unreadCount: 2,
    status: "open",
    messages: [
      {
        id: "conv-1-msg-1",
        sender: "customer",
        body: "Hi! I'm trying to enable billing in the widget but I can't find the tab.",
        timestamp: "2024-11-18T09:58:00Z",
      },
      {
        id: "conv-1-msg-2",
        sender: "assistant",
        body: "No worries, it's tucked under Settings -> Billing. Do you see it there?",
        timestamp: "2024-11-18T10:05:00Z",
      },
      {
        id: "conv-1-msg-3",
        sender: "customer",
        body: "I only see Integrations and Themes -- nothing else.",
        timestamp: "2024-11-18T10:24:00Z",
      },
    ],
  },
  {
    id: "conv-2",
    customerName: "Kai Moreno",
    subject: "Escalated: subscription not updating",
    lastMessageSnippet:
      "The payment went through but the plan is still the same.",
    updatedAt: "2024-11-18T08:41:00Z",
    unreadCount: 0,
    status: "waiting",
    messages: [
      {
        id: "conv-2-msg-1",
        sender: "customer",
        body: "I upgraded yesterday but my workspace still shows Starter.",
        timestamp: "2024-11-18T08:02:00Z",
      },
      {
        id: "conv-2-msg-2",
        sender: "assistant",
        body: "Thanks for flagging. Let me refresh your subscription status on our side.",
        timestamp: "2024-11-18T08:18:00Z",
      },
      {
        id: "conv-2-msg-3",
        sender: "assistant",
        body: "Can you confirm the last 4 digits of the card you used?",
        timestamp: "2024-11-18T08:41:00Z",
      },
    ],
  },
  {
    id: "conv-3",
    customerName: "Studio North",
    subject: "Need transcript of October chats",
    lastMessageSnippet:
      "Is there a way to export every conversation from last month?",
    updatedAt: "2024-11-17T16:15:00Z",
    unreadCount: 5,
    status: "open",
    messages: [
      {
        id: "conv-3-msg-1",
        sender: "customer",
        body: "We promised a compliance audit, so I need exports of October chats.",
        timestamp: "2024-11-17T15:01:00Z",
      },
      {
        id: "conv-3-msg-2",
        sender: "assistant",
        body: "Sure thing. Do you need them grouped by agent or a single CSV?",
        timestamp: "2024-11-17T15:32:00Z",
      },
      {
        id: "conv-3-msg-3",
        sender: "customer",
        body: "Single CSV is perfect. Earlier months would help too if possible.",
        timestamp: "2024-11-17T16:15:00Z",
      },
    ],
  },
];

export default function Home() {
  const [activeConversationId, setActiveConversationId] = React.useState<
    string | undefined
  >(() => mockConversations[0]?.id);

  const selectedConversation = React.useMemo(
    () =>
      mockConversations.find(
        (conversation) => conversation.id === activeConversationId
      ),
    [activeConversationId]
  );

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-2xl">
      <ResizablePanel
        defaultSize={28}
        minSize={22}
        className="min-w-[280px] border-border/80 border-r bg-card"
      >
        <ConversationsPanel
          conversations={mockConversations}
          activeConversationId={activeConversationId}
          onSelectConversation={setActiveConversationId}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel className="min-w-0 bg-background">
        <ConversationDetailPanel conversation={selectedConversation} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
