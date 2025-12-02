import { getOrganizationBySlug } from "@/lib/auth-server";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { mockCurrentPlanId, mockPlans } from "@/lib/mock-data";

interface SettingsPageProps {
  params: Promise<{ teamSlug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { teamSlug } = await params;
  const organization = await getOrganizationBySlug(teamSlug);

  if (!organization) {
    notFound();
  }

  const currentPlan = mockPlans.find((plan) => plan.id === mockCurrentPlanId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Update your account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                defaultValue={organization.name}
                className="max-w-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                defaultValue="https://acme.com"
                className="max-w-md"
              />
            </div>
          </div>
          <div className="space-y-2 max-w-md">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              defaultValue="support@acme.com"
            />
          </div>
          <Button type="button" size="sm" className="mt-2 max-w-fit">
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure how you receive notifications. These controls are visual
            only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <NotificationRow
            title="Email Notifications"
            description="Receive email for new conversations."
            enabled
          />
          <NotificationRow
            title="Push Notifications"
            description="Browser push notifications for mentions and assignments."
            enabled
          />
          <NotificationRow
            title="Daily Summary"
            description="Receive a daily email with key stats."
            enabled
          />
          <NotificationRow
            title="Sound Alerts"
            description="Play a sound when new messages arrive."
            enabled={false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage API keys for integrations. Values shown here are mock data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Production Key
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                readOnly
                className="max-w-md text-xs"
                defaultValue="lkp_live_********************************a1s2"
              />
              <Button size="sm" variant="outline" type="button">
                Copy
              </Button>
              <Button size="sm" variant="outline" type="button">
                Regenerate
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Test Key
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                readOnly
                className="max-w-md text-xs"
                defaultValue="lkp_test_********************************t9z8"
              />
              <Button size="sm" variant="outline" type="button">
                Copy
              </Button>
              <Button size="sm" variant="outline" type="button">
                Regenerate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing &amp; Subscription</CardTitle>
          <CardDescription>
            Manage your subscription and payment methods.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {currentPlan && (
            <div className="flex flex-col justify-between gap-2 rounded-md border bg-muted/40 p-3 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {currentPlan.name} Plan
                  </span>
                  <Badge variant="outline" className="text-[11px]">
                    {currentPlan.tier === "free" ? "Free" : "Active"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  ${currentPlan.priceMonthly}/{"month"} • Renews automatically (mock).
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" type="button">
                  Change Plan
                </Button>
                {currentPlan.tier === "pro" && (
                  <Button size="sm" variant="outline" type="button">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1 rounded-md border bg-background p-3">
            <p className="text-xs font-medium">Payment Method</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>VISA •••• 4242 — Expires 08/27</span>
              <Button size="sm" variant="outline" type="button">
                Update
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your security settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <SecurityRow
            label="Two-Factor Authentication"
            description="Add an extra layer of security to your account."
            actionLabel="Enable"
          />
          <SecurityRow
            label="Active Sessions"
            description="View and revoke active logins."
            actionLabel="Manage"
          />
          <SecurityRow
            label="Password"
            description="Last changed 30 days ago (mock)."
            actionLabel="Change"
          />
        </CardContent>
      </Card>

      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-destructive">
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Export All Data</p>
              <p className="text-xs text-muted-foreground">
                Download all your data as JSON (mock only).
              </p>
            </div>
            <Button size="sm" variant="outline" type="button">
              Export
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all data.
              </p>
            </div>
            <Button size="sm" variant="destructive" type="button">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface NotificationRowProps {
  title: string;
  description: string;
  enabled: boolean;
}

function NotificationRow({ title, description, enabled }: NotificationRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border bg-background/40 px-3 py-2">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div
        className={`inline-flex h-5 w-10 items-center rounded-full px-0.5 ${
          enabled
            ? "justify-end border border-primary bg-primary/80"
            : "justify-start border border-border bg-muted"
        }`}
      >
        <span className="h-4 w-4 rounded-full bg-background shadow" />
      </div>
    </div>
  );
}

interface SecurityRowProps {
  label: string;
  description: string;
  actionLabel: string;
}

function SecurityRow({ label, description, actionLabel }: SecurityRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border bg-background/40 px-3 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Button size="sm" variant="outline" type="button">
        {actionLabel}
      </Button>
    </div>
  );
}
