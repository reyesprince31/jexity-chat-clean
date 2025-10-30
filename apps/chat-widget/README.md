# Chat Widget

An embeddable AI chat widget built with React, Vite, and TypeScript. This widget connects to the Fastify API server to provide conversational AI with RAG (Retrieval Augmented Generation) capabilities.

## Features

- Real-time streaming responses using Server-Sent Events (SSE)
- RAG-powered responses with source citations
- Beautiful, responsive UI with smooth animations
- Easy to embed in any website
- TypeScript support with full type definitions
- Standalone components (no external dependencies except React)

## Development

### Prerequisites

- Node.js >= 18
- pnpm (or npm/yarn)
- The API server running (see `apps/api`)

### Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

3. Configure the API URL in `.env`:

```env
VITE_API_URL=http://localhost:3001
```

### Running the Development Server

```bash
# Start the widget dev server on port 3000
pnpm dev

# Make sure the API server is also running
cd ../api
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the widget in development mode.

### Building for Production

```bash
pnpm build
```

This will create a `dist/` folder with:
- `chat-widget.es.js` - ES module build
- `chat-widget.umd.js` - UMD build for `<script>` tags
- Type definitions (`.d.ts` files)

## Usage

### Method 1: HTML Data Attribute (Simplest)

The easiest way to embed the widget is using the `data-chat-widget` attribute:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <!-- Widget will auto-initialize here -->
  <div data-chat-widget
       data-api-url="http://localhost:3001"
       data-conversation-id="optional-conversation-id">
  </div>

  <!-- Load React and ReactDOM from CDN -->
  <script crossorigin src="https://unpkg.com/react@19/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"></script>

  <!-- Load the chat widget -->
  <script src="./dist/chat-widget.umd.js"></script>
</body>
</html>
```

### Method 2: JavaScript Initialization

For more control, use the JavaScript API:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <div id="chat-container"></div>

  <script crossorigin src="https://unpkg.com/react@19/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"></script>
  <script src="./dist/chat-widget.umd.js"></script>

  <script>
    // Initialize the widget
    const cleanup = window.initChatWidget({
      containerId: 'chat-container',
      apiUrl: 'http://localhost:3001',
      onConversationCreate: (conversationId) => {
        console.log('Conversation created:', conversationId);
        // Save conversation ID to localStorage, etc.
      }
    });

    // Later, to remove the widget:
    // cleanup();
  </script>
</body>
</html>
```

### Method 3: ES Module (React Apps)

If you're using a bundler like Webpack or Vite:

```typescript
import { initChatWidget, ChatWidget } from 'chat-widget';

// Option 1: Use the init function
const cleanup = initChatWidget({
  containerId: 'chat-container',
  apiUrl: 'http://localhost:3001',
  conversationId: 'existing-conversation-id', // optional
  onConversationCreate: (id) => {
    console.log('New conversation:', id);
  }
});

// Option 2: Use as a React component
function App() {
  return (
    <div>
      <h1>My App</h1>
      <ChatWidget
        apiUrl="http://localhost:3001"
        onConversationCreate={(id) => console.log(id)}
      />
    </div>
  );
}
```

## API Reference

### `initChatWidget(options)`

Initializes and mounts the chat widget.

**Options:**

- `containerId?: string` - ID of the DOM element to mount the widget to
- `containerElement?: HTMLElement` - Direct reference to the container element
- `apiUrl?: string` - URL of the API server (defaults to `VITE_API_URL` env var)
- `conversationId?: string` - Existing conversation ID to load
- `onConversationCreate?: (id: string) => void` - Callback when a new conversation is created

**Returns:** `() => void` - Cleanup function to unmount the widget

### `ChatWidget` Component Props

When using the component directly in React:

```typescript
interface ChatWidgetProps {
  apiUrl?: string;
  conversationId?: string;
  onConversationCreate?: (conversationId: string) => void;
}
```

## Customization

### Styling

The widget comes with default styles in `src/components/ChatWidget.css`. To customize:

1. **Override CSS variables** - The widget uses standard CSS. You can override styles by targeting the class names:

```css
.chat-widget {
  /* Your custom styles */
  max-width: 800px;
}

.chat-header {
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
}
```

2. **Modify the source** - For deeper customization, edit `src/components/ChatWidget.css` and rebuild.

### API Client

For advanced usage, you can use the API client directly:

```typescript
import { ApiClient } from 'chat-widget';

const client = new ApiClient('http://localhost:3001');

// Create a conversation
const { conversation } = await client.createConversation({
  title: 'My Conversation'
});

// Send a message and handle streaming
for await (const event of client.streamMessage(conversation.id, {
  message: 'Hello!',
  useRAG: true,
  ragOptions: { limit: 5, similarityThreshold: 0.7 }
})) {
  if (event.type === 'token') {
    console.log(event.content);
  } else if (event.type === 'done') {
    console.log('Sources:', event.sources);
  }
}
```

## Scripts

- `pnpm dev` - Start development server on port 3000
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm check-types` - Run TypeScript type checking

## Architecture

- **Entry Point:** `src/main.tsx` - Exports the initialization function and components
- **Component:** `src/components/ChatWidget.tsx` - Main React component
- **API Client:** `src/lib/api-client.ts` - Handles communication with the API
- **Types:** `src/types/api.ts` - TypeScript type definitions

## Integration with Turborepo

This app is part of a Turborepo monorepo. You can run it alongside other apps:

```bash
# Run all apps
pnpm dev

# Run just the widget
turbo dev --filter=chat-widget

# Build all apps
pnpm build

# Build just the widget
turbo build --filter=chat-widget
```

## Troubleshooting

### Widget not appearing

1. Make sure React and ReactDOM are loaded before the widget script
2. Check the browser console for errors
3. Verify the container element exists in the DOM

### Connection errors

1. Ensure the API server is running (default: http://localhost:3001)
2. Check CORS settings on the API server
3. Verify the `VITE_API_URL` in `.env` is correct

### Build issues

1. Run `pnpm check-types` to check for TypeScript errors
2. Run `pnpm lint` to check for linting issues
3. Clear the build cache: `rm -rf dist node_modules/.vite`

## License

Private - Part of the ai-chat monorepo
