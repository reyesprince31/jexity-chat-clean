"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
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
import { ProBadge } from "@/components/dashboard/pro-badge";
import {
  DocumentSource,
  WebsiteSource,
  Workflow,
  mockDocuments,
  mockWebsiteSources,
  mockWorkflows,
} from "@/lib/mock-data";

interface KnowledgeBaseOverviewProps {
  teamSlug: string;
}

export function KnowledgeBaseOverview({
  teamSlug,
}: KnowledgeBaseOverviewProps) {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteSources, setWebsiteSources] = useState<WebsiteSource[]>(
    mockWebsiteSources,
  );
  const [documents] = useState<DocumentSource[]>(mockDocuments);
  const [workflows] = useState<Workflow[]>(mockWorkflows);

  const handleAddWebsite = () => {
    if (!websiteUrl.trim()) return;

    const newSource: WebsiteSource = {
      id: `url-${Date.now()}`,
      url: websiteUrl.trim(),
      status: "crawling",
      pageCount: 0,
      lastCrawled: "Queued just now",
    };

    setWebsiteSources((prev) => [newSource, ...prev]);
    setWebsiteUrl("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Knowledge Base</h1>
            <ProBadge />
          </div>
          <p className="text-sm text-muted-foreground">
            Connect websites, documents, and workflows that power AI responses
            for your widget.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-[10px] uppercase">
            Pro feature preview
          </Badge>
          <Button
            size="sm"
            variant="outline"
            type="button"
            className="h-8 px-3 text-xs">
            View pricing (mock)
          </Button>
          <Button size="sm" type="button" className="h-8 px-3 text-xs">
            Add source
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Websites"
          value={websiteSources.length}
          description="Connected domains"
        />
        <StatCard
          title="Documents"
          value={documents.length}
          description="Files indexed for RAG"
        />
        <StatCard
          title="Workflows"
          value={workflows.length}
          description="Automations configured"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm font-semibold">
                <span>Website scraper</span>
                <Badge variant="outline" className="text-[10px]">
                  Crawling is simulated
                </Badge>
              </CardTitle>
              <CardDescription>
                Add website URLs to crawl and index pages into your knowledge
                base.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="websiteUrl"
                    placeholder="https://docs.example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={handleAddWebsite}
                    disabled={!websiteUrl.trim()}>
                    Crawl website
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Options like depth and robots.txt are omitted for this mock
                  and can be added later.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Indexed websites</h3>
                  <span className="text-xs text-muted-foreground">
                    {websiteSources.length} sources
                  </span>
                </div>
                <div className="divide-y rounded-md border bg-background text-sm">
                  {websiteSources.map((source) => (
                    <div key={source.id} className="flex items-center gap-3 p-3">
                      <div className="flex-1">
                        <p className="truncate font-medium">{source.url}</p>
                        <p className="text-xs text-muted-foreground">
                          {source.pageCount} pages | Last: {source.lastCrawled}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          source.status === "indexed" &&
                            "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
                          source.status === "crawling" &&
                            "border-amber-500/40 bg-amber-500/10 text-amber-500",
                          source.status === "failed" &&
                            "border-destructive/40 bg-destructive/10 text-destructive",
                        )}>
                        {source.status === "indexed"
                          ? "Indexed"
                          : source.status === "crawling"
                          ? "Crawling"
                          : "Failed"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="h-7 px-2 text-[11px]">
                        Details
                      </Button>
                    </div>
                  ))}
                  {websiteSources.length === 0 && (
                    <p className="p-3 text-xs text-muted-foreground">
                      No websites connected yet.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Documents</CardTitle>
              <CardDescription>
                Upload PDFs, markdown, and CSV files for AI to reference.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                Drag and drop files here or click to upload (mock only).
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Uploaded documents</h3>
                  <Input
                    placeholder="Search"
                    className="h-8 w-40 text-xs"
                    disabled
                  />
                </div>
                <div className="overflow-hidden rounded-md border bg-background">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size (MB)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="truncate font-medium">
                            {doc.filename}
                          </TableCell>
                          <TableCell className="uppercase">
                            {doc.type}
                          </TableCell>
                          <TableCell>{doc.size.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px]",
                                doc.status === "indexed" &&
                                  "border-emerald-500/40 bg-emerald-500/10 text-emerald-500",
                                doc.status === "processing" &&
                                  "border-amber-500/40 bg-amber-500/10 text-amber-500",
                                doc.status === "failed" &&
                                  "border-destructive/40 bg-destructive/10 text-destructive",
                              )}>
                              {doc.status === "indexed"
                                ? "Indexed"
                                : doc.status === "processing"
                                ? "Processing"
                                : "Failed"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              type="button"
                              className="text-lg leading-none">
                              
                              
                              
                              
                              ...
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Workflows</CardTitle>
              <CardDescription>
                Automate how new knowledge is ingested into your index.
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
                  No workflows yet. Use workflows to sync CRMs, email inboxes,
                  or other systems.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Upgrade experience
              </CardTitle>
              <CardDescription>
                Free workspaces will see upgrade prompts when they try to
                access Knowledge Base.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              <ul className="list-disc space-y-1 pl-4">
                <li>Pro badge in sidebar next to Knowledge Base.</li>
                <li>Tooltip and modal prompting upgrade when clicked.</li>
                <li>
                  Billing page shows available plans and highlights the current
                  plan.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  description: string;
}

function StatCard({ title, value, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}


