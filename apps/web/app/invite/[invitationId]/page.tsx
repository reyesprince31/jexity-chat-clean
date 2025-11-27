import { InvitationClient } from "./invitation-client";
import { getInvitationPublic } from "@/lib/auth-server";

interface InvitationPageProps {
  params: Promise<{ invitationId: string }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { invitationId } = await params;

  // Fetch invitation server-side (no auth required)
  const invitation = await getInvitationPublic(invitationId);

  return <InvitationClient invitation={invitation} invitationId={invitationId} />;
}
