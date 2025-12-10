# Conversation-Organization Link Implementation

**Date:** December 10, 2025  
**Status:** Planning Phase

---

## Objective

Connect the `conversations` schema to the `Organization` schema so that conversations are tied to specific teams/organizations.

---

## Current State Analysis

### Schema Structure

**`conversations` model** (`packages/db/prisma/schema/chat.prisma`):

- No relationship to `Organization`
- Contains escalation fields (`is_escalated`, `escalated_reason`, `escalated_at`)
- Contains resolution fields (`is_resolved`, `resolved_at`, `resolved_by`)
- Contains agent fields (`agent_name`, `agent_joined_at`)

**`Organization` model** (`packages/db/prisma/schema/auth.prisma`):

- Has `id`, `name`, `slug`, `logo`, `createdAt`, `metadata`
- Has relations to `Member[]` and `Invitation[]`
- No relation to conversations

### Seed Script (`tooling/scripts/src/seed.ts`)

- Uses `nanoid()` for organization ID (not hardcoded)
- Conversations created without `organizationId`
- No link between seeded conversations and organization

### Frontend Flow

- `conversations/page.tsx` → Gets organization from slug but doesn't pass ID to content
- `ConversationsContent.tsx` → Fetches ALL escalated conversations (no org filter)
- `lib/api.ts` → `fetchEscalatedConversations()` has no org parameter

### API Layer

- `apps/api/src/routes/helpdesk.ts` → `/helpdesk/escalations` returns all escalated conversations
- `apps/api/src/lib/database.ts` → `listEscalatedConversations()` has no org filter

---

## Implementation Plan

### 1. Schema Changes

**File:** `packages/db/prisma/schema/chat.prisma`

```prisma
model conversations {
  // ... existing fields ...
  organization_id  String?       @db.Uuid
  organization     Organization? @relation(fields: [organization_id], references: [id], onDelete: SetNull)

  @@index([organization_id], map: "idx_conversations_organization_id")
}
```

**File:** `packages/db/prisma/schema/auth.prisma`

```prisma
model Organization {
  // ... existing fields ...
  conversations conversations[]
}
```

### 2. Seed Script Updates

**File:** `tooling/scripts/src/seed.ts`

- Add hardcoded `SEED_ORG_ID` constant
- Use hardcoded ID when creating organization
- Pass `organization_id` when creating conversations

### 3. API Layer Updates

**File:** `apps/api/src/lib/database.ts`

- Update `listEscalatedConversations(limit, organizationId?)` to filter by org

**File:** `apps/api/src/routes/helpdesk.ts`

- Accept `organizationId` query parameter in `/helpdesk/escalations`

### 4. Frontend Updates

**File:** `apps/web/lib/api.ts`

- Update `fetchEscalatedConversations(organizationId?)` signature

**File:** `apps/web/components/conversations/ConversationContent.tsx`

- Accept `organizationId` prop
- Pass to `fetchEscalatedConversations()`

**File:** `apps/web/app/(saas)/dashboard/[teamSlug]/conversations/page.tsx`

- Pass `organization.id` to `ConversationsContent`

---

## Known Issues (From Screenshots)

### WebSocket Error

```
Helpdesk websocket error {}
```

- **Location:** `lib/api.ts:232:13` @ `WebSocket.handleError`
- **Cause:** API server (`localhost:3001`) not running

### Fetch Error

```
Failed to fetch
```

- **Location:** `lib/api.ts:35:26` @ `fetchEscalatedConversations`
- **Cause:** API server (`localhost:3001`) not reachable

**Resolution:** Start the API server - these are not code bugs.

---

## Files to Modify

| File                                                              | Change                                         |
| ----------------------------------------------------------------- | ---------------------------------------------- |
| `packages/db/prisma/schema/chat.prisma`                           | Add `organization_id` field and relation       |
| `packages/db/prisma/schema/auth.prisma`                           | Add `conversations` relation to Organization   |
| `tooling/scripts/src/seed.ts`                                     | Hardcode org ID, link conversations            |
| `apps/api/src/lib/database.ts`                                    | Add org filter to `listEscalatedConversations` |
| `apps/api/src/routes/helpdesk.ts`                                 | Accept `organizationId` query param            |
| `apps/web/lib/api.ts`                                             | Add `organizationId` param to fetch function   |
| `apps/web/components/conversations/ConversationContent.tsx`       | Accept and use `organizationId` prop           |
| `apps/web/app/(saas)/dashboard/[teamSlug]/conversations/page.tsx` | Pass org ID to content component               |

---

## Database Commands

> **Note:** User handles Prisma migrations manually. Only `db:push` and `db:generate` are allowed.

```bash
# After schema changes
pnpm db:generate
pnpm db:push
```

---

## Progress Checklist

- [x] Analyze current schema structure
- [x] Analyze seed script
- [x] Analyze frontend flow
- [x] Analyze API layer
- [x] Document implementation plan
- [ ] Implement schema changes
- [ ] Update seed script
- [ ] Update API layer
- [ ] Update frontend
- [ ] Test end-to-end flow
