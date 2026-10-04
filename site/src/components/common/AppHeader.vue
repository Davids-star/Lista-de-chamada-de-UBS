<script setup lang="ts">
defineProps<{ subtitulo: string }>()
</script>

<template>
  <header class="app-header">
    <div class="marca">
      <span class="logo" aria-hidden="true">+</span>
      <div>
        <strong>UBS São João</strong>
        <small>{{ subtitulo }}</small>
      </div>
    </div>
    <slot />
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 28px;
  background: var(--verde-escuro);
  color: var(--branco);
}

.marca {
  display: flex;
  align-items: center;
  gap: 14px;
}

.marca strong {
  display: block;
  font-size: 1.3rem;
}

.marca small {
  opacity: 0.85;
  font-size: 0.95rem;
}

.logo {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--branco);
  color: var(--verde-escuro);
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
}

@media (max-width: 600px) {
  .app-header {
    padding: 14px 16px;
  }
}
</style>
