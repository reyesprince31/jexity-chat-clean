import Fastify from "fastify";
import dotenv from "dotenv";
import multipart from "@fastify/multipart";
import uploadRoutes from "./routes/upload.js";

dotenv.config();

const PORT = process.env.PORT || 3001;

const fastify = Fastify({
  logger: true,
});

// Register multipart plugin for file uploads
await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Register upload routes
await fastify.register(uploadRoutes);

// Hello world endpoint
fastify.get("/", async (request, reply) => {
  return { message: "Hello World" };
});

// Health check endpoint
fastify.get("/health", async (request, reply) => {
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
