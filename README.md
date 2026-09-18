# 🏥 Fila Fácil - API & Back-end

> **Sistema de Gestão de Fila por Senha Virtual** desenvolvido para Unidades Básicas de Saúde (UBS) e Clínicas. Projeto de Extensão Universitária (6º Semestre de Sistemas de Informação).

O Back-end do Fila Fácil é responsável por gerenciar a fila de pacientes, fornecer atualizações em tempo real via WebSockets e disparar notificações automatizadas no WhatsApp de forma assíncrona.

---

## 📚 Documentação do Projeto

Para entender as regras de negócio, arquitetura estrutural e o planejamento das entregas, consulte nossa documentação dedicada:

- [📄 Visão Geral e Regras de Negócio](./docs/01-visao-geral.md)
- [🏗️ Arquitetura e Modelagem de Dados](./docs/02-arquitetura.md)
- [🗺️ Roadmap e Sprints (Checklist)](./docs/03-sprints.md)

---

## 🚀 Tecnologias Utilizadas

- **Linguagem:** Node.js com TypeScript
- **Framework:** Express.js
- **Banco de Dados:** PostgreSQL (via Prisma ORM)
- **Tempo Real:** Socket.io
- **Mensageria (Fila de Tarefas):** RabbitMQ
- **Integração WhatsApp:** Baileys
- **Segurança:** Autenticação via JWT (JSON Web Token)

---

## ⚙️ Pré-requisitos

Para rodar este projeto localmente, você precisará ter instalado na sua máquina:
- [Node.js](https://nodejs.org/) (Versão 18 ou superior)
- [PostgreSQL](https://www.postgresql.org/) (instalado localmente)
- [RabbitMQ](https://www.rabbitmq.com/) (Recomendado usar via Docker)

---

## 🛠️ Como baixar e rodar localmente

**1. Clone e instale as dependências**
```bash
git clone [https://github.com/seu-usuario/fila-facil-backend.git](https://github.com/seu-usuario/fila-facil-backend.git)
cd fila-facil-backend
npm install
```

**2. Configure as variáveis de ambiente**
```bash
cp .env.example .env
```
Edite o `.env` informando a URL de conexão do PostgreSQL local (`DATABASE_URL`) e do RabbitMQ (`RABBITMQ_URL`).

**3. Suba o RabbitMQ** (recomendado via Docker):
```bash
docker compose up rabbitmq
```
> Painel de gerenciamento: http://localhost:15672 (usuário/senha: `fila`/`fila`).

**4. Crie o banco de dados e rode as migrações**
```bash
npm run prisma:generate
npm run prisma:migrate
```

**5. Inicie a API e o Worker** (em terminais separados):
```bash
npm run dev        # API + Socket.io em http://localhost:3000
npm run worker     # Consome o RabbitMQ e envia WhatsApp
```

A API estará disponível em `http://localhost:3000` (health check em `GET /health`).

> **Alternativa:** para subir Postgres, RabbitMQ, API e Worker juntos, veja a seção **Rodando com Docker** abaixo.

---

## 🐳 Rodando com Docker (ambiente completo)

Sobe o **PostgreSQL**, **RabbitMQ**, a **API** e o **Worker** com um único comando — ideal para o dev do frontend não precisar instalar nada na máquina:

```bash
docker compose up --build
```

- API: http://localhost:3000 (health check em `GET /health`)
- RabbitMQ (painel): http://localhost:15672 (usuário/senha: `fila`/`fila`)
- Banco Postgres: apenas na rede interna do compose (porta `5432` não é exposta no host, evitando conflito com Postgres local).
- A sessão do WhatsApp (`whatsapp_auth/`) e os dados do banco ficam em volumes Docker persistentes (não se perdem ao reiniciar).

Para rodar a API fora do Docker (dev local), copie `.env.example` para `.env` e use sua instância local do PostgreSQL.

> **Nota:** o Worker abre a sessão do WhatsApp (QR Code via Socket.io). Mensagens do RabbitMQ só são enviadas depois que a sessão for conectada.