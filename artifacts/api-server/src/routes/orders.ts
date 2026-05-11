import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, botTypesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateOrderBody, UpdateOrderStatusBody } from "@workspace/api-zod";
import { sendAdminNotification } from "../lib/bot.js";

const router = Router();

router.get("/orders", async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    res.json(orders.map(o => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const parsed = CreateOrderBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    const { botTypeId, clientName, clientPhone, telegramId, telegramUsername, notes, referralCode } = parsed.data;

    const [bot] = await db.select().from(botTypesTable).where(eq(botTypesTable.id, botTypeId));
    if (!bot) return res.status(404).json({ error: "Bot type not found" });

    const [order] = await db.insert(ordersTable).values({
      botTypeId,
      botTypeName: bot.name,
      clientName,
      clientPhone,
      telegramId,
      telegramUsername: telegramUsername ?? null,
      status: "pending",
      totalPrice: bot.price,
      notes: notes ?? null,
      referralCode: referralCode ?? null,
    }).returning();

    // Notify admin
    try {
      await sendAdminNotification(
        `🆕 *Yangi buyurtma #${order.id}*\n\n` +
        `🤖 Bot: ${bot.name}\n` +
        `👤 Mijoz: ${clientName}\n` +
        `📞 Telefon: ${clientPhone}\n` +
        `💬 Telegram: ${telegramUsername ? "@" + telegramUsername : telegramId}\n` +
        `💰 Narx: ${bot.price.toLocaleString()} so'm\n` +
        (notes ? `📝 Izoh: ${notes}\n` : "") +
        (referralCode ? `🔗 Referal: ${referralCode}\n` : "") +
        `\n📅 Sana: ${new Date().toLocaleString("uz-UZ")}`
      );
    } catch (notifyErr) {
      req.log.warn({ notifyErr }, "Failed to notify admin");
    }

    res.status(201).json({
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create order");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!order) return res.status(404).json({ error: "Not found" });
    res.json({
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get order");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const parsed = UpdateOrderStatusBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });

    const [updated] = await db.update(ordersTable)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(ordersTable.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: "Not found" });

    const statusLabels: Record<string, string> = {
      pending: "⏳ Kutilmoqda",
      confirmed: "✅ Tasdiqlandi",
      in_progress: "🔄 Bajarilmoqda",
      completed: "🎉 Tayyor",
      cancelled: "❌ Bekor qilindi",
    };

    try {
      await sendAdminNotification(
        `📋 *Buyurtma #${id} holati o'zgardi*\n\n` +
        `Bot: ${updated.botTypeName}\n` +
        `Mijoz: ${updated.clientName}\n` +
        `Yangi holat: ${statusLabels[parsed.data.status] ?? parsed.data.status}`
      );
    } catch {}

    res.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update order status");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
