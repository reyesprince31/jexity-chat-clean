"use client";

import { useState, useEffect } from "react";
import { Monitor, Smartphone, Globe, Loader2, Trash2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";

interface Session {
  id: string;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

function getDeviceIcon(userAgent: string | null | undefined) {
  if (!userAgent) return <Globe className="h-5 w-5" />;

  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return <Smartphone className="h-5 w-5" />;
  }
  return <Monitor className="h-5 w-5" />;
}

function getDeviceName(userAgent: string | null | undefined) {
  if (!userAgent) return "Unknown Device";

  const ua = userAgent.toLowerCase();

  // Browser detection
  let browser = "Unknown Browser";
  if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("safari")) browser = "Safari";

  // OS detection
  let os = "";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  return os ? `${browser} on ${os}` : browser;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SessionsManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.listSessions();

      if (result.error) {
        setError(result.error.message || "Failed to load sessions");
        return;
      }

      setSessions(result.data || []);

      // Get current session to identify which one is active
      const currentSession = await authClient.getSession();
      if (currentSession.data?.session) {
        setCurrentToken(currentSession.data.session.token);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const revokeSession = async (token: string) => {
    setRevokingToken(token);

    try {
      const result = await authClient.revokeSession({ token });

      if (result.error) {
        setError(result.error.message || "Failed to revoke session");
        return;
      }

      // Remove from list
      setSessions((prev) => prev.filter((s) => s.token !== token));
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setRevokingToken(null);
    }
  };

  const revokeOtherSessions = async () => {
    setIsLoading(true);

    try {
      const result = await authClient.revokeOtherSessions();

      if (result.error) {
        setError(result.error.message || "Failed to revoke sessions");
        return;
      }

      // Reload sessions
      await loadSessions();
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
        <CardTitle>Active Sessions</CardTitle>
        <CardDescription>
          Manage your active sessions across devices. You can sign out of sessions you don&apos;t recognize.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No active sessions found.
          </p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const isCurrent = session.token === currentToken;

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-muted-foreground">
                      {getDeviceIcon(session.userAgent)}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {getDeviceName(session.userAgent)}
                        {isCurrent && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {session.ipAddress || "Unknown IP"} · Last active {formatDate(session.updatedAt)}
                      </div>
                    </div>
                  </div>
                  {!isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeSession(session.token)}
                      disabled={revokingToken === session.token}
                    >
                      {revokingToken === session.token ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })}

            {sessions.length > 1 && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={revokeOtherSessions}
                  disabled={isLoading}
                  className="w-full"
                >
                  Sign out of all other sessions
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
