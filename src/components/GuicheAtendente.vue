<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { alterarStatus, listarFila } from "../services/api";
import { socket } from "../services/socket";

const HISTORICO_LIMITE = 5;

const pacientes = ref([]);
const carregando = ref(true);
const erro = ref("");
const conectado = ref(socket.connected);
const recalling = ref(false);

const emEspera = computed(() =>
  pacientes.value
    .filter((p) => p.status === "em_espera")
    .sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm))
);

const atual = computed(
  () => pacientes.value.find((p) => p.status === "em_atendimento") || null
);

const historico = computed(() =>
  pacientes.value
    .filter((p) => p.status === "finalizado" || p.status === "ausente")
    .sort(
      (a, b) =>
        new Date(b.atendidoEm ?? b.criadoEm) -
        new Date(a.atendidoEm ?? a.criadoEm)
    )
    .slice(0, HISTORICO_LIMITE)
);

const podeChamarProxima = computed(
  () => !!atual.value || emEspera.value.length > 0
);

function upsertPaciente(paciente) {
  const idx = pacientes.value.findIndex((p) => p.id === paciente.id);
  if (idx === -1) {
    pacientes.value.push(paciente);
  } else {
    pacientes.value[idx] = paciente;
  }
}

async function carregarFila() {
  carregando.value = true;
  erro.value = "";
  try {
    pacientes.value = await listarFila();
  } catch (e) {
    erro.value =
      "Não foi possível conectar ao servidor. Verifique se o backend (fila-facil) está rodando.";
  } finally {
    carregando.value = false;
  }
}

// Finaliza quem está em atendimento (se houver) e chama o próximo da espera.
async function chamarProxima() {
  erro.value = "";
  try {
    if (atual.value) {
      await alterarStatus(atual.value.id, "finalizado");
    }
    const proximo = emEspera.value[0];
    if (proximo) {
      await alterarStatus(proximo.id, "em_atendimento");
    }
  } catch (e) {
    erro.value = e.message;
  }
}

// Não existe endpoint de "rechamar" no backend — é só um reforço visual local.
function chamarNovamente() {
  if (!atual.value) return;
  recalling.value = true;
  setTimeout(() => {
    recalling.value = false;
  }, 700);
}

function onConnect() {
  conectado.value = true;
  carregarFila();
}

function onDisconnect() {
  conectado.value = false;
}

onMounted(() => {
  carregarFila();
  socket.on("connect", onConnect);
  socket.on("disconnect", onDisconnect);
  socket.on("fila_atualizada", upsertPaciente);
  socket.on("status_alterado", upsertPaciente);
});

onUnmounted(() => {
  socket.off("connect", onConnect);
  socket.off("disconnect", onDisconnect);
  socket.off("fila_atualizada", upsertPaciente);
  socket.off("status_alterado", upsertPaciente);
});
</script>

<template>
  <div class="app-frame">
    <header class="header">
      <div class="header__info">
        <span class="header__title">Guichê 01 · Unidade Central</span>
        <span
          class="header__subtitle"
          :class="{ 'header__subtitle--offline': !conectado }"
        >
          {{ conectado ? "Conectado" : "Desconectado" }}
        </span>
      </div>
    </header>

    <main class="content">
      <section class="card">
        <h1 class="card__title">Fila do dia</h1>

        <p v-if="erro" class="alert">{{ erro }}</p>

        <div class="calling" :class="{ 'calling--recalling': recalling }">
          <span class="calling__label">Chamando agora</span>
          <div class="calling__grid">
            <div class="calling__field">
              <span class="calling__field-label">Senha</span>
              <span class="calling__field-value">{{
                atual ? atual.senha : "—"
              }}</span>
            </div>
            <div class="calling__divider"></div>
            <div class="calling__field">
              <span class="calling__field-label">Na espera</span>
              <span class="calling__field-value">{{ emEspera.length }}</span>
            </div>
          </div>
        </div>

        <div class="actions">
          <button
            class="btn btn--previous"
            type="button"
            :disabled="!atual"
            @click="chamarNovamente"
          >
            Chamar novamente
          </button>
          <button
            class="btn btn--next"
            type="button"
            :disabled="!podeChamarProxima"
            @click="chamarProxima"
          >
            Chamar próxima
          </button>
        </div>

        <div class="history">
          <p v-if="carregando" class="history__empty">Carregando fila...</p>
          <p v-else-if="historico.length === 0" class="history__empty">
            Nenhum atendimento ainda hoje.
          </p>
          <div class="history__item" v-for="item in historico" :key="item.id">
            {{ item.senha }} ·
            {{ item.status === "ausente" ? "Ausente" : "Atendido" }}
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
// ==========================================================================
// Variáveis — mude aqui as cores, fontes e espaçamentos do protótipo
// ==========================================================================
$color-header-bg: #1b4d3e;
$color-header-text: #ffffff;
$color-header-subtext: rgba(255, 255, 255, 0.7);
$color-offline: #e07a5f;

