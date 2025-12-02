"use client";

import { Crown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@repo/ui/components/tooltip";

export function ProBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-500">
            <Crown className="h-3 w-3" />
            <span>Pro</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          <div className="space-y-1">
            <p className="font-medium">Pro Feature</p>
            <p className="text-muted-foreground">
              Upgrade to unlock AI-powered responses with Knowledge Base.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
