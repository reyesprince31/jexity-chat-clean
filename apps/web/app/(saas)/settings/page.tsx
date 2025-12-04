import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { AppSidebar } from "@/components/saas/app-sidebar";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
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
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default async function SettingsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

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
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
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
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences.
            </p>
          </div>
          <SettingsTabs user={user} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
