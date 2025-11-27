import { prisma } from "@repo/db";
import { formatDistanceToNow } from "date-fns";
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
import {
  UserPlus,
  UserMinus,
  Ban,
  ShieldCheck,
  UserCog,
  Eye,
  Trash2,
  Building2,
  ScrollText,
} from "lucide-react";

// Action type to icon and color mapping
const actionConfig: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  ADMIN_PROMOTED: {
    icon: ShieldCheck,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    label: "Admin Promoted",
  },
  ADMIN_DEMOTED: {
    icon: UserMinus,
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    label: "Admin Demoted",
  },
  USER_BANNED: {
    icon: Ban,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    label: "User Banned",
  },
  USER_UNBANNED: {
    icon: UserPlus,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    label: "User Unbanned",
  },
  USER_CREATED: {
    icon: UserPlus,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    label: "User Created",
  },
  USER_DELETED: {
    icon: Trash2,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    label: "User Deleted",
  },
  USER_IMPERSONATED: {
    icon: Eye,
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    label: "User Impersonated",
  },
  ROLE_CHANGED: {
    icon: UserCog,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    label: "Role Changed",
  },
  ORG_SUSPENDED: {
    icon: Building2,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    label: "Org Suspended",
  },
  ORG_UNSUSPENDED: {
    icon: Building2,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    label: "Org Unsuspended",
  },
};

const defaultActionConfig = {
  icon: ScrollText,
  color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  label: "Action",
};

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100, // Limit to last 100 logs for now
  });

  // Get stats
  const totalLogs = await prisma.auditLog.count();
  const todayLogs = await prisma.auditLog.count({
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });
  const uniqueActors = await prisma.auditLog.groupBy({
    by: ["actorId"],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-2">
          Track all administrative actions on the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayLogs}</div>
            <p className="text-xs text-muted-foreground">Actions today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueActors.length}</div>
            <p className="text-xs text-muted-foreground">
              Admins with logged actions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Showing the last 100 administrative actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs yet</p>
              <p className="text-sm mt-1">
                Admin actions will appear here when they occur
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const config =
                    actionConfig[log.action] || defaultActionConfig;
                  const Icon = config.icon;
                  const metadata = log.metadata
                    ? JSON.parse(log.metadata)
                    : null;

                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${config.color} gap-1`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.actor.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.actor.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-muted-foreground">
                            {log.targetType}:
                          </span>{" "}
                          <span className="font-mono text-xs">
                            {log.targetId.slice(0, 8)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {metadata && (
                          <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {metadata.email && <span>{metadata.email}</span>}
                            {metadata.reason && (
                              <span>Reason: {metadata.reason}</span>
                            )}
                            {metadata.promotedVia && (
                              <span>Via: {metadata.promotedVia}</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(log.createdAt), {
                            addSuffix: true,
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
