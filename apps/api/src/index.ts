import Fastify from "fastify";
import dotenv from "dotenv";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import websocket from "@fastify/websocket";
import uploadRoutes from "./routes/upload.js";
import chatRoutes from "./routes/chat.js";
import helpdeskRoutes from "./routes/helpdesk.js";
import internalRoutes from "./routes/internal.js";
import { realtimeGateway } from "./lib/realtime.js";

dotenv.config();

const PORT = process.env.PORT || 3001;
const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

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
  credentials: true,
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
      return;
    }

    cb(new Error("Origin not allowed"), false);
  },
});

// Register multipart plugin for file uploads
await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Register websocket transport for realtime updates
await fastify.register(websocket);
realtimeGateway.register(fastify);

// Register upload routes
await fastify.register(uploadRoutes);

// Register chat routes
await fastify.register(chatRoutes);

// Helpdesk-specific routes
await fastify.register(helpdeskRoutes);

// Internal routes for workflow processing
await fastify.register(internalRoutes);

// Hello world endpoint
fastify.get("/", async () => {
  return { message: "Hello World" };
});

// Health check endpoint
fastify.get("/health", async () => {
  return { status: "ok" };
});

// For local development, start the server directly
const isDev = process.env.NODE_ENV !== "production";

if (isDev) {
  const startServer = async () => {
    try {
      await fastify.listen({ port: Number(PORT), host: "0.0.0.0" });
      console.log(`Server is running on port ${PORT}`);
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  };
  startServer();
}

// For Nitro/Vercel compatibility, export the handler
await fastify.ready();

export default (req: import("http").IncomingMessage, res: import("http").ServerResponse) => {
  fastify.server.emit("request", req, res);
};
