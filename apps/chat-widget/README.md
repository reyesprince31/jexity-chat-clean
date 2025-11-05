# Chat Widget

An embeddable AI chat widget with RAG (Retrieval Augmented Generation) support, built with React, TypeScript, and Tailwind CSS. Features full style isolation using Shadow DOM.

## Features

- 🎨 **Customizable Theming** - Override colors, fonts, and styles via props or CSS variables
- 🔒 **Style Isolation** - Uses Shadow DOM to prevent CSS conflicts with host pages
- 🤖 **AI-Powered** - Integrates with GPT-4o for intelligent responses
- 📚 **RAG Support** - Retrieval Augmented Generation for context-aware answers
- ⚡ **Streaming Responses** - Real-time streaming of AI responses via SSE
- 📝 **Source Citations** - Displays sources used to generate responses
- 💬 **Conversation History** - Maintains context across multiple messages
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎭 **TypeScript** - Full type safety for better DX

## Installation

```bash
npm install chat-widget
# or
pnpm add chat-widget
# or
yarn add chat-widget
```

## Quick Start

### HTML (via data attribute)

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="https://unpkg.com/chat-widget"></script>
</head>
<body>
  <div
    data-chat-widget
    data-api-url="https://your-api.com"
  ></div>
</body>
</html>
```

### JavaScript/TypeScript

```typescript
import { initChatWidget } from 'chat-widget';

const cleanup = initChatWidget({
  apiUrl: 'https://your-api.com',
  containerId: 'chat-widget-container',
  onConversationCreate: (conversationId) => {
    console.log('Conversation created:', conversationId);
  }
});

// Later, to unmount:
cleanup();
```

### React

```tsx
import { ChatWidget } from 'chat-widget';

function App() {
  return (
    <ChatWidget
      apiUrl="https://your-api.com"
      onConversationCreate={(id) => console.log('Created:', id)}
    />
  );
}
```

## Theming & Customization

The widget uses Shadow DOM for style isolation, but provides two ways to customize its appearance:

### Method 1: Theme Props (Recommended)

Pass a \`theme\` object to customize colors, fonts, and other styles:

```typescript
import { initChatWidget } from 'chat-widget';

initChatWidget({
  apiUrl: 'https://your-api.com',
  theme: {
    // Primary colors
    primaryColor: '#ff0000',
    primaryHoverColor: '#cc0000',

    // Background colors
    backgroundColor: '#ffffff',
    backgroundSecondaryColor: '#f9fafb',
    messageUserBackground: 'linear-gradient(to right, #ff6b6b, #ee5a6f)',
    messageAssistantBackground: '#f0f0f0',

    // Text colors
    textColor: '#1a1a1a',
    textSecondaryColor: '#6b7280',

    // Border colors
    borderColor: '#d1d5db',

    // Input styling
    inputBackgroundColor: '#ffffff',
    inputBorderColor: '#d1d5db',
    inputFocusBorderColor: '#ff0000',

    // Button styling
    buttonBackgroundColor: '#ff0000',
    buttonHoverBackgroundColor: '#cc0000',
    buttonTextColor: '#ffffff',

    // Sources/Citations
    sourcesBackgroundColor: '#fff3cd',
    sourcesBorderColor: '#ffb020',
    sourcesTextColor: '#856404',

    // Error messages
    errorBackgroundColor: '#fee',
    errorBorderColor: '#fcc',
    errorTextColor: '#c00',

    // Other customization
    borderRadius: '12px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '16px'
  }
});
```

### Method 2: CSS Variables

Override CSS custom properties from the host page. This works because CSS variables penetrate Shadow DOM boundaries:

```html
<style>
  /* Override widget colors */
  #chat-widget-container {
    --chatwidget-primary: #ff0000;
    --chatwidget-primary-hover: #cc0000;
    --chatwidget-bg: #ffffff;
    --chatwidget-text: #1a1a1a;
    --chatwidget-border-radius: 12px;
    --chatwidget-font-family: 'Inter', sans-serif;
  }
</style>

<div id="chat-widget-container"></div>
<script>
  initChatWidget({
    containerId: 'chat-widget-container',
    apiUrl: 'https://your-api.com'
  });
