"use client";

import { useState } from "react";
import { MoreHorizontal, Crown, Shield, User, Trash2 } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
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
import { Badge } from "@/ui/badge";

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

interface MembersListProps {
  members: Member[];
  organizationId: string;
  currentUserId: string;
  currentUserRole: string;
  onUpdate?: () => void;
}

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
};

const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export function MembersList({
  members,
  organizationId,
  currentUserId,
  currentUserRole,
  onUpdate,
}: MembersListProps) {
  const [removingMember, setRemovingMember] = useState<Member | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [changingRole, setChangingRole] = useState<{
    memberId: string;
    role: string;
  } | null>(null);

  const isOwner = currentUserRole === "owner";
  const isAdminOrOwner =
    currentUserRole === "owner" || currentUserRole === "admin";

  const canRemoveMember = (member: Member) => {
    if (member.userId === currentUserId) return false;
    if (member.role === "owner") return false;
    if (member.role === "admin" && !isOwner) return false;
    return isAdminOrOwner;
  };

  const canChangeRole = (member: Member) => {
    if (member.userId === currentUserId) return false;
    if (member.role === "owner") return false;
    return isOwner;
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;

    setIsRemoving(true);
    try {
      const result = await authClient.organization.removeMember({
        memberIdOrEmail: removingMember.id,
        organizationId,
      });

      if (result.error) {
        console.error("Failed to remove member:", result.error);
        return;
      }

      onUpdate?.();
    } catch (err) {
      console.error("Error removing member:", err);
    } finally {
      setIsRemoving(false);
      setRemovingMember(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setChangingRole({ memberId, role: newRole });
    try {
      const result = await authClient.organization.updateMemberRole({
        memberId,
        role: newRole,
        organizationId,
      });

      if (result.error) {
        console.error("Failed to update role:", result.error);
        return;
      }

      onUpdate?.();
    } catch (err) {
      console.error("Error updating role:", err);
    } finally {
      setChangingRole(null);
    }
  };

  // const ownerCount = members.filter((m) => m.role === "owner").length;

  return (
    <>
      <div className="divide-y rounded-md border">
        {members.map((member) => {
          const RoleIcon =
            roleIcons[member.role as keyof typeof roleIcons] || User;
          const isCurrentUser = member.userId === currentUserId;
          const isChanging = changingRole?.memberId === member.id;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {member.user.image ? (
                  <Image
                    src={member.user.image}
                    alt={member.user.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {member.user.name?.charAt(0)?.toUpperCase() ||
                        member.user.email?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.user.name}</span>
                    {isCurrentUser && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {member.user.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Joined {format(new Date(member.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canChangeRole(member) ? (
                  <Select
                    value={member.role}
                    onValueChange={(value: string) =>
                      handleRoleChange(member.id, value)
                    }
                    disabled={isChanging}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <RoleIcon className="h-4 w-4" />
                    <span>
                      {roleLabels[member.role as keyof typeof roleLabels] ||
                        member.role}
                    </span>
                  </div>
                )}

                {canRemoveMember(member) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setRemovingMember(member)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog
        open={!!removingMember}
        onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              {removingMember?.user.name || removingMember?.user.email} from the
              team? They will lose access to all team resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="bg-destructive text-white hover:bg-destructive/90">
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
