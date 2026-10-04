<script setup lang="ts">
import type { Paciente } from '@/types/fila'
import { formatarSenha } from '@/utils/senha'

defineProps<{
  titulo: string
  preferencial: boolean
  pacientes: Paciente[]
}>()
</script>

<template>
  <section class="proximas" :class="{ preferencial }">
    <h2>{{ titulo }}</h2>

    <p v-if="pacientes.length === 0" class="vazio">Nenhuma senha aguardando</p>

    <ul v-else>
      <li v-for="paciente in pacientes.slice(0, 5)" :key="paciente.id">
        <span class="codigo">{{ paciente.senha === null ? paciente.nome : formatarSenha(paciente) }}</span>
        <span class="clinica">{{ paciente.tipoAtendimento }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.proximas {
  padding: 18px;
  border-radius: 14px;
  background: var(--branco);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

h2 {
  margin: 0 0 12px;
  font-size: 1.05rem;
  color: var(--verde-escuro);
}

.proximas.preferencial h2 {
  color: var(--laranja);
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

li {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--cinza-fundo);
}

.proximas.preferencial li {
  background: var(--laranja-claro);
}

.codigo {
  min-width: 96px;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--verde-escuro);
}

.proximas.preferencial .codigo {
  color: var(--laranja);
}

.clinica {
  color: var(--cinza-texto);
}

.vazio {
  margin: 0;
  color: var(--cinza-texto);
}
</style>
