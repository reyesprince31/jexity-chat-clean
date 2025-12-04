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
  const teamSlug = params?.teamSlug as string | undefined;

  // Generate navigation data with dynamic URLs based on team context
  const navGroups = React.useMemo(() => {
    const baseDashboardUrl = teamSlug ? `/dashboard/${teamSlug}` : "/dashboard";
    const settingsBaseUrl = teamSlug
      ? `/dashboard/${teamSlug}/settings`
      : "/settings";

    return [
      {
        label: "MAIN",
        items: [
          {
            title: "Dashboard",
            url: baseDashboardUrl,
            icon: LayoutDashboard,
          },
          {
            title: "Inbox",
            url: teamSlug
              ? `${baseDashboardUrl}/conversations`
              : baseDashboardUrl,
            icon: MessageSquare,
          },
          {
            title: "Contacts",
            url: teamSlug ? `${baseDashboardUrl}/contacts` : baseDashboardUrl,
            icon: Users,
          },
        ],
      },
      {
        label: "WIDGET",
        items: [
          {
            title: "Widget Customizer",
            url: teamSlug ? `${baseDashboardUrl}/widget` : baseDashboardUrl,
            icon: Palette,
          },
        ],
      },
      {
        label: "KNOWLEDGE BASE",
        items: [
          {
            title: "Website Scraper",
            url: teamSlug
              ? `${baseDashboardUrl}/knowledge/websites`
              : baseDashboardUrl,
            icon: Globe2,
            badge: <ProBadge />,
          },
          {
            title: "Documents",
            url: teamSlug
              ? `${baseDashboardUrl}/knowledge/documents`
              : baseDashboardUrl,
            icon: FileText,
            badge: <ProBadge />,
          },
          {
            title: "Workflows",
            url: teamSlug
              ? `${baseDashboardUrl}/knowledge/workflows`
              : baseDashboardUrl,
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
            url: teamSlug ? `${baseDashboardUrl}/analytics` : baseDashboardUrl,
            icon: BarChart3,
          },
          {
            title: "Integrations",
            url: teamSlug
              ? `${settingsBaseUrl}/integrations`
              : "/settings/integrations",
            icon: Plug,
          },
        ],
      },
      {
        label: "SETTINGS",
        items: [
          {
            title: "Team",
            url: teamSlug ? `/dashboard/${teamSlug}/team` : "/dashboard",
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
  }, [teamSlug]);

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
