## 1. Arquitetura de Endpoints (API HTTP)

### Para o Paciente (Escrita/Consulta)
- `POST /api/fila`: 
  - **Ação:** Recebe dados do formulário, gera senha sequencial do dia.
  - **Efeito Colateral:** Emite evento Socket.io (`fila_atualizada`).
- `GET /api/fila/:id/status`:
  - **Ação:** Calcula a posição relativa (quantos `em_espera` estão na frente deste ID).

### Para a Recepção (Painel)
- `GET /api/fila`: 
  - **Ação:** Lista todos os pacientes do dia ordenados por `criado_em`.
- `PUT /api/fila/:id/status`: 
  - **Ação:** Altera o status (`em_atendimento`, `ausente`, `finalizado`).
  - **Efeitos Colaterais:** 
    1. Emite evento Socket.io (`status_alterado`).
    2. Aciona o gatilho de notificação para RabbitMQ (Ver Regras de Negócio).

---

## 2. Arquitetura de Tempo Real (WebSockets)
Para evitar requisições de *polling* (F5 constante), o servidor Socket.io manterá conexões ativas.

**Eventos Emitidos pelo Servidor:**
- `qr_code_whatsapp`: Envia o QR Code gerado pelo Baileys para a tela da recepção ler.
- `whatsapp_conectado`: Avisa a recepção que a sessão foi validada.
- `fila_atualizada`: Disparado sempre que uma nova senha é gerada.
- `status_alterado`: Disparado sempre que a recepção atende, finaliza ou marca ausência.

---

## 3. Arquitetura de Mensageria e Notificações (RabbitMQ)
O envio de mensagens no WhatsApp **nunca** deve travar o *Event Loop* do Express.

**Fluxo Assíncrono:**
1. A rota HTTP atualiza o banco de dados.
2. A API publica um evento na fila RabbitMQ: `notificacoes_whatsapp` contendo o payload `{ telefone, nome, pessoas_na_frente }`.
3. A API responde HTTP 200 OK imediatamente para o cliente.
4. Um **Worker Process** isolado consome a fila do RabbitMQ e processa o envio usando a biblioteca Baileys.

---

## 4. Regras de Negócio Críticas
- **Gatilho de Notificação (Regra dos 3):** Quando a recepção clica em "Chamar Próximo", o sistema deve buscar no banco quem é o **4º paciente** em status `em_espera` (usando `OFFSET 3`). Este é o paciente que tem exatamente 3 pessoas na frente. O telefone deste paciente é o que vai para o RabbitMQ.
- **Higienização de Telefone:** O DDI `55` deve ser embutido no momento de salvar no banco ou enviar para o WhatsApp. Caracteres especiais devem ser removidos.
- **Isolamento de Sessão:** A pasta de autenticação do Baileys/WhatsApp DEVE ser salva em um diretório persistente para evitar escaneamento repetido de QR Code em todo reinício do servidor.

---

## 7. Topologia de Hospedagem (Nuvem)
- **Front-end:** Vercel.
- **Banco de Dados:** Decidindo
- **Back-end (API + Socket.io + Worker):** Render.com ou Fly.io.


## 8. Estrutura de Pastas

O projeto deve seguir estritamente a separação de responsabilidades definida abaixo.

> **Regra crítica:** NUNCA misture a lógica do WhatsApp ou do RabbitMQ diretamente nos Controllers do Express.

```text
├── src/
│   ├── config/
│   │   └── # Inicialização e configuração de dependências (Prisma, RabbitMQ, Socket.io)
│   │
│   ├── controllers/
│   │   └── # Lógica de entrada e resposta das requisições HTTP (req, res)
│   │
│   ├── routes/
│   │   └── # Declaração dos endpoints e configuração do Express Router
│   │
│   ├── services/
│   │   └── # Regras de negócio e operações que envolvem múltiplos componentes
│   │
│   ├── websocket/
│   │   └── # Handlers e emissão de eventos do Socket.io
│   │
│   ├── messaging/
│   │   ├── publisher.ts
│   │   │   # Publicação de mensagens no RabbitMQ
│   │   │
│   │   └── worker.ts
│   │       # Consumer em background responsável por processar mensagens do RabbitMQ
│   │
│   ├── whatsapp/
│   │   ├── client.ts
│   │   │   # Inicialização, conexão e persistência da sessão do WhatsApp
│   │   │
│   │   └── sender.ts
│   │       # Funções responsáveis pelo envio de mensagens via WhatsApp
│   │
│   ├── utils/
│   │   └── # Funções utilitárias e helpers reutilizáveis
│   │
│   ├── app.ts
│   │   # Configuração do Express, middlewares e rotas
│   │
│   └── server.ts
│       # Ponto de entrada da aplicação HTTP e Socket.io
│
├── prisma/
│   └── schema.prisma
│       # Modelagem do banco de dados
│
└── docs/
    └── # Documentação técnica e documentação de arquitetura
```


