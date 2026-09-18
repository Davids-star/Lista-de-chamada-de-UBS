# Documentação da API Backend para o Frontend

> Guia de integração do Backend do Fila Fácil. Leia os tópicos abaixo para consumir a API HTTP e os eventos WebSocket (Socket.io).

---

## 1. Informações Gerais

- **Base URL (local):** `http://localhost:3000`
- **Base URL (produção):** definir após deploy (Metal/Render/Fly.io).
- **Formato:** JSON (`Content-Type: application/json`).
- **CORS:** liberado para qualquer origem (`*`) — o frontend pode hospedar em qualquer domínio (Vercel).
- **Check de saúde:** `GET /health` → resposta `{"status":"ok"}`.

---

## 2. Modelo de Dados (Paciente)

Toda resposta que representa um paciente tem o seguinte formato:

```json
{
  "id": 1,
  "nome": "Maria Silva",
  "cpf": "12345678900",
  "telefone": "5511987654321",
  "tipoAtendimento": "Clínico Geral",
  "motivo": "Consulta de rotina",
  "senha": 1,
  "status": "em_espera",
  "criadoEm": "2026-09-17T12:00:00.000Z",
  "atendidoEm": null
}
```

### Campos

| Campo | Tipo | Observações |
| :--- | :--- | :--- |
| `id` | number | Identificador único (use nas rotas `/:id`). |
| `nome` | string | Nome completo. |
| `cpf` | string | Apenas 11 dígitos (sem máscara). |
| `telefone` | string | **Higienizado no backend:** DDI `55` + 11 dígitos, sem `()`, `-`, espaço. Ex.: `5511987654321`. |
| `tipoAtendimento` | string | Ex.: "Clínico Geral", "Dentista", "Enfermagem". |
| `motivo` | string | Texto livre. |
| `senha` | number | Número da senha do dia (sequencial, começa em 1). |
| `status` | string | Enum abaixo. |
| `criadoEm` | string (ISO 8601) | Data/hora de entrada na fila. |
| `atendidoEm` | string \| null | Preenchido quando `status = finalizado`. |

### Enum de Status

| Valor | Significado |
| :--- | :--- |
| `em_espera` | Aguardando atendimento (status inicial). |
| `em_atendimento` | Em atendimento ("Chamar Próximo"). |
| `ausente` | Paciente não compareceu quando chamado. |
| `finalizado` | Atendimento encerrado. |

---

## 3. Endpoints HTTP

### 3.1. `POST /api/fila` — Retirada de senha (Paciente)

Cria um novo paciente e gera a senha sequencial do dia.

**Requisição (body):**

```json
{
  "nome": "Maria Silva",
  "cpf": "12345678900",
  "telefone": "(11) 98765-4321",
  "tipoAtendimento": "Clínico Geral",
  "motivo": "Consulta de rotina"
}
```

**Validações (retornam `400` com `{"error":"..."}`):**

- `nome` obrigatório.
- `cpf` obrigatório, deve ter exatamente 11 dígitos.
- `telefone` obrigatório, após higienização deve ter 13 dígitos (DDI 55 + 11).
- `tipoAtendimento` obrigatório.
- `motivo` obrigatório.

**Respostas:**

- `201 Created` → objeto Paciente (veja seção 2). Use `senha` para exibir a senha virtual do paciente.
- `400 Bad Request` → `{"error": "mensagem"}`.

**Exemplo de uso no frontend:**

```js
const res = await fetch(`${API_URL}/api/fila`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nome, cpf, telefone, tipoAtendimento, motivo }),
});
const paciente = await res.json();
```

> Ao criar, o backend emite o evento `fila_atualizada` (ver seção 4).

---

### 3.2. `GET /api/fila` — Lista da fila do dia (Recepção)

Lista todos os pacientes do dia atual, ordenados por `criadoEm` (ordem de chegada).

**Respostas:**

- `200 OK` → array de Paciente (`[]` se a fila estiver vazia).

**Uso no dashboard:** percorra a lista e agrupe pelos campos `status` e `tipoAtendimento`.

> **Atenção:** esta rota atualmente **não exige autenticação** e expõe dados sensíveis (CPF, telefone). A proteção por JWT está planejada (backlog) — não confie nela como segura em produção. Não exiba CPF no painel.

---

### 3.3. `GET /api/fila/:id/status` — Posição na fila (Paciente)

Consulta a posição atual e o status de um paciente específico.

**Resposta `200 OK`:**

```json
{
  "posicao": 2,
  "status": "em_espera"
}
```

- `posicao`: número de pessoas à frente + 1 (considera apenas `em_espera`).
- `status`: status atual do paciente.

**Erros:**

- `400` → `{"error":"id inválido"}` (id não numérico).
- `404` → `{"error":"paciente não encontrado"}`.

---

### 3.4. `PUT /api/fila/:id/status` — Ação da recepção

Altera o status de um paciente. Usada pelo painel para chamar, marcar ausente ou finalizar.

**Requisição (body):**

```json
{
  "status": "em_atendimento"
}
```

`status` aceita apenas: `em_atendimento`, `ausente`, `finalizado`.

**Respostas:**

