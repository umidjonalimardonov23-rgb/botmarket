import { Router } from "express";
import { db } from "@workspace/db";
import { botTypesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/bots", async (req, res) => {
  try {
    const bots = await db.select().from(botTypesTable).orderBy(botTypesTable.id);
    res.json(bots.map(b => ({
      ...b,
      features: b.features ?? [],
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list bots");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/bots/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const [bot] = await db.select().from(botTypesTable).where(eq(botTypesTable.id, id));
    if (!bot) return res.status(404).json({ error: "Not found" });
    res.json({ ...bot, features: bot.features ?? [] });
  } catch (err) {
    req.log.error({ err }, "Failed to get bot");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
