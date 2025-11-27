"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteUserWithAudit } from "../lib/admin-actions";

interface DeleteUserDialogProps {
  userId: string;
  userName: string;
  userEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteUserDialog({
  userId,
  userName,
  userEmail,
  open,
  onOpenChange,
}: DeleteUserDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [understood, setUnderstood] = useState(false);

  const canDelete =
    reason.trim().length >= 10 &&
    confirmEmail.toLowerCase() === userEmail.toLowerCase() &&
    understood;

  const handleDelete = async () => {
    if (!canDelete) return;

    try {
      setLoading(true);

      const result = await deleteUserWithAudit({
        userId,
        reason: reason.trim(),
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to delete user");
      }

      onOpenChange(false);
      setReason("");
      setConfirmEmail("");
      setUnderstood(false);
      router.refresh();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReason("");
      setConfirmEmail("");
      setUnderstood(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete User Permanently
          </DialogTitle>
          <DialogDescription>
            This will permanently delete <strong>{userName}</strong> (
            {userEmail})
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="text-sm text-red-800 dark:text-red-200">
              <p className="font-medium">This action cannot be undone!</p>
              <p className="mt-1">
                All user data will be permanently deleted including:
              </p>
              <ul className="list-disc list-inside mt-1 text-xs">
                <li>User account and profile</li>
                <li>All sessions</li>
                <li>Organization memberships</li>
                <li>Sent invitations</li>
              </ul>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">
              Deletion Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="e.g., GDPR deletion request, spam account, etc. (min 10 characters)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/10 characters minimum
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmEmail">
              Type <span className="font-mono text-xs">{userEmail}</span> to
              confirm
            </Label>
            <Input
              id="confirmEmail"
              placeholder="Enter user's email to confirm"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="understood"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="understood" className="text-sm font-normal">
              I understand this action cannot be undone
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || !canDelete}>
            {loading ? "Deleting..." : "Delete User Permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
