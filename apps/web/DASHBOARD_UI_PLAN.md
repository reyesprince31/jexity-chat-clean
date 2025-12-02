# AI Chatbot Dashboard - Mock UI Plan

## Overview

This document outlines the plan to create mock UI pages for the AI Chatbot Dashboard in the `apps/web` Next.js application, which already has **authentication** and **multi-tenancy** (organization/team-based).

---

## Current State Analysis

### Existing Structure
- **Framework:** Next.js 15+ with App Router
- **Styling:** TailwindCSS + shadcn/ui (new-york style) via `@repo/ui`
- **Icons:** Lucide React
- **Auth:** Better-Auth with organization multi-tenancy
- **Multi-tenancy:** Team-based via `[teamSlug]` dynamic routing
- **Current Routes:**
  - `/dashboard` - Dashboard redirect
  - `/dashboard/[teamSlug]` - Team dashboard overview
  - `/dashboard/[teamSlug]/settings` - Team settings
  - `/dashboard/[teamSlug]/settings/members` - Team members

### Existing Components
- `AppSidebar` with team switcher, nav-main, nav-projects, nav-user
- Settings layout with nested navigation pattern
- Breadcrumbs, separators, sidebar provider

---

## Proposed Navigation Structure

### Primary Navigation (Sidebar - `app-sidebar.tsx`)

| Icon | Label | Route | Tier |
|------|-------|-------|------|
| LayoutDashboard | Overview | `/dashboard/[teamSlug]` | All |
| MessageSquare | Conversations | `/dashboard/[teamSlug]/conversations` | All |
| Palette | Widget | `/dashboard/[teamSlug]/widget` | All |
| BookOpen | Knowledge Base | `/dashboard/[teamSlug]/knowledge` | 🔒 **Pro** |
| BarChart3 | Analytics | `/dashboard/[teamSlug]/analytics` | All |
| Settings2 | Settings | `/dashboard/[teamSlug]/settings` | All |

### Feature Tiers

| Tier | Features |
|------|----------|
| **Free** | Chat Widget with human CSR/TSR support, Widget Customizer, Basic Analytics |
| **Pro** | Everything in Free + Knowledge Base (Website Scraping, RAG Upload, Workflows), AI-powered responses |

### Pro Feature Badge Design
- **Icon:** `Crown` or `Sparkles` from Lucide
- **Badge:** Small amber/gold badge next to nav item
- **Tooltip:** "Upgrade to Pro to unlock this feature"
- **Behavior:** Clicking shows upgrade modal or redirects to billing

---

## Page Specifications

### 1. Conversations Page (Helpdesk Chat) 🆕

**Route:** `/dashboard/[teamSlug]/conversations`

**Purpose:** View and respond to customer chat messages from the widget. For Free tier users, all chats are handled by human CSR/TSR agents.

