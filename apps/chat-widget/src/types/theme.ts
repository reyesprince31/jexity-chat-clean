/**
 * Theme configuration for ChatWidget
 * Keys mirror the CSS variable naming scheme (grouped by utility).
 */
export interface ChatWidgetTheme {
  bg?: {
    chatMessageUser?: string;
    chatMessageAgent?: string;
    chatHeader?: string;
    chatHeaderIconHover?: string;
    chatTrigger?: string;
    chatTriggerHover?: string;
    chatInput?: string;
    chatSendButton?: string;
    chatSendButtonHover?: string;
    chatSendButtonDisabled?: string;
    chatContainer?: string;
    citationPill?: string;
    citationPillHover?: string;
    citationPillMuted?: string;
  };
  text?: {
    chatMessageUser?: string;
    chatMessageAgent?: string;
    chatHeader?: string;
    chatInput?: string;
    chatInputPlaceholder?: string;
    chatInputCounter?: string;
    citationPill?: string;
    citationPillHover?: string;
    citationPillMuted?: string;
  };
  border?: {
    chatHeader?: string;
    chatMessageAgent?: string;
    chatMessageUser?: string;
    chatInput?: string;
    citationPill?: string;
    citationPillHover?: string;
    citationPillMuted?: string;
  };
  icon?: {
    chatHeader?: string;
    chatTrigger?: string;
    chatSendButton?: string;
    chatSendButtonDisabled?: string;
  };
}

/**
 * Maps theme properties to CSS custom property names
 */
export const themeToCSSVars = (
  theme: ChatWidgetTheme
): Record<string, string> => {
  const cssVars: Record<string, string> = {};

  if (theme.bg?.chatMessageUser) {
    cssVars["--jexity-assistant-bg-chat-message-user"] =
      theme.bg.chatMessageUser;
  }
  if (theme.bg?.chatMessageAgent) {
    cssVars["--jexity-assistant-bg-chat-message-agent"] =
      theme.bg.chatMessageAgent;
  }
  if (theme.bg?.chatHeader) {
    cssVars["--jexity-assistant-bg-chat-header"] = theme.bg.chatHeader;
  }
  if (theme.bg?.chatHeaderIconHover) {
    cssVars["--jexity-assistant-bg-chat-header-icon-hover"] =
      theme.bg.chatHeaderIconHover;
  }
  if (theme.bg?.chatTrigger) {
    cssVars["--jexity-assistant-bg-chat-trigger"] = theme.bg.chatTrigger;
  }
  if (theme.bg?.chatTriggerHover) {
    cssVars["--jexity-assistant-bg-chat-trigger-hover"] =
      theme.bg.chatTriggerHover;
  }
  if (theme.bg?.chatInput) {
    cssVars["--jexity-assistant-bg-chat-input"] = theme.bg.chatInput;
  }
  if (theme.bg?.chatSendButton) {
    cssVars["--jexity-assistant-bg-chat-send-button"] =
      theme.bg.chatSendButton;
  }
  if (theme.bg?.chatSendButtonHover) {
    cssVars["--jexity-assistant-bg-chat-send-button-hover"] =
      theme.bg.chatSendButtonHover;
  }
  if (theme.bg?.chatSendButtonDisabled) {
    cssVars["--jexity-assistant-bg-chat-send-button-disabled"] =
      theme.bg.chatSendButtonDisabled;
  }
  if (theme.bg?.chatContainer) {
    cssVars["--jexity-assistant-bg-chat-container"] =
      theme.bg.chatContainer;
  }
  if (theme.bg?.citationPill) {
    cssVars["--jexity-assistant-bg-citation-pill"] =
      theme.bg.citationPill;
  }
  if (theme.bg?.citationPillHover) {
    cssVars["--jexity-assistant-bg-citation-pill-hover"] =
      theme.bg.citationPillHover;
  }
  if (theme.bg?.citationPillMuted) {
    cssVars["--jexity-assistant-bg-citation-pill-muted"] =
      theme.bg.citationPillMuted;
  }
  if (theme.text?.chatMessageUser) {
    cssVars["--jexity-assistant-text-chat-message-user"] =
      theme.text.chatMessageUser;
  }
  if (theme.text?.chatMessageAgent) {
    cssVars["--jexity-assistant-text-chat-message-agent"] =
      theme.text.chatMessageAgent;
  }
  if (theme.text?.chatHeader) {
    cssVars["--jexity-assistant-text-color-chat-header"] =
      theme.text.chatHeader;
  }
  if (theme.text?.chatInput) {
    cssVars["--jexity-assistant-text-chat-input"] = theme.text.chatInput;
  }
  if (theme.text?.chatInputPlaceholder) {
    cssVars["--jexity-assistant-placeholder-chat-input"] =
      theme.text.chatInputPlaceholder;
  }
  if (theme.text?.chatInputCounter) {
    cssVars["--jexity-assistant-text-chat-input-counter"] =
      theme.text.chatInputCounter;
  }
  if (theme.text?.citationPill) {
    cssVars["--jexity-assistant-text-citation-pill"] =
      theme.text.citationPill;
  }
  if (theme.text?.citationPillHover) {
    cssVars["--jexity-assistant-text-citation-pill-hover"] =
      theme.text.citationPillHover;
  }
  if (theme.text?.citationPillMuted) {
    cssVars["--jexity-assistant-text-citation-pill-muted"] =
      theme.text.citationPillMuted;
  }
  if (theme.border?.chatHeader) {
    cssVars["--jexity-assistant-border-color-chat-header"] =
      theme.border.chatHeader;
  }
  if (theme.border?.chatMessageAgent) {
    cssVars["--jexity-assistant-border-chat-message-agent"] =
      theme.border.chatMessageAgent;
  }
  if (theme.border?.chatMessageUser) {
    cssVars["--jexity-assistant-border-chat-message-user"] =
      theme.border.chatMessageUser;
  }
  if (theme.border?.chatInput) {
    cssVars["--jexity-assistant-border-chat-input"] = theme.border.chatInput;
  }
  if (theme.border?.citationPill) {
    cssVars["--jexity-assistant-border-citation-pill"] =
      theme.border.citationPill;
  }
  if (theme.border?.citationPillHover) {
    cssVars["--jexity-assistant-border-citation-pill-hover"] =
      theme.border.citationPillHover;
  }
  if (theme.border?.citationPillMuted) {
    cssVars["--jexity-assistant-border-citation-pill-muted"] =
      theme.border.citationPillMuted;
  }
  if (theme.icon?.chatHeader) {
    cssVars["--jexity-assistant-icon-color-chat-header"] =
      theme.icon.chatHeader;
  }
  if (theme.icon?.chatTrigger) {
    cssVars["--jexity-assistant-icon-color-chat-trigger"] =
      theme.icon.chatTrigger;
  }
  if (theme.icon?.chatSendButton) {
    cssVars["--jexity-assistant-icon-color-chat-send-button"] =
      theme.icon.chatSendButton;
  }
  if (theme.icon?.chatSendButtonDisabled) {
    cssVars["--jexity-assistant-icon-color-chat-send-button-disabled"] =
      theme.icon.chatSendButtonDisabled;
  }

  return cssVars;
};
