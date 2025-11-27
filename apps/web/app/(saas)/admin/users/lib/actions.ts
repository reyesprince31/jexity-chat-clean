"use server";


import { auth } from "@repo/auth";
import { prisma } from "@repo/db";
import { headers } from "next/headers";


/**
 * Server action to set emailVerified for an existing user.
 */
export async function setUserEmailVerified(
  userId: string,
  verified: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify the current user is an admin
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    if (session.user.role !== "admin") {
      return { success: false, error: "Not authorized. Admin role required." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: verified },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user emailVerified:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: message };
  }
}
