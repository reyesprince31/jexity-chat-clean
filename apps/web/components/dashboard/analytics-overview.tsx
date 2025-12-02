"use client";

import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Badge } from "@repo/ui/components/badge";
import {
  AnalyticsPoint,
  mockAnalyticsSummary,
  mockConversationsOverTime,
  mockEscalationReasons,
  mockTopics,
} from "@/lib/mock-data";

export function AnalyticsOverview() {
  const summary = mockAnalyticsSummary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Get a feel for the type of metrics we\'ll surface once data
            collection is wired up.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Select defaultValue="7d">
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" type="button">
            Export CSV (mock)
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total chats"
          value={summary.totalChats.toLocaleString()}
          delta={summary.deltas.totalChats}
        />
        <MetricCard
          label="Resolution rate"
          value={`${Math.round(summary.resolutionRate * 100)}%`}
          delta={summary.deltas.resolutionRate}
        />
        <MetricCard
          label="Avg response time"
          value={`${summary.avgResponseSeconds.toFixed(1)}s`}
          delta={-summary.deltas.avgResponseSeconds}
        />
        <MetricCard
          label="CSAT"
          value={summary.csatScore.toFixed(1)}
          delta={summary.deltas.csatScore}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Conversations over time
            </CardTitle>
            <CardDescription className="text-xs">
              Static mock showing how the time-series chart could look.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MockBarChart data={mockConversationsOverTime} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top topics</CardTitle>
              <CardDescription className="text-xs">
                Based on conversation content and AI tagging.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MockHorizontalBars data={mockTopics} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Escalation reasons
              </CardTitle>
              <CardDescription className="text-xs">
                Why chats are handed off to human agents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MockHorizontalBars data={mockEscalationReasons} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">What\'s next</CardTitle>
          <CardDescription className="text-xs">
            Once events are instrumented, this page will use a real charting
            library (e.g. Recharts) backed by analytics events.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          <ul className="list-disc space-y-1 pl-5">
            <li>Filter analytics by team, date range, and channel.</li>
            <li>Drill into conversations by topic, resolution outcome, or agent.</li>
            <li>Compare AI vs human resolution rates for Pro workspaces.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  delta: number;
}

function MetricCard({ label, value, delta }: MetricCardProps) {
  const isPositive = delta >= 0;
  const formattedDelta = `${isPositive ? "+" : ""}${Math.round(delta * 100)}%`;

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold leading-tight">{value}</p>
        <div className="flex items-center gap-1 text-xs">
          <Badge
            variant="outline"
            className={
              isPositive
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                : "border-destructive/40 bg-destructive/10 text-destructive"
            }>
            {formattedDelta}
          </Badge>
          <span className="text-muted-foreground">vs previous period</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface MockBarChartProps {
  data: AnalyticsPoint[];
}

function MockBarChart({ data }: MockBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="mt-2 flex h-40 items-end gap-2 rounded-md bg-muted/60 px-3 pb-3 pt-4 text-xs">
      {data.map((point) => {
        const height = (point.value / maxValue) * 100;
        return (
          <div key={point.label} className="flex-1">
            <div
              className="mx-auto w-full max-w-[22px] rounded-t-md bg-primary/80"
              style={{ height: `${height}%` }}
            />
            <div className="mt-1 text-center text-[10px] text-muted-foreground">
              {point.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface MockHorizontalBarsProps {
  data: AnalyticsPoint[];
}

function MockHorizontalBars({ data }: MockHorizontalBarsProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-2 text-xs">
      {data.map((point) => {
        const width = (point.value / maxValue) * 100;
        return (
          <div key={point.label} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span>{point.label}</span>
              <span className="text-muted-foreground">{point.value}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary/80"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
