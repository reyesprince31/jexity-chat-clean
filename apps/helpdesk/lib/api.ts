import type {
  Conversation,
  HelpdeskConversation,
  HelpdeskEscalationListResponse,
  HelpdeskSocketEvent,
  Message,
} from "@repo/dto";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const WS_BASE_URL = process.env.NEXT_PUBLIC_API_WS_URL || API_BASE_URL;

const normalizedApiBase = API_BASE_URL.replace(/\/+$/, "");
const normalizedWsBase = WS_BASE_URL.replace(/\/+$/, "");

/**
 * Normalizes the websocket host so the dashboard can connect whether the env
 * uses http/https or ws/wss. Falls back to ws://host when no scheme is given.
 */
function buildWsUrl(path: string) {
  if (normalizedWsBase.startsWith("http")) {
    return normalizedWsBase.replace(/^http/, "ws") + path;
  }

  if (normalizedWsBase.startsWith("ws")) {
    return normalizedWsBase + path;
  }

  return `ws://${normalizedWsBase}${path}`;
}

/** Loads the current escalated queue that seeds the dashboard on page load. */
export async function fetchEscalatedConversations(): Promise<
  HelpdeskConversation[]
> {
  const response = await fetch(`${normalizedApiBase}/helpdesk/escalations`);
  if (!response.ok) {
    throw new Error(`Failed to load escalations: ${response.statusText}`);
  }

  const payload = (await response.json()) as HelpdeskEscalationListResponse & {
    success: boolean;
  };

  if (!payload.success) {
    throw new Error("API returned an error while loading escalations");
  }

  return payload.conversations;
}

type JoinConversationResponse =
  | {
      success: true;
      conversation: Conversation;
    }
  | {
      success: false;
      message?: string;
    };

/**
 * Records that an agent claimed an escalated chat. The API responds with the
 * updated conversation metadata so the UI can mark it as "waiting".
 */
export async function claimConversation(
  conversationId: string,
  agentName: string
): Promise<Conversation> {
  const response = await fetch(
    `${normalizedApiBase}/conversations/${conversationId}/agent/join`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agentName }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to claim conversation: ${response.statusText}`);
  }

  const payload = (await response.json()) as JoinConversationResponse;

  if (!payload.success) {
    throw new Error(payload.message || "Conversation already claimed");
  }

  return payload.conversation;
}

type SendAgentMessageResponse =
  | {
      success: true;
      message: Message;
    }
  | {
      success: false;
      message?: string;
    };

/** Persists a human-agent reply and returns the canonical message payload. */
export async function sendAgentMessage(
  conversationId: string,
  agentName: string,
  content: string
): Promise<Message> {
  const response = await fetch(
    `${normalizedApiBase}/helpdesk/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agentName, content }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  const payload = (await response.json()) as SendAgentMessageResponse;

  if (!payload.success) {
    throw new Error(payload.message || "Unable to send message");
  }

  return payload.message;
}

type ResolveConversationResponse =
  | {
      success: true;
      conversation: Conversation;
    }
  | {
      success: false;
      message?: string;
    };

/** Marks the escalation as resolved so every client immediately locks the UI. */
export async function resolveConversation(
  conversationId: string,
  agentName: string
): Promise<Conversation> {
  const response = await fetch(
    `${normalizedApiBase}/helpdesk/conversations/${conversationId}/resolve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ agentName }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to resolve conversation: ${response.statusText}`);
  }

  const payload = (await response.json()) as ResolveConversationResponse;

  if (!payload.success) {
    throw new Error(payload.message || "Unable to resolve conversation");
  }

  return payload.conversation;
}

/**
 * Subscribes to the `/ws/helpdesk` feed and forwards typed events to the
 * provided callback. Returns an unsubscribe function for cleanup.
 */
export function openHelpdeskSocket(
  onEvent: (event: HelpdeskSocketEvent) => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const socket = new WebSocket(buildWsUrl("/ws/helpdesk"));

  const handleMessage = (event: MessageEvent<string>) => {
    try {
      const parsed = JSON.parse(event.data) as HelpdeskSocketEvent;
      onEvent(parsed);
    } catch (error) {
      console.error("Failed to parse helpdesk websocket event", error);
    }
  };

  const handleError = (error: Event) => {
    console.error("Helpdesk websocket error", error);
  };

  socket.addEventListener("message", handleMessage);
  socket.addEventListener("error", handleError);

  return () => {
    socket.removeEventListener("message", handleMessage);
    socket.removeEventListener("error", handleError);
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close();
    }
  };
}
