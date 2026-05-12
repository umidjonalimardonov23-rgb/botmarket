import { Router } from "express";
import { db } from "@workspace/db";
import { botsTable, reviewsTable, categoriesTable, insertBotSchema } from "@workspace/db";
import { eq, avg, count, sql } from "drizzle-orm";

const router = Router();

// GET /api/bots/stats — must be before /:id
router.get("/stats", async (req, res) => {
  try {
    const [botsCount] = await db.select({ count: count() }).from(botsTable);
    const [categoriesCount] = await db.select({ count: count() }).from(categoriesTable);
    const [reviewsCount] = await db.select({ count: count() }).from(reviewsTable);

    res.json({
      totalBots: botsCount.count,
      totalCategories: categoriesCount.count,
      totalReviews: reviewsCount.count,
      totalUsers: Math.floor(botsCount.count * 12.4),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/bots/featured — must be before /:id
router.get("/featured", async (req, res) => {
  try {
    const bots = await db
      .select()
      .from(botsTable)
      .where(eq(botsTable.isVerified, true))
      .limit(8);
    res.json(bots);
  } catch (err) {
    req.log.error({ err }, "Failed to get featured bots");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/bots
router.get("/", async (req, res) => {
  try {
    const { category, search, lang } = req.query as Record<string, string>;

    let bots = await db.select().from(botsTable).orderBy(botsTable.id);

    if (category && category !== "all") {
      bots = bots.filter((b) => b.category === category);
    }
    if (search) {
      const s = search.toLowerCase();
      bots = bots.filter(
        (b) =>
          b.name.toLowerCase().includes(s) ||
          b.username.toLowerCase().includes(s) ||
          b.description.toLowerCase().includes(s)
      );
    }
    if (lang) {
      bots = bots.filter((b) => b.languages.includes(lang));
    }

    res.json(bots.reverse());
  } catch (err) {
    req.log.error({ err }, "Failed to list bots");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/bots
router.post("/", async (req, res) => {
  try {
    const parsed = insertBotSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid bot data" });
    }

    const [bot] = await db.insert(botsTable).values(parsed.data).returning();

    await db
      .update(categoriesTable)
      .set({ count: sql`${categoriesTable.count} + 1` })
      .where(eq(categoriesTable.slug, parsed.data.category));

    res.status(201).json(bot);

    // Notify admin about new bot submission
    try {
      const ADMIN_ID = 7575930751;
      const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      if (BOT_TOKEN) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: ADMIN_ID,
            text: `🆕 <b>Yangi bot qo'shildi!</b>\n\n${parsed.data.icon} <b>${parsed.data.name}</b>\n@${parsed.data.username}\n📂 ${parsed.data.category}\n\n${parsed.data.description?.slice(0, 100)}...`,
            parse_mode: "HTML",
          }),
        });
      }
    } catch {}
  } catch (err) {
    req.log.error({ err }, "Failed to create bot");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/bots/:id/reviews — must be before /:id alone
router.get("/:id/reviews", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.botId, id));

    res.json(reviews.reverse());
  } catch (err) {
    req.log.error({ err }, "Failed to get reviews");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/bots/:id/reviews
router.post("/:id/reviews", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const { authorName, authorAvatar, rating, comment } = req.body;
    if (!authorName || !rating || !comment) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [review] = await db
      .insert(reviewsTable)
      .values({
        botId: id,
        authorName,
        authorAvatar: authorAvatar ?? null,
        rating: Number(rating),
        comment,
      })
      .returning();

    const [stats] = await db
      .select({ avg: avg(reviewsTable.rating), count: count() })
      .from(reviewsTable)
      .where(eq(reviewsTable.botId, id));

    await db
      .update(botsTable)
      .set({ rating: Number(stats.avg ?? 0), reviewCount: stats.count })
      .where(eq(botsTable.id, id));

    res.status(201).json(review);
  } catch (err) {
    req.log.error({ err }, "Failed to create review");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/bots/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const [bot] = await db.select().from(botsTable).where(eq(botsTable.id, id));
    if (!bot) return res.status(404).json({ error: "Bot not found" });

    res.json(bot);
  } catch (err) {
    req.log.error({ err }, "Failed to get bot");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
