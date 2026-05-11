import { Router } from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

router.get("/miniapp", (_req, res) => {
  res.sendFile(path.join(__dirname, "../../miniapp/index.html"));
});

export default router;
