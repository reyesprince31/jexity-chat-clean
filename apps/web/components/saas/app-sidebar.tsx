"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  BookOpen,
  Bot,
  Frame,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react";

import { NavMain } from "@/components/saas/nav-main";
import { NavProjects } from "@/components/saas/nav-projects";
import { NavUser } from "@/components/saas/nav-user";
import { TeamSwitcher } from "@/components/saas/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@repo/ui/components/sidebar";

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
  const navMain = React.useMemo(() => {
    const settingsBaseUrl = teamSlug
      ? `/dashboard/${teamSlug}/settings`
      : "/settings";

    return [
      {
        title: "Playground",
        url: "#",
        icon: SquareTerminal,
        isActive: true,
        items: [
          { title: "History", url: "#" },
          { title: "Starred", url: "#" },
          { title: "Settings", url: "#" },
        ],
      },
      {
        title: "Models",
        url: "#",
        icon: Bot,
        items: [
          { title: "Genesis", url: "#" },
          { title: "Explorer", url: "#" },
          { title: "Quantum", url: "#" },
        ],
      },
      {
        title: "Documentation",
        url: "#",
        icon: BookOpen,
        items: [
          { title: "Introduction", url: "#" },
          { title: "Get Started", url: "#" },
          { title: "Tutorials", url: "#" },
          { title: "Changelog", url: "#" },
        ],
      },
      {
        title: "Settings",
        url: settingsBaseUrl,
        icon: Settings2,
        items: [
          { title: "General", url: settingsBaseUrl },
          { title: "Members", url: `${settingsBaseUrl}/members` },
          { title: "Billing", url: "#" },
        ],
      },
    ];
  }, [teamSlug]);

  const projects = [
    { name: "Design Engineering", url: "#", icon: Frame },
    { name: "Sales & Marketing", url: "#", icon: PieChart },
    { name: "Travel", url: "#", icon: Map },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
