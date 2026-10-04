<script setup lang="ts">
import type { Paciente } from '@/types/fila'
import { formatarSenha } from '@/utils/senha'

defineProps<{ paciente: Paciente | null }>()
</script>

<template>
  <section class="senha-atual">
    <p class="rotulo">{{ paciente?.status === 'em_conferencia' ? 'Conferência de dados' : 'Senha atual' }}</p>

    <template v-if="paciente?.status === 'em_conferencia'">
      <p class="conferencia">{{ paciente.nome }}</p>
      <span class="tipo preferencial">Preferencial · conferir documentos</span>
      <p class="clinica">{{ paciente.tipoAtendimento }}</p>
    </template>

    <template v-else-if="paciente">
      <p class="codigo" :class="{ preferencial: paciente.preferencial }">{{ formatarSenha(paciente) }}</p>
      <span class="tipo" :class="{ preferencial: paciente.preferencial }">
        {{ paciente.preferencial ? 'Senha preferencial' : 'Senha comum' }}
      </span>
      <p class="clinica">{{ paciente.tipoAtendimento }}</p>
    </template>

    <p v-else class="vazio">Nenhum atendimento em andamento</p>
  </section>
</template>

<style scoped>
.senha-atual {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 330px;
  padding: 24px;
  border-radius: 14px;
  background: var(--verde-claro);
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
  font-size: clamp(5rem, 16vw, 9rem);
  font-weight: 800;
  line-height: 1;
  color: var(--verde-escuro);
}

.conferencia {
  margin: 0;
  font-size: clamp(2.2rem, 6vw, 3.5rem);
  font-weight: 800;
  color: var(--laranja);
}

.codigo.preferencial {
  color: var(--laranja);
}

.tipo {
  padding: 8px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--verde-escuro);
  font-weight: 600;
}

.tipo.preferencial {
  color: var(--laranja);
}

.clinica {
  margin: 0;
  color: var(--cinza-texto);
}

.vazio {
  margin: 0;
  color: var(--cinza-texto);
  font-size: 1.1rem;
}
</style>
