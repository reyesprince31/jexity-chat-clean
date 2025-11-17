"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  LogOut,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import JexityLogo from "@/components/JexityLogo";
import { usePathname, useRouter } from "next/navigation";

type NavigationItemProps = {
  label: string;
  icon: LucideIcon;
  isActive?: boolean;
  onSelect?: () => void;
};

type PrimaryNavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
};

const primaryNavItems: PrimaryNavItem[] = [
  { label: "Conversations", icon: MessageSquare, href: "/" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
];

const footerActions = [
  { label: "Settings", icon: Settings },
  { label: "Logout", icon: LogOut },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = React.useCallback(
    (href: string) => {
      if (pathname !== href) {
        router.push(href);
      }
    },
    [pathname, router]
  );

  return (
    <Sidebar collapsible="none" className="h-screen" {...props}>
      <SidebarHeader className="flex justify-center items-center text-lg font-semibold py-5">
        <JexityLogo width={20} height={20} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {primaryNavItems.map((item) => (
              <NavigationItem
                key={item.label}
                label={item.label}
                icon={item.icon}
                isActive={
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href))
                }
                onSelect={() => handleNavigation(item.href)}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {footerActions.map((item) => (
            <NavigationItem key={item.label} {...item} />
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function NavigationItem({ label, icon: Icon, isActive, onSelect }: NavigationItemProps) {
  const [open, setOpen] = React.useState(false);
  const openTooltip = () => setOpen(true);
  const closeTooltip = () => setOpen(false);

  return (
    <SidebarMenuItem>
      <Popover open={open}>
        <PopoverTrigger asChild>
          <SidebarMenuButton
            type="button"
            isActive={isActive}
            aria-label={label}
            className="gap-0 justify-center"
            onPointerEnter={openTooltip}
            onPointerLeave={closeTooltip}
            onFocus={openTooltip}
            onBlur={closeTooltip}
            onClick={() => {
              closeTooltip();
              onSelect?.();
            }}
          >
            <Icon />
            <span className="sr-only">{label}</span>
          </SidebarMenuButton>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="center"
          sideOffset={8}
          className="w-auto px-3 py-1.5 text-sm font-medium"
          onPointerEnter={openTooltip}
          onPointerLeave={closeTooltip}
        >
          {label}
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}
