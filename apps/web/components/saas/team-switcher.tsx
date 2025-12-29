"use client"

import * as React from "react"
import Image from "next/image"
import { useRouter, useParams, usePathname } from "next/navigation"
import { ChevronsUpDown, Plus, Check, Building2, User } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/ui/sidebar"
import { Skeleton } from "@/ui/skeleton"
import { authClient } from "@/lib/auth-client"
import { CreateOrganizationDialog } from "@/components/organization/create-organization-dialog"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function TeamSwitcher() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const { isMobile } = useSidebar()
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)

  const { data: organizations, isPending: isLoadingOrgs, refetch } = authClient.useListOrganizations()

  // Get current team slug from URL
  const currentSlug = params?.team as string | undefined

  // Check if we're in a team context (has team in URL)
  const isTeamContext = !!currentSlug

  // Check if we're on personal account pages (settings, etc.)
  const isPersonalContext = !isTeamContext && (
    pathname === "/home/settings" ||
    pathname === "/home" ||
    pathname?.startsWith("/home/settings/")
  )

  // Find active org based on URL slug
  const activeOrg = React.useMemo(() => {
    if (!currentSlug) return null
    if (!organizations) return null
    return organizations.find((org) => org.slug === currentSlug) || null
  }, [organizations, currentSlug])

  const handleSwitchToPersonal = () => {
    router.push("/home/settings")
  }

  const handleSwitchOrg = (orgSlug: string) => {
    router.push(`/home/${orgSlug}`)
  }

  const handleCreateSuccess = (newOrgSlug?: string) => {
    refetch()
    if (newOrgSlug) {
      router.push(`/home/${newOrgSlug}`)
    }
  }

  // Loading state
  if (isLoadingOrgs) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="pointer-events-none">
            <Skeleton className="size-8 rounded-lg" />
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const orgs = organizations || []

  // Determine what to show in the button
  // Show team context if we have a team slug in URL, even while loading
  const showPersonal = !isTeamContext || isPersonalContext

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  {showPersonal ? (
                    <User className="size-4" />
                  ) : activeOrg?.logo ? (
                    <Image
                      src={activeOrg.logo}
                      alt={activeOrg.name}
                      width={16}
                      height={16}
                      className="rounded"
                    />
                  ) : activeOrg ? (
                    <span className="text-xs font-semibold">
                      {getInitials(activeOrg.name)}
                    </span>
                  ) : (
                    <Building2 className="size-4" />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {showPersonal ? "Personal Account" : activeOrg?.name || currentSlug || "Loading..."}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {showPersonal ? "Account" : "Team"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              {/* Personal Account */}
              <DropdownMenuItem
                onClick={handleSwitchToPersonal}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <User className="size-3.5" />
                </div>
                <span className="flex-1">Personal Account</span>
                {isPersonalContext && (
                  <Check className="size-4 text-primary" />
                )}
              </DropdownMenuItem>

              {/* Teams Section */}
              {orgs.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-muted-foreground text-xs">
                    Your Teams ({orgs.length})
                  </DropdownMenuLabel>
                  {orgs.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => handleSwitchOrg(org.slug)}
                      className="gap-2 p-2"
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border">
                        {org.logo ? (
                          <Image
                            src={org.logo}
                            alt={org.name}
                            width={14}
                            height={14}
                            className="shrink-0 rounded"
                          />
                        ) : (
                          <span className="text-[10px] font-semibold">
                            {getInitials(org.name)}
                          </span>
                        )}
                      </div>
                      <span className="flex-1">{org.name}</span>
                      {currentSlug === org.slug && (
                        <Check className="size-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {/* Create Team */}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setCreateDialogOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">Create a Team</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <CreateOrganizationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </>
  )
}
