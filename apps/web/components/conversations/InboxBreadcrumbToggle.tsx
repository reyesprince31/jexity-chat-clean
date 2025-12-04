"use client";

import * as React from "react";

import { BreadcrumbLink } from "@/ui/breadcrumb";
import { CONVERSATIONS_SHOW_LIST_EVENT } from "@/components/conversations/ConversationContent";

interface InboxBreadcrumbToggleProps {
  label?: string;
}

export function InboxBreadcrumbToggle({
  label = "Inbox",
}: InboxBreadcrumbToggleProps) {
  const handleClick = React.useCallback(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(CONVERSATIONS_SHOW_LIST_EVENT));
  }, []);

  return (
    <BreadcrumbLink asChild>
      <button
        type="button"
        onClick={handleClick}
        className="text-foreground transition hover:text-foreground/80"
      >
        {label}
      </button>
    </BreadcrumbLink>
  );
}
