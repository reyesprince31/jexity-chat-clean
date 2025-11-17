import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "preact/hooks";
import type { ComponentChildren, FunctionalComponent } from "preact";
import type { JSX } from "preact";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { ApiClient, apiClient } from "../lib/api-client";
import type { Message, MessageWithSources, Source } from "../types/api";
import type { ChatWidgetTheme } from "../types/theme";
import { cn } from "../lib/utils";
import { Content } from "./Content";
import { JexityLogo } from "../../public/JexityLogo";
import "../styles.css";

/**
 * TODO: Transfer icons to separate files, export IconProps to a common file.
 * In src/components, add svg-icons directory. Transfer the icons in ChatWidget there and add a types.ts file. IconProps should
 * be placed in there.
 */
/**
 * Common props shared across inline SVG icons rendered within the chat widget.
 */
type IconProps = JSX.SVGAttributes<SVGSVGElement> & { size?: number };

/**
 * Chat bubble glyph shown on the floating trigger button.
 */
function ChatbotIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zM9.5 9h.01m4.99 0h.01" />
        <path d="M9.5 13a3.5 3.5 0 0 0 5 0" />
      </g>
    </svg>
  );
}

/**
 * Three vertical dots used for contextual menus.
 */
function OptionsVerticalIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        fill="currentColor"
        d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0-4 0m0-6a2 2 0 1 0 4 0a2 2 0 0 0-4 0m0 12a2 2 0 1 0 4 0a2 2 0 0 0-4 0"
      />
    </svg>
  );
}

/**
 * Outward arrows indicating the chat can expand.
 */
function ExpandIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 8.5V4m0 0h4.5M4 4l5.5 5.5m10.5-1V4m0 0h-4.5M20 4l-5.5 5.5M4 15.5V20m0 0h4.5M4 20l5.5-5.5m10.5 1V20m0 0h-4.5m4.5 0l-5.5-5.5"
      />
    </svg>
  );
}

/**
 * Inward arrows indicating the chat can collapse back down.
 */
function CollapseIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <g fill="none" fillRule="evenodd">
        <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
        <path
          fill="currentColor"
          d="M20 7h-3V4a1 1 0 1 0-2 0v3a2 2 0 0 0 2 2h3a1 1 0 1 0 0-2M7 9a2 2 0 0 0 2-2V4a1 1 0 1 0-2 0v3H4a1 1 0 1 0 0 2zm0 8H4a1 1 0 1 1 0-2h3a2 2 0 0 1 2 2v3a1 1 0 1 1-2 0zm10-2a2 2 0 0 0-2 2v3a1 1 0 1 0 2 0v-3h3a1 1 0 1 0 0-2z"
        />
      </g>
    </svg>
  );
}

/**
 * Simple “×” glyph for dismissal actions.
 */
function CloseIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path
        fill="currentColor"
        d="m12 13.4l-4.9 4.9q-.275.275-.7.275t-.7-.275t-.275-.7t.275-.7l4.9-4.9l-4.9-4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l4.9 4.9l4.9-4.9q.275-.275.7-.275t.7.275t.275.7t-.275.7L13.4 12l4.9 4.9q.275.275.275.7t-.275.7t-.7.275t-.7-.275z"
      />
    </svg>
  );
}

/**
 * Upward chevron used on the send button.
 */
function ArrowUpIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <g fill="none">
        <path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
        <path
          fill="currentColor"
          d="M13.06 3.283a1.5 1.5 0 0 0-2.12 0L5.281 8.939a1.5 1.5 0 0 0 2.122 2.122L10.5 7.965V19.5a1.5 1.5 0 0 0 3 0V7.965l3.096 3.096a1.5 1.5 0 1 0 2.122-2.122z"
        />
      </g>
    </svg>
  );
}

/**
 * Floating button that summons the chat widget when it is closed.
 */
function ChatBoxTrigger({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-5 right-5 z-50",
        "w-14 h-14 rounded-full",
        "bg-black hover:bg-slate-900",
        "text-white border-0 cursor-pointer",
        "shadow-lg hover:shadow-xl",
        "flex items-center justify-center",
        className
      )}
      aria-label="Open chat"
    >
      <ChatbotIcon size={28} />
    </button>
  );
}

/**
 * Helper type for header menu icon components.
 */
type HeaderMenuOptionIcon = FunctionalComponent<IconProps>;

/**
 * Configuration for an action inside the chat header popover menu.
 */
interface HeaderMenuOption {
  id: string;
  label: string;
  icon: HeaderMenuOptionIcon;
  onClick: () => void;
}

/**
 * Popover-based menu that surfaces contextual actions for the chat header.
 */
function ChatBoxHeaderMenu({ options }: { options: HeaderMenuOption[] }) {
  const [open, setOpen] = useState(false);

  const handleOptionClick = (onClickHandler: () => void) => {
    onClickHandler();
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 disabled:pointer-events-none disabled:opacity-50 h-9 w-9 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Options"
        >
          <OptionsVerticalIcon size={20} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Content
        align="end"
        className="z-50 w-48 rounded-md border border-gray-200 bg-white p-1 text-gray-950 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
      >
        <div className="flex flex-col">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.onClick)}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100 hover:text-gray-900 transition-colors justify-start"
            >
              <option.icon size={16} className="mr-2" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Root>
  );
}