$color-page-bg: #eceeec;
$color-card-bg: #ffffff;

$color-accent: #e0a458; // laranja (chamar novamente / "chamando agora")
$color-accent-bg: #fdf1e0;
$color-accent-text: #b5651d;

$color-primary: #1b4d3e; // verde escuro (chamar próxima)
$color-primary-text: #ffffff;

$color-text: #22292a;
$color-text-muted: #8a8f8c;

$color-history-bg: #e7e8e5;
$color-history-text: #4b504d;

$color-alert-bg: #fdecec;
$color-alert-text: #b3261e;

$radius-lg: 16px;
$radius-md: 12px;
$radius-sm: 8px;

$frame-width: 380px;

// ==========================================================================
// Frame geral (largura da tela do guichê)
// ==========================================================================
.app-frame {
  width: 100%;
  max-width: $frame-width;
  margin: 32px auto;
  border-radius: $radius-lg;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  font-family: "Segoe UI", "Inter", Arial, sans-serif;
  color: $color-text;
}

button {
  font-family: inherit;
  border: none;
  cursor: pointer;
}

// ==========================================================================
// Header
// ==========================================================================
.header {
  background: $color-header-bg;
  color: $color-header-text;
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.header__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header__title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.header__subtitle {
  font-size: 12px;
  color: $color-header-subtext;
}

.header__subtitle--offline {
  color: $color-offline;
  font-weight: 600;
}

// ==========================================================================
// Conteúdo / Card
// ==========================================================================
.content {
  background: $color-page-bg;
  padding: 20px;
}

.card {
  background: $color-card-bg;
  border-radius: $radius-md;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card__title {
  margin: 0;
  text-align: center;
  font-size: 16px;
  font-weight: 700;
  color: $color-text;
}

.alert {
  margin: 0;
  background: $color-alert-bg;
  color: $color-alert-text;
  border-radius: $radius-sm;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

// -- Bloco "Chamando agora" ------------------------------------------------
.calling {
  background: $color-accent-bg;
  border-radius: $radius-md;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.calling__label {
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: $color-accent-text;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.calling__grid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.calling__field {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.calling__field-label {
  font-size: 11px;
  font-weight: 700;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.calling__field-value {
  font-size: 26px;
  font-weight: 800;
  color: $color-text;
  line-height: 1;
}

.calling__divider {
  width: 1px;
  align-self: stretch;
  background: rgba(0, 0, 0, 0.08);
}

.calling--recalling {
  animation: recall-pulse 0.7s ease;
}

@keyframes recall-pulse {
  0%,
  100% {
    background: $color-accent-bg;
  }
  40% {
    background: $color-accent;
  }
}

// -- Botões de ação ---------------------------------------------------------
.actions {
  display: flex;
  gap: 10px;
}

.btn {
  flex: 1;
  padding: 12px 10px;
  border-radius: $radius-sm;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  transition: filter 0.15s ease, transform 0.1s ease;

  &:hover {
    filter: brightness(0.95);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn--previous {
  background: $color-accent;
  color: $color-primary-text;
}

.btn--next {
  background: $color-primary;
  color: $color-primary-text;
}

// -- Histórico de senhas ------------------------------------------------
.history {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history__item {
  background: $color-history-bg;
  color: $color-history-text;
  border-radius: $radius-sm;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
}

.history__empty {
  margin: 0;
  text-align: center;
  font-size: 12px;
  color: $color-text-muted;
}
</style>
