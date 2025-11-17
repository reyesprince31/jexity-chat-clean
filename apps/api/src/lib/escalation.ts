import type { ChatMessage } from './chat.js';

/**
 * Outcome of the escalation heuristic executed for every user request.
 */
export interface EscalationDecision {
  /** Whether the conversation should be routed to a human agent. */
  shouldEscalate: boolean;
  /** Optional explanation logged for operators and surfaced to the UI. */
  reason?: string;
  /** Keywords that triggered the escalation (useful for debugging heuristics). */
  matchedSignals?: string[];
}

const ESCALATION_KEYWORDS = [
  'human',
  'representative',
  'real person',
  'lawsuit',
  'escalate',
  'manager',
  'complaint',
  'urgent',
  'support ticket',
  'agent',
  'supervisor',
  'contact number',
];

/**
 * Lightweight guardrail that inspects the latest user message (plus a short history window)
 * and decides whether the request should be handed to a human operator instead of the model.
 *
 * The current strategy is intentionally simple—a keyword scan plus a high-sensitivity
 * fallback that escalates when the user repeats themselves without resolution.
 * Replace this with a proper classifier or moderation endpoint once available; the
 * surrounding code expects the same return shape.
 */
export function evaluateEscalationNeed(params: {
  userMessage: string;
  conversationHistory: ChatMessage[];
}): EscalationDecision {
  const { userMessage, conversationHistory } = params;
  const normalized = userMessage.toLowerCase();

  const matchedSignals = ESCALATION_KEYWORDS.filter((keyword) =>
    normalized.includes(keyword)
  );

  if (matchedSignals.length > 0) {
    return {
      shouldEscalate: true,
      reason: 'User explicitly requested a human agent.',
      matchedSignals,
    };
  }

  const recentUserMessages = conversationHistory
    .filter((msg) => msg.role === 'user')
    .slice(-3)
    .map((msg) => msg.content.toLowerCase());

  const userRepeating = recentUserMessages.some((pastMessage) =>
    pastMessage === normalized
  );

  if (userRepeating) {
    return {
      shouldEscalate: true,
      reason: 'User repeated the same question multiple times.',
      matchedSignals: ['repeat-detection'],
    };
  }

  return {
    shouldEscalate: false,
  };
}
