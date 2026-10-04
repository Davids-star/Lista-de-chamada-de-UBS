import "dotenv/config";
import express from "express";
import cors from "cors";
import { filaRoutes } from "./routes/fila.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/fila", filaRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});