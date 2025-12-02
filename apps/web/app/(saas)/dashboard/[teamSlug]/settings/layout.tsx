import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getServerSession,
  getOrganizationBySlug,
  setActiveOrganization,
} from "@/lib/auth-server";
import { AppSidebar } from "@/components/saas/app-sidebar";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { SettingsNav } from "@/components/organization/settings-nav";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/ui/breadcrumb";
import { Separator } from "@/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/ui/sidebar";

interface SettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ teamSlug: string }>;
}

export default async function SettingsLayout({
  children,
  params,
}: SettingsLayoutProps) {
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
                  <BreadcrumbPage>Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href={`/dashboard/${teamSlug}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            <aside className="w-full md:w-48 shrink-0">
              <SettingsNav teamSlug={teamSlug} />
            </aside>
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
