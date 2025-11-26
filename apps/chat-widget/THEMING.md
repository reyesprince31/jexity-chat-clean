# Making Components Theming-Compatible

This guide documents the workflow we follow when exposing a component style to host-level theming.

## 1. Identify the Property

Decide which design token needs to be themeable.  
Example: the background color of `ChatBoxMessageUser`’s bubble currently uses a hard-coded value.

## 2. Define a CSS Variable

Create a variable with the `--jexity-assistant-*` prefix:

1. Start with the prefix `--jexity-assistant-`.
2. Append the utility group (e.g., `bg`, `border`, `font`).
3. Finish with a descriptive snake-cased name.

For the user message background this becomes:

```
--jexity-assistant-bg-chat-message-user
--jexity-assistant-text-chat-message-user
```

## 3. Register the Variable in `styles.css`

Add a default value under `:root` in `apps/chat-widget/src/styles.css` (or reuse an existing section if present). This provides default or fallback styling when the host does not override the variable.

```css
:root {
  --jexity-assistant-bg-chat-message-user: #000000;
  --jexity-assistant-text-chat-message-user: #ffffff;
}
```

## 4. Consume the Variable in the Component

Replace the hard-coded utility with the variable.
Using TailwindCSS v4, here is an example:

```tsx
<div className="bg-(--jexity-assistant-bg-chat-message-user) text-(--jexity-assistant-text-chat-message-user)">
  …
</div>
```

The value from `:root` (or any host override) is now applied automatically; keep the original class around until you confirm the variable is wired correctly.

## 5. Verify Overrides in the Demo Page

Update `apps/chat-widget/index.html` and, under the existing comment block, add style overrides for the variables:

```html
<style>
  /* Example host override */
  #chat-widget-demo {
    --jexity-assistant-bg-chat-message-user: #ff0000;
    --jexity-assistant-text-chat-message-user: #ffffff;
  }
</style>
```

Reload the dev server (`pnpm dev` in `apps/chat-widget`) and ensure the user bubble reflects the new background and text colors. Comment or remove the override once you’re done verifying.

## CSS Variable Reference

Each variable can be overridden via CSS or through the matching `theme` prop. Use this table to find the right hook for a given part of the UI.

