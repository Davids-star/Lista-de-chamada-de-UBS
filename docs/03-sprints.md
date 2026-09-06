### Sprint 1: Fundação e Modelagem (A Base)

*Nesta sprint, não tem WhatsApp nem Socket. É apenas garantir que o banco existe e que o servidor levanta.*

*  **Tarefa 1.1:** Setup do Node.js/Express e TypeScript.
* **Tarefa 1.2:** Conexão com o Banco de Dados (PostgreSQL + ORM escolhido).
* **Tarefa 1.3:** Criação da Tabela `pacientes` (Migração).
* **Tarefa 1.4:** Validação de Dados (Middlewares). Aqui entra a **tarefa crucial** de limpar e formatar o número de telefone (garantir o DDI `55` e remover `()` e `-`).

### Sprint 2: API Core - O Motor da Fila (Síncrono)

*Aqui a fila funciona perfeitamente, mas no formato antigo (a recepção teria que dar F5 na página).*

* **Tarefa 2.1:** Rota de Cadastro de Senha (`POST /fila`).
* **Tarefa 2.2:** Rota de Leitura para o Painel (`GET /fila`).
* **Tarefa 2.3:** Lógica de Cálculo de Posição. (Quantas pessoas na frente do ID X?).
* **Tarefa 2.4:** Rotas de Ação da Recepção (`PUT /fila/:id/chamar`, `/ausente`, `/finalizar`).

### Sprint 3: Tempo Real (WebSockets)

*Aqui matamos a necessidade do F5. O painel e o celular do paciente atualizam sozinhos.*

* **Tarefa 3.1:** Setup do Socket.io no Express.
* **Tarefa 3.2:** Emissão de evento ao criar senha (atualiza painel).
* **Tarefa 3.3:** Emissão de evento ao chamar paciente (atualiza painel e celular do paciente).

---

### Sprint 4: Mensageria e WhatsApp 
É aqui que o sistema fica "inteligente".

* **Tarefa 4.1: O Módulo Isolado do WhatsApp.**
* Configurar a biblioteca (Baileys/whatsapp-web.js).
* Fazer o console devolver o QR Code.
* Testar envio de mensagem via código (script isolado).


* **Tarefa 4.2: A Conexão WebSocket ↔ WhatsApp.**
* Transmitir o QR Code gerado no Back-end para o Front-end (via Socket.io).
* Emitir alerta pro Front-end quando a conexão (leitura do QR) for bem-sucedida.
* Configurar a **persistência da sessão** (garantir que não pede QR Code de novo se o servidor reiniciar).


* **Tarefa 4.3: Setup da Fila (RabbitMQ).**
* Subir o RabbitMQ localmente (Docker) para desenvolvimento.
* Criar a fila `notificacoes_whatsapp` no código Node.js.


* **Tarefa 4.4: O Gatilho de Negócio (A regra dos "Faltam 3").**
* Atualizar a rota `PUT /fila/:id/chamar`.
* Adicionar a lógica: "Busque quem é o 4º paciente em espera (`OFFSET 3`)."
* Se existir, publique o número dele na fila do RabbitMQ.


* **Tarefa 4.5: O Worker Consumidor.**
* Criar o processo que consome o RabbitMQ, lê o número, formata o texto ("Olá [Nome], faltam 3 pessoas para sua vez!") e dispara via módulo do WhatsApp.