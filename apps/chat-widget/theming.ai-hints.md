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

## 6. Wire Up the JavaScript Theme API (Optional)

The token should also be configurable via `initChatWidget({ theme })`, add a matching entry to `apps/chat-widget/src/types/theme.ts`:

```ts
export interface ChatWidgetTheme {
  bg?: {
    chatMessageUser?: string;
  };
  text?: {
    chatMessageUser?: string;
  };
}
```

In `themeToCSSVars`, map the new keys to the CSS variables:

```ts
if (theme.bg?.chatMessageUser) {
  cssVars["--jexity-assistant-bg-chat-message-user"] = theme.bg.chatMessageUser;
}
if (theme.text?.chatMessageUser) {
  cssVars["--jexity-assistant-text-chat-message-user"] =
    theme.text.chatMessageUser;
}
```

This keeps the TypeScript API aligned with the `--jexity-assistant-…` naming scheme so JavaScript theming and CSS overrides stay in sync.

Repeat this process for any additional component styles that need to participate in theming.
