"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, RefreshCw } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@repo/ui/components/button";

const COOLDOWN_SECONDS = 60;

export function VerifyEmailSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Load cooldown from localStorage on mount
  useEffect(() => {
    const storedCooldownEnd = localStorage.getItem("verifyEmailCooldownEnd");
    if (storedCooldownEnd) {
      const remainingTime = Math.ceil(
        (parseInt(storedCooldownEnd) - Date.now()) / 1000
      );
      if (remainingTime > 0) {
        setCooldown(remainingTime);
      } else {
        localStorage.removeItem("verifyEmailCooldownEnd");
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          localStorage.removeItem("verifyEmailCooldownEnd");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;

    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const { error: resendError } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/auth/verify-email",
      });

      if (resendError) {
        setError(resendError.message || "Failed to resend verification email");
        return;
      }

      setResendSuccess(true);
      // Start cooldown
      const cooldownEnd = Date.now() + COOLDOWN_SECONDS * 1000;
      localStorage.setItem("verifyEmailCooldownEnd", cooldownEnd.toString());
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <Mail className="size-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-muted-foreground text-sm text-balance">
          We&apos;ve sent a verification link to{" "}
          {email ? (
            <strong className="text-foreground">{email}</strong>
          ) : (
            "your email address"
          )}
          . Click the link in the email to verify your account.
        </p>
      </div>

      {resendSuccess && (
        <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm p-3 rounded-md text-center">
          Verification email sent! Please check your inbox.
        </div>
      )}

      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md text-center">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleResend}
          disabled={isResending || cooldown > 0 || !email}
          variant="outline"
          className="w-full"
        >
          {isResending ? (
            <>
              <RefreshCw className="mr-2 size-4 animate-spin" />
              Sending...
            </>
          ) : cooldown > 0 ? (
            <>Resend in {formatTime(cooldown)}</>
          ) : (
            <>
              <RefreshCw className="mr-2 size-4" />
              Resend verification email
            </>
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          <Link
            href="/auth/login"
            className="underline underline-offset-4 hover:text-primary"
          >
            Back to login
          </Link>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-2">
          Didn&apos;t receive the email?
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Check your spam or junk folder</li>
          <li>Make sure you entered the correct email</li>
          <li>Wait a few minutes and try resending</li>
        </ul>
      </div>
    </div>
  );
}
