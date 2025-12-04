import Link from "next/link";
import { Users, Shield, Building2, ScrollText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage users and platform settings
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              User Management
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mt-2">
              View, manage, and moderate user accounts
            </CardDescription>
            <Button asChild className="mt-4 w-full">
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mt-2">
              View all organizations and their members
            </CardDescription>
            <Button asChild className="mt-4 w-full">
              <Link href="/admin/organizations">View Organizations</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mt-2">
              Track all administrative actions and changes
            </CardDescription>
            <Button asChild className="mt-4 w-full">
              <Link href="/admin/audit-logs">View Logs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Tools</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mt-2">
              Access advanced administrative features
            </CardDescription>
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>
            Learn how to use the admin panel effectively
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Managing Users</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Navigate to the Users section to view all registered users. You
              can create test users manually (with verified emails), ban/unban
              users, and impersonate them to troubleshoot issues.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Organizations</h3>
            <p className="text-sm text-muted-foreground mt-1">
              View all organizations on the platform, see member counts, and
              explore organization details including all members and their
              roles.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Creating Test Users</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Use the &quot;Create User&quot; button in the Users section to
              manually create test accounts with verified emails, skipping the
              email verification process for testing purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
