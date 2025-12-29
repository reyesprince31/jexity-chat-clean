import { getServerSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { getAdminOrganizations } from "./lib/admin-organizations";
import { OrganizationsSummaryCards } from "./_components/OrganizationsSummaryCards";
import { OrganizationsTable } from "./_components/OrganizationsTable";
import { OrganizationsDetails } from "./_components/OrganizationsDetails";

export default async function AdminOrganizationsPage() {
  const session = await getServerSession();

  // Double check admin access (middleware should handle this too)
  if (!session || session.user.role !== "admin") {
    redirect("/home");
  }

  // Fetch all organizations with member and invitation counts
  const organizations = await getAdminOrganizations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Management</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all organizations
        </p>
      </div>

      <OrganizationsSummaryCards organizations={organizations} />

      <OrganizationsTable organizations={organizations} />

      <OrganizationsDetails organizations={organizations} />
    </div>
  );
}
