<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import {
  alterarStatus,
  consultarStatus,
  criarPaciente,
  listarFila,
} from "../services/api";
import { socket } from "../services/socket";

const STORAGE_KEY = "filaFacil.paciente";
const NOTIFY_THRESHOLD = 3; // mesma regra do backend (aviso de WhatsApp aos 3 antes)
const REFRESH_INTERVAL_MS = 15000;

const clinicName = "Nome da clínica";

const form = reactive({
  nome: "",
  cpf: "",
  telefone: "",
  tipoAtendimento: "Clínico Geral",
  motivo: "",
});
const enviando = ref(false);
const erroForm = ref("");

const paciente = ref(null); // { id, senha, criadoEm }
const status = ref(null); // em_espera | em_atendimento | ausente | finalizado
const posicao = ref(null);
const chamando = ref(null); // senha em atendimento no momento (global)
const erro = ref("");
const carregando = ref(false);

let refreshTimer = null;

const peopleAhead = computed(() => {
  if (posicao.value == null) return null;
  return Math.max(posicao.value - 1, 0);
});

const isAlmostYourTurn = computed(
  () =>
    status.value === "em_espera" &&
    peopleAhead.value !== null &&
    peopleAhead.value <= NOTIFY_THRESHOLD
);

const podeCancelar = computed(() => status.value === "em_espera");
const podeGerarNova = computed(
  () => status.value === "finalizado" || status.value === "ausente"
);

const geradaAs = computed(() => {
  if (!paciente.value?.criadoEm) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(
    new Date(paciente.value.criadoEm)
  );
});

function salvarLocal(p) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}
function limparLocal() {
  localStorage.removeItem(STORAGE_KEY);
}
function carregarLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function atualizarStatus() {
  if (!paciente.value) return;
  try {
    const resultado = await consultarStatus(paciente.value.id);
    status.value = resultado.status;
    posicao.value = resultado.posicao;
    erro.value = "";
  } catch {
    erro.value = "Não foi possível atualizar sua senha. Verifique sua conexão.";
  }
}

async function atualizarChamando() {
  try {
    const fila = await listarFila();
    const emAtendimento = fila.find((p) => p.status === "em_atendimento");
    chamando.value = emAtendimento ? emAtendimento.senha : null;
  } catch {
    // não é crítico pra experiência do paciente — ignora silenciosamente
  }
}

async function retirarSenha() {
  erroForm.value = "";
  enviando.value = true;
  try {
    const novoPaciente = await criarPaciente({ ...form });
    paciente.value = {
      id: novoPaciente.id,
      senha: novoPaciente.senha,
      criadoEm: novoPaciente.criadoEm,
    };
    salvarLocal(paciente.value);
    status.value = novoPaciente.status;
    await Promise.all([atualizarStatus(), atualizarChamando()]);
  } catch (e) {
    erroForm.value = e.message;
  } finally {
    enviando.value = false;
  }
}

async function cancelarSenha() {
  if (!paciente.value || !confirm("Deseja realmente cancelar sua senha?")) {
    return;
  }
  try {
    await alterarStatus(paciente.value.id, "ausente");
  } catch (e) {
    erro.value = e.message;
  } finally {
    limparLocal();
    resetarEstado();
  }
}

function novaSenha() {
  limparLocal();
  resetarEstado();
}

function resetarEstado() {
  paciente.value = null;
  status.value = null;
  posicao.value = null;
  erro.value = "";
  form.nome = "";
  form.cpf = "";
  form.telefone = "";
  form.tipoAtendimento = "Clínico Geral";
  form.motivo = "";
}

function onStatusAlterado(p) {
  if (p.status === "em_atendimento") {
    chamando.value = p.senha;
  }
  if (paciente.value && p.id === paciente.value.id) {
    status.value = p.status;
    atualizarStatus();
  } else if (status.value === "em_espera") {
    atualizarStatus();
  }
}

