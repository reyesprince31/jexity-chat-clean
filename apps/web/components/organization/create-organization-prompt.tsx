"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

import { Button } from "@/ui/button";
import { CreateOrganizationDialog } from "./create-organization-dialog";

export function CreateOrganizationPrompt() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSuccess = (slug?: string) => {
    if (slug) {
      router.push(`/home/${slug}`);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center max-w-md">
      <div className="bg-muted rounded-full p-4 mb-6">
        <Building2 className="size-8 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Create your first team</h2>
      <p className="text-muted-foreground mb-6">
        Teams help you organize your work and collaborate with others.
        Create a team to get started.
      </p>
      <Button size="lg" onClick={() => setDialogOpen(true)}>
        Create Team
      </Button>
      <CreateOrganizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
