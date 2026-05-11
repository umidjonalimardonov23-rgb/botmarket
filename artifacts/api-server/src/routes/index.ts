import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import miniappRouter from "./miniapp.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(miniappRouter);

if (process.env["NODE_ENV"] === "production" && process.env["WEBHOOK_URL"]) {
  import("./webhook.js").then((m) => router.use(m.default)).catch(() => {});
}

export default router;
