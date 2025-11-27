import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Badge } from "@repo/ui/components/badge";

interface OrganizationsDetailsProps {
  organizations: {
    id: string;
    name: string;
    _count: {
      members: number;
    };
    members: {
      id: string;
      role: string;
      user: {
        name: string | null;
        email: string;
      };
    }[];
  }[];
}

export function OrganizationsDetails({
  organizations,
}: OrganizationsDetailsProps) {
  if (organizations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Details</CardTitle>
        <CardDescription>Members in each organization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {organizations.map((org) => (
          <div key={org.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{org.name}</h3>
              <Badge>{org._count.members} members</Badge>
            </div>
            {org.members.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {org.members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{member.user.name}</TableCell>
                        <TableCell>{member.user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{member.role}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No members yet</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
