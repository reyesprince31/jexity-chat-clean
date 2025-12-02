import { redirect, notFound } from "next/navigation";
import {
  getOrganizationBySlug,
  getServerSession,
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
} from "@/ui/breadcrumb";
import { Separator } from "@/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/ui/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { cn } from "@/lib/utils";
import { mockContacts } from "@/lib/mock-data";

interface ContactsPageProps {
  params: Promise<{ teamSlug: string }>;
}

export default async function ContactsPage({ params }: ContactsPageProps) {
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

  const totalContacts = mockContacts.length;
  const activeThisWeek = 3;
  const newThisMonth = 5;
  const avgConversations = 4.2;

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
                  <BreadcrumbPage>Contacts</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold">Contacts</h1>
              <p className="text-sm text-muted-foreground">
                Manage your customer database.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" type="button">
                Export
              </Button>
              <Button size="sm" type="button">
                + Add Contact
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total contacts</CardDescription>
                <CardTitle className="text-2xl">{totalContacts}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active this week</CardDescription>
                <CardTitle className="text-2xl">{activeThisWeek}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>New this month</CardDescription>
                <CardTitle className="text-2xl">{newThisMonth}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg. conversations</CardDescription>
                <CardTitle className="text-2xl">{avgConversations}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="mt-2 flex-1">
            <CardHeader className="flex flex-col gap-3 pb-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-semibold">Contact list</CardTitle>
                <CardDescription>
                  This is a static mock table; filters and export are non-functional
                  for now.
                </CardDescription>
              </div>
              <div className="flex flex-1 items-center gap-2 md:flex-initial">
                <Input
                  placeholder="Search contacts..."
                  className="h-8 max-w-xs text-xs"
                  disabled
                />
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="h-8 px-3 text-xs">
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="overflow-hidden rounded-md border bg-background">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Conversations</TableHead>
                      <TableHead>Last seen</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="space-y-0.5">
                          <div className="text-xs font-medium">{contact.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {contact.email}
                          </div>
                        </TableCell>
                        <TableCell>{contact.company}</TableCell>
                        <TableCell>{contact.conversations}</TableCell>
                        <TableCell>{contact.lastSeen}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-[9px] uppercase tracking-wide">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={cn(
                              "text-[10px]",
                              contact.status === "active"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-muted text-muted-foreground",
                            )}>
                            {contact.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
