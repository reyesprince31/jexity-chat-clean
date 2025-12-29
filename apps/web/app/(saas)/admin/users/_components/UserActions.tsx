"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import {
  MoreHorizontal,
  Ban,
  ShieldCheck,
  UserCog,
  Trash2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { BanUserDialog } from "./BanUserDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import {
  unbanUserWithAudit,
  impersonateUserWithAudit,
} from "../lib/admin-actions";

interface UserActionsProps {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string | null;
  isBanned: boolean;
  isCurrentUser: boolean;
}

export function UserActions({
  userId,
  userName,
  userEmail,
  userRole,
  isBanned,
  isCurrentUser,
}: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isAdmin = userRole === "admin";

  const handleUnbanUser = async () => {
    try {
      setLoading(true);
      const result = await unbanUserWithAudit({ userId });
      if (!result.success) {
        throw new Error(result.error || "Failed to unban user");
      }
      router.refresh();
    } catch (error) {
      console.error("Error unbanning user:", error);
      alert(error instanceof Error ? error.message : "Failed to unban user");
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (isAdmin) {
      alert("Cannot impersonate other admins");
      return;
    }

    if (!confirm("You will be logged in as this user. Continue?")) {
      return;
    }

    try {
      setLoading(true);

      // Log the impersonation first
      await impersonateUserWithAudit({ userId, reason: "Admin support" });

      // Then perform the actual impersonation
      const response = await authClient.admin.impersonateUser({ userId });

      if (response?.error) {
        throw new Error(response.error.message || "Impersonation failed");
      }

      // Use hard navigation to ensure fresh server-side render
      window.location.href = "/home";
    } catch (error) {
      console.error("Error impersonating user:", error);
      alert(
        error instanceof Error ? error.message : "Failed to impersonate user"
      );
      setLoading(false);
    }
  };

  if (isCurrentUser) {
    return (
      <span className="text-xs text-muted-foreground italic">Your account</span>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleImpersonate}
            disabled={isAdmin}
            className={isAdmin ? "opacity-50" : ""}>
            <UserCog className="mr-2 h-4 w-4" />
            {isAdmin ? "Cannot impersonate admin" : "Impersonate"}
          </DropdownMenuItem>
          {isBanned ? (
            <DropdownMenuItem onClick={handleUnbanUser}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Unban User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setBanDialogOpen(true)}
              disabled={isAdmin}
              className={isAdmin ? "opacity-50" : "text-destructive"}>
              <Ban className="mr-2 h-4 w-4" />
              {isAdmin ? "Cannot ban admin" : "Ban User"}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isAdmin}
            className={isAdmin ? "opacity-50" : "text-destructive"}>
            <Trash2 className="mr-2 h-4 w-4" />
            {isAdmin ? "Cannot delete admin" : "Delete User"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BanUserDialog
        userId={userId}
        userName={userName}
        userEmail={userEmail}
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
      />

      <DeleteUserDialog
        userId={userId}
        userName={userName}
        userEmail={userEmail}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </>
  );
}
