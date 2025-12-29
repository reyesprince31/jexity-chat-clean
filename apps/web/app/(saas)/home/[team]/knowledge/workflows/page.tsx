import { notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/lib/auth-server";
import { KnowledgeWorkflows } from "@/components/dashboard/knowledge-workflows";
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

interface WorkflowsPageProps {
  params: Promise<{ team: string }>;
}

export default async function WorkflowsPage({ params }: WorkflowsPageProps) {
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
                <BreadcrumbPage>Workflow builder</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <KnowledgeWorkflows teamSlug={team} />
      </div>
    </>
  );
}
