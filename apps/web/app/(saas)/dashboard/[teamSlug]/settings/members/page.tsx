"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { UserPlus, Users } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@repo/ui/components/button";
import { InviteMemberDialog } from "@/components/organization/invite-member-dialog";
import { MembersList } from "@/components/organization/members-list";
import { InvitationsList } from "@/components/organization/pending-invitations";

interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  createdAt?: Date;
  inviterId: string;
}

export default function MembersPage() {
  const params = useParams();
  const teamSlug = params?.teamSlug as string;
  const { data: session } = authClient.useSession();

  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("member");
  const [isLoading, setIsLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!teamSlug) return;

    setIsLoading(true);
    try {
      const orgResult = await authClient.organization.getFullOrganization({
        query: {
          organizationSlug: teamSlug,
        },
      });

      if (orgResult.data) {
        setOrganizationId(orgResult.data.id);
        setMembers(orgResult.data.members || []);

        // Find current user's role
        const currentMember = orgResult.data.members?.find(
          (m: Member) => m.userId === session?.user?.id
        );
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
        }

        // Fetch invitations
        const invResult = await authClient.organization.listInvitations({
          query: {
            organizationId: orgResult.data.id,
          },
        });
        if (invResult.data) {
          setInvitations(invResult.data);
        }
      }
    } catch (err) {
      console.error("Error fetching organization data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [teamSlug, session?.user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isAdminOrOwner = currentUserRole === "owner" || currentUserRole === "admin";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">
            Manage your team members and their roles.
          </p>
        </div>
        {isAdminOrOwner && (
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      <InvitationsList
        invitations={invitations}
        organizationId={organizationId || ""}
        currentUserRole={currentUserRole}
        onUpdate={fetchData}
      />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          Members ({members.length})
        </h3>
        {members.length > 0 ? (
          <MembersList
            members={members}
            organizationId={organizationId || ""}
            currentUserId={session?.user?.id || ""}
            currentUserRole={currentUserRole}
            onUpdate={fetchData}
          />
        ) : (
          <div className="rounded-md border p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No members yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Invite team members to start collaborating.
            </p>
          </div>
        )}
      </div>

      {organizationId && (
        <InviteMemberDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          organizationId={organizationId}
          currentUserRole={currentUserRole}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
