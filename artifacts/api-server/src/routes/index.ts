import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import webhookRouter from "./webhook.js";
import miniappRouter from "./miniapp.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(webhookRouter);
router.use(miniappRouter);

export default router;
