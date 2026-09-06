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
- [PostgreSQL](https://www.postgresql.org/) (Ou usar via Docker)
- [RabbitMQ](https://www.rabbitmq.com/) (Recomendado usar via Docker)
- [Docker](https://www.docker.com/) (Para facilitar a subida do banco e mensageria)

---

## 🛠️ Como Instalar e Configurar

**1. Clone o repositório**
```bash
git clone [https://github.com/seu-usuario/fila-facil-backend.git](https://github.com/seu-usuario/fila-facil-backend.git)
cd fila-facil-backend
```

# em desenvolvimento