# Product Requirements Document (PRD)
# Jexity AI Chatbot Dashboard

**Version:** 1.0  
**Last Updated:** November 28, 2025  
**Status:** Draft - Pending Review

---

## 1. Executive Summary

### 1.1 Product Vision
Jexity is an AI-powered customer support chatbot platform that enables businesses to provide 24/7 customer support through an embeddable chat widget. The platform offers two tiers: **Free** (human-only support) and **Pro** (AI-powered with knowledge base).

### 1.2 Problem Statement
Small to medium businesses need affordable customer support solutions. Current options are either too expensive (enterprise AI solutions) or too basic (simple contact forms). Jexity bridges this gap by offering:
- Free tier: Basic chat widget with human CSR/TSR support
- Pro tier: AI-powered responses using RAG (Retrieval Augmented Generation)

### 1.3 Target Users
| User Type | Description |
|-----------|-------------|
| **Business Owner** | Sets up chatbot, manages team, handles billing |
| **Support Agent (CSR/TSR)** | Responds to customer chats in real-time |
| **End Customer** | Uses the chat widget on client websites |

---

## 2. Feature Tiers

### 2.1 Free Tier
| Feature | Description |
|---------|-------------|
| Chat Widget | Embeddable widget for websites |
| Widget Customizer | Theme, colors, branding customization |
| Conversations | View and respond to customer chats (human agents) |
| Basic Analytics | Chat volume, response times, resolution rates |
| 1 Team Member | Single agent seat |
| Jexity Branding | "Powered by Jexity" badge on widget |

### 2.2 Pro Tier 🔒
| Feature | Description | Badge |
|---------|-------------|-------|
| All Free Features | Everything in Free tier | - |
| **Knowledge Base** | AI-powered responses using RAG | 👑 Crown |
| ↳ Website Scraping | Crawl and index website pages | 👑 |
| ↳ Document Upload | Upload PDFs, docs for RAG context | 👑 |
| ↳ Workflows | Visual automation for knowledge updates | 👑 |
| AI Responses | Automatic AI-generated responses | 👑 |
| Advanced Analytics | Topic analysis, sentiment, trends | - |
| Unlimited Team Members | Add unlimited agents | - |
| Remove Branding | White-label option | - |
| Priority Support | Faster response from Jexity team | - |

### 2.3 Pro Feature UI Indicators
For designers to implement:

```
Navigation Item with Pro Badge:
┌────────────────────────────────┐
│ 📚 Knowledge Base  👑          │  ← Crown icon indicates Pro
│                    ↑           │
│              Amber/gold color  │
└────────────────────────────────┘

Tooltip on hover (for Free users):
┌────────────────────────────────┐
│ ⚡ Pro Feature                 │
│ Upgrade to unlock AI-powered   │
│ responses with Knowledge Base  │
│                                │
│ [Upgrade to Pro]               │
└────────────────────────────────┘
```

---

## 3. User Stories

### 3.1 Authentication & Onboarding
| ID | Story | Priority |
|----|-------|----------|
| US-001 | As a user, I can sign up with email or OAuth (Google, GitHub) | ✅ Done |
| US-002 | As a user, I can create an organization (team) | ✅ Done |
| US-003 | As an admin, I can invite team members to my organization | ✅ Done |
| US-004 | As a user, I can switch between organizations | ✅ Done |

### 3.2 Conversations (Free + Pro)
| ID | Story | Priority |
|----|-------|----------|
| US-010 | As an agent, I can see a list of all customer conversations | P0 - MVP |
| US-011 | As an agent, I can click a conversation to view the full chat history | P0 - MVP |
| US-012 | As an agent, I can send replies to customers in real-time | P0 - MVP |
| US-013 | As an agent, I can see when a customer is typing | P1 |
| US-014 | As an agent, I can mark a conversation as resolved | P0 - MVP |
| US-015 | As an agent, I can filter conversations by status (open, waiting, resolved) | P1 |
| US-016 | As an agent, I can search conversations by customer name or content | P2 |

### 3.3 Widget Customizer (Free + Pro)
| ID | Story | Priority |
|----|-------|----------|
| US-020 | As an admin, I can change the widget's primary color | P0 - MVP |
| US-021 | As an admin, I can switch between light/dark theme | P0 - MVP |
| US-022 | As an admin, I can customize the bot's name and avatar | P1 |
| US-023 | As an admin, I can set a custom welcome message | P1 |
| US-024 | As an admin, I can see a live preview of my changes | P0 - MVP |
| US-025 | As an admin, I can copy the embed code for my website | P0 - MVP |
| US-026 | As an admin, I can choose widget position (bottom-left/right) | P1 |

