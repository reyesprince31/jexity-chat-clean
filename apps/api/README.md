# API

A Fastify API server.

## Getting Started

First, install dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

The API will be available at [http://localhost:3001](http://localhost:3001).

## Endpoints

- `GET /` - Hello World endpoint
- `GET /health` - Health check endpoint
- `GET /conversations/:id/events` - SSE stream for conversation-level events (agent joins)
- `POST /conversations/:id/agent/join` - Mark a human agent as joined (emits SSE event)
- `POST /conversations/:id/typing` - Record that the end-user is typing and fan out `helpdesk.typing`.
- `POST /helpdesk/conversations/:id/typing` - Record agent typing activity and emit a `typing` websocket event to the widget.

## Conversation Flow

```mermaid
flowchart TD
    A[Widget boot] --> B[POST /conversations]
    B --> C[Widget stores id + escalation metadata]
    C --> D[POST /conversations/:id/messages]
    D --> E{Already escalated/resolved?}
    E -- resolved --> R[Emit resolved SSE + lock widget]
    E -- escalated --> F[Emit escalated SSE]
    E -- no --> G[Persist user message]
    G --> H[Fetch conversation history]
    H --> I[evaluateEscalationNeed]
    I --> J{Should escalate?}
    J -- yes --> K[setConversationEscalationStatus]
    K --> L[Broadcast helpdesk.websocket + widget SSE escalated]
    J -- no --> M[streamChatWithRAG]
    M --> N[Persist assistant + sources]
    N --> O[SSE token/done/title events]
    O --> P[Widget renders response]
```

## Realtime Channels

```mermaid
flowchart LR
    subgraph API
      WS1[/ws/helpdesk/]
      WS2[/ws/conversations/:id/]
    end
    Widget["Widget"]
    HelpdeskUI["Helpdesk UI"]
    Widget -->|join| WS2;
    HelpdeskUI -->|join| WS1;
    WS1 -->|helpdesk.message_created| HelpdeskUI;
    WS1 -->|helpdesk.conversation_claimed| HelpdeskUI;
    WS1 -->|helpdesk.conversation_resolved| HelpdeskUI;
    WS1 -->|helpdesk.typing| HelpdeskUI;
    WS2 -->|agent_joined| Widget;
    WS2 -->|agent_message| Widget;
    WS2 -->|resolved| Widget;
    WS2 -->|typing| Widget;
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT` - Port number for the API server (default: 3001)

## Building

To build the production bundle:

```bash
pnpm build
```

To run the production server:

```bash
pnpm start
```