**Note:** This is a new mock UI in `apps/web`. The existing `apps/helpdesk` implementation can be referenced for patterns but this will be built fresh with team context.

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Conversations                              [Filter ▼]      │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│   Conversation List      │      Chat View                   │
│   (Scrollable)           │      (Selected conversation)     │
│                          │                                  │
│   ┌──────────────────┐   │      ┌──────────────────────┐   │
│   │ 🟢 John Doe      │   │      │ Customer: John Doe    │   │
│   │ "Need help..."   │   │      │ Status: Active        │   │
│   │ 2 min ago        │   │      ├──────────────────────┤   │
│   └──────────────────┘   │      │                      │   │
│   ┌──────────────────┐   │      │ [Chat messages here] │   │
│   │ ⚪ Jane Smith    │   │      │                      │   │
│   │ "Thanks for..."  │   │      │                      │   │
│   │ 15 min ago       │   │      │                      │   │
│   └──────────────────┘   │      ├──────────────────────┤   │
│                          │      │ [Message Input]  [➤] │   │
│                          │      └──────────────────────┘   │
└──────────────────────────┴──────────────────────────────────┘
```

#### Features
- Conversation list with status indicators (open, waiting, resolved)
- Click conversation to view chat history
- Real-time message updates (mock with state)
- Agent response input
- Resolve/close conversation action

---

### 2. Widget Customizer Page 🆕

**Route:** `/dashboard/[teamSlug]/widget`

**Purpose:** Allow users to customize the chat widget appearance that gets embedded on their websites.

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Widget Customizer                                          │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│   Configuration Panel    │      Live Preview Panel          │
│   (Scrollable form)      │      (Widget mockup)             │
│                          │                                  │
│   ┌──────────────────┐   │      ┌──────────────────────┐   │
│   │ Theme            │   │      │                      │   │
│   │ ○ Light  ● Dark  │   │      │   [Chat Widget       │   │
│   └──────────────────┘   │      │    Preview with      │   │
│                          │      │    real-time         │   │
│   ┌──────────────────┐   │      │    updates]          │   │
│   │ Primary Color    │   │      │                      │   │
│   │ [Color Picker]   │   │      └──────────────────────┘   │
│   └──────────────────┘   │                                  │
│                          │                                  │
│   ┌──────────────────┐   │                                  │
│   │ Font Family      │   │                                  │
│   │ [Dropdown]       │   │                                  │
│   └──────────────────┘   │                                  │
│                          │                                  │
│   ... more options       │                                  │
│                          │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

#### Configuration Sections

**1. Appearance**
- Theme: Light / Dark / Auto
- Primary color (color picker)
- Secondary/accent color
- Background color
- Border radius (slider: none → rounded → pill)

**2. Typography**
- Font family dropdown (Inter, System, Roboto, etc.)
- Font size (Small, Medium, Large)
- Message bubble style

**3. Branding**
- Bot avatar upload/URL
- Bot name
- Welcome message
- Placeholder text

**4. Position & Size**
- Widget position: Bottom-right / Bottom-left
- Widget size: Compact / Standard / Large
- Chat button icon style

**5. Behavior (toggles)**
- Show powered by badge
- Enable sound notifications
- Auto-open on page load
- Show typing indicators

#### Components Needed
- `ColorPicker` - For color selection
- `ThemeToggle` - Light/Dark/Auto
- `SliderInput` - For border radius, sizes
- `ImageUpload` - For avatar
- `WidgetPreview` - Live preview component

---

### 3. Knowledge Base Page 🆕 🔒 **PRO FEATURE**

**Route:** `/dashboard/[teamSlug]/knowledge`

**Purpose:** Manage knowledge sources for the AI chatbot (RAG context).

**Pro Feature Indication:**
- Nav item shows `Crown` icon badge
- Tooltip: "Pro Feature - Upgrade to unlock AI-powered responses"
- If Free user clicks, show upgrade modal or redirect to billing

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Knowledge Base                          [+ Add Source]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │ Website │ │ Files   │ │ Workflows│                       │
│  │ Scraper │ │ (RAG)   │ │ (Nodes) │                       │
│  └─────────┘ └─────────┘ └─────────┘                       │
│                                                             │
│  [Tab Content Area]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Tab 1: Website Scraper

**Purpose:** Crawl and index website pages for chatbot knowledge.

```
┌─────────────────────────────────────────────────────────────┐
│  Website Sources                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🌐 Add Website URL                                     │ │
│  │ ┌─────────────────────────────────┬─────────────────┐ │ │
│  │ │ https://example.com             │ [Crawl Website] │ │ │
│  │ └─────────────────────────────────┴─────────────────┘ │ │
│  │                                                        │ │
│  │ Options:                                               │ │
│  │ ☑ Include subpages (max depth: [3])                   │ │
│  │ ☑ Respect robots.txt                                  │ │
│  │ ☐ Include blog posts                                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Indexed Websites                                           │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🌐 example.com                                         │ │
│  │    Status: ✓ Indexed  |  45 pages  |  Last: 2 days ago│ │
│  │    [Re-crawl] [View Pages] [Delete]                   │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ 🌐 docs.example.com                                    │ │
│  │    Status: ⏳ Crawling (23/100 pages)                  │ │
│  │    [Cancel] [View Progress]                           │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Tab 2: Files (RAG PDF Upload)

**Purpose:** Upload and manage document files for RAG knowledge base.

