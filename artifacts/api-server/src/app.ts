import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import webhookRouter from "./routes/webhook.js";
import { logger } from "./lib/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const miniappPath = path.join(__dirname, "../../public/miniapp");
app.use("/miniapp", express.static(miniappPath));

app.use("/api", router);
app.use(webhookRouter);

app.get("/miniapp", (_req, res) => {
  res.sendFile(path.join(miniappPath, "index.html"));
});

export default app;
