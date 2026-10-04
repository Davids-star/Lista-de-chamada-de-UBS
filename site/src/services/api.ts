import type { NovoPaciente, Paciente, PosicaoFila, StatusPaciente } from '@/types/fila'

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function request<T>(caminho: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${caminho}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const corpo = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(corpo?.error ?? `Erro ${res.status}`)
  }
  return corpo as T
}

export const filaApi = {
  listar: () => request<Paciente[]>('/api/fila'),

  criar: (dados: NovoPaciente) =>
    request<Paciente>('/api/fila', { method: 'POST', body: JSON.stringify(dados) }),

  buscarPorCpf: (cpf: string) =>
    request<{ nome: string; telefone: string }>(`/api/fila/cpf/${cpf}`),

  posicao: (id: number) => request<PosicaoFila>(`/api/fila/${id}/status`),

  chamarParaConferencia: (id: number) =>
    request<Paciente>(`/api/fila/${id}/conferencia`, { method: 'POST' }),

  confirmarPreferencial: (id: number, confirmar: boolean) =>
    request<Paciente>(`/api/fila/${id}/preferencial`, {
      method: 'POST',
      body: JSON.stringify({ confirmar }),
    }),

  chamarNovamente: (id: number) =>
    request<Paciente>(`/api/fila/${id}/chamar`, { method: 'POST' }),

  alterarStatus: (id: number, status: StatusPaciente) =>
    request<Paciente>(`/api/fila/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
}
