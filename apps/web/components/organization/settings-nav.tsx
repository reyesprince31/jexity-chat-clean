"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plug, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsNavProps {
  teamSlug: string;
}

const navItems = [
  {
    title: "General",
    href: (slug: string) => `/dashboard/${slug}/settings`,
    icon: Settings,
    exact: true,
  },
  {
    title: "Members",
    href: (slug: string) => `/dashboard/${slug}/settings/members`,
    icon: Users,
  },
  {
    title: "Integrations",
    href: (slug: string) => `/dashboard/${slug}/settings/integrations`,
    icon: Plug,
  },
];

export function SettingsNav({ teamSlug }: SettingsNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const href = item.href(teamSlug);
        const isActive = item.exact
          ? pathname === href
          : pathname?.startsWith(href);

        return (
          <Link
            key={item.title}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
