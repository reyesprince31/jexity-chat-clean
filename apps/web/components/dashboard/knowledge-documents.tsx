"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Badge } from "@repo/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { cn } from "@repo/ui/lib/utils";
import { ProBadge } from "@/components/dashboard/pro-badge";
import { DocumentSource, mockDocuments } from "@/lib/mock-data";

export function KnowledgeDocuments() {
  const [documents] = useState<DocumentSource[]>(mockDocuments);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Document Upload</h1>
            <ProBadge />
          </div>
          <p className="text-sm text-muted-foreground">
            Upload PDFs, markdown, and CSV files for AI to reference when
            answering customer questions.
          </p>
        </div>
        <Button type="button">+ Upload files</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Upload area</CardTitle>
          <CardDescription>
            This is a visual placeholder. Drag & drop and file parsing will be
            wired later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
            Drag & drop files here or click to browse (mock only).
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Uploaded documents</CardTitle>
          <CardDescription>
            All documents currently indexed or processing for this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Input
              placeholder="Search documents"
              className="h-8 w-48 text-xs"
              disabled
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="h-8 px-3 text-xs">
              Delete selected (mock)
            </Button>
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
                    <TableCell className="uppercase">{doc.type}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
