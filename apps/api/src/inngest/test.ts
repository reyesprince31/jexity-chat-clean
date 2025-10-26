import { inngest } from "./client";

export const debugLog = inngest.createFunction(
  { id: "debug-log" },
  { event: "test/log" },
  async ({ step, logger }) => {
    const result = await step.run("test-logging", async () => {
      logger.info("Logger works inside step");
      logger.debug("Debug message");
      logger.warn("Warning message");
      console.log("Console works inside step");

      // Return the logs as part of the output so we can see them
      return {
        logged: true,
        message: "All logging completed",
        timestamp: new Date().toISOString()
      };
    });

    logger.info("Function completed");
    return { ok: true, stepResult: result };
  }
);
