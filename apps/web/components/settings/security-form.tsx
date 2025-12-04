"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/ui/field";
import { Input } from "@/ui/input";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export function SecurityForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });

      if (result.error) {
        setError(result.error.message || "Failed to change password");
        return;
      }

      setSuccess("Password changed successfully. Other sessions have been logged out.");
      reset();
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password. You&apos;ll be logged out of other devices for security.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/15 text-green-600 text-sm p-3 rounded-md">
                {success}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="currentPassword">Current Password</FieldLabel>
              <Input
                id="currentPassword"
                type="password"
                {...register("currentPassword")}
                disabled={isLoading}
              />
              {errors.currentPassword && (
                <FieldDescription className="text-destructive">
                  {errors.currentPassword.message}
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
              <Input
                id="newPassword"
                type="password"
                {...register("newPassword")}
                disabled={isLoading}
              />
              {errors.newPassword ? (
                <FieldDescription className="text-destructive">
                  {errors.newPassword.message}
                </FieldDescription>
              ) : (
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <FieldDescription className="text-destructive">
                  {errors.confirmPassword.message}
                </FieldDescription>
              )}
            </Field>

            <Field>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Changing Password..." : "Change Password"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
