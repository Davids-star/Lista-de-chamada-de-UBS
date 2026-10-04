<script setup lang="ts">
import type { Paciente, PosicaoFila } from '@/types/fila'
import { formatarSenha } from '@/utils/senha'

defineProps<{ paciente: Paciente; posicao: PosicaoFila | null; chamadaRecente: boolean }>()
defineEmits<{ novaSenha: [] }>()
</script>

<template>
  <section class="gerada">
    <p v-if="chamadaRecente" class="alerta" role="alert">
      Sua senha está sendo chamada! Dirija-se ao guichê.
    </p>

    <template v-if="paciente.status === 'aguardando_confirmacao'">
      <p class="rotulo">Prioridade preferencial</p>
      <p class="posicao">
        Aguarde ser chamado para conferir seus dados. Mantenha esta tela aberta.
      </p>
    </template>

    <template v-else-if="paciente.status === 'em_conferencia'">
      <p class="rotulo">Conferência de dados</p>
      <p class="posicao destaque">
        Você foi chamado para conferir seus documentos. Dirija-se ao guichê.
      </p>
    </template>

    <template v-else-if="paciente.status === 'recusado'">
      <p class="rotulo">Prioridade não confirmada</p>
      <p class="posicao">
        A recepção não confirmou sua prioridade. Procure o atendimento para retirar uma senha comum.
      </p>
    </template>

    <template v-else>
      <p class="rotulo">Sua senha</p>
      <p class="codigo" :class="{ preferencial: paciente.preferencial }">{{ formatarSenha(paciente) }}</p>

      <template v-if="paciente.status === 'em_espera' && posicao">
        <p class="posicao">
          Você está em <strong>{{ posicao.posicao }}º</strong> na fila.
        </p>
      </template>
      <p v-else-if="paciente.status === 'em_atendimento'" class="posicao destaque">
        Sua senha foi chamada. Dirija-se ao guichê.
      </p>
      <p v-else-if="paciente.status === 'ausente'" class="posicao">
        Você foi marcado como ausente. Procure a recepção.
      </p>
      <p v-else-if="paciente.status === 'finalizado'" class="posicao">Atendimento finalizado. Obrigado!</p>

      <p class="aviso">Acompanhe avisos pelo WhatsApp.</p>
    </template>

    <button class="novo" type="button" @click="$emit('novaSenha')">Retirar outra senha</button>
  </section>
</template>

<style scoped>
.gerada {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  text-align: center;
}

.rotulo {
  margin: 0;
  color: var(--cinza-texto);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.codigo {
  margin: 0;
  font-size: 4.5rem;
  font-weight: 800;
  line-height: 1;
  color: var(--verde-escuro);
}

.codigo.preferencial {
  color: var(--laranja);
}

.alerta {
  margin: 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--laranja-claro);
  color: var(--laranja);
  font-weight: 700;
  animation: piscar 1s ease-in-out 3;
}

@keyframes piscar {
  50% {
    opacity: 0.4;
  }
}

.posicao {
  margin: 0;
  font-size: 1.05rem;
}

.destaque {
  color: var(--verde);
  font-weight: 700;
}

.aviso {
  margin: 0;
  color: var(--cinza-texto);
  font-size: 0.9rem;
}

.novo {
  margin-top: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  background: var(--verde-claro);
  color: var(--verde-escuro);
  font-weight: 700;
}
</style>
