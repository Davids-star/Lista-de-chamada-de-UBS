import type { Request, Response } from "express";
import { Status } from "@prisma/client";
import {
  alterarStatus,
  calcularPosicao,
  criarPaciente,
  listarFila,
} from "../services/filaService";
import { validarCadastroPaciente } from "../utils/validation";

const STATUS_VALIDOS = [
  Status.em_atendimento,
  Status.ausente,
  Status.finalizado,
];

export async function criar(req: Request, res: Response) {
  const resultado = validarCadastroPaciente(req.body ?? {});
  if ("error" in resultado) {
    return res.status(400).json({ error: resultado.error });
  }

  const paciente = await criarPaciente(resultado.data);
  return res.status(201).json(paciente);
}

export async function listar(_req: Request, res: Response) {
  const fila = await listarFila();
  return res.json(fila);
}

export async function posicao(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido" });
  }

  const resultado = await calcularPosicao(id);
  if (!resultado) {
    return res.status(404).json({ error: "paciente não encontrado" });
  }

  return res.json(resultado);
}

export async function alterarStatusHandler(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido" });
  }

  const { status } = req.body ?? {};
  if (!STATUS_VALIDOS.includes(status)) {
    return res.status(400).json({ error: "status inválido" });
  }

  const paciente = await alterarStatus(id, status);
  if (!paciente) {
    return res.status(404).json({ error: "paciente não encontrado" });
  }

  return res.json(paciente);
}