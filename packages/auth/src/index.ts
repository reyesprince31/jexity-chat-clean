import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { logger } from "@repo/logs";
import { prisma } from "@repo/db";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendDeleteAccountEmail,
  sendInvitationEmail,
} from "@repo/mail";
import { admin, organization } from "better-auth/plugins";

const vercelEnv = process.env.VERCEL_ENV;
const vercelUrl = process.env.VERCEL_URL;

function getBaseURL(): string {
  if (vercelEnv === "preview" && vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return process.env.BETTER_AUTH_URL || "http://localhost:3001";
}

const baseURL = getBaseURL();

export const auth = betterAuth({
  baseURL,
  trustedOrigins: [baseURL],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // Modify the callback URL to redirect to our verify-email page
      // which will then handle the localStorage redirect for invitations
      const modifiedUrl = new URL(url);
      modifiedUrl.searchParams.set("callbackURL", "/auth/verify-email");
      await sendVerificationEmail(user.email, modifiedUrl.toString());
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  user: {
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        await sendDeleteAccountEmail(user.email, url);
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      impersonationSessionDuration: 60 * 60, // 1 hour
      defaultBanReason: "Violation of terms of service",
    }),
    organization({
      async sendInvitationEmail({ email, organization, inviter }) {
        const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
        // Find the invitation to get its ID
        const invitation = await prisma.invitation.findFirst({
          where: {
            email,
            organizationId: organization.id,
            status: "pending",
          },
          orderBy: { createdAt: "desc" },
        });

        if (!invitation) {
          console.error("Could not find invitation for email:", email);
          return;
        }

        const inviteUrl = `${baseUrl}/invite/${invitation.id}`;
        const inviterName = inviter.user.name || inviter.user.email;

        await sendInvitationEmail({
          email,
          inviterName,
          organizationName: organization.name,
          url: inviteUrl,
        });
      },
    }),
  ],
  	onAPIError: {
		onError(error, ctx) {
			logger.error(error, { ctx });
		},
	},
});