### 3.4 Knowledge Base (Pro Only) 🔒
| ID | Story | Priority |
|----|-------|----------|
| US-030 | As a Pro admin, I can add a website URL to scrape for knowledge | P0 - MVP |
| US-031 | As a Pro admin, I can see the status of website crawling | P1 |
| US-032 | As a Pro admin, I can upload PDF/document files for RAG | P0 - MVP |
| US-033 | As a Pro admin, I can see all uploaded documents with their status | P0 - MVP |
| US-034 | As a Pro admin, I can delete knowledge sources | P1 |
| US-035 | As a Pro admin, I can create automation workflows for knowledge updates | P2 |
| US-036 | As a Free user, I see a Pro badge and upgrade prompt for Knowledge Base | P0 - MVP |

### 3.5 Analytics (Free + Pro)
| ID | Story | Priority |
|----|-------|----------|
| US-040 | As an admin, I can see total conversation count | P1 |
| US-041 | As an admin, I can see average response time | P1 |
| US-042 | As an admin, I can see resolution rate | P1 |
| US-043 | As an admin, I can see a chart of conversations over time | P2 |
| US-044 | As a Pro admin, I can see top conversation topics | P2 |

### 3.5 Settings
| ID | Story | Priority |
|----|-------|----------|
| US-050 | As an admin, I can update organization name and settings | ✅ Done |
| US-051 | As an admin, I can manage team members and roles | ✅ Done |
| US-052 | As an admin, I can view and manage billing (Pro) | P2 |
| US-053 | As an admin, I can generate API keys | P2 |

---

## 4. Functional Requirements

### 4.1 Navigation Structure

```
Dashboard Sidebar:
├── [Team Switcher]
├── Overview (home icon)
├── Conversations (message icon)
├── Widget (palette icon)
├── Knowledge Base (book icon) 👑 PRO
├── Analytics (chart icon)
└── Settings (gear icon)
    ├── General
    ├── Members
    ├── Billing (future)
    └── API Keys (future)
```

### 4.2 Route Structure

| Route | Component | Auth | Tier |
|-------|-----------|------|------|
| `/dashboard` | Redirect to first org | Yes | All |
| `/dashboard/[teamSlug]` | Overview page | Yes | All |
| `/dashboard/[teamSlug]/conversations` | Helpdesk chat | Yes | All |
| `/dashboard/[teamSlug]/widget` | Widget customizer | Yes | All |
| `/dashboard/[teamSlug]/knowledge` | Knowledge base | Yes | **Pro** |
| `/dashboard/[teamSlug]/analytics` | Analytics dashboard | Yes | All |
| `/dashboard/[teamSlug]/settings` | General settings | Yes | All |
| `/dashboard/[teamSlug]/settings/members` | Team members | Yes | All |

### 4.3 Data Requirements (Mock Data for MVP)

#### Conversations Mock Data
```typescript
interface Conversation {
  id: string;
  customerName: string;
  customerEmail?: string;
  status: 'open' | 'waiting' | 'resolved';
  lastMessage: string;
  updatedAt: string;
  messages: Message[];
}

interface Message {
  id: string;
  sender: 'customer' | 'agent' | 'ai';
  content: string;
  timestamp: string;
}
```

#### Knowledge Source Mock Data
```typescript
interface WebsiteSource {
  id: string;
  url: string;
  status: 'crawling' | 'indexed' | 'failed';
  pageCount: number;
  lastCrawled: string;
}

interface DocumentSource {
  id: string;
  filename: string;
  type: 'pdf' | 'txt' | 'md' | 'csv';
  size: number;
  status: 'processing' | 'indexed' | 'failed';
  uploadedAt: string;
}

interface Workflow {
  id: string;
  name: string;
  trigger: 'schedule' | 'webhook' | 'email';
  status: 'active' | 'paused';
  lastRun?: string;
}
```

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Page load time: < 2 seconds
- Time to interactive: < 3 seconds
- Smooth animations (60fps)

### 5.2 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader friendly
- Color contrast ratios met

### 5.3 Responsiveness
- Desktop: Full sidebar + content
- Tablet: Collapsible sidebar
- Mobile: Bottom navigation or hamburger menu

### 5.4 Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

---

## 6. Design Specifications

