import { useState } from "preact/hooks";
import type { ComponentChildren, FunctionalComponent, JSX, Ref } from "preact";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { Conversation, Source } from "../types/api";
import type { ChatWidgetTheme } from "../types/theme";
import { cn } from "../lib/utils";
import { Content } from "../components/Content";
import { JexityLogo } from "../components/JexityLogo";
import "../styles.css";
import type { IconProps } from "../components/icons/types";
import { ChatbotIcon } from "../components/icons/ChatbotIcon";
import { OptionsVerticalIcon } from "../components/icons/OptionsVerticalIcon";
import { ExpandIcon } from "../components/icons/ExpandIcon";
import { CollapseIcon } from "../components/icons/CollapseIcon";
import { CloseIcon } from "../components/icons/CloseIcon";
import { ArrowUpIcon } from "../components/icons/ArrowUpIcon";
import { ArrowLeftIcon } from "../components/icons/ArrowLeftIcon";

export const MAX_MESSAGE_LENGTH = 2000;

/**
 * Floating button that summons the chat widget when it is closed.
 */
export function ChatBoxTrigger({
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
        "bg-(--jexity-assistant-bg-chat-trigger)",
        "hover:bg-(--jexity-assistant-bg-chat-trigger-hover)",
        "text-(--jexity-assistant-icon-color-chat-trigger) border-0 cursor-pointer",
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
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 disabled:pointer-events-none disabled:opacity-50 h-9 w-9 p-0 text-(--jexity-assistant-icon-color-chat-header) hover:bg-(--jexity-assistant-bg-chat-header-icon-hover) hover:text-(--jexity-assistant-text-color-chat-header)"
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
export function ChatBoxHeader({
  title = "Jexity Chat Assistant",
  isExpanded,
  onExpandClick,
  onCloseClick,
  onBackClick,
  className,
}: {
  title?: string;
  isExpanded?: boolean;
  onExpandClick?: () => void;
  onCloseClick?: () => void;
  onBackClick?: () => void;
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
        "px-5 py-3",
        "bg-(--jexity-assistant-bg-chat-header) text-(--jexity-assistant-text-color-chat-header)",
        "border-b border-(--jexity-assistant-border-color-chat-header)",
        "flex items-center justify-between",
        className
      )}
    >
      <div className="flex items-center">
        {onBackClick && (
          <button
            type="button"
            onClick={onBackClick}
            className="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-md text-(--jexity-assistant-icon-color-chat-header) hover:bg-(--jexity-assistant-bg-chat-header-icon-hover)"
            aria-label="Back"
          >
            <ArrowLeftIcon size={18} />
          </button>
        )}
        <JexityLogo className="mr-1" />
        <p className="m-0 text-md font-medium">{title}</p>
      </div>
      <div className="flex items-center gap-1">
        <ChatBoxHeaderMenu options={menuOptions} />

        <button
          onClick={onCloseClick}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-300 disabled:pointer-events-none disabled:opacity-50 h-9 w-9 p-0 text-(--jexity-assistant-icon-color-chat-header) hover:bg-(--jexity-assistant-bg-chat-header-icon-hover) hover:text-(--jexity-assistant-text-color-chat-header)"
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
export function ChatBoxMessageUser({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col max-w-[80%] self-end", className)}>
      <div className="px-4 py-3 rounded-[20px] wrap-break-word leading-relaxed text-(--jexity-assistant-text-chat-message-user) rounded-br-md text-sm bg-(--jexity-assistant-bg-chat-message-user) border border-(--jexity-assistant-border-chat-message-user) hover:opacity-90 transition-opacity">
        {content}
      </div>
    </div>
  );
}

/**
 * Assistant bubble that renders branding plus either markdown content or custom children.
 */
export function ChatBoxMessageAgent({
  content,
  sources = [],
  children,
  footer,
  className,
  hideIncompleteCitations = false,
  agentName,
}: {
  content?: string;
  sources?: Source[];
  children?: ComponentChildren;
  footer?: ComponentChildren;
  className?: string;
  hideIncompleteCitations?: boolean;
  agentName?: string;
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
      <div className="px-4 py-3 rounded-[20px] wrap-break-word leading-relaxed rounded-bl-md border bg-(--jexity-assistant-bg-chat-message-agent) text-(--jexity-assistant-text-chat-message-agent) border-(--jexity-assistant-border-chat-message-agent)">
        <div className="mb-2 flex items-center">
          <JexityLogo />

          <p className="inline font-medium text-sm">
            {agentName?.trim() || "Jexity"}
            {!agentName && (
              <>
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
              </>
            )}
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
export function ChatBoxMessageLoading({
  content,
  className,
  isEscalated,
}: {
  content?: string;
  className?: string;
  isEscalated?: boolean;
}) {
  const hasContent = Boolean(content && content.trim().length > 0);

  if (!hasContent) {
    if (isEscalated) {
      return null;
    }

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
 * Visual indicator rendered while a human agent is composing a reply.
 */
export function ChatBoxTypingIndicator({
  label = "Agent is typing...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col max-w-[80%] self-start", className)}>
      <div className="px-4 py-3 rounded-[20px] wrap-break-word leading-relaxed bg-gray-100 text-gray-900 border border-gray-200 rounded-bl-md">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-2 w-2 rounded-full bg-gray-500 animate-typing"
              style={{ animationDelay: `${index * 120}ms` }}
            />
          ))}
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight inline error banner shown beneath the transcript.
 */
export function ChatBoxError({
  error,
  onRetry,
  className,
}: {
  error?: string | null;
  onRetry?: (() => void) | null;
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
      <div>{error}</div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center justify-center rounded-full border border-gray-400 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-200 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Communicates that the automation handed the conversation to a human teammate.
 */
export function ChatBoxEscalationBanner({
  reason,
  className,
}: {
  reason?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-4 mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900",
        className
      )}
    >
      <p className="m-0 font-semibold">Connecting you with a human agent.</p>
      <p className="m-0 mt-1 text-amber-900/90">
        {reason || "Hang tight - someone will reply shortly."}
      </p>
    </div>
  );
}

/**
 * Highlights that a named human agent has entered the conversation.
 */
export function ChatBoxAgentBanner({
  agentName,
  className,
}: {
  agentName: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-4 mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900",
        className
      )}
    >
      <p className="m-0 font-semibold">{agentName} has joined the chat.</p>
    </div>
  );
}

/** Informs the user that a teammate closed the conversation. */
export function ChatBoxResolvedBanner({
  resolvedBy,
  resolvedAt,
  className,
}: {
  resolvedBy?: string | null;
  resolvedAt?: string;
  className?: string;
}) {
  const displayName = resolvedBy || "our support team";
  const timestamp = resolvedAt
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(resolvedAt))
    : undefined;

  return (
    <div
      className={cn(
        "mx-4 mb-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800",
        className
      )}
    >
      <p className="m-0 font-semibold">Conversation closed by {displayName}.</p>
      {timestamp && (
        <p className="m-0 mt-1 text-gray-600">Resolved on {timestamp}.</p>
      )}
    </div>
  );
}