- `200 OK` → objeto Paciente atualizado.
- `400` → `{"error":"status inválido"}` ou `{"error":"id inválido"}`.
- `404` → `{"error":"paciente não encontrado"}`.

**Como montar o fluxo do painel (a lógica de "qual paciente" é do frontend):**

| Ação | Chamada |
| :--- | :--- |
| **Chamar Próximo** | Pegue o 1º paciente com `status = em_espera` (menor `senha`/`criadoEm`) e envie `PUT .../:id/status` com `"em_atendimento"`. |
| **Marcar Ausente** | Envie `PUT .../:id/status` com `"ausente"` no paciente em atendimento. |
| **Finalizar** | Envie `PUT .../:id/status` com `"finalizado"` no paciente em atendimento. |

**Efeitos colaterais (automáticos no backend):**

- Qualquer alteração emite o evento `status_alterado`.
- **Apenas** o status `em_atendimento` dispara o gatilho de notificação WhatsApp (Regra dos 3): o 4º paciente em `em_espera` recebe "Olá [nome], faltam 3 pessoas para a sua vez!".

> Limitação atual: marcar como `ausente` **não chama automaticamente** o próximo; o painel deve disparar "Chamar Próximo" em seguida.

---

## 4. Tempo Real (WebSocket / Socket.io)

- **Servidor:** mesmo host/porta da API (`http://localhost:3000`).
- **Lib cliente:** `socket.io-client` (versão 4.x compatível).
- Não é necessário `path` customizado.

**Conexão:**

```ts
import { io } from "socket.io-client";

const socket = io(API_URL); // ex.: http://localhost:3000
```

### Eventos emitidos pelo servidor

| Evento | Payload | Quando dispara | Quem usa |
| :--- | :--- | :--- | :--- |
| `fila_atualizada` | Paciente | Nova senha criada (`POST /api/fila`). | Painel da recepção (atualiza a lista). |
| `status_alterado` | Paciente | `PUT /api/fila/:id/status`. | Painel e tela do paciente. |
| `qr_code_whatsapp` | string (QR) | QR Code do WhatsApp disponível para leitura. | Tela da recepção (exibir QR para conectar a sessão). |
| `whatsapp_conectado` | (sem payload) | Sessão do WhatsApp validada. | Tela da recepção (indicar conexão OK). |

**Exemplo de assinatura:**

```ts
socket.on("fila_atualizada", (paciente) => { /* adiciona/refresca na lista */ });
socket.on("status_alterado", (paciente) => { /* atualiza linha do paciente */ });
socket.on("qr_code_whatsapp", (qr) => { /* renderiza o QR */ });
socket.on("whatsapp_conectado", () => { /* marca sessão como conectada */ });
```

> Os eventos de QR são retransmitidos pelo backend a partir do **Worker** (processo separado), portanto podem chegar antes/depois da conexão do frontend; inscreva-se no `connect` para renderizar só quando chegar o dado.

---

## 5. Fluxos Recomendados para o Frontend

### 5.1. Página do Paciente (Retirada de senha + acompanhamento)

1. Abrir link/QR Code → formulário (Nome, CPF, Telefone, Tipo de Atendimento, Motivo).
2. `POST /api/fila` → exibir a senha recebida.
3. Conectar no Socket.io fazendo `join` não é necessário — o paciente acompanha via `GET /api/fila/:id/status` periodicamente ou, se desejado, filterando os eventos gerais (`status_alterado`) pelo seu `id`.

> **Nota:** no momento os eventos emitidos são globais (sem sala por paciente). Para atualização precisa, combine: `GET /:id/status` no load + atualização visual quando `status_alterado.id === paciente.id`.

### 5.2. Painel da Recepção

1. Conectar no Socket.io.
2. `GET /api/fila` para carregar o estado inicial.
3. Manter a lista em tempo real com os eventos `fila_atualizada` e `status_alterado`.
4. Ações: ver tabela da seção 3.4 (Chamar Próximo / Marcar Ausente / Finalizar).
5. Exibir o QR do WhatsApp quando chegar `qr_code_whatsapp`; indicar "conectado" ao receber `whatsapp_conectado`.

---

## 6. Variáveis de Ambiente Relevantes para o Frontend

| Variável | Descrição | Default |
| :--- | :--- | :--- |
| `PORT` | Porta da API. | `3000` |
| `API_URL` | Endereço da API (usado pelo Worker). | `http://localhost:3000` |

O frontend deve ter uma constante configurável (ex.: `VITE_API_URL`) apontando para o backend, e adicionar o domínio do frontend ao CORS quando necessário.

---

## 7. Pendências / Avisos

- **Autenticação:** rotas do painel (`GET /api/fila` e `PUT /api/fila/:id/status`) estão **públicas** no momento. A implementação de JWT está no backlog — planeje o frontend para receber/armazenar um token futuramente e não tratar essas rotas como seguras em produção.
- **Ausente não avança a fila:** "Marcar Ausente" não chama o próximo automaticamente (comportamento atual do backend).
- **Dados sensíveis na listagem:** `GET /api/fila` retorna CPF e telefone — evite renderizá-los no painel.