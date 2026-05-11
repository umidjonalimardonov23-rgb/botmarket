import app from "./app.js";
import { logger } from "./lib/logger.js";
import { startBot, setupSubscriptionCron } from "./bot/index.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async () => {
  logger.info({ port }, "Server listening");
  await startBot();
  await setupSubscriptionCron();
});
