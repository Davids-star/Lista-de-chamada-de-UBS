import { sanitizePhone } from "./phone";

export interface CadastroPaciente {
  nome: string;
  cpf: string;
  telefone: string;
  tipoAtendimento: string;
  motivo: string;
  preferencial: boolean;
}

export function validarCadastroPaciente(
  body: Record<string, unknown>
): { data: CadastroPaciente } | { error: string } {
  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  const cpf =
    typeof body.cpf === "string" ? body.cpf.replace(/\D/g, "") : "";
  const telefone =
    typeof body.telefone === "string" ? sanitizePhone(body.telefone) : "";
  const tipoAtendimento =
    typeof body.tipoAtendimento === "string"
      ? body.tipoAtendimento.trim()
      : "";
  const motivo = typeof body.motivo === "string" ? body.motivo.trim() : "";

  if (!nome) return { error: "nome é obrigatório" };
  if (cpf.length !== 11) return { error: "cpf inválido" };
  if (telefone.length !== 13) return { error: "telefone inválido" };
  if (!tipoAtendimento) return { error: "tipoAtendimento é obrigatório" };
  if (!motivo) return { error: "motivo é obrigatório" };

  const preferencial = body.preferencial === true;

  return {
    data: { nome, cpf, telefone, tipoAtendimento, motivo, preferencial },
  };
}