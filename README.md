# Jexity Chatbot

A GPT-powered AI chat application with RAG (Retrieval-Augmented Generation) capabilities, built as a Turborepo monorepo.

## Features

- **AI Chat API** (`apps/api`) - Fastify backend with streaming responses
- **Web App** (`apps/web`) - Next.js admin dashboard
- **Chat Widget** (`apps/chat-widget`) - Embeddable Vite-based chat widget
- **RAG Pipeline** - Document chunking, vector embeddings, and semantic search using pgvector

## Tech Stack

- **Database**: PostgreSQL with [pgvector](https://github.com/pgvector/pgvector) extension (via Docker)
- **ORM**: Prisma with multi-schema file approach
- **Package Manager**: pnpm
- **Monorepo**: Turborepo

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm 10.24.0+
- Docker & Docker Compose

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start the Database

```bash
pnpm db:start
```

This starts a PostgreSQL container with pgvector extension using the Docker Compose file at `packages/db/docker-compose.yml`.

### 3. Setup Environment Variables

Copy the example env files and configure them:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

### 4. Generate Prisma Client & Push Schema

```bash
pnpm db:generate
pnpm db:push
```

### 5. Start Development

```bash
pnpm dev
```

## Port Configuration

- **Web App**: http://localhost:3000 - Next.js web application
- **API Server**: http://localhost:3001 - Fastify backend API
- **Chat Widget**: http://localhost:3002 - Vite development server

## Database

### Docker Compose Setup

We use a self-hosted PostgreSQL with pgvector instead of Supabase. The database runs via Docker Compose at `packages/db/docker-compose.yml`:

```yaml
image: pgvector/pgvector:pg17
```

This provides PostgreSQL 18 with the pgvector extension pre-installed for vector similarity search.

### Root-Level Database Commands

All database commands can be run from the **root directory** using Turbo's catalog feature:

| Command            | Description                            |
| ------------------ | -------------------------------------- |
| `pnpm db:start`    | Start PostgreSQL container (detached)  |
| `pnpm db:watch`    | Start PostgreSQL container (with logs) |
| `pnpm db:stop`     | Stop the container (preserves data)    |
| `pnpm db:down`     | Stop and remove the container          |
| `pnpm db:generate` | Generate Prisma client                 |
| `pnpm db:push`     | Push schema changes to database        |
| `pnpm db:migrate`  | Run Prisma migrations                  |
| `pnpm db:studio`   | Open Prisma Studio GUI                 |

These commands are defined in the root `package.json` and use Turbo's `-F` (filter) flag to target the `@repo/db` package:

```json
"db:start": "turbo -F @repo/db db:start"
```

### Turbo Task Configuration

The `turbo.json` defines database tasks that can be triggered from the root:

```json
{
  "tasks": {
    "db:start": { "cache": false, "persistent": true },
    "db:stop": { "cache": false, "persistent": true },
    "db:generate": { "cache": false },
    "db:push": { "cache": false, "persistent": true },
    "db:migrate": { "cache": false, "persistent": true },
    "db:studio": { "cache": false, "persistent": true }
  }
}
```

The `dev` and `build` tasks depend on `db:generate` to ensure the Prisma client is always up-to-date.

## Prisma Multi-Schema File Approach

The Prisma schema is split into multiple files under `packages/db/prisma/schema/`:

```
packages/db/prisma/schema/
├── schema.prisma   # Generator & datasource config (pgvector extension)
├── auth.prisma     # User, Session, Account, Organization models
└── chat.prisma     # Documents, Conversations, Messages models
```

### How It Works

Prisma's `prismaSchemaFolder` preview feature allows splitting the schema across multiple `.prisma` files. This provides:

- **Better organization** - Group related models together
- **Easier collaboration** - Reduce merge conflicts
- **Cleaner diffs** - Changes are isolated to relevant files

### Schema Files

- **`schema.prisma`** - Contains the generator and datasource configuration, including the `vector` extension for pgvector
- **`auth.prisma`** - Authentication models: `User`, `Session`, `Account`, `Verification`, `Organization`, `Member`, `Invitation`, `AuditLog`
- **`chat.prisma`** - Chat/RAG models: `documents`, `document_chunks`, `conversations`, `messages`, `message_sources`

## CLI Tools

The `tooling/script` package (`@repo/cli`) provides CLI commands for development tasks.

### Create User

Create a new user interactively with properly hashed password (compatible with better-auth):

```bash
pnpm cli:create-user
```

This will prompt for:

- **Email** - User's email address
- **Name** - User's display name
- **Admin role** - Whether the user should be an admin

A random secure password is generated and displayed after creation.

### Seed Database

Seed the database with test users, organization, and sample chat data:

```bash
# Seed everything (users, organization, and chat data)
pnpm cli:seed

# Seed only auth data (users and organization)
pnpm cli:seed:auth

# Seed only chat data (conversations and messages)
pnpm cli:seed:chat
```

#### Default Seed Data

| User   | Email              | Role                        |
| ------ | ------------------ | --------------------------- |
| Admin  | admin@example.com  | Super admin (`role: admin`) |
| Owner  | owner@example.com  | Organization owner          |
| Member | member@example.com | Organization member         |

**Organization:** Acme Corporation (`acme-corp`)  
**Password:** `Password123!` (same for all users)

**Chat Data:** Sample conversations with messages demonstrating the chatbot features.

#### Environment Variables

You can customize the seed data via environment variables:

```env
SEED_PASSWORD="Password123!"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_OWNER_EMAIL="owner@example.com"
SEED_MEMBER_EMAIL="member@example.com"
SEED_ORG_NAME="Acme Corporation"
SEED_ORG_SLUG="acme-corp"
```

## Apps and Packages

### Apps

- `apps/api` - Fastify API server with RAG pipeline
- `apps/web` - Next.js admin dashboard
- `apps/chat-widget` - Embeddable chat widget (Vite)

### Packages

- `@repo/db` - Prisma database client and schema
- `@repo/auth` - Better-auth authentication configuration
- `@repo/logs` - Logger abstraction (wraps consola for easy provider replacement)
- `@repo/dto` - Shared TypeScript types and DTOs
- `@repo/ui` - Shared React component library
- `@repo/eslint-config` - ESLint configurations
- `@repo/typescript-config` - Shared TypeScript configs

### Tooling

- `@repo/cli` - CLI tools for development (user creation, seeding, etc.)

## Development Commands

```bash
# Start all apps
pnpm dev

# Start specific app
pnpm dev --filter=web
pnpm dev --filter=api

# Build all
pnpm build

# Lint
pnpm lint

# Type check
pnpm check-types
```

## Useful Links

- [Turborepo Docs](https://turborepo.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [pgvector](https://github.com/pgvector/pgvector)
