"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";

interface DeleteAccountFormProps {
  userEmail: string;
}

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
  confirmEmail: z.string(),
});

type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;

export function DeleteAccountForm({ userEmail }: DeleteAccountFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
  });

  const confirmEmail = watch("confirmEmail");
  const isEmailMatch = confirmEmail === userEmail;

  const onSubmit = async (data: DeleteAccountFormData) => {
    if (!isEmailMatch) {
      setError("Email confirmation does not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.deleteUser({
        password: data.password,
        callbackURL: "/auth/goodbye",
      });

      if (result.error) {
        setError(result.error.message || "Failed to delete account");
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-700 dark:text-green-400">
            Verification Email Sent
          </CardTitle>
          <CardDescription>
            We&apos;ve sent a confirmation email to{" "}
            <strong>{userEmail}</strong>. Please check your inbox and click the
            link to complete the account deletion process.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </div>
        <CardDescription>
          Once you delete your account, there is no going back. Please be
          certain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Your Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmEmail">
              To verify, type{" "}
              <span className="font-mono font-semibold text-destructive">
                {userEmail}
              </span>{" "}
              below:
            </Label>
            <Input
              id="confirmEmail"
              type="text"
              placeholder="Enter your email to confirm"
              {...register("confirmEmail")}
              disabled={isLoading}
              className={
                confirmEmail && !isEmailMatch
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
            />
            {confirmEmail && !isEmailMatch && (
              <p className="text-sm text-destructive">
                Email does not match. Please type exactly:{" "}
                <span className="font-mono">{userEmail}</span>
              </p>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="destructive"
              disabled={isLoading || !isEmailMatch}
              className="w-full"
            >
              {isLoading ? "Processing..." : "Delete my account"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            This action cannot be undone. All your data will be permanently
            removed.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
