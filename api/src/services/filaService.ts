import { Prisma, Status, type Paciente } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  emitirFilaAtualizada,
  emitirSenhaChamada,
  emitirStatusAlterado,
} from "../websocket";
import { publicarNotificacaoWhatsApp } from "../messaging/publisher";
import type { CadastroPaciente } from "../utils/validation";

/** Quantas pessoas à frente disparam um aviso de aproximação no WhatsApp. */
const AVISOS_DE_APROXIMACAO = [3, 2, 1];

function inicioDoDia() {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

/** Próximo número de senha do dia. Só conta quem já recebeu senha. */
async function proximaSenha(tx: Prisma.TransactionClient) {
  const emitidas = await tx.paciente.count({
    where: { senha: { not: null }, criadoEm: { gte: inicioDoDia() } },
  });
  return emitidas + 1;
}

/**
 * Preferencial entra como `aguardando_confirmacao`, sem senha, até a recepção confirmar.
 * Comum recebe senha e entra na fila na hora.
 */
export async function criarPaciente(data: CadastroPaciente) {
  const paciente = await prisma.$transaction(async (tx) => {
    if (data.preferencial) {
      return tx.paciente.create({
        data: { ...data, status: "aguardando_confirmacao" },
      });
    }

    return tx.paciente.create({
      data: { ...data, senha: await proximaSenha(tx) },
    });
  });

  emitirFilaAtualizada(paciente);
  await notificarFila();
  return paciente;
}

export type ResultadoConfirmacao =
  | { paciente: Paciente }
  | { erro: "nao_encontrado" | "nao_esta_em_conferencia" };

/** Chama o preferencial pendente ao guichê para conferir os dados. */
export async function chamarParaConferencia(id: number) {
  const paciente = await prisma.paciente.findUnique({ where: { id } });
  if (!paciente) return { erro: "nao_encontrado" as const };
  if (paciente.status !== "aguardando_confirmacao") {
    return { erro: "nao_esta_aguardando" as const };
  }

  const atualizado = await prisma.paciente.update({
    where: { id },
    data: { status: "em_conferencia" },
  });

  publicarNotificacaoWhatsApp({
    tipo: "conferencia",
    telefone: atualizado.telefone,
    nome: atualizado.nome,
  });
  emitirStatusAlterado(atualizado);
  return { paciente: atualizado };
}

/** Após a conferência no guichê, confirma os dados (paciente entra na fila com senha) ou recusa. */
export async function confirmarPreferencial(
  id: number,
  confirmar: boolean
): Promise<ResultadoConfirmacao> {
  const paciente = await prisma.paciente.findUnique({ where: { id } });
  if (!paciente) return { erro: "nao_encontrado" };
  if (paciente.status !== "em_conferencia") {
    return { erro: "nao_esta_em_conferencia" };
  }

  const atualizado = await prisma.$transaction(async (tx) => {
    if (!confirmar) {
      return tx.paciente.update({ where: { id }, data: { status: "recusado" } });
    }
    return tx.paciente.update({
      where: { id },
      data: { status: "em_espera", senha: await proximaSenha(tx) },
    });
  });

  emitirStatusAlterado(atualizado);
  await notificarFila();
  return { paciente: atualizado };
}

/** Registro mais recente do CPF: é dele que saem nome e telefone para preencher o cadastro. */
export function buscarUltimoPorCpf(cpf: string) {
  return prisma.paciente.findFirst({
    where: { cpf },
    orderBy: { criadoEm: "desc" },
  });
}

export async function listarFila() {
  return prisma.paciente.findMany({
    where: { criadoEm: { gte: inicioDoDia() } },
    orderBy: { criadoEm: "asc" },
  });
}

export async function calcularPosicao(id: number) {
  const paciente = await prisma.paciente.findUnique({ where: { id } });
  if (!paciente) return null;

  const naFrente = await prisma.paciente.count({
    where: {
      status: "em_espera",
      criadoEm: { gte: inicioDoDia(), lt: paciente.criadoEm },
    },
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
    publicarNotificacaoWhatsApp({
      tipo: "vez",
      telefone: atualizado.telefone,
      nome: atualizado.nome,
    });
  }

  emitirStatusAlterado(atualizado);
  await notificarFila();
  return atualizado;
}

export type ResultadoChamada =
  | { paciente: Paciente }
  | { erro: "nao_encontrado" | "nao_esta_em_atendimento" };

/** Chama de novo quem já está em atendimento: avisa a tela do paciente e manda WhatsApp. */
export async function chamarNovamente(id: number): Promise<ResultadoChamada> {
  const paciente = await prisma.paciente.findUnique({ where: { id } });
  if (!paciente) return { erro: "nao_encontrado" };
  if (paciente.status !== "em_atendimento") {
    return { erro: "nao_esta_em_atendimento" };
  }

  publicarNotificacaoWhatsApp({
    tipo: "chamada_novamente",
    telefone: paciente.telefone,
    nome: paciente.nome,
  });
  emitirSenhaChamada(paciente);

  return { paciente };
}

/**
 * Percorre quem está aguardando e avisa quem chegou a 3, 2 ou 1 pessoa à frente.
 * `ultimoAvisoFila` garante que cada faixa seja avisada só uma vez por paciente.
 */
async function notificarFila() {
  const aguardando = await prisma.paciente.findMany({
    where: { status: "em_espera", criadoEm: { gte: inicioDoDia() } },
    orderBy: { criadoEm: "asc" },
  });

  for (const [pessoasNaFrente, paciente] of aguardando.entries()) {
    if (!AVISOS_DE_APROXIMACAO.includes(pessoasNaFrente)) continue;

    const jaAvisadoNessaFaixa =
      paciente.ultimoAvisoFila !== null &&
      pessoasNaFrente >= paciente.ultimoAvisoFila;
    if (jaAvisadoNessaFaixa) continue;

    await prisma.paciente.update({
      where: { id: paciente.id },
      data: { ultimoAvisoFila: pessoasNaFrente },
    });

    publicarNotificacaoWhatsApp({
      tipo: "fila",
      telefone: paciente.telefone,
      nome: paciente.nome,
      pessoasNaFrente,
    });
  }
}
