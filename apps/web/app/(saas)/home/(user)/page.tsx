import { redirect } from "next/navigation";
import { getServerSession, getUserOrganizations } from "@/lib/auth-server";
import { CreateOrganizationPrompt } from "@/components/organization/create-organization-prompt";

export default async function HomePage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Get user's organizations
  const organizations = await getUserOrganizations();

  // If user has organizations, redirect to the first one
  if (organizations && organizations.length > 0 && organizations[0]?.slug) {
    redirect(`/home/${organizations[0].slug}`);
  }

  // No organizations - show create prompt
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh]">
      <CreateOrganizationPrompt />
    </div>
  );
}