/**
 * Textarea plus send control used for composing user prompts.
 */
export function ChatBoxInput({
  value,
  onChange,
  onKeyDown,
  onSend,
  disabled,
  isSendDisabled,
  textareaRef,
  maxLength = MAX_MESSAGE_LENGTH,
  className,
}: {
  value: string;
  onChange: (e: JSX.TargetedEvent<HTMLTextAreaElement, Event>) => void;
  onKeyDown: (e: JSX.TargetedKeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  disabled?: boolean;
  isSendDisabled?: boolean;
  textareaRef?: Ref<HTMLTextAreaElement>;
  maxLength?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-4 py-3 bg-(--jexity-assistant-bg-chat-container)",
        className
      )}
    >
      <div className="flex items-center gap-2 bg-(--jexity-assistant-bg-chat-input) border border-(--jexity-assistant-border-chat-input) rounded-full pl-5 pr-2 py-2">
        <textarea
          className="flex-1 bg-transparent text-(--jexity-assistant-text-chat-input) placeholder:text-(--jexity-assistant-placeholder-chat-input) text-[15px] resize-none outline-none disabled:bg-transparent disabled:cursor-not-allowed max-h-24 leading-5 py-1.5"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Message..."
          disabled={disabled}
          maxLength={maxLength}
          rows={1}
          ref={textareaRef}
          style={{
            scrollbarWidth: "none",
          }}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || disabled || isSendDisabled}
          className="shrink-0 inline-flex items-center justify-center rounded-full w-[30px] h-[30px] transition-all bg-(--jexity-assistant-bg-chat-send-button) text-(--jexity-assistant-icon-color-chat-send-button) hover:bg-(--jexity-assistant-bg-chat-send-button-hover) disabled:bg-(--jexity-assistant-bg-chat-send-button-disabled) disabled:text-(--jexity-assistant-icon-color-chat-send-button-disabled) disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <ArrowUpIcon size={16} />
        </button>
      </div>
      <div className="mt-1 text-right text-xs text-(--jexity-assistant-text-chat-input-counter)">
        {value.length}/{maxLength}
      </div>
    </div>
  );
}

/**
 * Scrollable transcript area that stacks chat bubbles.
 */
export function ChatBoxMessages({
  children,
  className,
}: {
  children: ComponentChildren;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 bg-(--jexity-assistant-bg-chat-container)",
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
export function ChatBoxContainer({
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

export interface EscalationState {
  isEscalated: boolean;
  reason?: string;
  escalatedAt?: string;
  agentName?: string;
  agentJoinedAt?: string;
  isResolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string | null;
}

/**
 * Normalizes conversation metadata from the API into a widget-friendly structure.
 */
export function extractEscalationState(
  conversation?: Conversation | null
): EscalationState {
  if (!conversation) {
    return { isEscalated: false };
  }

  return {
    isEscalated: conversation.isEscalated,
    reason: conversation.escalatedReason ?? undefined,
    escalatedAt: conversation.escalatedAt ?? undefined,
    agentName: conversation.agentName ?? undefined,
    agentJoinedAt: conversation.agentJoinedAt ?? undefined,
    isResolved: conversation.isResolved,
    resolvedAt: conversation.resolvedAt ?? undefined,
    resolvedBy: conversation.resolvedBy ?? undefined,
  };
}
