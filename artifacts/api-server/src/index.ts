import app from "./app.js";
import { logger } from "./lib/logger.js";
import { sendTrialExpiryReminders } from "./lib/bot.js";
import cron from "node-cron";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Every day at 9:00 AM check for trial expiry
  cron.schedule("0 9 * * *", async () => {
    logger.info("Running trial expiry check...");
    await sendTrialExpiryReminders();
  });
});
