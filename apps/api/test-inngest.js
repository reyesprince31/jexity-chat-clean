// Simple script to test Inngest event triggering
import { inngest } from "./src/inngest/client.js";

console.log("Sending test event...");

const result = await inngest.send({
  name: "test/log",
  data: {},
});

console.log("Event sent:", result);
console.log("Check http://localhost:8288 to see the function run and logs");

process.exit(0);