## 8.1 Responsabilidades por Diretório

| Diretório | Responsabilidade |
|---|---|
| `config/` | Configuração e inicialização de dependências externas |
| `controllers/` | Receber requisições HTTP e retornar respostas |
| `routes/` | Definir endpoints e associá-los aos Controllers |
| `services/` | Implementar regras de negócio |
| `websocket/` | Gerenciar conexões e eventos do Socket.io |
| `messaging/` | Publicar e consumir mensagens do RabbitMQ |
| `whatsapp/` | Isolar toda a implementação relacionada ao WhatsApp |
| `utils/` | Funções utilitárias e reutilizáveis |
| `prisma/` | Schema e configuração relacionada ao banco de dados |
| `docs/` | Documentação técnica e arquitetural |

---

## 8.2 Regras de Separação

As seguintes regras devem ser respeitadas durante toda a implementação:

- `controllers/` não deve conter regras de negócio complexas.
- `controllers/` não deve acessar diretamente o RabbitMQ.
- `controllers/` não deve acessar diretamente o Baileys ou qualquer biblioteca de WhatsApp.
- `controllers/` não deve gerenciar conexões do Socket.io.
- `services/` deve concentrar as regras de negócio.
- `messaging/` deve concentrar toda a comunicação com o RabbitMQ.
- `whatsapp/` deve concentrar toda a comunicação com o WhatsApp.
- `websocket/` deve concentrar toda a comunicação em tempo real.
- `utils/` deve conter apenas funções genéricas e reutilizáveis.
- O `Worker` deve ser executado de forma independente da API HTTP.
- A implementação deve priorizar baixo acoplamento entre os componentes.
- Cada componente deve possuir uma responsabilidade bem definida.

---

## 8.3 Fluxo Esperado

### 8.3.1 Fluxo de uma Requisição HTTP

Uma requisição HTTP deve seguir, preferencialmente, o seguinte fluxo:

    HTTP Request
         │
         v
      Route
         │
         v
    Controller
         │
         v
      Service
         │
         ├──────────────> Repository / Prisma
         │
         ├──────────────> RabbitMQ Publisher
         │
         └──────────────> WebSocket

O `Controller` deve ser responsável apenas por receber a requisição, delegar o processamento e retornar a resposta.

As regras de negócio devem permanecer no `Service`.

### 8.3.2 Fluxo de Processamento do WhatsApp

O processamento das mensagens do WhatsApp deve ocorrer de forma independente da API HTTP:

    RabbitMQ
        │
        v
      Worker
        │
        v
    WhatsApp Client
        │
        v
    WhatsApp Sender
        │
        v
     WhatsApp

O `Worker` é responsável por consumir as mensagens do RabbitMQ e solicitar o envio através da camada de WhatsApp.

---

## 8.4 Regra de Isolamento

A implementação do WhatsApp deve ser completamente isolada do restante da aplicação.

Nenhum `Controller` ou `Service` deve importar diretamente bibliotecas como Baileys.

### Exemplo Incorreto

    import makeWASocket from "@whiskeysockets/baileys";

    export async function sendNotification(req, res) {
      // Lógica do WhatsApp diretamente no Controller
    }

Nesse caso, o `Controller` está diretamente acoplado à biblioteca do WhatsApp.

### Exemplo Correto

    export async function sendNotification(
      message: WhatsAppNotificationMessage
    ) {
      await whatsappSender.send(message);
    }

A implementação específica do WhatsApp deve permanecer dentro de:

    src/whatsapp/
    ├── client.ts
    └── sender.ts

O mesmo princípio deve ser aplicado ao RabbitMQ.

Nenhum `Controller` deve implementar diretamente a lógica de conexão, publicação ou consumo de mensagens do RabbitMQ.

A comunicação com o RabbitMQ deve ser encapsulada em:

    src/messaging/

---

## 8.5 Objetivos da Separação

A separação das responsabilidades tem como objetivo:

- Reduzir o acoplamento entre os componentes.
- Facilitar a manutenção do código.
- Facilitar a criação de testes unitários e de integração.
- Permitir substituir o Baileys sem alterar as regras de negócio.
- Permitir substituir o RabbitMQ sem alterar os Controllers.
- Evitar que regras de infraestrutura sejam misturadas com regras de negócio.
- Facilitar a evolução e escalabilidade do sistema.
- Tornar o código mais previsível para manutenção humana e geração de código por IA.

> **Regra geral:** cada camada deve conhecer apenas o necessário para executar sua responsabilidade. Implementações específicas de infraestrutura, como WhatsApp, RabbitMQ, PostgreSQL e Socket.io, devem permanecer isoladas em suas respectivas camadas.