"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/ui/field";
import { Input } from "@/ui/input";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

// Zod 4 validation schema
const forgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send reset email");
      }

      // Always show success message (security: don't reveal if email exists)
      setSuccess(true);
    } catch (err) {
      console.error(err);
      // Still show success to prevent email enumeration
      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              {!success ? (
                <>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">
                      Forgot your password?
                    </h1>
                    <p className="text-muted-foreground text-balance">
                      Enter your email address and we&apos;ll send you a link to
                      reset your password.
                    </p>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      {...register("email")}
                    />
                    {errors.email && (
                      <FieldDescription className="text-red-600">
                        {errors.email.message}
                      </FieldDescription>
                    )}
                  </Field>

                  <Field>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </Field>

                  <FieldDescription className="text-center">
                    Remember your password?{" "}
                    <Link href="/auth/login" className="underline">
                      Back to login
                    </Link>
                  </FieldDescription>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-8 rounded-lg">
                    <div className="text-4xl mb-4">✓</div>
                    <h2 className="text-xl font-semibold mb-2">
                      Check your email
                    </h2>
                    <p className="text-sm">
                      If an account exists with that email address, you&apos;ll
                      receive a password reset link shortly.
                    </p>
                  </div>
                  <FieldDescription>
                    Didn&apos;t receive an email?{" "}
                    <button
                      type="button"
                      onClick={() => setSuccess(false)}
                      className="underline"
                    >
                      Try again
                    </button>
                  </FieldDescription>
                  <FieldDescription>
                    <Link href="/auth/login" className="underline">
                      Back to login
                    </Link>
                  </FieldDescription>
                </div>
              )}
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <Image
              src="/placeholder.svg"
              alt="Image"
              width={1200}
              height={1200}
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
