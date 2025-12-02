import { redirect } from "next/navigation";
import { getServerSession, getUserOrganizations } from "@/lib/auth-server";
import { AppSidebar } from "@/components/saas/app-sidebar";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { CreateOrganizationPrompt } from "@/components/organization/create-organization-prompt";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/ui/sidebar";
import { Separator } from "@/ui/separator";

export default async function DashboardPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Get user's organizations
  const organizations = await getUserOrganizations();

  // If user has organizations, redirect to the first one
  if (organizations && organizations.length > 0 && organizations[0]?.slug) {
    redirect(`/dashboard/${organizations[0].slug}`);
  }

  // No organizations - show create prompt
  const user = {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image,
    role: session.user.role,
  };

  const isImpersonating = session?.session?.impersonatedBy;

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        {isImpersonating && (
          <ImpersonationBanner user={{ name: user.name, email: user.email }} />
        )}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <span className="text-sm font-medium">Get Started</span>
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <CreateOrganizationPrompt />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
