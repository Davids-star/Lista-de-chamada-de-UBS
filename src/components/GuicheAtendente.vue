<script setup>
import { computed, ref } from "vue";
import { alterarStatus, state, validarPreferencial } from "../services/localFila";

const HISTORICO_LIMITE = 5;

const recalling = ref(false);

// 'comum' | 'preferencial' — qual fila está sendo exibida/chamada agora.
const filtro = ref("comum");

const ehPreferencial = (p) => p.prioritario === true;

// Pedidos de preferencial que o paciente marcou no celular e ainda não
// foram confirmados pela recepção (prioritario === null = pendente).
const pendentes = computed(() =>
  state.pacientes
    .filter((p) => p.solicitouPreferencial && p.prioritario === null)
    .sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm))
);

const emEspera = computed(() =>
  state.pacientes
    .filter(
      (p) => p.status === "em_espera" && ehPreferencial(p) === (filtro.value === "preferencial")
    )
    .sort((a, b) => new Date(a.criadoEm) - new Date(b.criadoEm))
);

const atual = computed(
  () =>
    state.pacientes.find(
      (p) =>
        p.status === "em_atendimento" &&
        ehPreferencial(p) === (filtro.value === "preferencial")
    ) || null
);

// Resumo das duas filas, sempre visível (independente do filtro selecionado).
const atualComum = computed(
  () =>
    state.pacientes.find((p) => p.status === "em_atendimento" && !ehPreferencial(p)) ||
    null
);
const atualPreferencial = computed(
  () =>
    state.pacientes.find((p) => p.status === "em_atendimento" && ehPreferencial(p)) ||
    null
);
const esperandoComum = computed(
  () => state.pacientes.filter((p) => p.status === "em_espera" && !ehPreferencial(p)).length
);
const esperandoPreferencial = computed(
  () => state.pacientes.filter((p) => p.status === "em_espera" && ehPreferencial(p)).length
);

// Aviso discreto no topo — só aparece quando existe uma chamada de preferencial em curso.
const haChamadaPreferencial = computed(() => !!atualPreferencial.value);

const historico = computed(() =>
  state.pacientes
    .filter(
      (p) =>
        (p.status === "finalizado" || p.status === "ausente") &&
        ehPreferencial(p) === (filtro.value === "preferencial")
    )
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

// Finaliza quem está em atendimento (se houver) e chama o próximo da espera.
async function chamarProxima() {
  if (atual.value) {
    await alterarStatus(atual.value.id, "finalizado");
  }
  const proximo = emEspera.value[0];
  if (proximo) {
    await alterarStatus(proximo.id, "em_atendimento");
  }
}

// Reforço visual local — só rechama quem já está em atendimento.
function chamarNovamente() {
  if (!atual.value) return;
  recalling.value = true;
  setTimeout(() => {
    recalling.value = false;
  }, 700);
}

// Recepção confirma (ou nega) o pedido de preferencial vindo do celular.
function confirmarPreferencial(id, aprovado) {
  validarPreferencial(id, aprovado);
}
</script>

<template>
  <div class="app-frame">
    <header class="header">
      <div class="header__info">
        <span class="header__title">Guichê 01 · Unidade Central</span>
        <span class="header__subtitle">Modo demonstração (dados salvos neste navegador)</span>
      </div>
    </header>

    <main class="content">
      <div v-if="haChamadaPreferencial" class="aviso-preferencial">
        🔔 Existe uma chamada para preferencial — Senha
        {{ atualPreferencial.senha }}
      </div>

      <section v-if="pendentes.length > 0" class="card card--pendentes">
        <h2 class="card__title">Confirmar atendimento preferencial</h2>
        <div class="pendente" v-for="p in pendentes" :key="p.id">
          <p class="pendente__texto">
            Senha <strong>{{ p.senha }}</strong> ({{ p.nome }}) pediu
            atendimento preferencial —
            <strong>{{ p.tipoPreferencial || "não informado" }}</strong>.
            Confirmar?
          </p>
          <div class="pendente__acoes">
            <button
              class="btn btn--next"
              type="button"
              @click="confirmarPreferencial(p.id, true)"
            >
              Sim, é preferencial
            </button>
            <button
              class="btn btn--previous"
              type="button"
              @click="confirmarPreferencial(p.id, false)"
            >
              Não, é comum
            </button>
          </div>
        </div>
      </section>

      <section class="card">
        <h1 class="card__title">Fila do dia</h1>
        <p class="card__hint">Toque numa fila abaixo pra escolher quem atender</p>

        <button
          class="calling"
          type="button"
          :class="{
            'calling--active': filtro === 'comum',
            'calling--recalling': recalling && filtro === 'comum',
          }"
          @click="filtro = 'comum'"
        >
          <span class="calling__label">Comum · Chamando agora</span>
          <div class="calling__grid">
            <div class="calling__field">
              <span class="calling__field-label">Senha</span>
              <span class="calling__field-value">{{
                atualComum ? atualComum.senha : "—"
              }}</span>
            </div>
            <div class="calling__divider"></div>
            <div class="calling__field">
              <span class="calling__field-label">Na espera</span>
              <span class="calling__field-value">{{ esperandoComum }}</span>
            </div>
          </div>
        </button>

        <button
          class="calling calling--preferencial"
          type="button"
          :class="{
            'calling--active': filtro === 'preferencial',
            'calling--recalling': recalling && filtro === 'preferencial',
          }"
          @click="filtro = 'preferencial'"
        >
          <span class="calling__label">Preferencial · Chamando agora</span>
          <div class="calling__grid">
            <div class="calling__field">
              <span class="calling__field-label">Senha</span>
              <span class="calling__field-value">{{
                atualPreferencial ? atualPreferencial.senha : "—"
              }}</span>
            </div>
            <div class="calling__divider"></div>
            <div class="calling__field">
              <span class="calling__field-label">Na espera</span>
              <span class="calling__field-value">{{ esperandoPreferencial }}</span>
            </div>
          </div>
        </button>

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
          <p v-if="historico.length === 0" class="history__empty">
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

