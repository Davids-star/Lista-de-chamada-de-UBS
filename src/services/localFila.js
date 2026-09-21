import { reactive } from "vue";

// Versão 100% estática (sem backend) da fila — pensada pra rodar em hospedagem
// estática (GitHub Pages). Guarda tudo no localStorage do navegador e mantém
// abas/telas abertas sincronizadas via evento "storage".
const STORAGE_KEY = "filaFacilDemo.pacientes";

function carregar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const state = reactive({
  pacientes: carregar(),
});

function persistir() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.pacientes));
}

// Outra aba/dispositivo (mesmo navegador) alterou a fila — atualiza aqui também.
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) {
    state.pacientes = event.newValue ? JSON.parse(event.newValue) : [];
  }
});

function proximoId() {
  return state.pacientes.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

function sanitizePhone(telefone) {
  const digits = String(telefone || "").replace(/\D/g, "");
  return digits.length === 11 ? `55${digits}` : digits;
}

function validar(dados) {
  const nome = (dados.nome || "").trim();
  const cpf = (dados.cpf || "").replace(/\D/g, "");
  const telefone = sanitizePhone(dados.telefone);
  const tipoAtendimento = (dados.tipoAtendimento || "").trim();
  const motivo = (dados.motivo || "").trim();

  if (!nome) return { error: "nome é obrigatório" };
  if (cpf.length !== 11) return { error: "cpf inválido" };
  if (telefone.length !== 13) return { error: "telefone inválido" };
  if (!tipoAtendimento) return { error: "tipoAtendimento é obrigatório" };
  if (!motivo) return { error: "motivo é obrigatório" };

  return { data: { nome, cpf, telefone, tipoAtendimento, motivo } };
}

export function criarPaciente(dados) {
  const resultado = validar(dados);
  if ("error" in resultado) {
    return Promise.reject(new Error(resultado.error));
  }

  const solicitouPreferencial = !!dados.prioritario;
  const tipoPreferencial = solicitouPreferencial
    ? (dados.tipoPreferencial || "").trim()
    : "";

  const paciente = {
    id: proximoId(),
    ...resultado.data,
    senha: state.pacientes.length + 1,
    status: "em_espera",
    criadoEm: new Date().toISOString(),
    atendidoEm: null,
    // null = pedido de preferencial aguardando confirmação da recepção
    solicitouPreferencial,
    tipoPreferencial:
      tipoPreferencial === "Outro"
        ? `Outro: ${(dados.outraCondicao || "").trim()}`
        : tipoPreferencial,
    prioritario: solicitouPreferencial ? null : false,
  };

  state.pacientes.push(paciente);
  persistir();
  return Promise.resolve({ ...paciente });
}

// Recepção confirma (ou nega) o pedido de atendimento preferencial.
export function validarPreferencial(id, aprovado) {
  const paciente = state.pacientes.find((p) => p.id === Number(id));
  if (!paciente) {
    return Promise.reject(new Error("paciente não encontrado"));
  }

  paciente.prioritario = !!aprovado;
  persistir();
  return Promise.resolve({ ...paciente });
}

export function listarFila() {
  return Promise.resolve(state.pacientes.map((p) => ({ ...p })));
}

export function consultarStatus(id) {
  const paciente = state.pacientes.find((p) => p.id === Number(id));
  if (!paciente) {
    return Promise.reject(new Error("paciente não encontrado"));
  }

  const naFrente = state.pacientes.filter(
    (p) => p.status === "em_espera" && p.criadoEm < paciente.criadoEm
  ).length;

  return Promise.resolve({ posicao: naFrente + 1, status: paciente.status });
}

export function alterarStatus(id, status) {
  const paciente = state.pacientes.find((p) => p.id === Number(id));
  if (!paciente) {
    return Promise.reject(new Error("paciente não encontrado"));
  }

  paciente.status = status;
  if (status === "finalizado") {
    paciente.atendidoEm = new Date().toISOString();
  }

  persistir();
  return Promise.resolve({ ...paciente });
}

export function limparFila() {
  state.pacientes = [];
  persistir();
}
