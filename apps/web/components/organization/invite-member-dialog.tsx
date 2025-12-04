"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/ui/field";
import { Input } from "@/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";

const inviteSchema = z.object({
  email: z.email("Please enter a valid email address"),
  role: z.enum(["member", "admin", "owner"], {
    message: "Please select a role",
  }),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  currentUserRole: string;
  onSuccess?: () => void;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  organizationId,
  currentUserRole,
  onSuccess,
}: InviteMemberDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isOwner = currentUserRole === "owner";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const roleValue = watch("role");

  const onSubmit = async (data: InviteFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.organization.inviteMember({
        email: data.email,
        role: data.role,
        organizationId,
      });

      if (result.error) {
        setError(result.error.message || "Failed to send invitation");
        return;
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your team. They&apos;ll receive a link to accept.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="email">Email Address</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <FieldDescription className="text-destructive">
                  {errors.email.message}
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="role">Role</FieldLabel>
              <Select
                value={roleValue}
                onValueChange={(value: string) => setValue("role", value as "member" | "admin" | "owner")}
                disabled={isLoading}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  {isOwner && (
                    <>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {errors.role ? (
                <FieldDescription className="text-destructive">
                  {errors.role.message}
                </FieldDescription>
              ) : (
                <FieldDescription>
                  {roleValue === "owner" && "Full control including deleting the organization"}
                  {roleValue === "admin" && "Can manage members and invitations"}
                  {roleValue === "member" && "Can view team content"}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
