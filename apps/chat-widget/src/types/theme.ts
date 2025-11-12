/**
 * Theme configuration for ChatWidget
 * Keys mirror the CSS variable naming scheme (grouped by utility).
 */
export interface ChatWidgetTheme {
  bg?: {
    chatMessageUser?: string;
  };
  text?: {
    chatMessageUser?: string;
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
  if (theme.text?.chatMessageUser) {
    cssVars["--jexity-assistant-text-chat-message-user"] =
      theme.text.chatMessageUser;
  }

  return cssVars;
};
