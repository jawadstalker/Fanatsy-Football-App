import "dotenv/config";
import express from "express";
import cors from "cors";
import { footballRouter } from "./footballProxy";
import { leaguesRouter } from "./leagues";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/football", footballRouter);
app.use("/api/leagues", leaguesRouter);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Fantasy Multi League server listening on port ${port}`);
});