</script>
```

### Available CSS Variables

All available CSS variables with their default values:

```css
:host {
  /* Primary colors */
  --chatwidget-primary: #4f46e5;
  --chatwidget-primary-hover: #4338ca;

  /* Text colors */
  --chatwidget-text: #1f2937;
  --chatwidget-text-secondary: #6b7280;

  /* Background colors */
  --chatwidget-bg: #ffffff;
  --chatwidget-bg-secondary: #f9fafb;
  --chatwidget-message-user-bg: linear-gradient(to bottom right, #6366f1, #a855f7);
  --chatwidget-message-assistant-bg: #ffffff;

  /* Border colors */
  --chatwidget-border: #d1d5db;

  /* Input colors */
  --chatwidget-input-bg: #ffffff;
  --chatwidget-input-border: #d1d5db;
  --chatwidget-input-focus-border: #6366f1;

  /* Button colors */
  --chatwidget-button-bg: linear-gradient(to bottom right, #6366f1, #a855f7);
  --chatwidget-button-hover-bg: linear-gradient(to bottom right, #4f46e5, #9333ea);
  --chatwidget-button-text: #ffffff;

  /* Sources colors */
  --chatwidget-sources-bg: #fffbeb;
  --chatwidget-sources-border: #fbbf24;
  --chatwidget-sources-text: #92400e;

  /* Error colors */
  --chatwidget-error-bg: #fef2f2;
  --chatwidget-error-border: #fca5a5;
  --chatwidget-error-text: #991b1b;

  /* Other */
  --chatwidget-border-radius: 0.75rem;
  --chatwidget-font-family: system-ui, -apple-system, sans-serif;
  --chatwidget-font-size: 14px;
}
```

## API Reference

### \`initChatWidget(options)\`

Initializes and mounts the chat widget.

**Parameters:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`apiUrl\` | \`string\` | \`undefined\` | Base URL for the chat API |
| \`conversationId\` | \`string\` | \`undefined\` | Existing conversation ID to resume |
| \`containerId\` | \`string\` | \`undefined\` | ID of the container element |
| \`containerElement\` | \`HTMLElement\` | \`undefined\` | Container element (alternative to containerId) |
| \`theme\` | \`ChatWidgetTheme\` | \`undefined\` | Theme customization object |
| \`onConversationCreate\` | \`(id: string) => void\` | \`undefined\` | Callback when conversation is created |

**Returns:** \`() => void\` - Cleanup function to unmount the widget

### \`ChatWidgetTheme\` Interface

```typescript
interface ChatWidgetTheme {
  primaryColor?: string;
  primaryHoverColor?: string;
  textColor?: string;
  textSecondaryColor?: string;
  backgroundColor?: string;
  backgroundSecondaryColor?: string;
  messageUserBackground?: string;
  messageAssistantBackground?: string;
  borderColor?: string;
  inputBackgroundColor?: string;
  inputBorderColor?: string;
  inputFocusBorderColor?: string;
  buttonBackgroundColor?: string;
  buttonHoverBackgroundColor?: string;
  buttonTextColor?: string;
  sourcesBackgroundColor?: string;
  sourcesBorderColor?: string;
  sourcesTextColor?: string;
  errorBackgroundColor?: string;
  errorBorderColor?: string;
  errorTextColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  fontSize?: string;
}
```

## Examples

### Custom Brand Colors

```typescript
initChatWidget({
  apiUrl: 'https://api.example.com',
  theme: {
    primaryColor: '#7c3aed',
    primaryHoverColor: '#6d28d9',
    messageUserBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'Poppins, sans-serif'
  }
});
```

### Dark Mode

```typescript
initChatWidget({
  apiUrl: 'https://api.example.com',
  theme: {
    backgroundColor: '#1a1a1a',
    backgroundSecondaryColor: '#2d2d2d',
    textColor: '#ffffff',
    textSecondaryColor: '#a0a0a0',
    borderColor: '#404040',
    messageAssistantBackground: '#2d2d2d',
    inputBackgroundColor: '#2d2d2d',
    inputBorderColor: '#404040',
    inputFocusBorderColor: '#667eea'
  }
});
```

### Minimalist Theme

```typescript
initChatWidget({
  apiUrl: 'https://api.example.com',
  theme: {
    primaryColor: '#000000',
    borderRadius: '4px',
    messageUserBackground: '#000000',
    buttonBackgroundColor: '#000000',
    fontFamily: 'SF Pro Display, system-ui, sans-serif'
  }
});
```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Type check
pnpm check-types

# Lint
pnpm lint
```

## Architecture

- **Shadow DOM**: Ensures style isolation from the host page
- **React 19**: Latest React with concurrent features
- **Tailwind CSS v4**: Utility-first CSS framework
- **TypeScript**: Full type safety
- **Vite**: Fast build tool and dev server
- **react-shadow**: React integration for Shadow DOM

## Browser Support

- Chrome/Edge 88+
- Firefox 63+
- Safari 13.1+
- No IE11 support (Shadow DOM requirement)

## License

MIT
