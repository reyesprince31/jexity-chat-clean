import { notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/lib/auth-server";
import { WidgetCustomizer } from "@/components/dashboard/widget-customizer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/ui/breadcrumb";
import { Separator } from "@/ui/separator";
import { SidebarTrigger } from "@/ui/sidebar";

interface WidgetPageProps {
  params: Promise<{ team: string }>;
}

export default async function WidgetPage({ params }: WidgetPageProps) {
  const { team } = await params;

  const organization = await getOrganizationBySlug(team);

  if (!organization) {
    notFound();
  }

  return (
    <>
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
                <BreadcrumbLink href={`/home/${team}`}>
                  {organization.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Widget</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Widget customizer</h1>
          <p className="text-sm text-muted-foreground">
            Configure how the chat widget looks and behaves on your website.
          </p>
        </div>
        <div className="flex-1 rounded-xl bg-muted/50 p-4">
          <WidgetCustomizer />
        </div>
      </div>
    </>
  );
}
