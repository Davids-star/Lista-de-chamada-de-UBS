import { Router } from "express";
import * as filaController from "../controllers/filaController";

export const filaRoutes = Router();

filaRoutes.post("/", filaController.criar);
filaRoutes.get("/", filaController.listar);
filaRoutes.get("/:id/status", filaController.posicao);
filaRoutes.put("/:id/status", filaController.alterarStatusHandler);