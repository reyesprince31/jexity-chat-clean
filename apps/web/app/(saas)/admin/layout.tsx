import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Admin Panel</h1>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {session.user.name}
          </span>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to App
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
