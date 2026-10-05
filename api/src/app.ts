import "dotenv/config";
import express from "express";
import cors from "cors";
import { filaRoutes } from "./routes/fila.routes";
import { corsOrigin } from "./config/cors";

export const app = express();

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.use("/api/fila", filaRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});