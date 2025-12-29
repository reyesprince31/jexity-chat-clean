"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Ban, AlertTriangle } from "lucide-react";
import { banUserWithAudit } from "../lib/admin-actions";

interface BanUserDialogProps {
  userId: string;
  userName: string;
  userEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BanUserDialog({
  userId,
  userName,
  userEmail,
  open,
  onOpenChange,
}: BanUserDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<string>("permanent");

  const handleBan = async () => {
    if (reason.trim().length < 10) {
      alert("Please provide a reason (at least 10 characters)");
      return;
    }

    try {
      setLoading(true);

      // Calculate ban expiry date based on duration
      let banExpiresAt: Date | undefined;
      if (duration !== "permanent") {
        const now = new Date();
        switch (duration) {
          case "1h":
            banExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);
            break;
          case "24h":
            banExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case "7d":
            banExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case "30d":
            banExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
        }
      }

      const result = await banUserWithAudit({
        userId,
        reason: reason.trim(),
        banExpiresAt,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to ban user");
      }

      onOpenChange(false);
      setReason("");
      setDuration("permanent");
      router.refresh();
    } catch (error) {
      console.error("Error banning user:", error);
      alert(error instanceof Error ? error.message : "Failed to ban user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Ban className="h-5 w-5" />
            Ban User
          </DialogTitle>
          <DialogDescription>
            Suspend access for <strong>{userName}</strong> ({userEmail})
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Warning</p>
              <p>
                This user will be immediately logged out and unable to sign in
                until unbanned.
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why this user is being banned (min 10 characters)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/10 characters minimum
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration">Ban Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleBan}
            disabled={loading || reason.trim().length < 10}>
            {loading ? "Banning..." : "Ban User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
