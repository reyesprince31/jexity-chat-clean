import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatWidget, type ChatWidgetProps } from './components/ChatWidget';

export interface InitChatWidgetOptions extends ChatWidgetProps {
  containerId?: string;
  containerElement?: HTMLElement;
}

/**
 * Initialize the chat widget and mount it to a container
 * @param options Configuration options for the widget
 * @returns Cleanup function to unmount the widget
 */
export function initChatWidget(options: InitChatWidgetOptions = {}): () => void {
  const { containerId, containerElement, ...widgetProps } = options;

  // Get the container element
  let container: HTMLElement | null = null;

  if (containerElement) {
    container = containerElement;
  } else if (containerId) {
    container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
  } else {
    // Create a default container
    container = document.createElement('div');
    container.id = 'chat-widget-container';
    document.body.appendChild(container);
  }

  // Mount the React component
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <ChatWidget {...widgetProps} />
    </React.StrictMode>
  );

  // Return cleanup function
  return () => {
    root.unmount();
  };
}

// Export the component for direct use
export { ChatWidget } from './components/ChatWidget';
export type { ChatWidgetProps } from './components/ChatWidget';

// Export API client for advanced usage
export { ApiClient, apiClient } from './lib/api-client';
export * from './types/api';

// Auto-initialize if data-chat-widget attribute is present
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const element = document.querySelector('[data-chat-widget]');
    if (element && element instanceof HTMLElement) {
      const apiUrl = element.getAttribute('data-api-url') || undefined;
      const conversationId =
        element.getAttribute('data-conversation-id') || undefined;

      initChatWidget({
        containerElement: element,
        apiUrl,
        conversationId,
      });
    }
  });
}

// Make initChatWidget available globally for UMD builds
if (typeof window !== 'undefined') {
  (window as Window & typeof globalThis & { initChatWidget: typeof initChatWidget }).initChatWidget = initChatWidget;
}
