import { Status } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  emitirFilaAtualizada,
  emitirStatusAlterado,
} from "../websocket";
import { publicarNotificacaoWhatsApp } from "../messaging/publisher";
import type { CadastroPaciente } from "../utils/validation";

export async function criarPaciente(data: CadastroPaciente) {
  const paciente = await prisma.$transaction(async (tx) => {
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);

    const pacientesHoje = await tx.paciente.count({
      where: { criadoEm: { gte: inicioDoDia } },
    });

    return tx.paciente.create({
      data: { ...data, senha: pacientesHoje + 1 },
    });
  });

  emitirFilaAtualizada(paciente);
  return paciente;
}

export async function listarFila() {
  const inicioDoDia = new Date();
  inicioDoDia.setHours(0, 0, 0, 0);

  return prisma.paciente.findMany({
    where: { criadoEm: { gte: inicioDoDia } },
    orderBy: { criadoEm: "asc" },
  });
}

export async function calcularPosicao(id: number) {
  const paciente = await prisma.paciente.findUnique({ where: { id } });
  if (!paciente) return null;

  const naFrente = await prisma.paciente.count({
    where: { status: "em_espera", criadoEm: { lt: paciente.criadoEm } },
  });

  return { posicao: naFrente + 1, status: paciente.status };
}

export async function alterarStatus(id: number, status: Status) {
  const paciente = await prisma.paciente.findUnique({ where: { id } });
  if (!paciente) return null;

  const data: { status: Status; atendidoEm?: Date } = { status };
  if (status === "finalizado") data.atendidoEm = new Date();

  const atualizado = await prisma.paciente.update({ where: { id }, data });

  if (status === "em_atendimento") {
    await notificarProximoDaFila();
  }

  emitirStatusAlterado(atualizado);
  return atualizado;
}

async function notificarProximoDaFila() {
  const quarto = await prisma.paciente.findFirst({
    where: { status: "em_espera" },
    orderBy: { criadoEm: "asc" },
    skip: 3,
  });

  if (quarto) {
    publicarNotificacaoWhatsApp({
      telefone: quarto.telefone,
      nome: quarto.nome,
      pessoasNaFrente: 3,
    });
  }
}