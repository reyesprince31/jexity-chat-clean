import { notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/lib/auth-server";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";

interface TeamPageProps {
  params: Promise<{ team: string }>;
}

interface TeamMemberMock {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Agent";
  status: "Online" | "Offline" | "Away";
  conversations: number;
  avgResponse: string;
  satisfaction: string;
}

const mockTeamMembers: TeamMemberMock[] = [
  {
    id: "m1",
    name: "John Doe",
    email: "john@company.com",
    role: "Owner",
    status: "Online",
    conversations: 45,
    avgResponse: "1m",
    satisfaction: "98%",
  },
  {
    id: "m2",
    name: "Jane Smith",
    email: "jane@company.com",
    role: "Admin",
    status: "Online",
    conversations: 38,
    avgResponse: "2m",
    satisfaction: "96%",
  },
  {
    id: "m3",
    name: "Bob Wilson",
    email: "bob@company.com",
    role: "Agent",
    status: "Away",
    conversations: 52,
    avgResponse: "1m",
    satisfaction: "94%",
  },
  {
    id: "m4",
    name: "Alice Brown",
    email: "alice@company.com",
    role: "Agent",
    status: "Offline",
    conversations: 29,
    avgResponse: "3m",
    satisfaction: "92%",
  },
];

export default async function TeamPage({ params }: TeamPageProps) {
  const { team } = await params;

  const organization = await getOrganizationBySlug(team);

  if (!organization) {
    notFound();
  }

  const onlineCount = mockTeamMembers.filter((m) => m.status === "Online").length;

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
                <BreadcrumbPage>Team</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold">Team</h1>
            <p className="text-sm text-muted-foreground">
              Manage your support team members.
            </p>
          </div>
          <Button type="button" size="sm">
            + Invite Member
          </Button>
        </div>

        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-sm font-semibold">Team Members</h2>
              <p className="text-xs text-muted-foreground">
                {mockTeamMembers.length} members – {onlineCount} online
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {mockTeamMembers.map((member) => (
              <Card key={member.id} className="bg-muted/40">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-xs font-semibold">
                      {getInitials(member.name)}
                    </div>
                    <div className="space-y-0.5">
                      <CardTitle className="text-sm font-semibold">
                        {member.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        {member.email}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="space-y-1 text-right text-[11px]">
                    <div className="flex justify-end gap-1">
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 bg-amber-500/10 text-[10px] font-medium uppercase tracking-wide text-amber-500"
                      >
                        {member.role}
                      </Badge>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] ${
                          member.status === "Online"
                            ? "text-emerald-500"
                            : member.status === "Away"
                            ? "text-amber-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            member.status === "Online"
                              ? "bg-emerald-500"
                              : member.status === "Away"
                              ? "bg-amber-500"
                              : "bg-muted-foreground"
                          }`}
                        />
                        {member.status}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-2 border-t border-border/40 pt-3 text-center text-[11px] text-muted-foreground">
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {member.conversations}
                    </p>
                    <p>Conversations</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {member.avgResponse}
                    </p>
                    <p>Avg Response</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      {member.satisfaction}
                    </p>
                    <p>Satisfaction</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Role Permissions</CardTitle>
              <CardDescription>
                Overview of permissions for each role (mock only).
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto text-xs">
              <table className="w-full border-collapse text-left">
                <thead className="border-b border-border/60 text-[11px] text-muted-foreground">
                  <tr>
                    <th className="py-2 font-medium">Permission</th>
                    <th className="py-2 text-center font-medium">Owner</th>
                    <th className="py-2 text-center font-medium">Admin</th>
                    <th className="py-2 text-center font-medium">Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {permissionRows.map((row) => (
                    <tr key={row.label} className="border-b border-border/40 last:border-0">
                      <td className="py-2 pr-2 align-top text-[11px]">
                        {row.label}
                      </td>
                      <td className="py-2 text-center">
                        {row.owner ? "✓" : "—"}
                      </td>
                      <td className="py-2 text-center">
                        {row.admin ? "✓" : "—"}
                      </td>
                      <td className="py-2 text-center">
                        {row.agent ? "✓" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}

interface PermissionRow {
  label: string;
  owner: boolean;
  admin: boolean;
  agent: boolean;
}

const permissionRows: PermissionRow[] = [
  { label: "View Conversations", owner: true, admin: true, agent: true },
  { label: "Reply to Conversations", owner: true, admin: true, agent: true },
  { label: "Manage Team Members", owner: true, admin: true, agent: false },
  { label: "Access Knowledge Base", owner: true, admin: true, agent: true },
  { label: "Widget Customization", owner: true, admin: true, agent: false },
  { label: "Billing & Subscription", owner: true, admin: false, agent: false },
  { label: "Delete Data", owner: true, admin: false, agent: false },
];

function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (
    parts[0]!.charAt(0).toUpperCase() +
    parts[parts.length - 1]!.charAt(0).toUpperCase()
  );
}
