import { Router, type IRouter } from "express";
import healthRouter from "./health";
import botsRouter from "./bots";
import categoriesRouter from "./categories";
import webhookRouter from "./webhook";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/bots", botsRouter);
router.use("/categories", categoriesRouter);
router.use("/webhook", webhookRouter);

export default router;
