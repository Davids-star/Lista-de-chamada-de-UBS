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
cd fila-facil/api
npm install
```

**2. Configure as variáveis de ambiente**
```bash
cp .env.example .env
```
Edite o `.env` informando a URL de conexão do PostgreSQL local (`DATABASE_URL`) e do RabbitMQ (`RABBITMQ_URL`).

**3. Suba o RabbitMQ** (recomendado via Docker):
```bash
cd api && docker compose up rabbitmq
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

> **Alternativa:** para subir Postgres, API e Site juntos, veja a seção **Rodando com Docker** abaixo.

---

## 🐳 Rodando com Docker (ambiente completo)

Sobe **PostgreSQL**, **API** e **Site** com um único comando. Só precisa do [Docker](https://docs.docker.com/get-docker/) instalado.

```bash
docker compose up --build
```

- Site: http://localhost:8080 (no computador abre o painel; no celular, a retirada de senha)
- API: http://localhost:3000 (health check em `GET /health`)
- Banco Postgres: só na rede interna do compose (não ocupa porta do seu computador).
- As tabelas são criadas automaticamente na primeira subida (migrations).
- Os dados ficam no volume `pgdata`. Para apagar tudo e começar do zero: `docker compose down -v`.

Para parar: `docker compose down`.

> **Acessar de outro aparelho (ex.: celular na mesma rede):** o site grava o endereço da API no build. Troque `VITE_API_URL` no `docker-compose.yml` pelo IP do computador (ex.: `http://192.168.0.10:3000`) e rode `docker compose up --build` de novo.

Para rodar a API fora do Docker (dev local), copie `api/.env.example` para `api/.env` e use sua instância local do PostgreSQL.


---

## 💻 Rodando em outra máquina 
Felipe com o front

Passo a passo para quem recebeu o projeto e quer rodar do zero.

**1. Instale o Docker**
- Windows/Mac: [Docker Desktop](https://docs.docker.com/get-docker/) (abra o programa e espere ele iniciar).
- Linux: instale o Docker Engine e o plugin Compose. Confira com `docker compose version`.

**2. Baixe o projeto**
```bash
git clone https://github.com/Davids-star/Lista-de-chamada-de-UBS.git
cd Lista-de-chamada-de-UBS
```
Se recebeu um `.zip`, descompacte e entre na pasta (a que contém o `docker-compose.yml`).

**3. Suba tudo**
```bash
docker compose up --build
```
A primeira vez demora alguns minutos (baixa as imagens e compila). Está pronto quando aparecer `API Fila Fácil rodando na porta 3000`.

**4. Abra no navegador**

| O quê | Endereço |
|---|---|
| Painel da recepção (computador) | http://localhost:8080/painel |
| Retirar senha | http://localhost:8080/retirar-senha |
| API (teste) | http://localhost:3000/health |

Não precisa instalar Node, PostgreSQL nem criar `.env`: está tudo dentro do Docker.

**5. Testar pelo celular (mesma rede Wi-Fi)**
1. Descubra o IP do computador (`ipconfig` no Windows, `ip a` no Linux, ou nas configurações de rede do Mac), por exemplo `192.168.0.10`.
2. No `docker-compose.yml`, em `site → build → args`, troque `VITE_API_URL` por `http://192.168.0.10:3000`.
3. Rode `docker compose up --build` de novo.
4. No celular, abra `http://192.168.0.10:8080`.

Se não abrir, libere as portas `8080` e `3000` no firewall do computador.

**Comandos úteis**
```bash
docker compose up -d           # sobe em segundo plano
docker compose logs -f api     # acompanha os logs da API
docker compose down            # para tudo (mantém os dados)
docker compose down -v         # para tudo e apaga o banco
```

**Problemas comuns**
- *"port is already allocated"*: algo já usa a porta 3000 ou 8080. Feche o outro programa ou mude a porta à esquerda em `ports:` do `docker-compose.yml` (ex.: `"8081:80"`).
- *Site abre mas não carrega a fila*: o `VITE_API_URL` está com um endereço que o navegador não alcança. Confira o passo 5 e refaça o `--build`.
- *Primeira tela demora*: espere o log mostrar `Banco de dados conectado` antes de abrir o site.