| CSS variable | Theme key | Description |
| --- | --- | --- |
| `--jexity-assistant-bg-chat-message-user` | `theme.bg.chatMessageUser` | Background for the end-user's outbound bubble. |
| `--jexity-assistant-text-chat-message-user` | `theme.text.chatMessageUser` | Text color inside the user bubble. |
| `--jexity-assistant-border-chat-message-user` | `theme.border.chatMessageUser` | Border stroke for the user bubble. |
| `--jexity-assistant-bg-chat-message-agent` | `theme.bg.chatMessageAgent` | Background of the assistant/agent bubble. |
| `--jexity-assistant-text-chat-message-agent` | `theme.text.chatMessageAgent` | Text color within assistant responses. |
| `--jexity-assistant-border-chat-message-agent` | `theme.border.chatMessageAgent` | Border stroke around the assistant bubble. |
| `--jexity-assistant-bg-chat-header` | `theme.bg.chatHeader` | Header bar background behind the brand + controls. |
| `--jexity-assistant-text-color-chat-header` | `theme.text.chatHeader` | Default text color inside the header (title + logo). |
| `--jexity-assistant-border-color-chat-header` | `theme.border.chatHeader` | Divider line between the header and transcript. |
| `--jexity-assistant-icon-color-chat-header` | `theme.icon.chatHeader` | Icon color for header buttons (options/close). |
| `--jexity-assistant-bg-chat-header-icon-hover` | `theme.bg.chatHeaderIconHover` | Hover fill for the header icon buttons. |
| `--jexity-assistant-bg-chat-container` | `theme.bg.chatContainer` | Shared background for the transcript area and composer wrapper. |
| `--jexity-assistant-bg-chat-trigger` | `theme.bg.chatTrigger` | Floating trigger button background (idle). |
| `--jexity-assistant-bg-chat-trigger-hover` | `theme.bg.chatTriggerHover` | Floating trigger hover background. |
| `--jexity-assistant-icon-color-chat-trigger` | `theme.icon.chatTrigger` | Icon color for the floating trigger. |
| `--jexity-assistant-bg-chat-input` | `theme.bg.chatInput` | Background of the rounded composer pill. |
| `--jexity-assistant-border-chat-input` | `theme.border.chatInput` | Border color for the composer pill. |
| `--jexity-assistant-text-chat-input` | `theme.text.chatInput` | Text color used inside the textarea. |
| `--jexity-assistant-placeholder-chat-input` | `theme.text.chatInputPlaceholder` | Placeholder text color inside the textarea. |
| `--jexity-assistant-text-chat-input-counter` | `theme.text.chatInputCounter` | Color of the character counter below the composer. |
| `--jexity-assistant-bg-chat-send-button` | `theme.bg.chatSendButton` | Send button background (enabled state). |
| `--jexity-assistant-bg-chat-send-button-hover` | `theme.bg.chatSendButtonHover` | Send button hover background. |
| `--jexity-assistant-bg-chat-send-button-disabled` | `theme.bg.chatSendButtonDisabled` | Send button background when disabled. |
| `--jexity-assistant-icon-color-chat-send-button` | `theme.icon.chatSendButton` | Arrow icon color on the send button. |
| `--jexity-assistant-icon-color-chat-send-button-disabled` | `theme.icon.chatSendButtonDisabled` | Arrow icon color while the send button is disabled. |
| `--jexity-assistant-bg-citation-pill` | `theme.bg.citationPill` | Background for clickable citation pills. |
| `--jexity-assistant-text-citation-pill` | `theme.text.citationPill` | Text color for clickable citation pills. |
| `--jexity-assistant-border-citation-pill` | `theme.border.citationPill` | Border color for clickable citation pills. |
| `--jexity-assistant-bg-citation-pill-hover` | `theme.bg.citationPillHover` | Hover background for clickable citation pills. |
| `--jexity-assistant-text-citation-pill-hover` | `theme.text.citationPillHover` | Hover text color for clickable citation pills. |
| `--jexity-assistant-border-citation-pill-hover` | `theme.border.citationPillHover` | Hover border color for clickable citation pills. |
| `--jexity-assistant-bg-citation-pill-muted` | `theme.bg.citationPillMuted` | Background for muted citation pills (e.g., missing sources). |
| `--jexity-assistant-text-citation-pill-muted` | `theme.text.citationPillMuted` | Text color for muted citation pills. |
| `--jexity-assistant-border-citation-pill-muted` | `theme.border.citationPillMuted` | Border color for muted citation pills. |

## 6. Wire Up the JavaScript Theme API (Optional)

The token should also be configurable via `initChatWidget({ theme })`, add a matching entry to `apps/chat-widget/src/types/theme.ts`:

```ts
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
```

In `themeToCSSVars`, map the new keys to the CSS variables:

```ts
if (theme.bg?.chatMessageUser) {
  cssVars["--jexity-assistant-bg-chat-message-user"] = theme.bg.chatMessageUser;
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
  cssVars[
    "--jexity-assistant-icon-color-chat-send-button-disabled"
  ] = theme.icon.chatSendButtonDisabled;
}
```

This keeps the TypeScript API aligned with the `--jexity-assistant-…` naming scheme so JavaScript theming and CSS overrides stay in sync.

Repeat this process for any additional component styles that need to participate in theming.

## 7. Smoke-Test the Overrides Locally

- There is a commented CSS block in `apps/chat-widget/index.html` under the `#chat-widget-demo` styles. It sets a deliberately different palette (sage user bubble, teal header, mint border) so visual regressions are obvious.
- Temporarily uncomment (or tweak) that block whenever you need to prove the CSS variables are flowing through the Shadow DOM. Reload `pnpm dev` and confirm the widget header/background colors switch to the test palette—including the header icon foreground/hover colors, the floating trigger button palette, the agent/user message bubbles, and the composer styling.
- Re-comment the block before committing so the default dev experience stays on-brand (unless the work item explicitly calls for the alternate palette to remain enabled, as in this test scenario).