function onFilaAtualizada() {
  if (status.value === "em_espera") {
    atualizarStatus();
  }
}

onMounted(async () => {
  const salvo = carregarLocal();
  if (salvo) {
    paciente.value = salvo;
    carregando.value = true;
    await atualizarStatus();
    carregando.value = false;
  }
  await atualizarChamando();

  socket.on("status_alterado", onStatusAlterado);
  socket.on("fila_atualizada", onFilaAtualizada);

  refreshTimer = setInterval(() => {
    if (paciente.value) atualizarStatus();
  }, REFRESH_INTERVAL_MS);
});

onUnmounted(() => {
  socket.off("status_alterado", onStatusAlterado);
  socket.off("fila_atualizada", onFilaAtualizada);
  if (refreshTimer) clearInterval(refreshTimer);
});
</script>

<template>
  <div class="phone-frame">
    <header class="header">
      <h1 class="header__title">{{ clinicName }}</h1>
    </header>

    <main class="content">
      <form v-if="!paciente" class="form" @submit.prevent="retirarSenha">
        <p class="form__title">Retirar senha</p>
        <p v-if="erroForm" class="alert">{{ erroForm }}</p>

        <label class="field">
          <span>Nome completo</span>
          <input v-model="form.nome" type="text" required />
        </label>
        <label class="field">
          <span>CPF (somente números)</span>
          <input
            v-model="form.cpf"
            type="text"
            inputmode="numeric"
            maxlength="11"
            required
          />
        </label>
        <label class="field">
          <span>Telefone/WhatsApp</span>
          <input v-model="form.telefone" type="tel" required />
        </label>
        <label class="field">
          <span>Tipo de atendimento</span>
          <select v-model="form.tipoAtendimento">
            <option>Clínico Geral</option>
            <option>Dentista</option>
            <option>Enfermagem</option>
          </select>
        </label>
        <label class="field">
          <span>Motivo</span>
          <input v-model="form.motivo" type="text" required />
        </label>

        <button class="btn-submit" type="submit" :disabled="enviando">
          {{ enviando ? "Enviando..." : "Retirar senha" }}
        </button>
      </form>

      <template v-else>
        <p v-if="erro" class="alert">{{ erro }}</p>
        <p v-if="carregando" class="loading">Carregando...</p>

        <template v-else>
          <section class="ticket-card">
            <span class="ticket-card__label">Sua senha</span>
            <span class="ticket-card__value">{{ paciente.senha }}</span>
          </section>

          <div
            v-if="status === 'em_atendimento'"
            class="notice notice--alert"
          >
            É a sua vez! Dirija-se ao guichê.
          </div>
          <div v-else-if="status === 'finalizado'" class="notice">
            Atendimento concluído. Obrigado!
          </div>
          <div v-else-if="status === 'ausente'" class="notice">
            Sua senha foi encerrada.
          </div>
          <template v-else>
            <div class="info-row">
              <section class="info-card">
                <span class="info-card__value">{{ peopleAhead ?? "—" }}</span>
                <span class="info-card__label">Pessoas na sua frente</span>
              </section>
              <section class="info-card">
                <span class="info-card__value">{{ chamando ?? "—" }}</span>
                <span class="info-card__label">Chamando agora</span>
              </section>
            </div>

            <div class="notice" :class="{ 'notice--alert': isAlmostYourTurn }">
              Avisaremos aqui quando faltarem {{ NOTIFY_THRESHOLD }} Pessoas
              para sua vez
            </div>
          </template>

          <footer class="footer">
            <p v-if="geradaAs" class="footer__validity">
              Senha gerada às {{ geradaAs }}
            </p>
            <button
              v-if="podeCancelar"
              class="footer__cancel"
              type="button"
              @click="cancelarSenha"
            >
              Cancelar Senha
            </button>
            <button
              v-else-if="podeGerarNova"
              class="footer__cancel"
              type="button"
              @click="novaSenha"
            >
              Tirar nova senha
            </button>
          </footer>
        </template>
      </template>
    </main>
  </div>
