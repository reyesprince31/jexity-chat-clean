# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **Turborepo monorepo** managing multiple Next.js applications and shared packages. It uses **pnpm** as the package manager and requires Node.js >= 18.

## Monorepo Structure

```
apps/
  api/       - Fastify API server running on port 3001 (configurable via .env)
  web/       - Next.js app running on port 3000
packages/
  ui/                  - Shared React component library (@repo/ui)
  eslint-config/       - Shared ESLint configurations (@repo/eslint-config)
  typescript-config/   - Shared TypeScript configurations (@repo/typescript-config)
```

## Common Commands

### Development
```bash
# Run all apps in development mode (with Turbopack)
pnpm dev

# Run a specific app
turbo dev --filter=web    # web app on port 3000
turbo dev --filter=api    # API server on port 3001 (or PORT from .env)
```

### Building
```bash
# Build all apps and packages
pnpm build

# Build a specific app
turbo build --filter=web
turbo build --filter=api
```

### Linting
```bash
# Lint all packages and apps
pnpm lint

# Lint a specific package
turbo lint --filter=web
```

### Type Checking
```bash
# Type check all packages and apps
pnpm check-types

# Type check a specific package
turbo check-types --filter=web
```

### Formatting
```bash
# Format all TypeScript, TSX, and Markdown files
pnpm format
```

### Working with @repo/ui
```bash
# Generate a new React component in the UI package
cd packages/ui
pnpm generate:component
```

## Architecture Notes

### Workspace Dependencies
- The `web` app depends on `@repo/ui` for shared components
- All packages use `@repo/eslint-config` for linting configurations
- All packages use `@repo/typescript-config` for TypeScript configurations
- Workspace dependencies are referenced with `workspace:*` protocol

### UI Package Structure
- Components in `packages/ui/src/` are exported individually via the package.json `exports` field
- Import pattern: `import { Button } from "@repo/ui/button"`
- All UI components are client components ("use client" directive)

### Next.js App (web)

- Uses Next.js 15+ with React 19+
- Development runs with Turbopack for faster builds (`next dev --turbopack`)
- Uses the App Router (`app/` directory)
- Linting requires zero warnings (`--max-warnings 0`)

### API Server (Fastify)
- Uses Fastify framework for REST API
- Port is configurable via `PORT` environment variable in `apps/api/.env` (default: 3001)
- Development uses `tsx watch` for hot reloading
- Production builds use `tsup` for bundling
- Available endpoints:
  - `GET /` - Hello World
  - `GET /health` - Health check

### Turborepo Configuration
- Build tasks depend on upstream builds (`^build` dependency)
- Dev tasks are persistent and uncached
- Build outputs are cached in `.next/` for Next.js apps and `dist/` for Node.js apps
- Uses TUI (Terminal UI) mode for better task visualization
