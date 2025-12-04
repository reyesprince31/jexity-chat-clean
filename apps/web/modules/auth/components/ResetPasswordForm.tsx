"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/ui/button"
import { Card, CardContent } from "@/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/ui/field"
import { Input } from "@/ui/input"
import Link from "next/link"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useState } from "react"

// Zod 4 validation schema (matching signup requirements)
const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm({
  className,
  token,
  hasError,
  ...props
}: React.ComponentProps<"div"> & {
  token: string | null
  hasError: boolean
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    try {
      setError(null)
      setIsLoading(true)

      if (!token) {
        setError("Invalid reset link. Please request a new one.")
        setIsLoading(false)
        return
      }

      const result = await authClient.resetPassword({
        newPassword: data.password,
        token,
      })

      if (result.error) {
        setError(result.error.message || "Failed to reset password")
        return
      }

      // Success - redirect to dashboard (user is auto signed in)
      router.push("/dashboard")
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Show error state if token is invalid or expired
  if (hasError || (!token && !error)) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-8 rounded-lg">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h2 className="text-xl font-semibold mb-2">
                    Invalid or Expired Link
                  </h2>
                  <p className="text-sm">
                    This password reset link is invalid or has expired. Password
                    reset links expire after 1 hour for security reasons.
                  </p>
                </div>
                <FieldDescription>
                  <Link href="/auth/forgot-password" className="underline">
                    Request a new password reset link
                  </Link>
                </FieldDescription>
                <FieldDescription>
                  <Link href="/auth/login" className="underline">
                    Back to login
                  </Link>
                </FieldDescription>
              </div>
            </div>
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
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Reset your password</h1>
                <p className="text-muted-foreground text-balance">
                  Enter your new password below.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="password">New Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                />
                {errors.password && (
                  <FieldDescription className="text-red-600">
                    {errors.password.message}
                  </FieldDescription>
                )}
                {!errors.password && (
                  <FieldDescription>
                    Must be at least 8 characters with uppercase, lowercase, and
                    number.
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm New Password
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <FieldDescription className="text-red-600">
                    {errors.confirmPassword.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Resetting password..." : "Reset Password"}
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Remember your password?{" "}
                <Link href="/auth/login" className="underline">
                  Back to login
                </Link>
              </FieldDescription>
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
  )
}
