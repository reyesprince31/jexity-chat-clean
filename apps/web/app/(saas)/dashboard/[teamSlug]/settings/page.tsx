import { getOrganizationBySlug } from "@/lib/auth-server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";

interface SettingsPageProps {
  params: Promise<{ teamSlug: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { teamSlug } = await params;
  const organization = await getOrganizationBySlug(teamSlug);

  if (!organization) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">General Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            Basic information about your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={organization.name}
              disabled
              className="max-w-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Organization Slug</Label>
            <Input
              id="slug"
              value={organization.slug}
              disabled
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Used in URLs: /dashboard/{organization.slug}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
