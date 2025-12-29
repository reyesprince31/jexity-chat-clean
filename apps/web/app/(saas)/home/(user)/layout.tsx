import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-server";
import { HeaderUserNav } from "@/components/saas/header-user-nav";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image,
    role: session.user.role,
  };

  const isImpersonating = !!session?.session?.impersonatedBy;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {isImpersonating && (
        <ImpersonationBanner user={{ name: user.name, email: user.email }} />
      )}
      <HeaderUserNav user={user} />
      <main className="flex flex-1 flex-col mx-auto w-full max-w-4xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
