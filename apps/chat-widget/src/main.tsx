import './styles.css';
import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import root from 'react-shadow';
import { ChatWidget, type ChatWidgetProps } from './components/ChatWidget';
import { themeToCSSVars } from './types/theme';

// Create a typed Shadow DOM wrapper component
const ShadowRoot = root.div as React.ComponentType<
  React.HTMLProps<HTMLDivElement> & { mode?: 'open' | 'closed' }
>;

// Shadow DOM wrapper that loads CSS
function ShadowWidgetWrapper(props: ChatWidgetProps & { themeStyles: React.CSSProperties }) {
  const { themeStyles, ...widgetProps } = props;
  const [cssContent, setCssContent] = useState<string>('');
  const shadowRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Extract CSS from document stylesheets
    const extractCSS = () => {
      let css = '';

      // Look for style tags and link tags that might contain our CSS
      Array.from(document.styleSheets).forEach((stylesheet) => {
        try {
          // Try to read the CSS rules
          if (stylesheet.cssRules) {
            Array.from(stylesheet.cssRules).forEach((rule) => {
              css += rule.cssText + '\n';
            });
          }
        } catch {
          // CORS or other error - check if it's a link tag with our styles
          if (stylesheet.href && stylesheet.href.includes('styles')) {
            // Fetch the stylesheet
            fetch(stylesheet.href)
              .then(res => res.text())
              .then(text => setCssContent(prev => prev + text))
              .catch(err => console.warn('Could not fetch stylesheet:', err));
          }
        }
      });

      return css;
    };

    // Wait a bit for Tailwind to inject styles in dev mode
    const timeout = setTimeout(() => {
      const css = extractCSS();
      if (css) {
        setCssContent(css);
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <ShadowRoot ref={shadowRootRef as never} style={themeStyles}>
      <style>{cssContent}</style>
      <ChatWidget {...widgetProps} />
    </ShadowRoot>
  );
}

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

  // Apply theme CSS variables if provided
  const themeStyles = options.theme ? themeToCSSVars(options.theme) : {};

  // Mount the React component with Shadow DOM
  const reactRoot = ReactDOM.createRoot(container);
  reactRoot.render(
    <React.StrictMode>
      <ShadowWidgetWrapper {...widgetProps} themeStyles={themeStyles} />
    </React.StrictMode>
  );

  // Return cleanup function
  return () => {
    reactRoot.unmount();
  };
}

// Export the component for direct use
export { ChatWidget } from './components/ChatWidget';
export type { ChatWidgetProps } from './components/ChatWidget';

// Export theme types
export type { ChatWidgetTheme } from './types/theme';

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
