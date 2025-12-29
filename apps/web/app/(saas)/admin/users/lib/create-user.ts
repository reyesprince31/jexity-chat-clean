"use server";

import { auth } from "@repo/auth";
import { prisma } from "@repo/db";
import { headers } from "next/headers";

interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: "admin" | "user";
}

interface CreateUserResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string | null;
    emailVerified: boolean;
  };
  error?: string;
}

/**
 * Server action to create a user with emailVerified set to true.
 * This bypasses email verification for test users created by admins.
 */
export async function createUserWithVerifiedEmail(
  data: CreateUserData
): Promise<CreateUserResult> {
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

    // Create the user using BetterAuth's API
    const result = await auth.api.createUser({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
      },
    });

    if (!result?.user?.id) {
      return { success: false, error: "Failed to create user" };
    }

    // Directly update emailVerified in the database
    const updatedUser = await prisma.user.update({
      where: { id: result.user.id },
      data: { emailVerified: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      },
    });

    return {
      success: true,
      user: updatedUser,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: message };
  }
}