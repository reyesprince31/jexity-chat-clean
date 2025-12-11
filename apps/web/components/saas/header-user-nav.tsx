"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, ChevronDown, CreditCard, LogOut, Settings, User } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Button } from "@/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { CreateOrganizationDialog } from "@/components/organization/create-organization-dialog";

interface HeaderUserNavProps {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
    role?: string | null;
  };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function HeaderUserNav({ user }: HeaderUserNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  const { refetch } = authClient.useListOrganizations();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth/login");
  };

  const handleCreateSuccess = (newOrgSlug?: string) => {
    refetch();
    if (newOrgSlug) {
      router.push(`/home/${newOrgSlug}`);
    }
  };

  const pageTitle = React.useMemo(() => {
    if (pathname.startsWith("/home/settings/billing")) return "Billing";
    if (pathname.startsWith("/home/settings")) return "Settings";
    return "Home";
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center px-4">

          {/* Back and page title */}
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 px-2">
                <Avatar className="size-7">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm font-medium max-w-[100px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/home/settings">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/home/settings/billing">
                    <CreditCard className="mr-2 size-4" />
                    Billing
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CreateOrganizationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
