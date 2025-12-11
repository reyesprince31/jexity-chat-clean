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
- Docker & Docker Compose (or a Neon database account)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Database

You have two options for the database:

#### Option A: Docker (Recommended for local development)

```bash
pnpm db:start
```

This starts a PostgreSQL container with pgvector extension using the Docker Compose file at `packages/db/docker-compose.yml`.

#### Option B: Neon Database (No Docker required)

If you prefer not to use Docker, you can use [Neon](https://neon.tech) as your PostgreSQL provider:

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Enable the `pgvector` extension in SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Copy your connection string from the Neon dashboard
5. Set `DATABASE_URL` in your `.env` files (see step 3)

> **Note:** Neon's free tier includes pgvector support. The connection string format is:
> `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`

### 3. Setup Environment Variables

Copy the example env files and configure them:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

If using Neon, update `DATABASE_URL` in both `.env` files with your Neon connection string.

### 4. Initialize Database

```bash
# Generate Prisma Client (required before any other db command)
pnpm db:generate

# Apply schema to database (first time setup)
pnpm db:migrate
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

This provides PostgreSQL 17 with the pgvector extension pre-installed for vector similarity search.

### Root-Level Database Commands

All database commands can be run from the **root directory** using Turbo's filter flag:

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

## Development Workflow

### Prisma Commands Explained

Understanding when to use each Prisma command:

| Command        | Purpose                                    | When to Use                              |
| -------------- | ------------------------------------------ | ---------------------------------------- |
| `db:generate`  | Generate Prisma Client from schema         | After cloning, after schema changes      |
| `db:push`      | Sync schema to DB without migration file   | Rapid prototyping, experimental changes  |
| `db:migrate`   | Create migration file and apply to DB      | Production-ready schema changes          |

### Recommended Workflow

1. **Initial Setup** (after cloning):
   ```bash
   pnpm db:generate   # Generate Prisma Client
   pnpm db:migrate    # Apply existing migrations
   ```

2. **Prototyping Schema Changes**:
   ```bash
   # Edit your .prisma files
   pnpm db:push       # Quick sync without migration (dev only!)
   ```

3. **Finalizing Schema Changes**:
   ```bash
   # Once your schema is working, create a proper migration
   pnpm --filter @repo/db prisma migrate dev --name add_user_profile
   ```

### Prisma Migrate Flags

When running migrations directly via `prisma migrate dev`:

- **`--name <name>`**: Name your migration (required for non-interactive)
  ```bash
  prisma migrate dev --name add_user_avatar
  # Creates: prisma/migrations/20241211_add_user_avatar/
  ```

- **`--create-only`**: Generate migration SQL without applying it
  ```bash
  prisma migrate dev --name add_indexes --create-only
  # Review the SQL, then run: prisma migrate dev
  ```

### When to Use What

| Scenario                          | Command                                    |
| --------------------------------- | ------------------------------------------ |
| First time setup                  | `db:generate` → `db:migrate`               |
| Quick schema experiment           | `db:push`                                  |
| Ready to commit schema change     | `prisma migrate dev --name <description>` |
| Review SQL before applying        | `prisma migrate dev --create-only`         |
| Production deployment             | `prisma migrate deploy`                    |

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

#### Understanding Turbo Task Options

- **`cache: false`**: Task output is never cached. Used for tasks that must always run fresh (database operations, dev servers).
- **`persistent: true`**: Task runs indefinitely (long-running process). Used for:
  - Dev servers (`dev`)
  - Database containers (`db:start`, `db:watch`)
  - Interactive tools (`db:studio`)
  - Commands that wait for user input (`db:migrate`, `db:push`)

> **Note:** `persistent: true` prevents Turbo from considering the task "done" and allows it to run alongside other tasks.

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

## Monorepo Workflows

### Adding Dependencies with pnpm Catalog

The `pnpm-workspace.yaml` includes a `catalog:` section for centralized version control of shared dependencies:

```yaml
catalog:
  better-auth: 1.4.5
  "@prisma/client": 7.1.0
  dotenv: 17.2.2
```

#### Using Catalog Dependencies

In your package's `package.json`, reference catalog versions with `catalog:`:

```json
{
  "dependencies": {
    "dotenv": "catalog:"
  }
}
```

#### Adding a New Shared Dependency

1. Add the package with version to `pnpm-workspace.yaml`:
   ```yaml
   catalog:
     zod: 3.23.8
   ```

2. Reference it in packages that need it:
   ```json
   {
     "dependencies": {
       "zod": "catalog:"
     }
   }
   ```

3. Run `pnpm install` to install the dependency

> **Benefits:** All packages use the same version, single place to update, prevents version conflicts.

### Adding Packages to the Monorepo

To add a dependency to a specific package:

```bash
# Add to a specific app/package
pnpm --filter web add lucide-react
pnpm --filter @repo/ui add clsx

# Add as dev dependency
pnpm --filter api add -D @types/node

# Add to root (for tooling like prettier)
pnpm add -D -w prettier
```

### Adding Root Scripts

To add a new script that runs across packages:

1. **Add the script to root `package.json`**:
   ```json
   {
     "scripts": {
       "test": "turbo run test"
     }
   }
   ```

2. **Add the task to `turbo.json`** (if it needs Turbo orchestration):
   ```json
   {
     "tasks": {
       "test": {
         "dependsOn": ["^build"],
         "cache": true
       }
     }
   }
   ```

#### When to Add to turbo.json

| Scenario                                | Add to turbo.json? | Options to Consider        |
| --------------------------------------- | ------------------ | --------------------------- |
| Runs in multiple packages               | Yes                | `dependsOn`, `cache`        |
| Long-running process (dev server)       | Yes                | `persistent: true`          |
| Needs specific package outputs          | Yes                | `outputs`, `inputs`         |
| Simple one-off command                  | No                 | Just add to package.json    |
| Database/external service command       | Yes                | `cache: false`              |

### TypeScript Configuration

Shared TypeScript configs are in `packages/typescript-config/`:

```
packages/typescript-config/
├── base.json         # Base config for all packages
├── nextjs.json       # Next.js specific settings
├── react-library.json # React library packages
└── node.json         # Node.js packages (API, scripts)
```

To use in a package, extend the appropriate config:

```json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Deployment

For production deployment, CI/CD setup, and database migration strategies, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

Topics covered:
- Prisma migrate vs deploy
- Neon database branching (preview/staging/production)
- GitHub Actions CI/CD workflows
- Hetzner self-hosted setup

## Useful Links

- [Turborepo Docs](https://turborepo.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [pgvector](https://github.com/pgvector/pgvector)
- [Neon Docs](https://neon.tech/docs)
- [Better Auth Docs](https://better-auth.com/docs)
