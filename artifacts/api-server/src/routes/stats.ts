import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, telegramUsersTable, botTypesTable } from "@workspace/db";
import { eq, count, sum, desc } from "drizzle-orm";

const router = Router();

router.get("/stats/dashboard", async (req, res) => {
  try {
    const allOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter(o => o.status === "pending").length;
    const completedOrders = allOrders.filter(o => o.status === "completed").length;
    const totalRevenue = allOrders
      .filter(o => o.status === "completed")
      .reduce((sum, o) => sum + o.totalPrice, 0);

    const [userCount] = await db.select({ count: count() }).from(telegramUsersTable);
    const totalUsers = userCount?.count ?? 0;

    const botCounts: Record<string, number> = {};
    for (const o of allOrders) {
      botCounts[o.botTypeName] = (botCounts[o.botTypeName] ?? 0) + 1;
    }
    const popularBot = Object.entries(botCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    const recentOrders = allOrders.slice(0, 5).map(o => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));

    res.json({
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
      totalUsers: Number(totalUsers),
      popularBot,
      recentOrders,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/ref/:code", async (req, res) => {
  try {
    const code = req.params.code;
    const [user] = await db
      .select()
      .from(telegramUsersTable)
      .where(eq(telegramUsersTable.referralCode, code));

    if (!user) return res.status(404).json({ error: "Not found" });

    const referrals = await db
      .select()
      .from(telegramUsersTable)
      .where(eq(telegramUsersTable.referredBy, code));

    res.json({
      code,
      referrerName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Foydalanuvchi",
      totalReferrals: referrals.length,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get referral info");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
