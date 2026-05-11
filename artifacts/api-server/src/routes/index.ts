import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import botsRouter from "./bots.js";
import ordersRouter from "./orders.js";
import statsRouter from "./stats.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(botsRouter);
router.use(ordersRouter);
router.use(statsRouter);

export default router;
