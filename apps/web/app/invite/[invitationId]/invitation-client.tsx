"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Check, X, LogIn, UserPlus } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/ui/card";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  inviter: {
    id: string;
    name: string;
    email: string;
  };
}

interface InvitationClientProps {
  invitation: InvitationData | null;
  invitationId: string;
}

const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export function InvitationClient({ invitation, invitationId }: InvitationClientProps) {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = authClient.useSession();

  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!invitation) return;

    setIsAccepting(true);
    setError(null);

    try {
      const result = await authClient.organization.acceptInvitation({
        invitationId: invitation.id,
      });

      if (result.error) {
        setError(result.error.message || "Failed to accept invitation");
        return;
      }

      router.push(`/home/${invitation.organization.slug}`);
    } catch (err) {
      console.error("Error accepting invitation:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;

    setIsDeclining(true);
    setError(null);

    try {
      const result = await authClient.organization.rejectInvitation({
        invitationId: invitation.id,
      });

      if (result.error) {
        setError(result.error.message || "Failed to decline invitation");
        return;
      }

      router.push("/home");
    } catch (err) {
      console.error("Error declining invitation:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsDeclining(false);
    }
  };

  // Loading session state
  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invitation not found
  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <X className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation may have expired, been cancelled, or doesn&apos;t exist.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/home">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();
  const isAlreadyAccepted = invitation.status === "accepted";
  const isCancelled = invitation.status === "cancelled";
  const emailMismatch = session?.user?.email && invitation.email &&
    session.user.email.toLowerCase() !== invitation.email.toLowerCase();

  // Invalid invitation states
  if (isExpired || isAlreadyAccepted || isCancelled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <X className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>
              {isExpired && "Invitation Expired"}
              {isAlreadyAccepted && "Already Accepted"}
              {isCancelled && "Invitation Cancelled"}
            </CardTitle>
            <CardDescription>
              {isExpired && "This invitation has expired. Please ask for a new invitation."}
              {isAlreadyAccepted && "This invitation has already been accepted."}
              {isCancelled && "This invitation has been cancelled by the sender."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link href="/home">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Join {invitation.organization.name}</CardTitle>
            <CardDescription>
              You&apos;ve been invited to join as a{" "}
              <span className="font-medium">
                {roleLabels[invitation.role as keyof typeof roleLabels] || invitation.role}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center text-sm">
              <p className="text-muted-foreground">
                Invitation sent to: <span className="font-medium text-foreground">{invitation.email}</span>
              </p>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Sign in or create an account to accept this invitation.
            </p>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button asChild className="w-full">
              <Link href={`/auth/login?redirect=/invite/${invitationId}`}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/auth/signup?redirect=/invite/${invitationId}`}>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Email mismatch
  if (emailMismatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <X className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Email Mismatch</CardTitle>
            <CardDescription>
              This invitation was sent to <span className="font-medium">{invitation.email}</span>,
              but you&apos;re signed in as <span className="font-medium">{session.user.email}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">
              Please sign in with the correct email address to accept this invitation.
            </p>
          </CardContent>
          <CardFooter className="justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/home">Go to Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href={`/auth/login?redirect=/invite/${invitationId}`}>
                Sign In with Different Account
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Ready to accept
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Join {invitation.organization.name}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join as a{" "}
            <span className="font-medium">
              {roleLabels[invitation.role as keyof typeof roleLabels] || invitation.role}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitation.inviter && (
            <div className="rounded-lg bg-muted p-4 text-center text-sm">
              <p className="text-muted-foreground">
                Invited by: <span className="font-medium text-foreground">{invitation.inviter.name || invitation.inviter.email}</span>
              </p>
            </div>
          )}
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md text-center">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            onClick={handleAccept}
            disabled={isAccepting || isDeclining}
            className="w-full"
          >
            {isAccepting ? (
              "Accepting..."
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Accept Invitation
              </>
            )}
          </Button>
          <Button
            onClick={handleDecline}
            disabled={isAccepting || isDeclining}
            variant="outline"
            className="w-full"
          >
            {isDeclining ? "Declining..." : "Decline"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
