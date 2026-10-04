export type StatusPaciente =
  | 'em_espera'
  | 'em_atendimento'
  | 'ausente'
  | 'finalizado'
  | 'aguardando_confirmacao'
  | 'em_conferencia'
  | 'recusado'

export interface Paciente {
  id: number
  nome: string
  cpf: string
  telefone: string
  tipoAtendimento: string
  motivo: string
  senha: number | null
  status: StatusPaciente
  criadoEm: string
  atendidoEm: string | null
  preferencial?: boolean
}

export interface NovoPaciente {
  nome: string
  cpf: string
  telefone: string
  tipoAtendimento: string
  motivo: string
  preferencial: boolean
}

export interface PosicaoFila {
  posicao: number
  status: StatusPaciente
}