</template>

<style lang="scss" scoped>
// ==========================================================================
// Variáveis — mude aqui as cores, fontes e espaçamentos da tela
// ==========================================================================
$color-header-bg: #1b4d3e;
$color-header-text: #ffffff;

$color-page-bg: #f4f3ef;
$color-card-bg: #ffffff;

$color-primary: #1b4d3e;

$color-text: #22292a;
$color-text-muted: #7c8280;

$color-notice-bg: #e7e7ea;
$color-notice-text: #55585c;
$color-notice-alert-bg: #fdf1e0;
$color-notice-alert-text: #b5651d;

$color-alert-bg: #fdecec;
$color-alert-text: #b3261e;

$color-border: #dcdcd7;

$radius-lg: 20px;
$radius-md: 14px;
$radius-sm: 10px;

$frame-width: 320px;

// ==========================================================================
// Frame geral (largura da tela do celular)
// ==========================================================================
.phone-frame {
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
  background: none;
}

// ==========================================================================
// Header
// ==========================================================================
.header {
  background: $color-header-bg;
  padding: 22px 20px;
  text-align: center;
}

.header__title {
  margin: 0;
  color: $color-header-text;
  font-size: 17px;
  font-weight: 700;
}

// ==========================================================================
// Conteúdo
// ==========================================================================
.content {
  background: $color-page-bg;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
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

.loading {
  margin: 0;
  text-align: center;
  font-size: 13px;
  color: $color-text-muted;
}

// -- Formulário de retirada de senha ----------------------------------------
.form {
  background: $color-card-bg;
  border-radius: $radius-lg;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form__title {
  margin: 0;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: $color-text-muted;

  input,
  select {
    font-family: inherit;
    font-size: 14px;
    color: $color-text;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    padding: 10px 12px;
    background: #fff;

    &:focus {
      outline: 2px solid $color-primary;
      outline-offset: 1px;
    }
  }
}

.btn-submit {
  margin-top: 4px;
  background: $color-primary;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  padding: 12px;
  border-radius: $radius-sm;
  text-align: center;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// -- Card principal da senha ------------------------------------------------
.ticket-card {
  background: $color-card-bg;
  border-radius: $radius-lg;
  padding: 22px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.ticket-card__label {
  font-size: 13px;
  color: $color-text-muted;
}

.ticket-card__value {
  font-size: 34px;
  font-weight: 800;
  color: $color-primary;
  letter-spacing: 0.02em;
}

// -- Cards de status (pessoas na frente / chamando agora) -------------------
.info-row {
  display: flex;
  gap: 12px;
}

.info-card {
  flex: 1;
  background: $color-card-bg;
  border-top: 3px solid $color-primary;
  border-radius: $radius-md;
  padding: 16px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.info-card__value {
  font-size: 22px;
  font-weight: 800;
  color: $color-primary;
}

.info-card__label {
  font-size: 12px;
  color: $color-text-muted;
}

// -- Aviso ------------------------------------------------------------------
.notice {
  background: $color-notice-bg;
  color: $color-notice-text;
  border-radius: $radius-sm;
  padding: 14px 16px;
  font-size: 13px;
  text-align: center;
  line-height: 1.4;
  transition: background 0.2s ease, color 0.2s ease;
}

.notice--alert {
  background: $color-notice-alert-bg;
  color: $color-notice-alert-text;
  font-weight: 600;
}

// -- Rodapé -------------------------------------------------------------
.footer {
  text-align: center;
  padding-top: 4px;
}

.footer__validity {
  margin: 0 0 6px;
  font-size: 11px;
  color: $color-text-muted;
}

.footer__cancel {
  font-size: 12px;
  color: $color-text-muted;
  text-decoration: underline;

  &:hover {
    color: $color-text;
  }
}
</style>
