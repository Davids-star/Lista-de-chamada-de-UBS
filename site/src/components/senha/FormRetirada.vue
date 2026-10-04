<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { filaApi } from '@/services/api'
import type { NovoPaciente } from '@/types/fila'

const props = defineProps<{ enviando: boolean }>()
const emit = defineEmits<{ enviar: [dados: NovoPaciente] }>()

const tiposAtendimento = ['Clínica Geral', 'Dentista', 'Enfermagem']

const form = reactive<NovoPaciente>({
  nome: '',
  cpf: '',
  telefone: '',
  tipoAtendimento: tiposAtendimento[0],
  motivo: '',
  preferencial: false,
})

const erroValidacao = ref<string | null>(null)
const buscandoCpf = ref(false)
const cadastroEncontrado = ref(false)

function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** Com o CPF completo, busca cadastro anterior e preenche nome e celular. */
watch(
  () => somenteDigitos(form.cpf),
  async (cpf) => {
    cadastroEncontrado.value = false
    if (cpf.length !== 11) return

    buscandoCpf.value = true
    try {
      const salvo = await filaApi.buscarPorCpf(cpf)
      if (somenteDigitos(form.cpf) !== cpf) return
      form.nome = salvo.nome
      form.telefone = salvo.telefone
      cadastroEncontrado.value = true
    } catch {
      // CPF sem cadastro anterior: segue o preenchimento manual.
    } finally {
      buscandoCpf.value = false
    }
  },
)

function enviar() {
  const cpf = somenteDigitos(form.cpf)
  const telefone = somenteDigitos(form.telefone)

  if (!form.nome.trim()) return (erroValidacao.value = 'Informe seu nome completo.')
  if (cpf.length !== 11) return (erroValidacao.value = 'O CPF deve ter 11 dígitos.')
  if (telefone.length < 10) return (erroValidacao.value = 'Informe um celular com DDD.')
  if (!form.motivo.trim()) return (erroValidacao.value = 'Informe o motivo do atendimento.')

  erroValidacao.value = null
  emit('enviar', { ...form, nome: form.nome.trim(), cpf, telefone, motivo: form.motivo.trim() })
}
</script>

<template>
  <form class="form" @submit.prevent="enviar">
    <div class="campo">
      <label for="nome">Nome completo <span class="obrigatorio">*</span></label>
      <input id="nome" v-model="form.nome" type="text" placeholder="Digite seu nome completo" autocomplete="name" />
    </div>

    <div class="campo">
      <label for="cpf">CPF <span class="obrigatorio">*</span></label>
      <input id="cpf" v-model="form.cpf" type="text" inputmode="numeric" placeholder="000.000.000-00" maxlength="14" />
      <small v-if="buscandoCpf">Buscando seu cadastro...</small>
      <small v-else-if="cadastroEncontrado" class="encontrado">Encontramos seu cadastro. Confira seus dados.</small>
    </div>

    <div class="campo">
      <label for="telefone">Celular (WhatsApp) <span class="obrigatorio">*</span></label>
      <input id="telefone" v-model="form.telefone" type="tel" inputmode="tel" placeholder="(88) 9 0000-0000" />
      <small>Enviaremos sua senha e avisos pelo WhatsApp.</small>
    </div>

    <div class="campo">
      <label for="tipo">Especialidade <span class="obrigatorio">*</span></label>
      <select id="tipo" v-model="form.tipoAtendimento">
        <option v-for="tipo in tiposAtendimento" :key="tipo" :value="tipo">{{ tipo }}</option>
      </select>
    </div>

    <div class="campo">
      <label for="motivo">Motivo do atendimento <span class="obrigatorio">*</span></label>
      <input id="motivo" v-model="form.motivo" type="text" placeholder="Ex.: consulta de rotina" />
    </div>

    <fieldset class="campo">
      <legend>Tipo de atendimento <span class="obrigatorio">*</span></legend>
      <div class="opcoes">
        <label class="opcao" :class="{ ativa: !form.preferencial }">
          <input v-model="form.preferencial" type="radio" name="tipo-senha" :value="false" />
          <span class="titulo">Comum</span>
          <small>Demais atendimentos</small>
        </label>
        <label class="opcao preferencial" :class="{ ativa: form.preferencial }">
          <input v-model="form.preferencial" type="radio" name="tipo-senha" :value="true" />
          <span class="titulo">Preferencial</span>
          <small>Idosos, gestantes, PCD, lactantes, etc.</small>
        </label>
      </div>
    </fieldset>

    <p v-if="erroValidacao" class="erro" role="alert">{{ erroValidacao }}</p>

    <button class="enviar" type="submit" :disabled="props.enviando">
      {{ props.enviando ? 'Gerando senha...' : 'Gerar minha senha' }}
    </button>

    <div class="aviso">
      <strong>Você receberá sua senha</strong>
      <span>e informações sobre sua posição na fila diretamente no seu WhatsApp.</span>
    </div>
  </form>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  border: none;
}

label,
legend {
  font-weight: 600;
  color: #1c2a27;
  padding: 0;
  margin-bottom: 6px;
}

.encontrado {
  color: var(--verde);
  font-weight: 600;
}

.obrigatorio {
  color: var(--vermelho);
}

input,
select {
  padding: 12px 14px;
  border: 1px solid var(--cinza-borda);
  border-radius: 10px;
  background: var(--branco);
  color: #1c2a27;
}

input:focus,
select:focus {
  outline: 2px solid var(--verde);
  outline-offset: 1px;
}

small {
  color: var(--cinza-texto);
  font-size: 0.85rem;
}

.opcoes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.opcao {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border: 1px solid var(--cinza-borda);
  border-radius: 12px;
  cursor: pointer;
  margin: 0;
  font-weight: 400;
}

.opcao input {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 18px;
  height: 18px;
  accent-color: var(--verde-escuro);
}

.opcao.ativa {
  border-color: var(--verde);
  background: var(--verde-claro);
}

.opcao.preferencial .titulo {
  color: var(--laranja);
}

.titulo {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--verde-escuro);
}

.erro {
  margin: 0;
  color: var(--vermelho);
  font-weight: 600;
}

.enviar {
  padding: 16px;
  border-radius: 12px;
  background: var(--verde-escuro);
  color: var(--branco);
  font-size: 1.1rem;
  font-weight: 700;
}

.aviso {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border-radius: 12px;
  background: var(--verde-claro);
  color: #1c2a27;
}

.aviso span {
  color: var(--cinza-texto);
}
</style>
