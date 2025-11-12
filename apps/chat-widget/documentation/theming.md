# Chat Widget Theming Guide

The chat widget exposes a theme API that lets you override its look-and-feel without touching the source bundle. The theme is defined as a plain object that maps to CSS custom properties (variables) applied to the widget's shadow DOM host.

## Using the Theme API

```ts
import { initChatWidget } from "chat-widget";

initChatWidget({
  containerId: "chat-widget-container",
  apiUrl: "https://example.com/api",
  theme: {
    bg: { chatMessageUser: "#ff0000" },
    text: { chatMessageUser: "#ffffff" },
  },
});
```

Each theme key is optional—provide only the values you want to customize. Any keys you omit fall back to the component’s internal defaults or CSS fallbacks.

## Theme Properties

- **theme.bg.chatMessageUser** → `--jexity-assistant-bg-chat-message-user`
- **theme.text.chatMessageUser** → `--jexity-assistant-text-chat-message-user`

## Shadow DOM Cascade

The widget renders inside a shadow DOM. The theme object is converted into inline CSS variables on the shadow host, which means your values win over the defaults declared in `:host`. You can also set the same variables directly on a hosting page if you prefer not to use the JavaScript API.

## Manually Managing CSS Variables

Define or override the widget's CSS custom properties on the hosting page or application stylesheet:

```css
#chat-widget-container {
  --jexity-assistant-bg-chat-message-user: #ff0000;
  --jexity-assistant-text-chat-message-user: #ffffff;
}
```

Because CSS variables penetrate the shadow boundary, the widget will pick up your values without needing to pass them via the theme object. Remember that there are no built-in fallbacks for these variables; if you reference one, make sure it is declared in your CSS.

- The user bubble background defaults to `#000000` and the text defaults to `#ffffff` when the variables are unset, thanks to the defaults defined in `styles.css`.

## Auto Initialization

By default the UMD bundle looks for `[data-chat-widget]` and mounts itself automatically. Add `data-auto-init="false"` to opt out when you want to call `initChatWidget` manually—useful for theming, advanced configuration, or spinning up multiple widgets with different settings.
