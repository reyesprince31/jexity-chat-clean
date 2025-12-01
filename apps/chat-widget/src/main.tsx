import "./styles.css";
import { useEffect, useState } from "preact/hooks";
import type { ComponentChildren, ComponentType } from "preact";
import { render } from "preact";
import root from "react-shadow";
import { ChatWidget } from "./screens/ConversationScreen";
import { themeToCSSVars } from "./types/theme";
import { ChatWidgetProps } from "src/components/ChatBox";

// Create a typed Shadow DOM wrapper component
type ThemeStyles = Record<string, string>;

const ShadowRoot = root.div as ComponentType<
  {
    style?: ThemeStyles;
    mode?: "open" | "closed";
    children?: ComponentChildren;
  } & Record<string, unknown>
>;

// Shadow DOM wrapper that loads CSS
function ShadowWidgetWrapper(
  props: ChatWidgetProps & { themeStyles: ThemeStyles }
) {
  const { themeStyles, ...widgetProps } = props;
  const [cssContent, setCssContent] = useState<string>("");
  const [stylesLoaded, setStylesLoaded] = useState(false);

  useEffect(() => {
    // Extract CSS from document stylesheets
    const extractCSS = () => {
      let css = "";

      // Look for style tags and link tags that might contain our CSS
      Array.from(document.styleSheets).forEach((stylesheet) => {
        try {
          // Try to read the CSS rules
          if (stylesheet.cssRules) {
            Array.from(stylesheet.cssRules).forEach((rule) => {
              css += rule.cssText + "\n";
            });
          }
        } catch {
          // CORS or other error - check if it's a link tag with our styles
          if (stylesheet.href && stylesheet.href.includes("styles")) {
            // Fetch the stylesheet
            fetch(stylesheet.href)
              .then((res) => res.text())
              .then((text) => {
                setCssContent((prev) => prev + text);
                setStylesLoaded(true);
              })
              .catch((err) => {
                console.warn("Could not fetch stylesheet:", err);
                setStylesLoaded(true); // Continue anyway
              });
          }
        }
      });

      return css;
    };

    // Wait for stylesheets to actually load
    const handleLoad = () => {
      const css = extractCSS();
      if (css) {
        setCssContent(css);
      }
      setStylesLoaded(true);
    };

    if (document.readyState === "complete") {
      // DOM is already ready
      handleLoad();
    } else {
      // Wait for window load event
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  return (
    <div style={{ visibility: stylesLoaded ? "visible" : "hidden" }}>
      <ShadowRoot style={themeStyles}>
        <style>{cssContent}</style>
        <ChatWidget {...widgetProps} />
      </ShadowRoot>
    </div>
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
export function initChatWidget(
  options: InitChatWidgetOptions = {}
): () => void {
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
    container = document.createElement("div");
    container.id = "chat-widget-container";
    document.body.appendChild(container);
  }

  // Apply theme CSS variables if provided
  const themeStyles = options.theme ? themeToCSSVars(options.theme) : {};

  // Mount the Preact component with Shadow DOM
  render(
    <ShadowWidgetWrapper {...widgetProps} themeStyles={themeStyles} />,
    container
  );

  // Return cleanup function
  return () => {
    render(null, container);
  };
}

// Export the component for direct use
export { ChatWidget } from "./screens/ConversationScreen";
export type { ChatWidgetProps } from "./components/ChatBox";

// Export theme types
export type { ChatWidgetTheme } from "./types/theme";

// Export API client for advanced usage
export { ApiClient, apiClient } from "./lib/api-client";
export * from "./types/api";

// Auto-initialize if data-chat-widget attribute is present
if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-chat-widget]").forEach((element) => {
      if (!(element instanceof HTMLElement)) {
        return;
      }

      if (element.getAttribute("data-auto-init") === "false") {
        return;
      }

      const apiUrl = element.getAttribute("data-api-url") || undefined;
      const conversationId =
        element.getAttribute("data-conversation-id") || undefined;

      initChatWidget({
        containerElement: element,
        apiUrl,
        conversationId,
      });
    });
  });
}

// Make initChatWidget available globally for UMD builds
if (typeof window !== "undefined") {
  (
    window as Window &
      typeof globalThis & { initChatWidget: typeof initChatWidget }
  ).initChatWidget = initChatWidget;
}
