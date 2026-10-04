import type { Paciente } from '@/types/fila'

/** Monta o código exibido na tela, ex.: E025 (comum) ou P003 (preferencial). */
export function formatarSenha(paciente: Paciente): string {
  if (paciente.senha === null) return '---'
  const prefixo = paciente.preferencial ? 'P' : 'E'
  return `${prefixo}${String(paciente.senha).padStart(3, '0')}`
}

export function mensagemDeErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Algo deu errado. Tente novamente.'
}
