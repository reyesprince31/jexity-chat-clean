import { Resend } from "resend";
import type { CreateEmailOptions } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  // Ensure at least one of text or html is provided
  if (!text && !html) {
    throw new Error("Either text or html must be provided");
  }

  const payload = {
    from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
    to,
    subject,
    ...(html && { html }),
    ...(text && { text }),
  } as CreateEmailOptions;

  const { data, error } = await resend.emails.send(payload);

  if (error) {
    console.error("Failed to send email:", error);
    throw new Error(error.message);
  }

  return data;
}

// Pre-built email templates
export async function sendPasswordResetEmail(email: string, url: string) {
  return sendEmail({
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <div style="margin: 24px 0;">
          <a href="${url}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
      </div>
    `,
    text: `Reset your password by clicking this link: ${url}`,
  });
}

export async function sendVerificationEmail(email: string, url: string) {
  return sendEmail({
    to: email,
    subject: "Verify your email address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email</h2>
        <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
        <div style="margin: 24px 0;">
          <a href="${url}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `,
    text: `Verify your email by clicking this link: ${url}`,
  });
}

export async function sendDeleteAccountEmail(email: string, url: string) {
  return sendEmail({
    to: email,
    subject: "Confirm account deletion",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Confirm Account Deletion</h2>
        <p>You requested to delete your account. This action is <strong>permanent and cannot be undone</strong>.</p>
        <p>Click the button below to confirm deletion:</p>
        <div style="margin: 24px 0;">
          <a href="${url}" style="background-color: #dc2626; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Delete My Account
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please secure your account immediately.</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
      </div>
    `,
    text: `Confirm account deletion by clicking this link: ${url}. This action is permanent and cannot be undone.`,
  });
}

interface InvitationEmailOptions {
  email: string;
  inviterName: string;
  organizationName: string;
  url: string;
}

export async function sendInvitationEmail({
  email,
  inviterName,
  organizationName,
  url,
}: InvitationEmailOptions) {
  return sendEmail({
    to: email,
    subject: `You've been invited to join ${organizationName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>You're Invited!</h2>
        <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong>.</p>
        <p>Click the button below to accept the invitation and join the team:</p>
        <div style="margin: 24px 0;">
          <a href="${url}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">If you weren't expecting this invitation, you can safely ignore this email.</p>
        <p style="color: #666; font-size: 14px;">This invitation will expire in 48 hours.</p>
      </div>
    `,
    text: `${inviterName} has invited you to join ${organizationName}. Accept the invitation by clicking this link: ${url}`,
  });
}
