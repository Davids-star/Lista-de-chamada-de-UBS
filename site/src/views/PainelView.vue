<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AppHeader from '@/components/common/AppHeader.vue'
import ProximasSenhas from '@/components/painel/ProximasSenhas.vue'
import SenhaAtual from '@/components/painel/SenhaAtual.vue'
import { useFila } from '@/composables/useFila'
import { filaApi } from '@/services/api'
import type { Paciente } from '@/types/fila'
import { mensagemDeErro } from '@/utils/senha'

const {
  carregando,
  erro,
  emAtendimento,
  emConferencia,
  aguardandoConfirmacao,
  comuns,
  preferenciais,
  atualizar,
} = useFila()

const abaAtiva = ref<'comum' | 'preferencial'>('comum')
const ocupado = ref(false)
const erroAcao = ref<string | null>(null)

const filaDaAba = computed(() => (abaAtiva.value === 'comum' ? comuns.value : preferenciais.value))
const atual = computed<Paciente | null>(() => emConferencia.value ?? emAtendimento.value)
const mensagemErro = computed(() => erroAcao.value ?? erro.value)

const agora = ref(new Date())
let timer: number | undefined

const horario = computed(() => agora.value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
const data = computed(() =>
  agora.value.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' }),
)

/**
 * Chama o próximo. Preferenciais pendentes têm prioridade: são chamados ao guichê
 * para conferir os dados antes de entrar na fila de consulta.
 */
async function chamarProxima() {
  if (emConferencia.value) return

  await executar(async () => {
    if (emAtendimento.value) {
      atualizar(await filaApi.alterarStatus(emAtendimento.value.id, 'finalizado'))
    }

    const pendente = aguardandoConfirmacao.value[0]
    if (pendente) {
      atualizar(await filaApi.chamarParaConferencia(pendente.id))
      return
    }

    const proximo = filaDaAba.value[0]
    if (proximo) {
      atualizar(await filaApi.alterarStatus(proximo.id, 'em_atendimento'))
    }
  })
}

/** Confirma os dados (paciente recebe senha e entra na fila de consulta) ou recusa a prioridade. */
async function decidirConferencia(confirmar: boolean) {
  const conferido = emConferencia.value
  if (!conferido) return

  await executar(async () => {
    atualizar(await filaApi.confirmarPreferencial(conferido.id, confirmar))
  })
}

/** Marca o atual como ausente e chama o próximo, já que o backend não avança a fila sozinho. */
async function pularSenha() {
  await executar(async () => {
    if (!emAtendimento.value) return
    atualizar(await filaApi.alterarStatus(emAtendimento.value.id, 'ausente'))
    const proximo = filaDaAba.value[0]
    if (proximo) {
      atualizar(await filaApi.alterarStatus(proximo.id, 'em_atendimento'))
    }
  })
}

async function chamarNovamente() {
  await executar(async () => {
    if (!emAtendimento.value) return
    await filaApi.chamarNovamente(emAtendimento.value.id)
  })
}

async function finalizarAtendimento() {
  await executar(async () => {
    if (!emAtendimento.value) return
    atualizar(await filaApi.alterarStatus(emAtendimento.value.id, 'finalizado'))
  })
}

async function executar(acao: () => Promise<void>) {
  ocupado.value = true
  erroAcao.value = null
  try {
    await acao()
  } catch (e) {
    erroAcao.value = mensagemDeErro(e)
  } finally {
    ocupado.value = false
  }
}

onMounted(() => {
  timer = window.setInterval(() => (agora.value = new Date()), 1000)
})

onUnmounted(() => window.clearInterval(timer))
</script>

<template>
  <div class="painel">
    <AppHeader subtitulo="Sistema de Atendimento">
      <div class="relogio">
        <small>{{ data }}</small>
        <strong>{{ horario }}</strong>
      </div>
    </AppHeader>

    <main class="grade">
      <section class="principal">
        <div class="abas" role="tablist">
          <button
            type="button"
            role="tab"
            class="aba"
            :class="{ ativa: abaAtiva === 'comum' }"
            :aria-selected="abaAtiva === 'comum'"
            @click="abaAtiva = 'comum'"
          >
            Senhas comuns ({{ comuns.length }})
          </button>
          <button
            type="button"
            role="tab"
            class="aba preferencial"
            :class="{ ativa: abaAtiva === 'preferencial' }"
            :aria-selected="abaAtiva === 'preferencial'"
            @click="abaAtiva = 'preferencial'"
          >
            Senhas preferenciais ({{ preferenciais.length }})
            <span v-if="aguardandoConfirmacao.length" class="pendentes">
              · {{ aguardandoConfirmacao.length }} a conferir
            </span>
          </button>
        </div>

        <SenhaAtual :paciente="atual" />

        <button
          class="chamar"
          type="button"
          :disabled="ocupado || !!emConferencia || (filaDaAba.length === 0 && aguardandoConfirmacao.length === 0 && !emAtendimento)"
          @click="chamarProxima"
        >
          🔊 Chamar próxima senha
        </button>

        <div v-if="emConferencia" class="secundarios duas">
          <button type="button" class="confirmar" :disabled="ocupado" @click="decidirConferencia(true)">
            Confirmar dados
          </button>
          <button type="button" class="recusar" :disabled="ocupado" @click="decidirConferencia(false)">
            Recusar
          </button>
        </div>

        <div v-else class="secundarios tres">
          <button type="button" :disabled="ocupado || !emAtendimento" @click="chamarNovamente">
            Chamar novamente
          </button>
          <button type="button" :disabled="ocupado || !emAtendimento" @click="pularSenha">Pular senha</button>
          <button type="button" :disabled="ocupado || !emAtendimento" @click="finalizarAtendimento">
            Finalizar atendimento
          </button>
        </div>

        <p v-if="mensagemErro" class="erro" role="alert">{{ mensagemErro }}</p>
        <p v-else-if="carregando" class="aviso">Carregando fila...</p>
      </section>

      <aside class="lateral">
        <ProximasSenhas
          v-if="aguardandoConfirmacao.length"
          titulo="Aguardando conferência de dados"
          :preferencial="true"
          :pacientes="aguardandoConfirmacao"
        />
        <ProximasSenhas titulo="Próximas — Senhas comuns" :preferencial="false" :pacientes="comuns" />
        <ProximasSenhas
          titulo="Próximas — Senhas preferenciais"
          :preferencial="true"
          :pacientes="preferenciais"
        />
      </aside>
    </main>
  </div>
</template>

<style scoped>
.painel {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.relogio {
  text-align: right;
}

.relogio small {
  display: block;
  opacity: 0.85;
}

.relogio strong {
  font-size: 2.4rem;
  line-height: 1;
}

.grade {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(300px, 1fr);
  gap: 20px;
  padding: 24px;
}

.principal {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: 16px;
  background: var(--branco);
}

.abas {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.aba {
  padding: 16px;
  border-radius: 12px;
  background: var(--verde-claro);
  color: var(--verde-escuro);
  font-weight: 700;
  border-bottom: 4px solid transparent;
}

.aba.preferencial {
  background: var(--laranja-claro);
  color: var(--laranja);
}

.aba.ativa {
  border-bottom-color: currentColor;
}

.pendentes {
  font-weight: 600;
}

.chamar {
  padding: 22px;
  border-radius: 14px;
  background: var(--verde-escuro);
  color: var(--branco);
  font-size: 1.6rem;
  font-weight: 700;
}

.secundarios {
  display: grid;
  gap: 12px;
}

.secundarios.tres {
  grid-template-columns: repeat(3, 1fr);
}

.secundarios.duas {
  grid-template-columns: 1fr 1fr;
}

.secundarios button {
  padding: 16px;
  border-radius: 12px;
  background: var(--cinza-fundo);
  color: var(--verde-escuro);
  font-weight: 700;
}

.secundarios button.confirmar {
  background: var(--verde);
  color: var(--branco);
}

.secundarios button.recusar {
  background: var(--vermelho);
  color: var(--branco);
}

.erro {
  margin: 0;
  color: var(--vermelho);
  font-weight: 600;
}

.aviso {
  margin: 0;
  color: var(--cinza-texto);
}

.lateral {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 900px) {
  .grade {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .relogio strong {
    font-size: 1.8rem;
  }
}
</style>
