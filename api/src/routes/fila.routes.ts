import { Router } from "express";
import * as filaController from "../controllers/filaController";

export const filaRoutes = Router();

filaRoutes.post("/", filaController.criar);
filaRoutes.get("/", filaController.listar);
filaRoutes.get("/cpf/:cpf", filaController.buscarPorCpf);
filaRoutes.get("/:id/status", filaController.posicao);
filaRoutes.put("/:id/status", filaController.alterarStatusHandler);
filaRoutes.post("/:id/chamar", filaController.chamarNovamenteHandler);
filaRoutes.post("/:id/conferencia", filaController.chamarParaConferenciaHandler);
filaRoutes.post("/:id/preferencial", filaController.confirmarPreferencialHandler);