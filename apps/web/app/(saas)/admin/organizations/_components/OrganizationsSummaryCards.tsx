import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Building2, Users } from "lucide-react";

interface OrganizationsSummaryCardsProps {
  organizations: {
    _count: {
      members: number;
      invitations: number;
    };
  }[];
}

export function OrganizationsSummaryCards({
  organizations,
}: OrganizationsSummaryCardsProps) {
  const totalOrganizations = organizations.length;
  const totalMembers = organizations.reduce(
    (acc, org) => acc + org._count.members,
    0
  );
  const totalInvitations = organizations.reduce(
    (acc, org) => acc + org._count.invitations,
    0
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Organizations
          </CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOrganizations}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMembers}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Invitations
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInvitations}</div>
        </CardContent>
      </Card>
    </div>
  );
}
