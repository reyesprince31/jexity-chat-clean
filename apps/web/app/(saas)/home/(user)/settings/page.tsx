import { SettingsTabs } from "@/components/settings/settings-tabs";
import { getServerSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function PersonalSettingsPage() {
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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      <SettingsTabs user={user} />
    </div>
  );
}
