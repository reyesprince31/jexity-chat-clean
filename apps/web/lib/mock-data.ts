export type ConversationStatus = "open" | "waiting" | "resolved";

export interface Message {
  id: string;
  sender: "customer" | "agent" | "ai";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  customerName: string;
  customerEmail?: string;
  status: ConversationStatus;
  lastMessage: string;
  updatedAt: string;
  messages: Message[];
}

export interface WebsiteSource {
  id: string;
  url: string;
  status: "crawling" | "indexed" | "failed";
  pageCount: number;
  lastCrawled: string;
}

export type DocumentType = "pdf" | "txt" | "md" | "csv";

export interface DocumentSource {
  id: string;
  filename: string;
  type: DocumentType;
  size: number;
  status: "processing" | "indexed" | "failed";
  uploadedAt: string;
}

export type WorkflowTrigger = "schedule" | "webhook" | "email";

export interface Workflow {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  status: "active" | "paused";
  lastRun?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  conversations: number;
  lastSeen: string;
  tags: string[];
  status: "active" | "inactive";
}

export interface AnalyticsSummary {
  totalChats: number;
  resolutionRate: number;
  avgResponseSeconds: number;
  csatScore: number;
  deltas: {
    totalChats: number;
    resolutionRate: number;
    avgResponseSeconds: number;
    csatScore: number;
  };
}

export interface AnalyticsPoint {
  label: string;
  value: number;
}

export type PlanTier = "free" | "pro";

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: string[];
  isPopular?: boolean;
}

export const mockConversations: Conversation[] = [
  {
    id: "1",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    status: "open",
    lastMessage: "I need help with my order.",
    updatedAt: "2 min ago",
    messages: [
      {
        id: "m1",
        sender: "customer",
        content: "Hi, I need help with my recent order.",
        timestamp: "2 min ago",
      },
      {
        id: "m2",
        sender: "agent",
        content: "Sure, can you share your order ID?",
        timestamp: "1 min ago",
      },
    ],
  },
  {
    id: "2",
    customerName: "Jane Smith",
    customerEmail: "jane@example.com",
    status: "waiting",
    lastMessage: "Thanks for the quick response!",
    updatedAt: "15 min ago",
    messages: [
      {
        id: "m3",
        sender: "customer",
        content: "Can I change my shipping address?",
        timestamp: "20 min ago",
      },
      {
        id: "m4",
        sender: "agent",
        content: "Yes, I can help with that.",
        timestamp: "18 min ago",
      },
      {
        id: "m5",
        sender: "customer",
        content: "Thanks for the quick response!",
        timestamp: "15 min ago",
      },
    ],
  },
  {
    id: "3",
    customerName: "Acme Corp.",
    customerEmail: "support@acme.com",
    status: "resolved",
    lastMessage: "Great, that answers my question.",
    updatedAt: "1 hour ago",
    messages: [
      {
        id: "m6",
        sender: "customer",
        content: "Do you offer volume discounts?",
        timestamp: "2 hours ago",
      },
      {
        id: "m7",
        sender: "agent",
        content: "Yes, here is our pricing for teams.",
        timestamp: "1.5 hours ago",
      },
      {
        id: "m8",
        sender: "customer",
        content: "Great, that answers my question.",
        timestamp: "1 hour ago",
      },
    ],
  },
];