$color-page-bg: #eceeec;
$color-card-bg: #ffffff;

$color-accent: #e0a458; // laranja (chamar novamente / fila comum)
$color-accent-bg: #fdf1e0;
$color-accent-text: #b5651d;

$color-preferencial: #5b6fd8; // azul (fila preferencial)
$color-preferencial-bg: #eaecfb;
$color-preferencial-text: #3c4aa0;

$color-primary: #1b4d3e; // verde escuro (chamar próxima)
$color-primary-text: #ffffff;

$color-text: #22292a;
$color-text-muted: #8a8f8c;

$color-history-bg: #e7e8e5;
$color-history-text: #4b504d;

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

// ==========================================================================
// Conteúdo / Card
// ==========================================================================
.content {
  background: $color-page-bg;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  letter-spacing: 0.04em;
  color: $color-text;
}

.card__hint {
  margin: -8px 0 0;
  text-align: center;
  font-size: 11px;
  color: $color-text-muted;
}

// -- Aviso discreto de chamada preferencial em curso -------------------------
.aviso-preferencial {
  background: #fff;
  border-left: 3px solid $color-accent;
  color: $color-accent-text;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: $radius-sm;
}

// -- Pedidos de preferencial pendentes de confirmação -----------------------
.card--pendentes {
  border: 2px solid $color-accent;
  background: $color-accent-bg;
}

.pendente {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;

  & + .pendente {
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    padding-top: 12px;
  }
}

.pendente__texto {
  margin: 0;
  font-size: 13px;
  color: $color-text;
}

.pendente__acoes {
  display: flex;
  gap: 8px;
}

// -- Bloco "Chamando agora" ------------------------------------------------
.calling {
  width: 100%;
  background: $color-accent-bg;
  border: 2px solid transparent;
  border-radius: $radius-md;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
  transition: border-color 0.15s ease;

  &--active {
    border-color: $color-accent;
  }
}

.calling--preferencial {
  background: $color-preferencial-bg;

  .calling__label {
    color: $color-preferencial-text;
  }

  &.calling--active {
    border-color: $color-preferencial;
  }
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

.calling--preferencial.calling--recalling {
  animation-name: recall-pulse-preferencial;
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

@keyframes recall-pulse-preferencial {
  0%,
  100% {
    background: $color-preferencial-bg;
  }
  40% {
    background: $color-preferencial;
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
