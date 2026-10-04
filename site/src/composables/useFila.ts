import { computed, onMounted, onUnmounted, ref } from 'vue'
import { filaApi } from '@/services/api'
import { getSocket } from '@/services/socket'
import type { Paciente } from '@/types/fila'
import { mensagemDeErro } from '@/utils/senha'

/** Estado da fila do painel da recepção, mantido em tempo real via Socket.io. */
export function useFila() {
  const pacientes = ref<Paciente[]>([])
  const carregando = ref(true)
  const erro = ref<string | null>(null)
  const socket = getSocket()

  const emAtendimento = computed(() => pacientes.value.find((p) => p.status === 'em_atendimento') ?? null)

  const aguardando = computed(() =>
    pacientes.value
      .filter((p) => p.status === 'em_espera')
      .sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime()),
  )

  const aguardandoConfirmacao = computed(() =>
    pacientes.value
      .filter((p) => p.status === 'aguardando_confirmacao')
      .sort((a, b) => new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime()),
  )

  const emConferencia = computed(() => pacientes.value.find((p) => p.status === 'em_conferencia') ?? null)

  const comuns = computed(() => aguardando.value.filter((p) => !p.preferencial))
  const preferenciais = computed(() => aguardando.value.filter((p) => p.preferencial))

  function atualizar(paciente: Paciente) {
    const indice = pacientes.value.findIndex((p) => p.id === paciente.id)
    if (indice >= 0) {
      pacientes.value[indice] = paciente
    } else {
      pacientes.value.push(paciente)
    }
  }

  async function carregar() {
    carregando.value = true
    try {
      pacientes.value = await filaApi.listar()
      erro.value = null
    } catch (e) {
      erro.value = mensagemDeErro(e)
    } finally {
      carregando.value = false
    }
  }

  onMounted(() => {
    carregar()
    socket.on('fila_atualizada', atualizar)
    socket.on('status_alterado', atualizar)
    socket.on('connect', carregar)
  })

  onUnmounted(() => {
    socket.off('fila_atualizada', atualizar)
    socket.off('status_alterado', atualizar)
    socket.off('connect', carregar)
  })

  return {
    pacientes,
    carregando,
    erro,
    emAtendimento,
    aguardandoConfirmacao,
    emConferencia,
    comuns,
    preferenciais,
    carregar,
    atualizar,
  }
}
