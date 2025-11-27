"use server";

import { auth } from "@repo/auth";
import { prisma } from "@repo/db";
import { headers } from "next/headers";

type ActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Get current admin session and validate admin role
 */
async function getAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: "Not authenticated", session: null };
  }

  if (session.user.role !== "admin") {
    return { error: "Not authorized. Admin role required.", session: null };
  }

  return { error: null, session };
}

/**
 * Get request metadata for audit logging
 */
async function getRequestMetadata() {
  const headersList = await headers();
  return {
    ipAddress: headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown",
    userAgent: headersList.get("user-agent") || "unknown",
  };
}

/**
 * Ban a user with audit logging
 */
export async function banUserWithAudit({
  userId,
  reason,
  banExpiresAt,
}: {
  userId: string;
  reason: string;
  banExpiresAt?: Date;
}): Promise<ActionResult> {
  try {
    const { session, error } = await getAdminSession();
    if (error || !session) {
      return { success: false, error: error || "Not authenticated" };
    }

    // Cannot ban yourself
    if (session.user.id === userId) {
      return { success: false, error: "Cannot ban yourself" };
    }

    // Get target user info
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Cannot ban other admins
    if (targetUser.role === "admin") {
      return { success: false, error: "Cannot ban other admins" };
    }

    // Ban the user using better-auth
    await auth.api.banUser({
      headers: await headers(),
      body: {
        userId,
        banReason: reason,
        banExpiresIn: banExpiresAt
          ? Math.floor((banExpiresAt.getTime() - Date.now()) / 1000)
          : undefined,
      },
    });

    // Create audit log
    const { ipAddress, userAgent } = await getRequestMetadata();
    await prisma.auditLog.create({
      data: {
        action: "USER_BANNED",
        actorId: session.user.id,
        targetType: "USER",
        targetId: userId,
        metadata: JSON.stringify({
          email: targetUser.email,
          name: targetUser.name,
          reason,
          banExpiresAt: banExpiresAt?.toISOString() || "permanent",
        }),
        ipAddress,
        userAgent,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error banning user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Unban a user with audit logging
 */
export async function unbanUserWithAudit({
  userId,
}: {
  userId: string;
}): Promise<ActionResult> {
  try {
    const { session, error } = await getAdminSession();
    if (error || !session) {
      return { success: false, error: error || "Not authenticated" };
    }

    // Get target user info
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, banReason: true },
    });

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Unban the user using better-auth
    await auth.api.unbanUser({
      headers: await headers(),
      body: { userId },
    });

    // Create audit log
    const { ipAddress, userAgent } = await getRequestMetadata();
    await prisma.auditLog.create({
      data: {
        action: "USER_UNBANNED",
        actorId: session.user.id,
        targetType: "USER",
        targetId: userId,
        metadata: JSON.stringify({
          email: targetUser.email,
          name: targetUser.name,
          previousBanReason: targetUser.banReason,
        }),
        ipAddress,
        userAgent,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error unbanning user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Impersonate a user with audit logging
 */
export async function impersonateUserWithAudit({
  userId,
  reason,
}: {
  userId: string;
  reason?: string;
}): Promise<ActionResult> {
  try {
    const { session, error } = await getAdminSession();
    if (error || !session) {
      return { success: false, error: error || "Not authenticated" };
    }

    // Get target user info
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Cannot impersonate other admins
    if (targetUser.role === "admin") {
      return { success: false, error: "Cannot impersonate other admins" };
    }

    // Create audit log BEFORE impersonation (since session will change)
    const { ipAddress, userAgent } = await getRequestMetadata();
    await prisma.auditLog.create({
      data: {
        action: "USER_IMPERSONATED",
        actorId: session.user.id,
        targetType: "USER",
        targetId: userId,
        metadata: JSON.stringify({
          email: targetUser.email,
          name: targetUser.name,
          reason: reason || "Support/debugging",
          adminEmail: session.user.email,
        }),
        ipAddress,
        userAgent,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error logging impersonation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete a user with audit logging
 */
export async function deleteUserWithAudit({
  userId,
  reason,
}: {
  userId: string;
  reason: string;
}): Promise<ActionResult> {
  try {
    const { session, error } = await getAdminSession();
    if (error || !session) {
      return { success: false, error: error || "Not authenticated" };
    }

    // Cannot delete yourself
    if (session.user.id === userId) {
      return { success: false, error: "Cannot delete yourself" };
    }

    // Get target user info BEFORE deletion
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    // Cannot delete other admins
    if (targetUser.role === "admin") {
      return { success: false, error: "Cannot delete other admins" };
    }

    // Create audit log BEFORE deletion (to preserve user info)
    const { ipAddress, userAgent } = await getRequestMetadata();
    await prisma.auditLog.create({
      data: {
        action: "USER_DELETED",
        actorId: session.user.id,
        targetType: "USER",
        targetId: userId,
        metadata: JSON.stringify({
          deletedEmail: targetUser.email,
          deletedName: targetUser.name,
          reason,
          deletedBy: session.user.email,
        }),
        ipAddress,
        userAgent,
      },
    });

    // Delete the user using better-auth
    await auth.api.removeUser({
      headers: await headers(),
      body: { userId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Log when impersonation ends
 */
export async function logImpersonationEnded({
  impersonatedUserId,
}: {
  impersonatedUserId: string;
}): Promise<ActionResult> {
  try {
    const { session, error } = await getAdminSession();
    if (error || !session) {
      return { success: false, error: error || "Not authenticated" };
    }

    const { ipAddress, userAgent } = await getRequestMetadata();
    await prisma.auditLog.create({
      data: {
        action: "IMPERSONATION_ENDED",
        actorId: session.user.id,
        targetType: "USER",
        targetId: impersonatedUserId,
        metadata: JSON.stringify({
          endedBy: "manual",
        }),
        ipAddress,
        userAgent,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error logging impersonation end:", error);
    return { success: false, error: "Failed to log" };
  }
}
