import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.count);
    res.json(cats.reverse().map(c => ({ id: c.slug, name: c.name, icon: c.icon, count: c.count })));
  } catch (err) {
    req.log.error({ err }, "Failed to list categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
