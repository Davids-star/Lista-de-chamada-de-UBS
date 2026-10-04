<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import AppHeader from '@/components/common/AppHeader.vue'
import FormRetirada from '@/components/senha/FormRetirada.vue'
import SenhaGerada from '@/components/senha/SenhaGerada.vue'
import { filaApi } from '@/services/api'
import { getSocket } from '@/services/socket'
import type { NovoPaciente, Paciente, PosicaoFila } from '@/types/fila'
import { mensagemDeErro } from '@/utils/senha'

const enviando = ref(false)
const chamadaRecente = ref(false)
const erro = ref<string | null>(null)
const paciente = ref<Paciente | null>(null)
const posicao = ref<PosicaoFila | null>(null)
const socket = getSocket()

async function gerarSenha(dados: NovoPaciente) {
  enviando.value = true
  erro.value = null
  try {
    paciente.value = await filaApi.criar(dados)
    await atualizarPosicao()
  } catch (e) {
    erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}

async function atualizarPosicao() {
  if (!paciente.value) return
  posicao.value = await filaApi.posicao(paciente.value.id)
}

/** Acompanha só o próprio paciente nos eventos globais de status. */
function aoAlterarStatus(atualizado: Paciente) {
  if (paciente.value?.id !== atualizado.id) return
  paciente.value = atualizado
  atualizarPosicao()
}

/** Quando a recepção chama de novo, avisa o paciente na tela e com vibração (se o aparelho suportar). */
function aoChamarNovamente(chamado: Paciente) {
  if (paciente.value?.id !== chamado.id) return
  chamadaRecente.value = true
  navigator.vibrate?.([300, 150, 300])
}

function novaSenha() {
  paciente.value = null
  posicao.value = null
  chamadaRecente.value = false
}

onMounted(() => {
  socket.on('status_alterado', aoAlterarStatus)
  socket.on('senha_chamada', aoChamarNovamente)
})

onUnmounted(() => {
  socket.off('status_alterado', aoAlterarStatus)
  socket.off('senha_chamada', aoChamarNovamente)
})
</script>

<template>
  <div class="pagina">
    <AppHeader subtitulo="Sistema de Atendimento" />

    <main class="conteudo">
      <div class="cartao">
        <template v-if="!paciente">
          <h1>Retirar senha</h1>
          <p class="subtitulo">Preencha seus dados para entrar na fila de atendimento.</p>

          <FormRetirada :enviando="enviando" @enviar="gerarSenha" />
          <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
        </template>

        <SenhaGerada
          v-else
          :paciente="paciente"
          :posicao="posicao"
          :chamada-recente="chamadaRecente"
          @nova-senha="novaSenha"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.pagina {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.conteudo {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 24px 16px;
}

.cartao {
  width: 100%;
  max-width: 460px;
  padding: 28px 24px;
  border-radius: 18px;
  background: var(--branco);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

h1 {
  margin: 0 0 6px;
  font-size: 1.7rem;
  color: var(--verde-escuro);
}

.subtitulo {
  margin: 0 0 24px;
  color: var(--cinza-texto);
}

.erro {
  margin: 16px 0 0;
  color: var(--vermelho);
  font-weight: 600;
}
</style>
