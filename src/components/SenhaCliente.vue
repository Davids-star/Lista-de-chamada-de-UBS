<script setup>
import { computed, reactive, ref } from "vue";
import { alterarStatus, criarPaciente, state } from "../services/localFila";

const STORAGE_KEY = "filaFacilDemo.meuPaciente";
const NOTIFY_THRESHOLD = 3; // mesma regra do backend real (aviso aos 3 antes)
const MOTIVO_MAX_LENGTH = 200;

const clinicName = "Nome da clínica";

const form = reactive({
  nome: "",
  cpf: "",
  telefone: "",
  tipoAtendimento: "Clínico Geral",
  motivo: "",
  prioritario: false,
  tipoPreferencial: "",
  outraCondicao: "",
});
const enviando = ref(false);
const erroForm = ref("");

const meuId = ref(carregarLocal());

const paciente = computed(
  () => state.pacientes.find((p) => p.id === meuId.value) || null
);

// Pedido de preferencial ainda não confirmado pela recepção.
const aguardandoValidacao = computed(
  () =>
    paciente.value?.solicitouPreferencial && paciente.value?.prioritario === null
);

const posicao = computed(() => {
  if (!paciente.value || paciente.value.status !== "em_espera") return null;
  const naFrente = state.pacientes.filter(
    (p) =>
      p.status === "em_espera" &&
      p.prioritario === paciente.value.prioritario &&
      p.criadoEm < paciente.value.criadoEm
  ).length;
  return naFrente + 1;
});

const peopleAhead = computed(() => {
  if (posicao.value == null) return null;
  return Math.max(posicao.value - 1, 0);
});

const chamando = computed(
  () =>
    state.pacientes.find(
      (p) =>
        p.status === "em_atendimento" &&
        p.prioritario === (paciente.value?.prioritario ?? false)
    )?.senha ?? null
);

const isAlmostYourTurn = computed(
  () =>
    paciente.value?.status === "em_espera" &&
    peopleAhead.value !== null &&
    peopleAhead.value <= NOTIFY_THRESHOLD
);

const motivoCount = computed(() => form.motivo.length);
const motivoPercent = computed(() =>
  Math.min(100, (motivoCount.value / MOTIVO_MAX_LENGTH) * 100)
);
const motivoNoLimite = computed(() => motivoCount.value >= MOTIVO_MAX_LENGTH);

const podeCancelar = computed(() => paciente.value?.status === "em_espera");
const podeGerarNova = computed(
  () =>
    paciente.value?.status === "finalizado" ||
    paciente.value?.status === "ausente"
);

const geradaAs = computed(() => {
  if (!paciente.value?.criadoEm) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(
    new Date(paciente.value.criadoEm)
  );
});

function carregarLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? Number(raw) : null;
}

function salvarLocal(id) {
  localStorage.setItem(STORAGE_KEY, String(id));
}

function limparLocal() {
  localStorage.removeItem(STORAGE_KEY);
}

