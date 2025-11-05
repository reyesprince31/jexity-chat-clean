/**
 * Theme configuration for ChatWidget
 * All colors support CSS color values (hex, rgb, hsl, etc.)
 * Hosts can override these via CSS custom properties on the widget container
 */
export interface ChatWidgetTheme {
  // Primary colors
  primaryColor?: string;
  primaryHoverColor?: string;

  // Text colors
  textColor?: string;
  textSecondaryColor?: string;

  // Background colors
  backgroundColor?: string;
  backgroundSecondaryColor?: string;
  messageUserBackground?: string;
  messageAssistantBackground?: string;

  // Border colors
  borderColor?: string;

  // Input colors
  inputBackgroundColor?: string;
  inputBorderColor?: string;
  inputFocusBorderColor?: string;

  // Button colors
  buttonBackgroundColor?: string;
  buttonHoverBackgroundColor?: string;
  buttonTextColor?: string;

  // Sources colors
  sourcesBackgroundColor?: string;
  sourcesBorderColor?: string;
  sourcesTextColor?: string;

  // Error colors
  errorBackgroundColor?: string;
  errorBorderColor?: string;
  errorTextColor?: string;

  // Other
  borderRadius?: string;
  fontFamily?: string;
  fontSize?: string;
}

/**
 * Maps theme properties to CSS custom property names
 */
export const themeToCSSVars = (theme: ChatWidgetTheme): Record<string, string> => {
  const cssVars: Record<string, string> = {};

  if (theme.primaryColor) cssVars['--chatwidget-primary'] = theme.primaryColor;
  if (theme.primaryHoverColor) cssVars['--chatwidget-primary-hover'] = theme.primaryHoverColor;
  if (theme.textColor) cssVars['--chatwidget-text'] = theme.textColor;
  if (theme.textSecondaryColor) cssVars['--chatwidget-text-secondary'] = theme.textSecondaryColor;
  if (theme.backgroundColor) cssVars['--chatwidget-bg'] = theme.backgroundColor;
  if (theme.backgroundSecondaryColor) cssVars['--chatwidget-bg-secondary'] = theme.backgroundSecondaryColor;
  if (theme.messageUserBackground) cssVars['--chatwidget-message-user-bg'] = theme.messageUserBackground;
  if (theme.messageAssistantBackground) cssVars['--chatwidget-message-assistant-bg'] = theme.messageAssistantBackground;
  if (theme.borderColor) cssVars['--chatwidget-border'] = theme.borderColor;
  if (theme.inputBackgroundColor) cssVars['--chatwidget-input-bg'] = theme.inputBackgroundColor;
  if (theme.inputBorderColor) cssVars['--chatwidget-input-border'] = theme.inputBorderColor;
  if (theme.inputFocusBorderColor) cssVars['--chatwidget-input-focus-border'] = theme.inputFocusBorderColor;
  if (theme.buttonBackgroundColor) cssVars['--chatwidget-button-bg'] = theme.buttonBackgroundColor;
  if (theme.buttonHoverBackgroundColor) cssVars['--chatwidget-button-hover-bg'] = theme.buttonHoverBackgroundColor;
  if (theme.buttonTextColor) cssVars['--chatwidget-button-text'] = theme.buttonTextColor;
  if (theme.sourcesBackgroundColor) cssVars['--chatwidget-sources-bg'] = theme.sourcesBackgroundColor;
  if (theme.sourcesBorderColor) cssVars['--chatwidget-sources-border'] = theme.sourcesBorderColor;
  if (theme.sourcesTextColor) cssVars['--chatwidget-sources-text'] = theme.sourcesTextColor;
  if (theme.errorBackgroundColor) cssVars['--chatwidget-error-bg'] = theme.errorBackgroundColor;
  if (theme.errorBorderColor) cssVars['--chatwidget-error-border'] = theme.errorBorderColor;
  if (theme.errorTextColor) cssVars['--chatwidget-error-text'] = theme.errorTextColor;
  if (theme.borderRadius) cssVars['--chatwidget-border-radius'] = theme.borderRadius;
  if (theme.fontFamily) cssVars['--chatwidget-font-family'] = theme.fontFamily;
  if (theme.fontSize) cssVars['--chatwidget-font-size'] = theme.fontSize;

  return cssVars;
};
