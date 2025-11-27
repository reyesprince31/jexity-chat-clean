# Helpdesk Dashboard

Next.js dashboard that surfaces escalated widget conversations in real time so human agents can claim, reply, and resolve threads.

## Key Features

- Live list of escalated conversations pulled from `GET /helpdesk/escalations`
- Websocket feed (`/ws/helpdesk`) for new escalations, agent claims, messages, and resolutions
- Claim/resolve workflow that locks the widget and displays system banners
- Inline transcript viewer with system breadcrumbs (escalated, joined, resolved)
- Real-time typing indicators for both the customer and the assigned agent after escalation.

## Local Development

```bash
pnpm install
pnpm dev --filter helpdesk
```

Set the following env vars (e.g., via `.env.local`):

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_WS_URL=ws://localhost:3001
```

## Agent Workflow

```mermaid
sequenceDiagram
    participant Widget
    participant API
    participant Helpdesk

    Widget->>API: POST /conversations/:id/messages (escalated)
    Widget->>API: POST /conversations/:id/typing (customer typing)
    API-->>Helpdesk: ws helpdesk.conversation_escalated
    API-->>Helpdesk: ws helpdesk.typing (user)
    Helpdesk->>API: POST /helpdesk/conversations/:id/agent/join
    API-->>Widget: ws agent_joined
    Helpdesk->>API: POST /helpdesk/conversations/:id/messages
    API-->>Widget: ws agent_message
    Helpdesk->>API: POST /helpdesk/conversations/:id/typing
    API-->>Widget: ws typing (human_agent)
    Helpdesk->>API: POST /helpdesk/conversations/:id/resolve
    API-->>Helpdesk: ws helpdesk.conversation_resolved
    API-->>Widget: ws resolved
```

### Typing Indicators

- The widget sends `POST /conversations/:id/typing` heartbeats once a thread is escalated so the dashboard can show "Customer is typing...".
- When an agent with the claim drafts a reply, the dashboard POSTs `/helpdesk/conversations/:id/typing`, and the API forwards a `typing` event over `/ws/conversations/:id` so the widget can surface an agent typing badge.

## Files of Interest

- `app/page.tsx` – Shell that loads conversations, opens websockets, and wires state.
- `components/conversations/ConversationsPanel.tsx` – Sidebar list.
- `components/conversations/Conversation.tsx` – Transcript, claim, resolve UI.
- `lib/api.ts` – Thin client for helpdesk-specific endpoints.

## Testing & Linting

```bash
pnpm lint --filter helpdesk
```

End-to-end flows currently rely on the API + widget running locally; start those apps before testing claim/resolve behavior.
