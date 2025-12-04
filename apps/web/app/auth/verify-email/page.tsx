"use client";

import { Button } from "@/ui/button";
import { GalleryVerticalEnd } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState<string>("/dashboard");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Check localStorage for stored redirect URL
    const storedRedirect = localStorage.getItem("auth_redirect");
    if (storedRedirect) {
      // Clear the stored redirect after reading
      localStorage.removeItem("auth_redirect");
      // Use setTimeout to avoid setState in effect warning
      setTimeout(() => {
        setRedirectUrl(storedRedirect);
      }, 0);
    }
  }, []);

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Handle redirect when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      router.push(redirectUrl);
    }
  }, [countdown, redirectUrl, router]);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Acme Inc.
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <svg
                    className="size-6 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold">Email Verified</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Your email has been verified successfully. You can now access
                  all features of your account.
                </p>
                <p className="text-muted-foreground text-xs">
                  Redirecting in {countdown} seconds...
                </p>
                <Button asChild className="mt-2">
                  <Link href={redirectUrl}>Continue</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          fill
        />
      </div>
    </div>
  );
}
