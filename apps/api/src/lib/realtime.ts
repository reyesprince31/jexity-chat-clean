import type { FastifyInstance } from "fastify";
import type WebSocket from "ws";
import type { HelpdeskSocketEvent, StreamEvent } from "@repo/dto";

type ConversationSubscribers = Map<string, Set<WebSocket>>;

/**
 * Adds close/error listeners to a socket and invokes `cleanup` once, regardless of
 * how the connection terminates. This prevents leaked references in the gateway.
 */
function handleSocketLifecycle(
  socket: WebSocket | undefined,
  cleanup: () => void
) {
  if (!socket || typeof (socket as unknown as { on?: unknown }).on !== "function") {
    return;
  }

  const tidy = () => {
    cleanup();
    if (typeof socket.off === "function") {
      socket.off("close", tidy);
      socket.off("error", tidy);
    } else if (typeof socket.removeListener === "function") {
      socket.removeListener("close", tidy);
      socket.removeListener("error", tidy);
    }
  };

  socket.on("close", tidy);
  socket.on("error", tidy);
}

/**
 * Fan-out hub for websocket transports. Keeps track of helpdesk dashboards and
 * per-conversation subscribers (chat widget) so API routes can broadcast events
 * without duplicating wiring logic.
 */
class RealtimeGateway {
  /** Sockets for helpdesk dashboards subscribed to global escalations feed. */
  private helpdeskClients = new Set<WebSocket>();
  /** Per-conversation sockets for embedded widgets keyed by conversation ID. */
  private conversationClients: ConversationSubscribers = new Map();

  /**
   * Registers the `/ws/helpdesk` and `/ws/conversations/:id` endpoints on the
   * Fastify instance. Each connection is added to the proper set so later calls
   * to `broadcastHelpdesk`/`emitConversationEvent` know where to fan out.
   */
  register(app: FastifyInstance) {
    app.get("/ws/helpdesk", { websocket: true }, (socket) => {
      this.helpdeskClients.add(socket);
      handleSocketLifecycle(socket, () => {
        this.helpdeskClients.delete(socket);
      });
    });

    app.get<{ Params: { id: string } }>(
      "/ws/conversations/:id",
      { websocket: true },
      (socket, request) => {
        const { id } = request.params;
        const bucket = this.conversationClients.get(id) ?? new Set<WebSocket>();
        bucket.add(socket);
        this.conversationClients.set(id, bucket);

        handleSocketLifecycle(socket, () => {
          bucket.delete(socket);
          if (bucket.size === 0) {
            this.conversationClients.delete(id);
          }
        });
      }
    );
  }

  /** Sends a helpdesk event to every connected dashboard. */
  broadcastHelpdesk(event: HelpdeskSocketEvent) {
    if (this.helpdeskClients.size === 0) {
      return;
    }

    const payload = JSON.stringify(event);
    for (const socket of this.helpdeskClients) {
      try {
        socket.send(payload);
      } catch {
        socket.close();
      }
    }
  }

  /** Emits a conversation-scoped stream event to all widgets attached to that ID. */
  emitConversationEvent(conversationId: string, event: StreamEvent) {
    const bucket = this.conversationClients.get(conversationId);
    if (!bucket || bucket.size === 0) {
      return;
    }

    const payload = JSON.stringify(event);
    for (const socket of bucket) {
      try {
        socket.send(payload);
      } catch {
        socket.close();
      }
    }
  }
}

export const realtimeGateway = new RealtimeGateway();
