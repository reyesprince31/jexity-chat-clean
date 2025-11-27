import { headers } from "next/headers";
import { getServerSession } from "@/lib/auth-server";
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
import { CreateUserDialog } from "./_components/CreateUserDialog";
import { UserActions } from "./_components/UserActions";
import { auth } from "@repo/auth";

export default async function AdminUsersPage() {
  const session = await getServerSession();

  const currentUserId = session?.user?.id ?? null;

  const listUsersResponse = await auth.api.listUsers({
    headers: await headers(),
    query: {
      limit: 100,
      offset: 0,
      sortBy: "createdAt",
      sortDirection: "desc",
    },
  });

  const users = listUsersResponse.users ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all platform users
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Total users: {users.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email Verified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge variant="secondary">{user.role}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-green-500 text-green-600">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.emailVerified ? (
                        <Badge variant="outline">Verified</Badge>
                      ) : (
                        <Badge variant="secondary">Not Verified</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserActions
                        userId={user.id}
                        userName={user.name || "Unknown"}
                        userEmail={user.email}
                        userRole={user.role || null}
                        isBanned={Boolean(user.banned)}
                        isCurrentUser={currentUserId === user.id}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Ban User:</strong> Temporarily suspend a user&apos;s access.
            They won&apos;t be able to log in.
          </p>
          <p>
            <strong>Impersonate:</strong> Log in as another user to troubleshoot
            issues or provide support.
          </p>
          <p className="text-muted-foreground">
            Note: These actions use better-auth&apos;s built-in admin methods.
            The admin role is checked server-side.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
