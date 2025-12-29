import { headers } from "next/headers";
import { auth } from "@repo/auth";
import { prisma } from "@repo/db";

/**
 * Get the current session on the server side
 * Use this in Server Components and Server Actions
 */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Check if the user is authenticated on the server side
 */
export async function isAuthenticated() {
  const session = await getServerSession();
  return !!session;
}

/**
 * Get the current user on the server side
 * Throws if not authenticated
 */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Get the list of organizations the user belongs to
 */
export async function getUserOrganizations() {
  const response = await auth.api.listOrganizations({
    headers: await headers(),
  });
  return response;
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string) {
  const orgs = await getUserOrganizations();
  return orgs?.find((org) => org.slug === slug) || null;
}

/**
 * Set the active organization
 */
export async function setActiveOrganization(organizationId: string) {
  const response = await auth.api.setActiveOrganization({
    headers: await headers(),
    body: { organizationId },
  });
  return response;
}

/**
 * Get organization members
 */
export async function getOrganizationMembers(organizationId: string) {
  const response = await auth.api.listMembers({
    headers: await headers(),
    query: { organizationId },
  });
  return response;
}

/**
 * Get organization invitations
 */
export async function getOrganizationInvitations(organizationId: string) {
  const response = await auth.api.listInvitations({
    headers: await headers(),
    query: { organizationId },
  });
  return response;
}

/**
 * Get invitation by ID (requires auth)
 */
export async function getInvitationById(invitationId: string) {
  const response = await auth.api.getInvitation({
    headers: await headers(),
    query: { id: invitationId },
  });
  return response;
}

/**
 * Get invitation by ID directly from database (no auth required)
 * Used for the public invitation accept page
 */
export async function getInvitationPublic(invitationId: string) {
 
  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!invitation) return null;

  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role || "member",
    status: invitation.status,
    expiresAt: invitation.expiresAt,
    organizationId: invitation.organizationId,
    organization: invitation.organization,
    inviter: {
      id: invitation.user.id,
      name: invitation.user.name,
      email: invitation.user.email,
    },
  };
}

/**
 * Get full organization with members
 */
export async function getFullOrganization(organizationId?: string, organizationSlug?: string) {
  const response = await auth.api.getFullOrganization({
    headers: await headers(),
    query: {
      ...(organizationId && { organizationId }),
      ...(organizationSlug && { organizationSlug }),
    },
  });
  return response;
}

/**
 * Get current user's role in an organization
 */
export async function getCurrentMemberRole(organizationId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) return null;

  const result = await getOrganizationMembers(organizationId);
  const currentMember = result?.members?.find(m => m.userId === session.user.id);
  return currentMember?.role || null;
}
