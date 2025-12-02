"use client";

import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";
import { ProBadge } from "@/components/dashboard/pro-badge";
import { Workflow, mockWorkflows } from "@/lib/mock-data";

interface KnowledgeWorkflowsProps {
  teamSlug: string;
}

export function KnowledgeWorkflows({ teamSlug }: KnowledgeWorkflowsProps) {
  const workflows: Workflow[] = mockWorkflows;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Workflow Builder</h1>
            <ProBadge />
          </div>
          <p className="text-sm text-muted-foreground">
            Visualize how knowledge is synced from external systems into your
            index.
          </p>
        </div>
        <Button type="button">+ New workflow</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Workflows</CardTitle>
          <CardDescription>
            This list is powered by static mock data and is meant to visualize
            how workflows could look.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="flex items-start justify-between rounded-lg border bg-background px-3 py-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{workflow.name}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      workflow.status === "active"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-500",
                    )}>
                    {workflow.status === "active" ? "Active" : "Paused"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Trigger: {workflow.trigger === "schedule"
                    ? "Schedule"
                    : workflow.trigger === "email"
                    ? "Email"
                    : "Webhook"}
                </p>
                {workflow.lastRun && (
                  <p className="text-[11px] text-muted-foreground">
                    Last run: {workflow.lastRun}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  type="button"
                  className="h-7 px-2 text-[11px]">
                  <Link
                    href={`/dashboard/${teamSlug}/knowledge/workflows/${workflow.id}`}>
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="h-7 px-2 text-[11px]">
                  Run once
                </Button>
              </div>
            </div>
          ))}
          {workflows.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No workflows yet. Use workflows to connect CRMs, email inboxes, or
              internal APIs.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Editor preview</CardTitle>
          <CardDescription>
            Simple static preview of how a node-based editor could look for MVP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-muted-foreground">
          <div className="flex flex-col items-center gap-2 rounded-md border bg-muted/40 p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-md bg-background px-3 py-2 shadow-sm">
                Trigger
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="rounded-md bg-background px-3 py-2 shadow-sm">
                Process
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="rounded-md bg-background px-3 py-2 shadow-sm">
                Index
              </div>
            </div>
            <p>
              In a future version this area will be a drag-and-drop canvas using
              a node editor library.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
