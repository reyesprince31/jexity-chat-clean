import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import uploadRoutes from "./routes/upload.js";
import chatRoutes from "./routes/chat.js";

import { fastifyPlugin } from "inngest/fastify";
import { functions } from "./inngest/index";
import { inngest } from "./inngest/client";

dotenv.config();

const PORT = process.env.PORT || 3001;

const fastify = Fastify({
  logger:
    process.env.NODE_ENV === "production"
      ? true
      : {
          transport: {
            target: "pino-pretty",
            options: {
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
            },
          },
        },
});

// Register CORS
await fastify.register(cors, {
  origin: "http://localhost:3000",
  credentials: true,
});

// Register Inngest
// This automatically adds the "/api/inngest" routes to your server
fastify.register(fastifyPlugin, {
  client: inngest,
  functions,
  options: {},
});

// Register multipart plugin for file uploads
await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Register upload routes
await fastify.register(uploadRoutes);

// Register chat routes
await fastify.register(chatRoutes);

// Hello world endpoint
fastify.get("/", async () => {
  return { message: "Hello World" };
});

// Health check endpoint
fastify.get("/health", async () => {
  return { status: "ok" };
});

const start = async () => {
  try {
    await fastify.listen({ port: Number(PORT), host: "0.0.0.0" });
    console.log(`Server is running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
