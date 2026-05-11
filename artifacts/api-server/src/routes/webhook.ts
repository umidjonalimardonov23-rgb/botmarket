import { Router } from "express";
import { createOrder, getOrCreateUser } from "../bot/database.js";
import { getBotById, BOT_CATALOG } from "../bot/data.js";
import { sendOrderToAdmin } from "../bot/index.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/api/bots", (_req, res) => {
  res.json(BOT_CATALOG);
});

router.post("/api/order", async (req, res) => {
  try {
    const { botId, contact, note, userId, userFirstName, username } = req.body as {
      botId: string;
      contact: string;
      note?: string;
      userId: string | number;
      userFirstName?: string;
      username?: string;
    };

    if (!botId || !contact || !userId) {
      res.status(400).json({ error: "botId, contact, userId required" });
      return;
    }

    const botProduct = getBotById(botId);
    if (!botProduct) {
      res.status(404).json({ error: "Bot not found" });
      return;
    }

    await getOrCreateUser(String(userId), username, userFirstName);

    const orderId = await createOrder(
      String(userId),
      botProduct.id,
      botProduct.name,
      botProduct.price,
      contact,
      note || ""
    );

    await sendOrderToAdmin(
      orderId,
      String(userId),
      botProduct.name,
      botProduct.emoji,
      botProduct.price,
      contact,
      note || "",
      userFirstName || "Noma'lum"
    );

    res.json({ success: true, orderId });
  } catch (err) {
    logger.error({ err }, "Order creation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
