<script setup>
import { ref } from 'vue'
import GuicheAtendente from './components/GuicheAtendente.vue'
import SenhaCliente from './components/SenhaCliente.vue'

const view = ref('guiche')
</script>

<template>
  <div class="view-switcher">
    <button
      type="button"
      :class="{ active: view === 'guiche' }"
      @click="view = 'guiche'"
    >
      Painel do guichê
    </button>
    <button
      type="button"
      :class="{ active: view === 'cliente' }"
      @click="view = 'cliente'"
    >
      Tela do celular
    </button>
  </div>

  <GuicheAtendente v-if="view === 'guiche'" />
  <SenhaCliente v-else />
</template>

<style scoped>
.view-switcher {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 16px;
}

.view-switcher button {
  font-family: inherit;
  border: 1px solid #d9dbd8;
  background: #fff;
  color: #22292a;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}

.view-switcher button.active {
  background: #1b4d3e;
  border-color: #1b4d3e;
  color: #fff;
}
</style>