### 6.1 Design System
- **Framework:** shadcn/ui (new-york style)
- **Icons:** Lucide React
- **Colors:** Neutral base with customizable primary
- **Typography:** Geist Sans / Geist Mono

### 6.2 Pro Feature Badge Specifications

| Property | Value |
|----------|-------|
| Icon | `Crown` from Lucide |
| Color | Amber/Gold (`text-amber-500`) |
| Size | 14px (0.875rem) |
| Position | Right of nav label |
| Tooltip | "Pro Feature - Upgrade to unlock" |

### 6.3 Component Patterns
- Cards with subtle borders and shadows
- Rounded corners (lg/xl)
- Consistent spacing (4px grid)
- Hover states with subtle transitions

---

## 7. Technical Architecture

### 7.1 Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15+ (App Router) |
| Styling | TailwindCSS + shadcn/ui |
| State | React useState/useReducer |
| Auth | Better-Auth |
| Database | PostgreSQL + Prisma |
| API | Fastify (apps/api) |

### 7.2 Existing Infrastructure
- ✅ Authentication flow
- ✅ Organization/team multi-tenancy
- ✅ Team member management
- ✅ Sidebar navigation pattern
- ✅ Settings layout pattern

### 7.3 New Components Needed
| Component | Purpose |
|-----------|---------|
| `ProBadge` | Crown icon with tooltip for Pro features |
| `UpgradeModal` | Modal prompting Free users to upgrade |
| `ConversationList` | List of chat conversations |
| `ChatView` | Full chat history and input |
| `WidgetPreview` | Live preview of customized widget |
| `ColorPicker` | Color selection component |
| `FileUploadZone` | Drag-drop file upload area |
| `DataTable` | Reusable data table component |
| `MetricCard` | Analytics stat card |

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Update sidebar navigation with new items
- [ ] Create `ProBadge` component with tooltip
- [ ] Set up route structure under `[teamSlug]`
- [ ] Create shared layout components

### Phase 2: Conversations (Week 1-2)
- [ ] Conversation list component
- [ ] Chat view with message history
- [ ] Message input and send
- [ ] Mock data for conversations
- [ ] Status indicators (open/waiting/resolved)

### Phase 3: Widget Customizer (Week 2)
- [ ] Configuration panel with form controls
- [ ] Color picker integration
- [ ] Theme toggle (light/dark)
- [ ] Live preview component
- [ ] Embed code display

### Phase 4: Knowledge Base - Pro (Week 2-3)
- [ ] Tab layout (Website/Files/Workflows)
- [ ] Website URL input with crawl button
- [ ] Source cards with status
- [ ] File upload dropzone
- [ ] Document table with actions
- [ ] Workflow list cards
- [ ] Pro feature gating (badge, modal)

### Phase 5: Analytics (Week 3)
- [ ] Metric cards (total, response time, resolution)
- [ ] Chart placeholders
- [ ] Date range selector
- [ ] Export button (mock)

### Phase 6: Polish (Week 3-4)
- [ ] Responsive design adjustments
- [ ] Loading states and skeletons
- [ ] Empty states
- [ ] Error states
- [ ] Final review with design team

---

## 9. Success Metrics

### 9.1 MVP Success Criteria
- [ ] All pages render without errors
- [ ] Navigation between pages works
- [ ] Mock data displays correctly
- [ ] Pro badge visible on Knowledge Base
- [ ] Clicking conversations shows chat view
- [ ] Widget customizer shows live preview
- [ ] Responsive on tablet/mobile

### 9.2 Design Handoff Checklist
- [ ] All wireframes implemented
- [ ] Pro feature indicators clear
- [ ] Consistent styling throughout
- [ ] Component library documented
- [ ] Ready for design review

---

## 10. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Widget preview: mini floating or full-screen? | Design | Open |
| 2 | Workflow editor complexity for MVP? | Product | Open |
| 3 | Interactive charts or static mockups? | Product | Open |
| 4 | What analytics metrics are most important? | Product | Open |

---

## 11. Appendix

### A. Related Documents
- `docs/DASHBOARD_UI_PLAN.md` - Technical implementation plan
- `CLAUDE.md` - Repository documentation

### B. Glossary
| Term | Definition |
|------|------------|
| CSR | Customer Service Representative |
| TSR | Technical Support Representative |
| RAG | Retrieval Augmented Generation |
| Widget | Embeddable chat interface for websites |
| Knowledge Base | Collection of documents/sources for AI context |

### C. Revision History
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Nov 28, 2025 | AI Assistant | Initial draft |