/**
 * Renders the assistant identity row with controls for expanding or closing the widget.
 */
function ChatBoxHeader({
  title = "Jexity Chat Assistant",
  isExpanded,
  onExpandClick,
  onCloseClick,
  className,
}: {
  title?: string;
  isExpanded?: boolean;
  onExpandClick?: () => void;
  onCloseClick?: () => void;
  className?: string;
}) {
  const menuOptions: HeaderMenuOption[] = [
    {
      id: "expand",
      label: isExpanded ? "Collapse" : "Expand",
      icon: isExpanded ? CollapseIcon : ExpandIcon,
      onClick: onExpandClick || (() => {}),
    },
  ];

  return (
    <div
      className={cn(
        "bg-white text-black px-5 py-3",
        "border-b border-gray-200",
        "flex items-center justify-between",
        className
      )}
    >
      <div className="flex items-center">
        <JexityLogo className="mr-1" />
        <p className="m-0 text-md font-medium">{title}</p>
      </div>
      <div className="flex items-center gap-1">
        <ChatBoxHeaderMenu options={menuOptions} />

        <button
          onClick={onCloseClick}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 disabled:pointer-events-none disabled:opacity-50 h-9 w-9 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Close"
        >
          <CloseIcon size={20} />
        </button>
      </div>
    </div>
  );
}

/**
 * Formats outbound user messages with right alignment and theme colors.
 */
function ChatBoxMessageUser({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col max-w-[80%] self-end", className)}>
      <div className="px-4 py-3 rounded-[20px] wrap-break-word leading-relaxed text-(--jexity-assistant-text-chat-message-user) rounded-br-md text-sm bg-(--jexity-assistant-bg-chat-message-user) hover:opacity-90 transition-opacity">
        {content}
      </div>
    </div>
  );
}

/**
 * Assistant bubble that renders branding plus either markdown content or custom children.
 */
function ChatBoxMessageAgent({
  content,
  sources = [],
  children,
  footer,
  className,
  hideIncompleteCitations = false,
}: {
  content?: string;
  sources?: Source[];
  children?: ComponentChildren;
  footer?: ComponentChildren;
  className?: string;
  hideIncompleteCitations?: boolean;
}) {
  const bodyContent =
    children ??
    (content ? (
      <Content
        value={content}
        sources={sources}
        className="text-sm"
        hideIncompleteCitations={hideIncompleteCitations}
      />
    ) : null);

  return (
    <div className={cn("flex flex-col max-w-[80%] self-start", className)}>
      <div className="px-4 py-3 rounded-[20px] wrap-break-word leading-relaxed bg-gray-100 text-gray-900 border border-gray-200 rounded-bl-md">
        <div className="mb-2 flex items-center">
          <JexityLogo />

          <p className="inline font-medium text-sm">
            Jexity
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="8"
              height="8"
              viewBox="0 0 48 48"
              className="inline mx-1"
            >
              <path
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="4"
                d="M24 33a9 9 0 1 0 0-18a9 9 0 0 0 0 18Z"
              />
            </svg>
            AI Agent
          </p>
        </div>
        {bodyContent}
      </div>
      {footer}
    </div>
  );
}

/**
 * Streaming placeholder that switches between a spinner and partial assistant output.
 */
function ChatBoxMessageLoading({
  content,
  className,
}: {
  content?: string;
  className?: string;
}) {
  const hasContent = Boolean(content && content.trim().length > 0);

  if (!hasContent) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gray-500",
          className
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={"thinking-spinner"}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Thinking
      </div>
    );
  }

  return (
    <ChatBoxMessageAgent
      className={className}
      content={content}
      hideIncompleteCitations
    />
  );
}

/**
 * Lightweight inline error banner shown beneath the transcript.
 */
function ChatBoxError({
  error,
  className,
}: {
  error?: string | null;
  className?: string;
}) {
  if (!error) return null;

  return (
    <div
      className={cn(
        "p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-900 text-sm",
        className
      )}
    >
      {error}
    </div>
  );
}

/**
 * Textarea plus send control used for composing user prompts.
 */
function ChatBoxInput({
  value,
  onChange,
  onKeyDown,
  onSend,
  disabled,
  className,
}: {
  value: string;
  onChange: (e: JSX.TargetedEvent<HTMLTextAreaElement, Event>) => void;
  onKeyDown: (e: JSX.TargetedKeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("px-4 py-3 bg-white", className)}>
      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-full pl-5 pr-2 py-2">
        <textarea
          className="flex-1 bg-transparent text-[15px] resize-none outline-none placeholder:text-gray-400 disabled:bg-transparent disabled:cursor-not-allowed max-h-24 leading-5 py-1.5"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Message..."
          disabled={disabled}
          rows={1}
          style={{
            scrollbarWidth: "none",
          }}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="shrink-0 inline-flex items-center justify-center rounded-full w-[30px] h-[30px] transition-all disabled:bg-gray-300 disabled:text-white bg-black text-white hover:bg-gray-800 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <ArrowUpIcon size={16} />
        </button>
      </div>
    </div>
  );
}

