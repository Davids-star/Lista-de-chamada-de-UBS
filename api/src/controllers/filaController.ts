import type { Request, Response } from "express";
import { Status } from "@prisma/client";
import {
  alterarStatus,
  buscarUltimoPorCpf,
  calcularPosicao,
  chamarNovamente,
  chamarParaConferencia,
  confirmarPreferencial,
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

export async function chamarNovamenteHandler(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido" });
  }

  const resultado = await chamarNovamente(id);
  if ("erro" in resultado) {
    if (resultado.erro === "nao_encontrado") {
      return res.status(404).json({ error: "paciente não encontrado" });
    }
    return res
      .status(409)
      .json({ error: "paciente não está em atendimento" });
  }

  return res.json(resultado.paciente);
}

/** Só devolve o necessário para preencher o formulário: nome e telefone, sem CPF nem histórico. */
export async function buscarPorCpf(req: Request, res: Response) {
  const cpf = String(req.params.cpf ?? "").replace(/\D/g, "");
  if (cpf.length !== 11) {
    return res.status(400).json({ error: "cpf inválido" });
  }

  const paciente = await buscarUltimoPorCpf(cpf);
  if (!paciente) {
    return res.status(404).json({ error: "cpf não cadastrado" });
  }

  return res.json({
    nome: paciente.nome,
    telefone: paciente.telefone.replace(/^55/, ""),
  });
}

export async function confirmarPreferencialHandler(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido" });
  }

  const { confirmar } = req.body ?? {};
  if (typeof confirmar !== "boolean") {
    return res.status(400).json({ error: "confirmar deve ser true ou false" });
  }

  const resultado = await confirmarPreferencial(id, confirmar);
  if ("erro" in resultado) {
    if (resultado.erro === "nao_encontrado") {
      return res.status(404).json({ error: "paciente não encontrado" });
    }
    return res.status(409).json({ error: "paciente não está em conferência" });
  }

  return res.json(resultado.paciente);
}

export async function chamarParaConferenciaHandler(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id inválido" });
  }

  const resultado = await chamarParaConferencia(id);
  if ("erro" in resultado) {
    if (resultado.erro === "nao_encontrado") {
      return res.status(404).json({ error: "paciente não encontrado" });
    }
    return res.status(409).json({ error: "paciente não está aguardando conferência" });
  }

  return res.json(resultado.paciente);
}
