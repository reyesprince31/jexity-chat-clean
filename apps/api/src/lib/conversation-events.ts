import type { FastifyReply } from 'fastify';

export interface ConversationEvent {
  type: string;
  [key: string]: unknown;
}

interface Subscriber {
  reply: FastifyReply;
}

/**
 * In-memory fan-out hub that lets multiple SSE subscribers listen for
 * conversation-level events (agent joined, etc.).
 */
class ConversationEventHub {
  private subscribers = new Map<string, Set<Subscriber>>();

  subscribe(conversationId: string, reply: FastifyReply): void {
    const bucket = this.subscribers.get(conversationId) ?? new Set<Subscriber>();
    const subscriber: Subscriber = { reply };
    bucket.add(subscriber);
    this.subscribers.set(conversationId, bucket);

    const stream = reply.raw;
    const cleanup = () => {
      bucket.delete(subscriber);
      if (bucket.size === 0) {
        this.subscribers.delete(conversationId);
      }
    };

    stream.on('close', cleanup);
    stream.on('error', cleanup);
  }

  emit(conversationId: string, event: ConversationEvent): void {
    const bucket = this.subscribers.get(conversationId);
    if (!bucket || bucket.size === 0) {
      return;
    }

    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const subscriber of bucket) {
      try {
        subscriber.reply.raw.write(payload);
      } catch (error) {
        subscriber.reply.log?.error({ error }, 'Failed to write SSE event');
      }
    }
  }
}

export const conversationEventHub = new ConversationEventHub();
