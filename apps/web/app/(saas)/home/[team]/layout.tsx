import { redirect, notFound } from "next/navigation";
import {
  getServerSession,
  getOrganizationBySlug,
  setActiveOrganization,
} from "@/lib/auth-server";
import { AppSidebar } from "@/components/saas/app-sidebar";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { SidebarInset, SidebarProvider } from "@/ui/sidebar";

interface TeamLayoutProps {
  children: React.ReactNode;
  params: Promise<{ team: string }>;
}

export default async function TeamLayout({ children, params }: TeamLayoutProps) {
  const { team } = await params;
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Get the organization by slug
  const organization = await getOrganizationBySlug(team);

  if (!organization) {
    notFound();
  }

  // Set this organization as active
  await setActiveOrganization(organization.id);

  const user = {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image,
    role: session.user.role,
  };

  const isImpersonating = !!session?.session?.impersonatedBy;

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        {isImpersonating && (
          <ImpersonationBanner user={{ name: user.name, email: user.email }} />
        )}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
