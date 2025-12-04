"use client";

import { useState } from "react";
import { X, Mail, Clock, RefreshCw } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/alert-dialog";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  createdAt?: Date;
  inviterId: string;
  inviter?: {
    name: string;
    email: string;
  };
}

interface InvitationsListProps {
  invitations: Invitation[];
  organizationId: string;
  currentUserRole: string;
  onUpdate?: () => void;
}

const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  accepted: "default",
  rejected: "destructive",
  cancelled: "outline",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function InvitationsList({
  invitations,
  organizationId,
  currentUserRole,
  onUpdate,
}: InvitationsListProps) {
  const [cancellingInvitation, setCancellingInvitation] = useState<Invitation | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [reinvitingEmail, setReinvitingEmail] = useState<string | null>(null);

  const isAdminOrOwner = currentUserRole === "owner" || currentUserRole === "admin";
  const isOwner = currentUserRole === "owner";

  // Separate pending and other invitations
  const pendingInvitations = invitations.filter((inv) => inv.status === "pending");
  const otherInvitations = invitations.filter((inv) => inv.status !== "pending" && inv.status !== "accepted");

  const isExpired = (expiresAt: Date) => {
    return new Date(expiresAt) < new Date();
  };

  const canReinvite = (invitation: Invitation) => {
    if (!isAdminOrOwner) return false;
    if (invitation.status === "pending") return false;
    // Only owners can reinvite for admin/owner roles
    if ((invitation.role === "admin" || invitation.role === "owner") && !isOwner) return false;
    return true;
  };

  const handleReinvite = async (invitation: Invitation) => {
    setReinvitingEmail(invitation.email);
    try {
      const result = await authClient.organization.inviteMember({
        email: invitation.email,
        role: invitation.role as "member" | "admin" | "owner",
        organizationId,
      });

      if (result.error) {
        console.error("Failed to reinvite:", result.error);
        return;
      }

      onUpdate?.();
    } catch (err) {
      console.error("Error reinviting:", err);
    } finally {
      setReinvitingEmail(null);
    }
  };

  const handleCancelInvitation = async () => {
    if (!cancellingInvitation) return;

    setIsCancelling(true);
    try {
      const result = await authClient.organization.cancelInvitation({
        invitationId: cancellingInvitation.id,
      });

      if (result.error) {
        console.error("Failed to cancel invitation:", result.error);
        return;
      }

      onUpdate?.();
    } catch (err) {
      console.error("Error cancelling invitation:", err);
    } finally {
      setIsCancelling(false);
      setCancellingInvitation(null);
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  const renderInvitation = (invitation: Invitation, showActions: boolean = true) => {
    const expired = invitation.status === "pending" && isExpired(invitation.expiresAt);
    const isReinviting = reinvitingEmail === invitation.email;

    return (
      <div
        key={invitation.id}
        className="flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{invitation.email}</span>
              <Badge variant="outline" className="text-xs">
                {roleLabels[invitation.role as keyof typeof roleLabels] || invitation.role}
              </Badge>
              <Badge variant={statusVariants[invitation.status] || "secondary"} className="text-xs">
                {statusLabels[invitation.status] || invitation.status}
              </Badge>
              {expired && (
                <Badge variant="destructive" className="text-xs">
                  Expired
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {invitation.createdAt && (
                <span>Invited {format(new Date(invitation.createdAt), "MMM d, yyyy")}</span>
              )}
              {invitation.status === "pending" && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {expired
                    ? `Expired ${formatDistanceToNow(new Date(invitation.expiresAt))} ago`
                    : `Expires in ${formatDistanceToNow(new Date(invitation.expiresAt))}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            {canReinvite(invitation) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReinvite(invitation)}
                disabled={isReinviting}
                className="text-muted-foreground hover:text-primary"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isReinviting ? "animate-spin" : ""}`} />
                {isReinviting ? "Sending..." : "Reinvite"}
              </Button>
            )}
            {isAdminOrOwner && invitation.status === "pending" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancellingInvitation(invitation)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Pending Invitations ({pendingInvitations.length})
          </h3>
          <div className="divide-y rounded-md border">
            {pendingInvitations.map((invitation) => renderInvitation(invitation))}
          </div>
        </div>
      )}

      {otherInvitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Past Invitations ({otherInvitations.length})
          </h3>
          <div className="divide-y rounded-md border">
            {otherInvitations.map((invitation) => renderInvitation(invitation))}
          </div>
        </div>
      )}

      <AlertDialog
        open={!!cancellingInvitation}
        onOpenChange={() => setCancellingInvitation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation to{" "}
              {cancellingInvitation?.email}? They will no longer be able to join
              using this invitation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep invitation
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvitation}
              disabled={isCancelling}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isCancelling ? "Cancelling..." : "Cancel invitation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
