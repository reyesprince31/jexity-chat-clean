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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { mockAnalyticsSummary, mockCurrentPlanId, mockPlans } from "@/lib/mock-data";

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
          <DashboardContent teamSlug={teamSlug} organizationName={organization.name} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface DashboardContentProps {
  teamSlug: string;
  organizationName: string;
}

function DashboardContent({ teamSlug, organizationName }: DashboardContentProps) {
  const currentPlan = mockPlans.find((plan) => plan.id === mockCurrentPlanId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            High-level view of what&apos;s happening in {organizationName}.
          </p>
        </div>
        {currentPlan && (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {currentPlan.name} plan
            </Badge>
            {currentPlan.tier === "free" && (
              <Button size="sm" variant="outline" type="button">
                Upgrade to Pro (mock)
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total chats (7 days)</CardDescription>
            <CardTitle className="text-2xl">
              {mockAnalyticsSummary.totalChats.toLocaleString()}
            </CardTitle>
            <CardDescription className="text-xs text-emerald-500">
              ↑ {(mockAnalyticsSummary.deltas.totalChats * 100).toFixed(0)}% vs last week
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolution rate</CardDescription>
            <CardTitle className="text-2xl">
              {(mockAnalyticsSummary.resolutionRate * 100).toFixed(0)}%
            </CardTitle>
            <CardDescription className="text-xs text-emerald-500">
              ↑ {(mockAnalyticsSummary.deltas.resolutionRate * 100).toFixed(0)}% vs last week
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. first response</CardDescription>
            <CardTitle className="text-2xl">
              {mockAnalyticsSummary.avgResponseSeconds.toFixed(1)}s
            </CardTitle>
            <CardDescription className="text-xs text-emerald-500">
              ↓ {Math.abs(mockAnalyticsSummary.deltas.avgResponseSeconds).toFixed(1)}s vs last week
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>CSAT</CardDescription>
            <CardTitle className="text-2xl">
              {mockAnalyticsSummary.csatScore.toFixed(1)}/5
            </CardTitle>
            <CardDescription className="text-xs text-emerald-500">
              ↑ {mockAnalyticsSummary.deltas.csatScore.toFixed(1)} vs last week
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Get set up</CardTitle>
            <CardDescription>
              Three quick steps to go from zero to live conversations.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <QuickLinkCard
              title="Connect your widget"
              description="Customize the widget and add the script to your site."
              href={`/dashboard/${teamSlug}/widget`}
              cta="Open Widget Customizer"
            />
            <QuickLinkCard
              title="Set up your inbox"
              description="Review how new chats will appear in the Inbox."
              href={`/dashboard/${teamSlug}/conversations`}
              cta="Go to Inbox"
            />
            <QuickLinkCard
              title="Add knowledge (Pro)"
              description="Connect docs and websites so AI has context."
              href={`/dashboard/${teamSlug}/knowledge/websites`}
              cta="Open Knowledge Base"
              isPro
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
            <CardDescription>
              Lightweight placeholder for now.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>No recent activity yet. Once customers start chatting, you&apos;ll see a feed here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface QuickLinkCardProps {
  title: string;
  description: string;
  href: string;
  cta: string;
  isPro?: boolean;
}

function QuickLinkCard({ title, description, href, cta, isPro }: QuickLinkCardProps) {
  return (
    <a
      href={href}
      className="flex flex-col justify-between rounded-lg border bg-background p-3 text-left text-xs transition-colors hover:border-primary/50 hover:bg-muted/60">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold">{title}</span>
          {isPro && (
            <Badge variant="outline" className="text-[9px] uppercase tracking-wide">
              Pro
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <span className="mt-3 text-[11px] font-medium text-primary">{cta}</span>
    </a>
  );
}
