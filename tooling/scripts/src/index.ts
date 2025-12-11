#!/usr/bin/env node
import { logger } from "@repo/logs";

logger.info("@repo/cli - Available commands:");
logger.log("  pnpm cli:create-user  - Create a new user interactively");
logger.log("  pnpm cli:seed         - Seed database with test data");
