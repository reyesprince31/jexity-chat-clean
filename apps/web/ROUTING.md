# Routing Documentation

This document describes the application's routing structure, navigation components, and guidelines for adding new features.

## Route Structure Overview

The application uses Next.js App Router with a clear separation between **personal account** pages and **team** pages.

```
apps/web/app/
├── (saas)/                     # Main SaaS application routes
│   ├── home/                   # Personal & team routes
│   │   ├── layout.tsx          # Personal header navigation layout
│   │   ├── page.tsx            # Home page (redirects to team or shows create prompt)
│   │   ├── settings/           # Personal account settings
│   │   │   └── page.tsx
│   │   └── [team]/             # Team-specific routes (dynamic segment)
│   │       ├── layout.tsx      # Team sidebar navigation layout
│   │       ├── page.tsx        # Team dashboard
│   │       ├── analytics/
│   │       ├── contacts/
│   │       ├── conversations/
│   │       ├── knowledge/
│   │       │   ├── page.tsx
│   │       │   ├── documents/
│   │       │   ├── websites/
│   │       │   └── workflows/
│   │       ├── settings/
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx
│   │       │   ├── integrations/
│   │       │   └── members/
│   │       ├── team/
│   │       └── widget/
│   ├── admin/                  # Admin panel (requires admin role)
│   └── layout.tsx              # Root SaaS layout
├── auth/                       # Authentication pages
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   ├── reset-password/
│   └── verify-email/
├── invite/                     # Organization invitation handling
│   └── [invitationId]/
└── api/                        # API routes
```

## Key Routes

| Route | Description | Layout |
|-------|-------------|--------|
| `/home` | Personal home page - redirects to first team or shows create team prompt | Header nav |
| `/home/settings` | Personal account settings | Header nav |
| `/home/[team]` | Team dashboard | Sidebar nav |
| `/home/[team]/conversations` | Team inbox/conversations | Sidebar nav |
| `/home/[team]/contacts` | Team contacts | Sidebar nav |
| `/home/[team]/analytics` | Team analytics | Sidebar nav |
| `/home/[team]/widget` | Widget customizer | Sidebar nav |
| `/home/[team]/knowledge` | Knowledge base overview | Sidebar nav |
| `/home/[team]/team` | Team members management | Sidebar nav |
| `/home/[team]/settings` | Team settings | Sidebar nav |
| `/admin` | Admin panel (admin role required) | Admin layout |

## Navigation Components

### Personal Pages (Header Navigation)

**File:** `components/saas/personal-header-nav.tsx`

Used for personal account pages like `/home` and `/home/settings`. Features:
- Account switcher dropdown (switch between personal and teams)
- Navigation links (Dashboard, Settings)
- User menu with sign out

**Layout:** `app/(saas)/home/layout.tsx`

### Team Pages (Sidebar Navigation)

**File:** `components/saas/app-sidebar.tsx`

Used for all team-specific pages under `/home/[team]/*`. Features:
- Team switcher in header
- Collapsible navigation groups (Main, Widget, Knowledge Base, Insights, Settings)
- User menu in footer

**Layout:** `app/(saas)/home/[team]/layout.tsx`

### Team Switcher

**File:** `components/saas/team-switcher.tsx`

Handles switching between personal account and teams. Used in both:
- Sidebar (for team pages)
- Header dropdown (for personal pages via `personal-header-nav.tsx`)

## Route Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `[team]` | Organization slug | `acme-corp`, `evelan-gmbh` |
| `[invitationId]` | Organization invitation ID | UUID |

## Authentication Flow

### Login Redirects

After successful authentication, users are redirected to `/home`:
- If user has organizations → redirects to first team (`/home/[team]`)
- If user has no organizations → shows create team prompt

### Protected Routes

All routes under `(saas)/` require authentication. The middleware in `proxy.ts` handles:
- Redirecting authenticated users away from auth pages to `/home`
- The individual layouts check for session and redirect to `/auth/login` if not authenticated

### Admin Routes

Routes under `/admin` require the user to have `role: "admin"`. Non-admins are redirected to `/home`.

## Adding New Features

### Adding a New Team Page

1. Create the page file in `app/(saas)/home/[team]/[feature]/page.tsx`
2. Use the standard page structure:

```tsx
import { notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/lib/auth-server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/ui/breadcrumb";
import { Separator } from "@/ui/separator";
import { SidebarTrigger } from "@/ui/sidebar";

interface FeaturePageProps {
  params: Promise<{ team: string }>;
}

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { team } = await params;
  const organization = await getOrganizationBySlug(team);

  if (!organization) {
    notFound();
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={`/home/${team}`}>
                  {organization.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Feature Name</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Your content here */}
      </div>
    </>
  );
}
```

3. Add navigation link to `components/saas/app-sidebar.tsx` in the appropriate nav group

### Adding a New Personal Page

1. Create the page file in `app/(saas)/home/[feature]/page.tsx`
2. The page will automatically use the header navigation layout
3. Add navigation link to `components/saas/personal-header-nav.tsx` if needed

## Important Files

| File | Purpose |
|------|---------|
| `proxy.ts` | Middleware for auth redirects |
| `lib/auth-server.ts` | Server-side auth utilities (`getServerSession`, `getOrganizationBySlug`) |
| `lib/auth-client.ts` | Client-side auth utilities (`authClient`) |
| `components/saas/app-sidebar.tsx` | Team sidebar navigation |
| `components/saas/team-switcher.tsx` | Account/team switcher |
| `components/saas/personal-header-nav.tsx` | Personal pages header |
| `components/organization/settings-nav.tsx` | Team settings sub-navigation |

## URL Migration (from /dashboard to /home)

The application previously used `/dashboard` routes. All routes have been migrated to `/home`:

| Old Route | New Route |
|-----------|-----------|
| `/dashboard` | `/home` |
| `/dashboard/[teamSlug]` | `/home/[team]` |
| `/settings` | `/home/settings` |

All internal links, redirects, and navigation have been updated to use the new routes.
