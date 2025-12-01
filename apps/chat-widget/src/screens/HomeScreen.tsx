/* eslint-disable react/prop-types */
import type { FunctionalComponent } from "preact";
import { cn } from "../lib/utils";
import { CloseIcon } from "../components/icons/CloseIcon";

interface HomeScreen {
  onStart: () => void;
  isStarting?: boolean;
  onClose?: () => void;
}

export const HomeScreen: FunctionalComponent<HomeScreen> = ({
  onStart,
  isStarting = false,
  onClose,
}) => {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="rounded-b-[28px] px-5 pb-10 pt-6 bg-(--jexity-assistant-bg-landing-hero) text-(--jexity-assistant-text-landing-hero)">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-bold tracking-[0.08em]">Jexity Chat</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/30 text-white transition hover:bg-white/40"
              aria-label="Close chat"
            >
              <CloseIcon size={18} />
            </button>
          )}
        </div>
        <p className="mt-6 text-3xl font-semibold leading-tight">
          Hi there <span aria-hidden="true">👋</span>
          <br />
          How can we help today?
        </p>
        <button
          type="button"
          onClick={onStart}
          disabled={isStarting}
          className={cn(
            "cursor-pointer mt-6 flex w-full items-center justify-between rounded-2xl px-5 py-4 text-base font-semibold transition",
            "bg-(--jexity-assistant-bg-landing-cta) text-(--jexity-assistant-text-landing-cta)",
            "focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white",
            isStarting && "pointer-events-none opacity-70"
          )}
        >
          <span>{isStarting ? "Preparing..." : "Start a Conversation"}</span>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white bg-(--jexity-assistant-bg-landing-cta-icon)">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 3l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>

      <div className="flex flex-1 flex-col px-5 py-6">
        <p className="text-base font-medium text-(--jexity-assistant-text-landing-body)">
          We&rsquo;re online and ready to help.
        </p>
        <p className="mt-1 text-sm text-(--jexity-assistant-text-landing-body) opacity-80">
          Tap the button above to connect with our team.
        </p>
      </div>
    </div>
  );
};

export default HomeScreen;