export const mockContacts: Contact[] = [
  {
    id: "c1",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    company: "Acme Inc",
    conversations: 12,
    lastSeen: "2 minutes ago",
    tags: ["vip", "enterprise"],
    status: "active",
  },
  {
    id: "c2",
    name: "Mike Chen",
    email: "mike.chen@startup.io",
    company: "TechStart",
    conversations: 8,
    lastSeen: "1 hour ago",
    tags: ["pro"],
    status: "active",
  },
  {
    id: "c3",
    name: "Emily Davis",
    email: "emily@designco.co",
    company: "DesignCo",
    conversations: 5,
    lastSeen: "3 hours ago",
    tags: ["free"],
    status: "active",
  },
  {
    id: "c4",
    name: "Alex Thompson",
    email: "alex.t@megacorp.com",
    company: "MegaCorp",
    conversations: 23,
    lastSeen: "1 day ago",
    tags: ["enterprise", "priority"],
    status: "inactive",
  },
  {
    id: "c5",
    name: "Lisa Park",
    email: "lisa.park@creative.io",
    company: "Creative Agency",
    conversations: 15,
    lastSeen: "2 days ago",
    tags: ["pro"],
    status: "inactive",
  },
];

export const mockWebsiteSources: WebsiteSource[] = [
  {
    id: "w1",
    url: "https://docs.example.com",
    status: "indexed",
    pageCount: 156,
    lastCrawled: "2 hours ago",
  },
  {
    id: "w2",
    url: "https://blog.example.com",
    status: "crawling",
    pageCount: 42,
    lastCrawled: "Just now",
  },
];

export const mockDocuments: DocumentSource[] = [
  {
    id: "d1",
    filename: "product-manual-v2.pdf",
    type: "pdf",
    size: 2.4,
    status: "indexed",
    uploadedAt: "1 day ago",
  },
  {
    id: "d2",
    filename: "faq.md",
    type: "md",
    size: 0.04,
    status: "indexed",
    uploadedAt: "3 days ago",
  },
  {
    id: "d3",
    filename: "pricing.csv",
    type: "csv",
    size: 0.01,
    status: "processing",
    uploadedAt: "5 min ago",
  },
];

export const mockWorkflows: Workflow[] = [
  {
    id: "wf1",
    name: "Daily Knowledge Sync",
    trigger: "schedule",
    status: "active",
    lastRun: "6 hours ago",
  },
  {
    id: "wf2",
    name: "Support Email Ingestion",
    trigger: "email",
    status: "paused",
    lastRun: "1 day ago",
  },
];

export const mockAnalyticsSummary: AnalyticsSummary = {
  totalChats: 1234,
  resolutionRate: 0.87,
  avgResponseSeconds: 2.3,
  csatScore: 4.5,
  deltas: {
    totalChats: 0.12,
    resolutionRate: 0.05,
    avgResponseSeconds: -0.5,
    csatScore: 0.2,
  },
};

export const mockConversationsOverTime: AnalyticsPoint[] = [
  { label: "Mon", value: 120 },
  { label: "Tue", value: 140 },
  { label: "Wed", value: 110 },
  { label: "Thu", value: 160 },
  { label: "Fri", value: 190 },
  { label: "Sat", value: 80 },
  { label: "Sun", value: 60 },
];

export const mockTopics: AnalyticsPoint[] = [
  { label: "Pricing", value: 40 },
  { label: "Product", value: 30 },
  { label: "Billing", value: 15 },
  { label: "Technical", value: 15 },
];

export const mockEscalationReasons: AnalyticsPoint[] = [
  { label: "Complex issue", value: 45 },
  { label: "Account changes", value: 30 },
  { label: "Refunds", value: 15 },
  { label: "Other", value: 10 },
];

export const mockPlans: Plan[] = [
  {
    id: "free",
    name: "Free",
    tier: "free",
    priceMonthly: 0,
    priceYearly: 0,
    description: "For getting started with human-only support.",
    features: [
      "1 team member",
      "Chat widget",
      "Widget customizer",
      "Basic analytics",
      "Powered by Jexity badge",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tier: "pro",
    priceMonthly: 49,
    priceYearly: 490,
    description: "AI-powered support with knowledge base.",
    features: [
      "Unlimited team members",
      "AI responses with RAG",
      "Knowledge base (web + docs)",
      "Workflows",
      "Advanced analytics",
      "Remove Jexity branding",
      "Priority support",
    ],
    isPopular: true,
  },
];

export const mockCurrentPlanId: PlanTier = "free";
