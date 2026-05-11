import { Router } from "express";
import { bot } from "../bot/index.js";
import { webhookCallback } from "grammy";

const router = Router();

const handler = webhookCallback(bot, "express");

router.post("/webhook", handler);

export default router;
