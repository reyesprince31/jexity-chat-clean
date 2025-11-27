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
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";
import { Separator } from "@repo/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui/components/sidebar";

interface DashboardPageProps {
  params: Promise<{ teamSlug: string }>;
}

export default async function TeamDashboardPage({
  params,
}: DashboardPageProps) {
  const { teamSlug } = await params;
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Get the organization by slug
  const organization = await getOrganizationBySlug(teamSlug);

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

  // Check if current session is an impersonation session
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
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={`/dashboard/${teamSlug}`}>
                    {organization.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">
              Welcome to {organization.name}
            </h1>
            <p className="text-muted-foreground">
              Here&apos;s what&apos;s happening with your team today.
            </p>
          </div>
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="bg-muted/50 aspect-video rounded-xl p-4">
              <h3 className="font-medium">Total Projects</h3>
              <p className="text-3xl font-bold mt-2">12</p>
            </div>
            <div className="bg-muted/50 aspect-video rounded-xl p-4">
              <h3 className="font-medium">Active Tasks</h3>
              <p className="text-3xl font-bold mt-2">24</p>
            </div>
            <div className="bg-muted/50 aspect-video rounded-xl p-4">
              <h3 className="font-medium">Team Members</h3>
              <p className="text-3xl font-bold mt-2">8</p>
            </div>
          </div>
          <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min p-4">
            <h3 className="font-medium mb-4">Recent Activity</h3>
            <p className="text-muted-foreground">
              No recent activity to display.
            </p>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
