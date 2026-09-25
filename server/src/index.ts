import "dotenv/config";
import express from "express";
import cors from "cors";
import { footballRouter } from "./footballProxy";
import { leaguesRouter } from "./leagues";
import authRouter from "./auth";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS ?? "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.includes("*") ? true : allowedOrigins,
}));
app.use(express.json({ limit: "64kb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/football", footballRouter);
app.use("/api/auth", authRouter);
app.use("/api/leagues", leaguesRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Fantasy Multi League server listening on port ${port}`);
});