async function retirarSenha() {
  erroForm.value = "";
  enviando.value = true;
  try {
    const novoPaciente = await criarPaciente({ ...form });
    meuId.value = novoPaciente.id;
    salvarLocal(novoPaciente.id);
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
  await alterarStatus(paciente.value.id, "ausente");
  limparLocal();
  meuId.value = null;
  resetarFormulario();
}

function novaSenha() {
  limparLocal();
  meuId.value = null;
  resetarFormulario();
}

function resetarFormulario() {
  form.nome = "";
  form.cpf = "";
  form.telefone = "";
  form.tipoAtendimento = "Clínico Geral";
  form.motivo = "";
  form.prioritario = false;
  form.tipoPreferencial = "";
  form.outraCondicao = "";
}
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
          <input
            v-model="form.nome"
            type="text"
            placeholder="Ex: Maria da Silva Souza"
            required
          />
        </label>
        <label class="field">
          <span>CPF (somente números)</span>
          <input
            v-model="form.cpf"
            type="text"
            inputmode="numeric"
            maxlength="11"
            autocomplete="off"
            placeholder="Ex: 12345678909"
            required
          />
        </label>
        <label class="field">
          <span>Telefone/WhatsApp</span>
          <input
            v-model="form.telefone"
            type="tel"
            placeholder="Ex: (11) 98765-4321"
            required
          />
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
          <textarea
            v-model="form.motivo"
            :maxlength="MOTIVO_MAX_LENGTH"
            rows="2"
            placeholder="Ex: Consulta de rotina e exames"
            required
          ></textarea>
          <div
            class="field__counter"
            :class="{
              'field__counter--visible': motivoCount > 0,
              'field__counter--limit': motivoNoLimite,
            }"
          >
            <div class="field__counter-track">
              <div
                class="field__counter-fill"
                :style="{ width: motivoPercent + '%' }"
              ></div>
            </div>
            <span class="field__counter-text"
              >{{ motivoCount }}/{{ MOTIVO_MAX_LENGTH }}</span
            >
          </div>
        </label>

        <label class="field field--checkbox">
          <input type="checkbox" v-model="form.prioritario" />
          <span>Atendimento preferencial</span>
        </label>

        <template v-if="form.prioritario">
          <label class="field">
            <span>Qual a condição?</span>
            <select v-model="form.tipoPreferencial" required>
              <option value="" disabled>Selecione uma opção</option>
              <option>Idoso (60 anos ou mais)</option>
              <option>Gestante</option>
              <option>Pessoa com deficiência (PCD)</option>
              <option>Outro</option>
            </select>
          </label>

          <label v-if="form.tipoPreferencial === 'Outro'" class="field">
            <span>Qual a sua condição?</span>
            <input
              v-model="form.outraCondicao"
              type="text"
              placeholder="Descreva a condição"
              required
            />
          </label>
        </template>

        <button class="btn-submit" type="submit" :disabled="enviando">
          {{ enviando ? "Enviando..." : "Retirar senha" }}
        </button>
      </form>

      <template v-else>
        <section class="ticket-card">
          <span class="ticket-card__label">Sua senha</span>
          <span class="ticket-card__value">{{ paciente.senha }}</span>
        </section>

        <div v-if="aguardandoValidacao" class="notice notice--alert">
          Aguardando a recepção confirmar seu atendimento preferencial...
        </div>
        <div
          v-else-if="paciente.status === 'em_atendimento'"
          class="notice notice--alert"
        >
          É a sua vez! Dirija-se ao guichê.
        </div>
        <div v-else-if="paciente.status === 'finalizado'" class="notice">
          Atendimento concluído. Obrigado!
        </div>
        <div v-else-if="paciente.status === 'ausente'" class="notice">
          Sua senha foi encerrada.
        </div>
        <template v-else>
          <div
            v-if="paciente.solicitouPreferencial"
            class="notice"
            :class="paciente.prioritario ? 'notice--alert' : ''"
          >
            {{
              paciente.prioritario
                ? "Atendimento preferencial confirmado pela recepção!"
                : "Seu pedido de preferencial não foi confirmado — você segue na fila comum."
            }}
          </div>

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

$color-border: #000000;
$color-limit: #b3261e;

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
  select,
  textarea {
    font-family: inherit;
    font-size: 14px;
    color: $color-text;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    padding: 10px 12px;
    background: #fff;
    transition: border-color 0.2s ease;

    &:focus {
      outline: 2px solid $color-primary;
      outline-offset: 1px;
    }
  }

  input[type="checkbox"] {
    appearance: auto;
    -webkit-appearance: checkbox;
    width: 16px;
    height: 16px;
    min-width: 16px;
    padding: 0;
    margin: 0;
    border: initial;
    border-radius: initial;
    background: initial;
  }

  textarea {
    resize: none;
    line-height: 1.4;
  }
}

.field--checkbox {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: $color-text;

  input {
    width: auto;
    margin: 0;
  }
}

.field__hint {
  margin: -6px 0 0;
  font-size: 11px;
  color: $color-text-muted;
}

// -- Contador do campo Motivo ------------------------------------------------
.field__counter {
  display: flex;
  align-items: center;
  gap: 8px;
  max-height: 0;
  opacity: 0;
  transform: translateY(-4px);
  overflow: hidden;
  transition: max-height 0.25s ease, opacity 0.25s ease, transform 0.25s ease;

  &--visible {
    max-height: 20px;
    opacity: 1;
    transform: translateY(0);
  }
}

.field__counter-track {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #eceae4;
  overflow: hidden;
}

.field__counter-fill {
  height: 100%;
  background: $color-primary;
  border-radius: 2px;
  transition: width 0.15s ease, background 0.2s ease;
}

.field__counter-text {
  flex-shrink: 0;
  font-size: 11px;
  color: $color-text-muted;
}

.field__counter--limit {
  .field__counter-fill {
    background: $color-limit;
  }

  .field__counter-text {
    color: $color-limit;
    font-weight: 700;
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
