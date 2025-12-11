"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  BarChart3,
  FileText,
  GitBranch,
  Globe2,
  LayoutDashboard,
  MessageSquare,
  Palette,
  Plug,
  Settings2,
  UserCog,
  Users,
} from "lucide-react";

import { NavMain } from "@/components/saas/nav-main";
import { NavUser } from "@/components/saas/nav-user";
import { TeamSwitcher } from "@/components/saas/team-switcher";
import { ProBadge } from "@/components/dashboard/pro-badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/ui/sidebar";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
    role?: string | null;
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const params = useParams();
  const team = params?.team as string | undefined;

  // Generate navigation data with dynamic URLs based on team context
  const navGroups = React.useMemo(() => {
    const baseUrl = team ? `/home/${team}` : "/home";
    const settingsBaseUrl = team
      ? `/home/${team}/settings`
      : "/home/settings";

    return [
      {
        label: "MAIN",
        items: [
          {
            title: "Dashboard",
            url: baseUrl,
            icon: LayoutDashboard,
          },
          {
            title: "Inbox",
            url: team
              ? `${baseUrl}/conversations`
              : baseUrl,
            icon: MessageSquare,
          },
          {
            title: "Contacts",
            url: team ? `${baseUrl}/contacts` : baseUrl,
            icon: Users,
          },
        ],
      },
      {
        label: "WIDGET",
        items: [
          {
            title: "Widget Customizer",
            url: team ? `${baseUrl}/widget` : baseUrl,
            icon: Palette,
          },
        ],
      },
      {
        label: "KNOWLEDGE BASE",
        items: [
          {
            title: "Website Scraper",
            url: team
              ? `${baseUrl}/knowledge/websites`
              : baseUrl,
            icon: Globe2,
            badge: <ProBadge />,
          },
          {
            title: "Documents",
            url: team
              ? `${baseUrl}/knowledge/documents`
              : baseUrl,
            icon: FileText,
            badge: <ProBadge />,
          },
          {
            title: "Workflows",
            url: team
              ? `${baseUrl}/knowledge/workflows`
              : baseUrl,
            icon: GitBranch,
            badge: <ProBadge />,
          },
        ],
      },
      {
        label: "INSIGHTS",
        items: [
          {
            title: "Analytics",
            url: team ? `${baseUrl}/analytics` : baseUrl,
            icon: BarChart3,
          },
          {
            title: "Integrations",
            url: team
              ? `${settingsBaseUrl}/integrations`
              : "/home/settings/integrations",
            icon: Plug,
          },
        ],
      },
      {
        label: "SETTINGS",
        items: [
          {
            title: "Team",
            url: team ? `/home/${team}/team` : "/home",
            icon: UserCog,
          },
          {
            title: "Settings",
            url: settingsBaseUrl,
            icon: Settings2,
          },
        ],
      },
    ];
  }, [team]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
