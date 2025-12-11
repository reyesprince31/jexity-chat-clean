import { getOrganizationBySlug } from "@/lib/auth-server";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { Button } from "@/ui/button";

interface IntegrationsPageProps {
  params: Promise<{ team: string }>;
}

export default async function IntegrationsPage({
  params,
}: IntegrationsPageProps) {
  const { team } = await params;
  const organization = await getOrganizationBySlug(team);

  if (!organization) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Connect Jexity to the tools your team already uses. This is a visual
          mockup only.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Slack</CardTitle>
            <CardDescription>
              Send conversation notifications and summaries into your channels.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Coming soon</span>
            <Button size="sm" variant="outline" type="button" disabled>
              Connect
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>
              Turn support@ inbox messages into conversations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Coming soon</span>
            <Button size="sm" variant="outline" type="button" disabled>
              Connect
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>
              Push events to your own backend when conversations change.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Coming soon</span>
            <Button size="sm" variant="outline" type="button" disabled>
              Configure
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CRM</CardTitle>
            <CardDescription>
              Sync contacts and companies from tools like HubSpot or Salesforce.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Coming soon</span>
            <Button size="sm" variant="outline" type="button" disabled>
              Connect
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