/**
 * Scrollable transcript area that stacks chat bubbles.
 */
function ChatBoxMessages({
  children,
  className,
}: {
  children: ComponentChildren;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 bg-white",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Outer shell that controls the widget’s floating positioning and sizing.
 */
function ChatBoxContainer({
  children,
  isExpanded,
  className,
}: {
  children: ComponentChildren;
  isExpanded?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col w-full border border-gray-200 rounded-2xl bg-white shadow-lg overflow-hidden transition-all duration-300",
        "fixed bottom-5 right-5 z-50",
        "animate-slideUp",
        isExpanded
          ? "h-[95vh] max-w-[45vw] min-w-[300px]"
          : "h-[75vh] max-w-[400px]",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Public configuration options for embedding the chat widget.
 */
export interface ChatWidgetProps {
  apiUrl?: string;
  conversationId?: string;
  onConversationCreate?: (conversationId: string) => void;
  theme?: ChatWidgetTheme;
}

/**
 * Entry component that wires together API calls, window chrome, and chat state.
 */
export function ChatWidget({
  apiUrl,
  conversationId: initialConversationId,
  onConversationCreate,
  // Note: theme prop exists in ChatWidgetProps but is applied at the Shadow DOM level in main.tsx
}: ChatWidgetProps) {
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [messages, setMessages] = useState<MessageWithSources[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize API client with custom URL if provided
  const client = useMemo(
    () => (apiUrl ? new ApiClient(apiUrl) : apiClient),
    [apiUrl]
  );

  // Instant scroll to bottom when chat is opened
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [isOpen]);

  // Smooth scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && (messages.length > 0 || streamingContent)) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent, isOpen]);

  const createConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await client.createConversation();
      setConversationId(response.conversation.id);
      onConversationCreate?.(response.conversation.id);
    } catch (err) {
      setError("Failed to create conversation");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [client, onConversationCreate]);

  // Create conversation on mount if none provided
  useEffect(() => {
    if (!conversationId) {
      createConversation();
    }
  }, [conversationId, createConversation]);

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);
    setIsStreaming(true);
    setStreamingContent("");

    // Add user message optimistically
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: conversationId,
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      let fullResponse = "";

      for await (const event of client.streamMessage(conversationId, {
        message: userMessage,
        useRAG: true,
      })) {
        if (event.type === "token" && event.content) {
          console.log("[ChatWidget] Token chunk:", event.content);
          fullResponse += event.content;
          setStreamingContent(fullResponse);
        } else if (event.type === "done") {
          // Add assistant message with sources
          console.log(
            "[ChatWidget] Streaming complete. Assistant message:",
            fullResponse
          );
          const assistantMsg: MessageWithSources = {
            id: `temp-${Date.now()}`,
            conversationId: conversationId,
            role: "assistant",
            content: fullResponse,
            createdAt: new Date().toISOString(),
            sources: event.sources || [],
          };

          // Update all states together - Preact batches state updates during event loops
          setIsStreaming(false);
          setStreamingContent("");
          setMessages((prev) => [...prev, assistantMsg]);
        } else if (event.type === "error") {
          setError(event.message || "An error occurred");
          setIsStreaming(false);
        }
      }
    } catch (err) {
      setError("Failed to send message");
      console.error(err);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Show trigger button when chat is closed
  if (!isOpen) {
    return <ChatBoxTrigger onClick={() => setIsOpen(true)} />;
  }

  // Show loading state
  if (isLoading) {
    return (
      <ChatBoxContainer isExpanded={isExpanded}>
        <div className="flex items-center justify-center h-full text-gray-600 text-base">
          Initializing chat...
        </div>
      </ChatBoxContainer>
    );
  }

  // Show full chat widget
  return (
    <ChatBoxContainer isExpanded={isExpanded}>
      <ChatBoxHeader
        isExpanded={isExpanded}
        onExpandClick={() => setIsExpanded(!isExpanded)}
        onCloseClick={() => setIsOpen(false)}
      />

      <ChatBoxMessages>
        {messages.map((message) =>
          message.role === "user" ? (
            <ChatBoxMessageUser key={message.id} content={message.content} />
          ) : (
            <ChatBoxMessageAgent
              key={message.id}
              content={message.content}
              sources={message.sources}
            />
          )
        )}

        {isStreaming && (
          <ChatBoxMessageLoading content={streamingContent || undefined} />
        )}
        <ChatBoxError error={error} />

        <div ref={messagesEndRef} />
      </ChatBoxMessages>

      <ChatBoxInput
        value={input}
        onChange={(e) => setInput(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onSend={sendMessage}
        disabled={isStreaming}
      />
    </ChatBoxContainer>
  );
}
