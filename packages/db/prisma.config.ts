import path from "node:path";
import { defineConfig, env } from "prisma/config";
import dotenv from "dotenv";

dotenv.config({
	path: "../../apps/web/.env",
});

export default defineConfig({
	schema: path.join("prisma", "schema"),
	migrations: {
		path: path.join("prisma", "migrations"),
		seed: "tsx prisma/seed.ts",
	},
	datasource: {
		url: env("DATABASE_URL"),
	},
});
