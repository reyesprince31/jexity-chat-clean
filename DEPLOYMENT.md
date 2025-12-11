# Deployment Guide

This guide covers production deployment workflows, database migrations, CI/CD setup, and environment management for the Jexity Chatbot.

## Table of Contents

- [Prisma Migrate vs Deploy](#prisma-migrate-vs-deploy)
- [Environment Strategy](#environment-strategy)
- [Neon Database Branching](#neon-database-branching)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [Hetzner Production Setup](#hetzner-production-setup)

---

## Prisma Migrate vs Deploy

### Understanding the Difference

| Command | Purpose | Environment | Creates Migration? |
|---------|---------|-------------|-------------------|
| `prisma migrate dev` | Development migrations | Local/Dev | Yes |
| `prisma migrate deploy` | Apply existing migrations | Staging/Production | No |

### `prisma migrate dev`

Used **only in development**. This command:

1. Detects schema changes
2. Creates a new migration file with SQL
3. Applies the migration to your database
4. Regenerates Prisma Client

```bash
# Create and apply a new migration
pnpm --filter @repo/db prisma migrate dev --name add_user_preferences

# Create migration without applying (review SQL first)
pnpm --filter @repo/db prisma migrate dev --name add_indexes --create-only
```

### `prisma migrate deploy`

Used **only in production/staging**. This command:

1. Applies all pending migrations from `prisma/migrations/`
2. Does NOT create new migrations
3. Does NOT modify migration files
4. Safe for automated CI/CD pipelines

```bash
# Apply all pending migrations (production-safe)
pnpm --filter @repo/db prisma migrate deploy
```

### When to Use What

| Scenario | Command |
|----------|---------|
| Developing a new feature locally | `prisma migrate dev --name <feature>` |
| CI/CD deploying to staging | `prisma migrate deploy` |
| CI/CD deploying to production | `prisma migrate deploy` |
| Reviewing migration SQL before commit | `prisma migrate dev --create-only` |
| Hotfix in production | Create migration locally, then `prisma migrate deploy` |

### Migration Workflow

```
Developer Machine          Git Repository          Production Server
       │                         │                        │
       │ prisma migrate dev      │                        │
       │ --name feature_x        │                        │
       │                         │                        │
       ├─────── commit ─────────>│                        │
       │                         │                        │
       │                         │<────── CI/CD ─────────>│
       │                         │   prisma migrate       │
       │                         │   deploy               │
       │                         │                        │
```

---

## Environment Strategy

### Recommended Environment Setup

| Environment | Purpose | Database | Branch |
|-------------|---------|----------|--------|
| **Local** | Development | Docker or Neon Dev Branch | `feature/*` |
| **Preview** | PR Testing | Neon Preview Branch | `preview` |
| **Staging** | Pre-production testing | Neon Staging Branch or Hetzner | `develop` |
| **Production** | Live application | Neon Main or Hetzner | `main` |

### Environment Variables Per Environment

Each environment needs its own set of credentials:

```env
# .env.local (Local Development)
DATABASE_URL="postgresql://postgres:password@localhost:5432/jexity-chatbot"

# .env.preview (Neon Preview Branch)
DATABASE_URL="postgresql://user:pass@ep-preview-xxx.region.aws.neon.tech/neondb?sslmode=require"

# .env.staging (Neon Staging or Hetzner)
DATABASE_URL="postgresql://user:pass@ep-staging-xxx.region.aws.neon.tech/neondb?sslmode=require"

# .env.production (Neon Production or Hetzner)
DATABASE_URL="postgresql://user:pass@ep-main-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

---

## Neon Database Branching

Neon supports database branching similar to Git branches. Each branch is an isolated copy-on-write clone of the parent.

### Branch Strategy

```
main (Production)
  │
  ├── staging (Pre-production testing)
  │     │
  │     └── preview (PR deployments)
  │
  └── development (Shared dev environment - optional)
```

### Setting Up Neon Branches

#### 1. Create the Main Branch (Production)

This is created automatically when you create a Neon project.

```bash
# Via Neon CLI
neonctl projects create --name jexity-chatbot
```

#### 2. Create Staging Branch

```bash
# Create staging branch from main
neonctl branches create --project-id <project-id> --name staging --parent main
```

#### 3. Create Preview Branch

```bash
# Create preview branch from staging
neonctl branches create --project-id <project-id> --name preview --parent staging
```

### Getting Connection Strings

```bash
# List all branches
neonctl branches list --project-id <project-id>

# Get connection string for a specific branch
neonctl connection-string --project-id <project-id> --branch-name staging
```

### Store Connection Strings

Store each branch's connection string in your CI/CD secrets:

| Secret Name | Branch | Used By |
|-------------|--------|---------|
| `DATABASE_URL_PRODUCTION` | main | Production deployment |
| `DATABASE_URL_STAGING` | staging | Staging deployment |
| `DATABASE_URL_PREVIEW` | preview | PR preview deployments |

---

## CI/CD with GitHub Actions

### Workflow Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                        Git Workflow                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  feature/xyz ──PR──> develop ──PR──> main                       │
│       │                  │              │                        │
│       ▼                  ▼              ▼                        │
│   No Deploy         Preview/       Production                    │
│   (tests only)      Staging         Deploy                       │
│                     Deploy                                       │
│                                                                  │
│  Migrations:                                                     │
│  - Created locally (prisma migrate dev)                         │
│  - Committed to repo                                             │
│  - Applied via CI/CD (prisma migrate deploy)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### GitHub Actions Workflows

Create the following workflow files:

#### `.github/workflows/ci.yml` - Run on All PRs

```yaml
name: CI

on:
  pull_request:
    branches: [develop, main]
  push:
    branches: [develop, main]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.24.0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm db:generate

      - name: Lint
        run: pnpm lint

      - name: Type Check
        run: pnpm check-types

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.24.0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm db:generate

      - name: Build
        run: pnpm build
```

#### `.github/workflows/deploy-preview.yml` - Deploy to Preview/Staging

```yaml
name: Deploy Preview

on:
  push:
    branches: [develop]

env:
  DATABASE_URL: ${{ secrets.DATABASE_URL_PREVIEW }}
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  deploy-preview:
    name: Deploy to Preview
    runs-on: ubuntu-latest
    environment: preview
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.24.0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm db:generate

      - name: Run Database Migrations
        run: pnpm --filter @repo/db prisma migrate deploy

      - name: Build
        run: pnpm build

      # Add your deployment step here (Vercel, Railway, Coolify, etc.)
      # Example for Vercel:
      # - name: Deploy to Vercel
      #   uses: amondnet/vercel-action@v25
      #   with:
      #     vercel-token: ${{ secrets.VERCEL_TOKEN }}
      #     vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
      #     vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

#### `.github/workflows/deploy-production.yml` - Deploy to Production

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

env:
  DATABASE_URL: ${{ secrets.DATABASE_URL_PRODUCTION }}
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10.24.0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma Client
        run: pnpm db:generate

      - name: Run Database Migrations
        run: pnpm --filter @repo/db prisma migrate deploy

      - name: Build
        run: pnpm build

      # Add your deployment step here
      # Example: Deploy to Hetzner via SSH
      # - name: Deploy to Hetzner
      #   uses: appleboy/ssh-action@v1.0.0
      #   with:
      #     host: ${{ secrets.HETZNER_HOST }}
      #     username: ${{ secrets.HETZNER_USER }}
      #     key: ${{ secrets.HETZNER_SSH_KEY }}
      #     script: |
      #       cd /app/jexity-chatbot
      #       git pull origin main
      #       pnpm install --frozen-lockfile
      #       pnpm db:generate
      #       pnpm --filter @repo/db prisma migrate deploy
      #       pnpm build
      #       pm2 restart all
```

### GitHub Repository Secrets

Configure these secrets in your GitHub repository settings:

| Secret | Description |
|--------|-------------|
| `DATABASE_URL_PREVIEW` | Neon preview branch connection string |
| `DATABASE_URL_STAGING` | Neon staging branch connection string |
| `DATABASE_URL_PRODUCTION` | Neon main branch connection string |
| `TURBO_TOKEN` | Turborepo remote cache token (optional) |
| `HETZNER_HOST` | Hetzner server IP (if using Hetzner) |
| `HETZNER_USER` | SSH username for Hetzner |
| `HETZNER_SSH_KEY` | Private SSH key for Hetzner |

### GitHub Environments

Create environments in GitHub repository settings for approval gates:

1. **preview** - Auto-deploy on push to `develop`
2. **production** - Require approval before deploying to `main`

---

## Hetzner Production Setup

If you prefer self-hosted infrastructure over Neon, here's how to set up PostgreSQL with pgvector on Hetzner.

### Server Requirements

- **Hetzner Cloud**: CX21 or higher (2 vCPU, 4GB RAM minimum)
- **OS**: Ubuntu 22.04 LTS
- **Storage**: 40GB+ SSD

### Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Hetzner Cloud                               │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │   App Server    │    │   DB Server     │                    │
│  │   (Production)  │    │  (PostgreSQL)   │                    │
│  │                 │    │                 │                    │
│  │  - Next.js      │◄──►│  - PostgreSQL   │                    │
│  │  - Fastify API  │    │  - pgvector     │                    │
│  │  - PM2          │    │                 │                    │
│  │                 │    │                 │                    │
│  └─────────────────┘    └─────────────────┘                    │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │   App Server    │    │   DB Server     │                    │
│  │   (Staging)     │    │  (Staging)      │                    │
│  └─────────────────┘    └─────────────────┘                    │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Option A: Single Server Setup (Staging)

For staging or small production workloads, run everything on one server.

#### 1. Initial Server Setup

```bash
# SSH into your Hetzner server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm@10.24.0

# Install PM2 for process management
npm install -g pm2

# Install PostgreSQL 17 with pgvector
apt install -y postgresql-common
/usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
apt install -y postgresql-17 postgresql-17-pgvector

# Start PostgreSQL
systemctl enable postgresql
systemctl start postgresql
```

#### 2. Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE jexity_production;
CREATE USER jexity WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE jexity_production TO jexity;

# Connect to database and enable pgvector
\c jexity_production
CREATE EXTENSION IF NOT EXISTS vector;

# Exit
\q
```

#### 3. Configure PostgreSQL for Remote Access (if needed)

```bash
# Edit postgresql.conf
nano /etc/postgresql/17/main/postgresql.conf
# Add: listen_addresses = '*'

# Edit pg_hba.conf
nano /etc/postgresql/17/main/pg_hba.conf
# Add: host all all 0.0.0.0/0 scram-sha-256

# Restart PostgreSQL
systemctl restart postgresql
```

#### 4. Deploy Application

```bash
# Create app directory
mkdir -p /app/jexity-chatbot
cd /app/jexity-chatbot

# Clone repository
git clone https://github.com/your-org/jexity-chatbot.git .

# Install dependencies
pnpm install --frozen-lockfile

# Create .env files
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env

# Edit .env files with production values
nano apps/web/.env
# DATABASE_URL="postgresql://jexity:your-secure-password@localhost:5432/jexity_production"

# Generate Prisma Client
pnpm db:generate

# Run migrations
pnpm --filter @repo/db prisma migrate deploy

# Build applications
pnpm build
```

#### 5. Configure PM2 Ecosystem

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    {
      name: "web",
      cwd: "./apps/web",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "api",
      cwd: "./apps/api",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
```

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Option B: Separate Database Server (Production)

For production, use a dedicated managed PostgreSQL instance:

- **Hetzner Managed Database** - Fully managed PostgreSQL with automated backups
- **Neon** - Serverless PostgreSQL with branching
- **Supabase** - PostgreSQL with additional features

#### Hetzner Managed Database Setup

1. Create a managed PostgreSQL instance in Hetzner Cloud Console
2. Enable the `pgvector` extension via SQL:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Get the connection string from Hetzner dashboard
4. Store in your environment variables

### Nginx Reverse Proxy

```bash
# Install Nginx
apt install -y nginx

# Create configuration
nano /etc/nginx/sites-available/jexity-chatbot
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Web App
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/jexity-chatbot /etc/nginx/sites-enabled/

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your-domain.com

# Test and reload Nginx
nginx -t
systemctl reload nginx
```

### CI/CD for Hetzner Deployment

Update `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy Production (Hetzner)

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy to Hetzner
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HETZNER_HOST }}
          username: ${{ secrets.HETZNER_USER }}
          key: ${{ secrets.HETZNER_SSH_KEY }}
          script: |
            cd /app/jexity-chatbot
            
            # Pull latest changes
            git fetch origin main
            git reset --hard origin/main
            
            # Install dependencies
            pnpm install --frozen-lockfile
            
            # Generate Prisma Client
            pnpm db:generate
            
            # Run migrations
            pnpm --filter @repo/db prisma migrate deploy
            
            # Build applications
            pnpm build
            
            # Restart PM2 processes
            pm2 restart all
            
            # Save PM2 state
            pm2 save
```

---

## Quick Reference

### Migration Commands

```bash
# Development - create new migration
pnpm --filter @repo/db prisma migrate dev --name <description>

# Development - create migration without applying
pnpm --filter @repo/db prisma migrate dev --name <description> --create-only

# Production/Staging - apply pending migrations
pnpm --filter @repo/db prisma migrate deploy

# Check migration status
pnpm --filter @repo/db prisma migrate status

# Reset database (DANGER - destroys all data)
pnpm --filter @repo/db prisma migrate reset
```

### Neon CLI Commands

```bash
# Install Neon CLI
npm install -g neonctl

# Authenticate
neonctl auth

# List projects
neonctl projects list

# Create branch
neonctl branches create --project-id <id> --name <branch-name> --parent <parent-branch>

# Get connection string
neonctl connection-string --project-id <id> --branch-name <branch-name>

# Delete branch
neonctl branches delete --project-id <id> --branch-name <branch-name>
```

### Deployment Checklist

- [ ] All migrations committed to repository
- [ ] Environment variables configured in CI/CD secrets
- [ ] Database connection tested
- [ ] `prisma migrate deploy` runs successfully
- [ ] Application builds without errors
- [ ] Health checks pass after deployment

---

## Platform-Specific Deployment

This section covers how to deploy each application in the monorepo to its target platform.

### apps/web → Vercel

The Next.js web application is deployed to Vercel for optimal performance and zero-config deployment.

#### Initial Setup

1. **Create a new Vercel project**
   - Go to [vercel.com](https://vercel.com) and import your repository
   - Select the repository containing your monorepo

2. **Configure Root Directory**
   - In project settings, set **Root Directory** to `apps/web`
   - Vercel will automatically detect Next.js and configure build settings

3. **Build Settings** (auto-detected, but verify):
   ```
   Framework Preset: Next.js
   Build Command: pnpm build (or leave default)
   Output Directory: .next (auto-detected)
   Install Command: pnpm install
   ```

4. **Environment Variables**
   Add all required environment variables in Vercel project settings:
   
   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | PostgreSQL connection string (Neon) |
   | `BETTER_AUTH_SECRET` | Auth secret key |
   | `BETTER_AUTH_URL` | Production URL (e.g., `https://your-app.vercel.app`) |
   | `NEXT_PUBLIC_APP_URL` | Same as above |
   | `OPENAI_API_KEY` | OpenAI API key |
   | `NEXT_PUBLIC_API_URL` | API server URL (Hetzner) |

5. **Link Local Project** (optional, for Vercel CLI)
   ```bash
   cd apps/web
   vercel link
   ```

#### Team Environment Variables

For monorepos, use Vercel's **Team Environment Variables** feature to share variables across projects:
- Variables like `DATABASE_URL` can be defined once at team level
- Automatically available to all projects in the team

#### Deployment Triggers

- **Production**: Push to `main` branch
- **Preview**: Push to any other branch or open a PR

#### Vercel Configuration (optional)

Create `apps/web/vercel.json` for custom settings:

```json
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=web",
  "installCommand": "cd ../.. && pnpm install",
  "framework": "nextjs"
}
```

---

### apps/api → Hetzner

The Fastify API server is deployed to Hetzner Cloud for cost-effective, self-managed hosting.

#### Server Requirements

- **Hetzner Cloud**: CX21 or higher (2 vCPU, 4GB RAM)
- **OS**: Ubuntu 22.04 LTS
- **Node.js**: 20.x

#### Initial Server Setup

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm and PM2
npm install -g pnpm@10.24.0 pm2
```

#### Deploy the API

```bash
# Create app directory
mkdir -p /app/jexity-chatbot
cd /app/jexity-chatbot

# Clone repository
git clone https://github.com/your-org/jexity-chatbot.git .

# Install dependencies
pnpm install --frozen-lockfile

# Create environment file
cat > apps/api/.env << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://user:pass@your-db-host:5432/jexity_production"
BETTER_AUTH_SECRET="your-secret"
OPENAI_API_KEY="your-openai-key"
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-key"
EOF

# Generate Prisma Client
pnpm db:generate

# Build the API
pnpm --filter api build

# Start with PM2
pm2 start apps/api/dist/index.js --name "api" --env production

# Save PM2 config and enable startup
pm2 save
pm2 startup
```

#### PM2 Ecosystem File

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    {
      name: "api",
      cwd: "./apps/api",
      script: "dist/index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
```

#### Nginx Configuration for API

```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }
}
```

#### Update Deployment Script

```bash
#!/bin/bash
# deploy-api.sh

cd /app/jexity-chatbot

# Pull latest changes
git fetch origin main
git reset --hard origin/main

# Install dependencies
pnpm install --frozen-lockfile

# Generate Prisma Client
pnpm db:generate

# Run migrations
pnpm --filter @repo/db prisma migrate deploy

# Build API
pnpm --filter api build

# Restart PM2
pm2 restart api
```

---

### apps/chat-widget → Hetzner (Static Files)

The chat widget is a Vite/Preact application that builds to static files. It can be served via Nginx or deployed to a CDN.

#### Build the Widget

```bash
# Build produces dist/ folder with:
# - chat-widget.es.js (ES module)
# - chat-widget.umd.js (UMD bundle)
pnpm --filter chat-widget build
```

#### Option A: Serve via Nginx on Hetzner

```bash
# Copy built files to web root
cp -r apps/chat-widget/dist/* /var/www/widget.your-domain.com/
```

Nginx configuration:

```nginx
server {
    listen 80;
    server_name widget.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name widget.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/widget.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/widget.your-domain.com/privkey.pem;

    root /var/www/widget.your-domain.com;
    index index.html;

    # Enable CORS for widget embedding
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
    add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept";

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin *;
    }

    location / {
        try_files $uri $uri/ =404;
    }
}
```

#### Option B: Deploy to CDN (Recommended for Production)

For better global performance, deploy the widget to a CDN:

**Cloudflare R2 / AWS S3 + CloudFront:**

```bash
# Upload to S3/R2
aws s3 sync apps/chat-widget/dist/ s3://your-bucket/widget/ \
  --cache-control "public, max-age=31536000, immutable"
```

**Usage in customer websites:**

```html
<!-- Load from your CDN -->
<script src="https://cdn.your-domain.com/widget/chat-widget.umd.js"></script>
<script>
  ChatWidget.init({
    apiUrl: 'https://api.your-domain.com',
    widgetId: 'your-widget-id'
  });
</script>
```

#### Widget Deployment Script

```bash
#!/bin/bash
# deploy-widget.sh

cd /app/jexity-chatbot

# Pull latest
git fetch origin main
git reset --hard origin/main

# Install and build
pnpm install --frozen-lockfile
pnpm --filter chat-widget build

# Copy to web root
cp -r apps/chat-widget/dist/* /var/www/widget.your-domain.com/

# Or sync to CDN
# aws s3 sync apps/chat-widget/dist/ s3://your-bucket/widget/
```

---

### Combined GitHub Actions Workflow

Here's a complete workflow that deploys all three apps:

```yaml
name: Deploy All

on:
  push:
    branches: [main]

jobs:
  deploy-web:
    name: Deploy Web to Vercel
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID_WEB }}
          working-directory: ./apps/web

  deploy-api-and-widget:
    name: Deploy API & Widget to Hetzner
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HETZNER_HOST }}
          username: ${{ secrets.HETZNER_USER }}
          key: ${{ secrets.HETZNER_SSH_KEY }}
          script: |
            cd /app/jexity-chatbot
            
            # Pull latest
            git fetch origin main
            git reset --hard origin/main
            
            # Install dependencies
            pnpm install --frozen-lockfile
            
            # Generate Prisma
            pnpm db:generate
            
            # Run migrations
            pnpm --filter @repo/db prisma migrate deploy
            
            # Build API and Widget
            pnpm --filter api build
            pnpm --filter chat-widget build
            
            # Deploy widget files
            cp -r apps/chat-widget/dist/* /var/www/widget.your-domain.com/
            
            # Restart API
            pm2 restart api
```

---

## Troubleshooting

### Migration Drift

If your database schema drifts from migrations:

```bash
# Check for drift
pnpm --filter @repo/db prisma migrate diff --from-schema-datamodel prisma/schema --to-url $DATABASE_URL

# Reset and re-apply (DESTROYS DATA)
pnpm --filter @repo/db prisma migrate reset
```

### Failed Migration in Production

1. **Do NOT use `prisma migrate reset`** in production
2. Check the failed migration SQL manually
3. Fix the issue in the migration file or create a new migration to fix it
4. Re-run `prisma migrate deploy`

### Connection Issues

```bash
# Test database connection
pnpm --filter @repo/db prisma db execute --stdin <<< "SELECT 1"

# Check Prisma connection
pnpm --filter @repo/db prisma db pull
```
