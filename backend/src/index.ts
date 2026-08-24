import "dotenv/config";
import express from "express";
import cors from "cors";
import { menuRouter } from "./routes/menu";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "nutriweek-backend" });
});

app.use("/api/menu", menuRouter);

const port = Number(process.env.PORT ?? 3333);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`NutriWeek backend rodando em http://localhost:${port}`);
});
