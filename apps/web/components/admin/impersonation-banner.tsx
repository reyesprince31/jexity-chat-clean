"use client";

import { useState } from "react";
import { Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/ui/button";
import { authClient } from "@/lib/auth-client";

interface ImpersonationBannerProps {
  user: {
    name: string;
    email: string;
  };
}

export function ImpersonationBanner({ user }: ImpersonationBannerProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleExitImpersonation = async () => {
    try {
      setIsExiting(true);
      await authClient.admin.stopImpersonating();
      // Use hard navigation to ensure fresh server-side render
      // This restores the admin's original session properly
      window.location.href = "/admin/users";
    } catch (error) {
      console.error("Error stopping impersonation:", error);
      setIsExiting(false);
    }
  };

  return (
    <div className="bg-amber-100 border-b border-amber-200 text-amber-900">
      <div className="flex items-center justify-between px-4 py-2 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-amber-500 text-white">
            <Eye className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm">
            Viewing as <span className="font-semibold">{user.name}</span>
            <span className="text-amber-700 ml-1">({user.email})</span>
          </span>
        </div>
        <Button
          onClick={handleExitImpersonation}
          disabled={isExiting}
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 border-amber-300 bg-white hover:bg-amber-50 text-amber-900">
          <ArrowLeft className="h-3.5 w-3.5" />
          {isExiting ? "Exiting..." : "Exit"}
        </Button>
      </div>
    </div>
  );
}
