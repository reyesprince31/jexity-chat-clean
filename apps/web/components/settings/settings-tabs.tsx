"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { ProfileForm } from "./profile-form";
import { SecurityForm } from "./security-form";
import { SessionsManager } from "./sessions-manager";
import { DeleteAccountForm } from "./delete-account-form";

interface SettingsTabsProps {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
  };
}

export function SettingsTabs({ user }: SettingsTabsProps) {
  return (
    <Tabs defaultValue="profile" className="w-full max-w-2xl">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="sessions">Sessions</TabsTrigger>
        <TabsTrigger value="danger" className="text-destructive">
          Danger
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="mt-6">
        <ProfileForm user={user} />
      </TabsContent>
      <TabsContent value="security" className="mt-6">
        <SecurityForm />
      </TabsContent>
      <TabsContent value="sessions" className="mt-6">
        <SessionsManager />
      </TabsContent>
      <TabsContent value="danger" className="mt-6">
        <DeleteAccountForm userEmail={user.email} />
      </TabsContent>
    </Tabs>
  );
}
