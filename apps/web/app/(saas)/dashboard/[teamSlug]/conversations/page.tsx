import { redirect, notFound } from "next/navigation";
import {
  getServerSession,
  getOrganizationBySlug,
  setActiveOrganization,
} from "@/lib/auth-server";
import { AppSidebar } from "@/components/saas/app-sidebar";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/ui/breadcrumb";
import { Separator } from "@/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/ui/sidebar";
import { ConversationsContent } from "@/components/conversations/ConversationContent";
import { InboxBreadcrumbToggle } from "@/components/conversations/InboxBreadcrumbToggle";

interface ConversationsPageProps {
  params: Promise<{ teamSlug: string }>;
}

export default async function ConversationsPage({
  params,
}: ConversationsPageProps) {
  const { teamSlug } = await params;
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  const organization = await getOrganizationBySlug(teamSlug);

  if (!organization) {
    notFound();
  }

  await setActiveOrganization(organization.id);

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
      <SidebarInset className="flex h-screen flex-col min-h-0">
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
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/dashboard/${teamSlug}`}>
                    {organization.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <InboxBreadcrumbToggle />
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 min-h-0 flex-col">
          <ConversationsContent user={user} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