```
┌─────────────────────────────────────────────────────────────┐
│  Document Files                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                        │ │
│  │     📁 Drop files here or click to upload             │ │
│  │                                                        │ │
│  │     Supported: PDF, TXT, MD, CSV (Max 10MB)           │ │
│  │                                                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Uploaded Documents                          [Search...]    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ □  Name              Type    Size    Status   Actions │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ □  product-guide.pdf PDF     2.4 MB  ✓ Indexed  [···]│ │
│  │ □  faq.md            MD      45 KB   ✓ Indexed  [···]│ │
│  │ □  pricing.csv       CSV     12 KB   ⏳ Processing    │ │
│  │ □  manual.pdf        PDF     8.1 MB  ✓ Indexed  [···]│ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Delete Selected]                    Showing 4 of 4 files  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Tab 3: Workflows (Node-based Editor)

**Purpose:** Visual workflow builder for complex knowledge pipelines (like Zapier/n8n).

```
┌─────────────────────────────────────────────────────────────┐
│  Workflows                               [+ New Workflow]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  My Workflows                                               │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ⚡ Daily Knowledge Sync                                │ │
│  │    Trigger: Schedule (Daily 2AM)                      │ │
│  │    Actions: Fetch API → Process → Update Index        │ │
│  │    Status: ✓ Active     Last run: 6 hours ago         │ │
│  │    [Edit] [Run Now] [Disable]                         │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ 📧 Support Email Ingestion                             │ │
│  │    Trigger: Email received                            │ │
│  │    Actions: Parse Email → Extract FAQ → Index         │ │
│  │    Status: ⏸ Paused                                   │ │
│  │    [Edit] [Enable] [Delete]                           │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Workflow Editor Preview (when editing):               │ │
│  │                                                        │ │
│  │  [Trigger]──→[Process]──→[Filter]──→[Index]          │ │
│  │     📅          🔄          🔍         💾             │ │
│  │                                                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Workflow Editor (Full Page Modal/Route):**
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Workflows    "Daily Knowledge Sync"    [Save]   │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐                                                │
│ │ Nodes    │   Canvas Area (drag & drop nodes)             │
│ │          │                                                │
│ │ Triggers │   ┌─────────┐     ┌─────────┐     ┌─────────┐│
│ │  ⏰ Cron  │   │ ⏰ Cron  │────→│🔄 HTTP   │────→│💾 Index ││
│ │  📧 Email │   │ Daily   │     │ Request │     │ Update  ││
│ │  🔗 Webhook│   └─────────┘     └─────────┘     └─────────┘│
│ │          │                                                │
│ │ Actions  │                                                │
│ │  🔄 HTTP  │                                               │
│ │  📝 Parse │   Node Inspector (right panel when selected) │
│ │  🔍 Filter│   ┌───────────────────────────────────────┐  │
│ │  💾 Index │   │ HTTP Request                          │  │
│ │          │   │ URL: [https://api.example.com/data]   │  │
│ └──────────┘   │ Method: [GET ▼]                       │  │
│                │ Headers: [+ Add Header]               │  │
│                └───────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. Analytics Page 🆕

**Route:** `/dashboard/[teamSlug]/analytics`

**Purpose:** Display chatbot performance metrics and insights.

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Analytics                         [Last 7 days ▼] [Export]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐│
│  │ Total Chats │ │ Resolution  │ │ Avg Response│ │ CSAT   ││
│  │   1,234     │ │    87%      │ │   2.3s      │ │  4.5⭐ ││
│  │   ↑ 12%     │ │    ↑ 5%     │ │   ↓ 0.5s    │ │  ↑ 0.2 ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────┘│
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Conversations Over Time (Line Chart)                 │  │
│  │ [Chart visualization]                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌────────────────────────┐ ┌────────────────────────────┐ │
│  │ Top Topics (Pie Chart) │ │ Escalation Reasons         │ │
│  │ [Chart]                │ │ [Bar Chart]                │ │
│  └────────────────────────┘ └────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. Settings Page (Enhancement)

**Route:** `/dashboard/[teamSlug]/settings` (exists, add more sections)

**Purpose:** Configure chatbot behavior, integrations, and team settings.

**Note:** General and Members settings already exist. We'll add more sections as needed.

#### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────┐  ┌────────────────────────────────────┐│
│  │ Navigation     │  │ Content Area                       ││
│  │                │  │                                    ││
│  │ • General      │  │ [Selected settings content]        ││
│  │ • AI Model     │  │                                    ││
│  │ • Integrations │  │                                    ││
│  │ • Team         │  │                                    ││
│  │ • Billing      │  │                                    ││
│  │ • API Keys     │  │                                    ││
│  │ • Embed Code   │  │                                    ││
│  └────────────────┘  └────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Settings Sections

**General**
- Chatbot name
- Default language
- Timezone
- Operating hours

**AI Model**
- Model selection (GPT-4o, etc.)
- Temperature slider
- Max tokens
- System prompt customization
- Fallback behavior

**Integrations**
- Slack integration
- Email notifications
- Webhook URLs
- CRM connections

**Team**
- Team members list
- Invite new members
- Role management

**Billing**
- Current plan
- Usage stats
- Upgrade options

**API Keys**
- Generate/revoke keys
- Key permissions

**Embed Code**
- Copy-paste snippet
- Installation instructions

---

## File Structure (New Files to Create)

```
apps/web/
├── app/(saas)/dashboard/[teamSlug]/
│   ├── conversations/
│   │   ├── layout.tsx                  # Conversations layout with chat list
│   │   └── page.tsx                    # Conversations/Helpdesk page
│   ├── widget/
│   │   └── page.tsx                    # Widget customizer page
│   ├── knowledge/
│   │   ├── layout.tsx                  # Knowledge base layout
│   │   ├── page.tsx                    # Knowledge base main (tabs)
│   │   └── workflows/
│   │       └── [id]/
│   │           └── page.tsx            # Workflow editor page
│   └── analytics/
│       └── page.tsx                    # Analytics dashboard
├── components/
│   ├── dashboard/
│   │   ├── pro-badge.tsx               # Pro feature badge with tooltip
│   │   └── upgrade-modal.tsx           # Upgrade to Pro modal
│   ├── conversations/
│   │   ├── conversation-list.tsx       # Chat list sidebar
│   │   ├── conversation-view.tsx       # Chat view panel
│   │   └── message-input.tsx           # Message composer
│   ├── widget/
│   │   ├── widget-preview.tsx          # Live widget preview
│   │   ├── color-picker.tsx            # Color selection
│   │   └── config-panel.tsx            # Configuration form
│   ├── knowledge/
│   │   ├── website-source-card.tsx     # Website crawl card
│   │   ├── file-upload-zone.tsx        # Drag-drop upload
│   │   ├── document-table.tsx          # Files table
│   │   ├── workflow-card.tsx           # Workflow list item
│   │   └── workflow-editor.tsx         # Node-based editor (simple)
│   └── analytics/
│       ├── metric-card.tsx             # Stat card component
│       └── chart-placeholder.tsx       # Chart mockup
└── lib/
    └── mock-data.ts                     # Mock data for UI
```

---

## Implementation Order

### Phase 1: Navigation & Structure
1. Update `AppSidebar.tsx` with new navigation items
2. Create route folders and placeholder pages

### Phase 2: Widget Customizer
1. Create configuration panel with form controls
2. Build live preview component
3. Add color picker functionality

### Phase 3: Knowledge Base
1. Build tabs layout
2. Create Website Scraper tab UI
3. Create File Upload tab with drag-drop zone
4. Create Workflows tab with card list
5. Build simple workflow editor (visual node concept)

### Phase 4: Analytics Enhancement
1. Add metric cards
2. Create chart placeholders (using recharts or similar)

### Phase 5: Settings Page
1. Create settings navigation
2. Build out individual settings sections

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@radix-ui/react-slider": "^1.x",      // For sliders
    "@radix-ui/react-switch": "^1.x",      // For toggles
    "recharts": "^2.x",                     // For analytics charts
    "react-colorful": "^5.x",               // For color picker
    "react-dropzone": "^14.x"               // For file upload
  }
}
```

---

## Design Guidelines

### Color Palette (from existing)
- Background: `bg-zinc-200` (page bg), `bg-card` / `bg-background` (panels)
- Text: `text-foreground`, `text-muted-foreground`
- Borders: `border-border/80`
- Accent: Primary brand color (customizable)

### Component Patterns
- Use shadcn/ui components (Card, Button, Input, Tabs, etc.)
- Resizable panels for split views
- Tooltips for icon-only navigation
- Consistent border-radius (`rounded-2xl` for main panels)

### Responsive Behavior
- Sidebar collapses to icons only (already implemented)
- Main content uses resizable panels where appropriate
- Mobile: Stack panels vertically

---

## Mock Data Strategy

All pages will use static mock data initially. Data structure examples:

```typescript
// Mock conversation for helpdesk
const mockConversations = [
  { id: '1', customerName: 'John Doe', status: 'open', ... }
];

// Mock website sources
const mockWebsiteSources = [
  { id: '1', url: 'example.com', status: 'indexed', pageCount: 45 }
];

// Mock documents
const mockDocuments = [
  { id: '1', name: 'product-guide.pdf', type: 'PDF', status: 'indexed' }
];

// Mock workflows
const mockWorkflows = [
  { id: '1', name: 'Daily Sync', trigger: 'cron', status: 'active' }
];
```

---

## Questions for Clarification

1. **Widget Customizer:** Should the preview show a mini chat widget or a full-screen preview?

2. **Workflow Editor:** How complex should the node editor be for MVP?
   - Option A: Simple list of connected steps (text-based)
   - Option B: Visual drag-drop canvas (like n8n)
   - Option C: Just workflow cards with edit modal (simplest)

3. **Analytics:** Do you want interactive charts or static mockups for now?

---

## Next Steps

After your approval:
1. Update `app-sidebar.tsx` with new navigation structure + Pro badge
2. Create route folders and placeholder pages
3. Build each page with mock data and interactive state
4. All styling follows existing patterns from `apps/web`

**See `docs/PRD.md` for the full Product Requirements Document.**
