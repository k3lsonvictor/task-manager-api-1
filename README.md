# Task Manager API

API REST para gerenciamento colaborativo de projetos e tarefas, construída com NestJS, Prisma e PostgreSQL. O projeto oferece autenticação com access e refresh tokens, confirmação de e-mail, recuperação de senha, organização de tarefas em etapas e eventos em tempo real via Server-Sent Events (SSE).

## Funcionalidades

- Cadastro, confirmação de e-mail e recuperação de senha
- Autenticação com JWT por cookie HTTP-only ou Bearer token
- Rotação de refresh tokens e logout com invalidação da sessão
- Criação e gerenciamento de projetos
- Membros de projeto com papéis `OWNER`, `ADMIN` e `MEMBER`
- Etapas ordenáveis para organizar o fluxo de trabalho
- Tarefas ordenáveis e vinculadas opcionalmente a uma etapa
- Atualizações de projeto em tempo real via SSE
- Envio assíncrono de e-mails com BullMQ, tentativas automáticas e dead-letter queue
- Documentação interativa com Swagger
- Painel administrativo com AdminJS e monitoramento de filas com Bull Board

## Stack técnica

| Categoria | Tecnologias | Uso no projeto |
| --- | --- | --- |
| Linguagem e runtime | TypeScript 5, Node.js | Tipagem, compilação e execução da API |
| Framework | NestJS 11, Express | Estrutura modular, injeção de dependências e servidor HTTP |
| Banco de dados | PostgreSQL 16 | Persistência de usuários, projetos, etapas e tarefas |
| ORM e migrations | Prisma 7, Prisma PostgreSQL Adapter | Modelagem, queries tipadas e evolução do banco |
| Autenticação | JWT, Passport, bcrypt | Access e refresh tokens, proteção de rotas e hash de credenciais |
| Filas e mensageria | Redis 7, BullMQ 5 | Processamento assíncrono, retentativas e dead-letter queue de e-mails |
| E-mail | Nodemailer 8, Mailpit | Envio SMTP e inspeção local de mensagens |
| Tempo real | RxJS, Server-Sent Events | Distribuição de eventos de projetos aos clientes conectados |
| Documentação | Swagger, OpenAPI | Documentação e exploração interativa dos endpoints |
| Administração | AdminJS, Bull Board | Gerenciamento dos dados e monitoramento das filas |
| Validação | class-validator, class-transformer | Validação e saneamento dos dados de entrada |
| Testes | Jest 30, Supertest | Testes unitários e end-to-end |
| Qualidade | ESLint, Prettier | Análise estática e padronização do código |
| Infraestrutura | Docker Compose, pnpm | Serviços locais e gerenciamento de dependências |

## Pré-requisitos

- Node.js 20 ou superior
- pnpm 10 ou superior
- Docker e Docker Compose

## Executando localmente

1. Instale as dependências:

```bash
pnpm install
```

2. Crie um arquivo `.env` na raiz do projeto:

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001

DATABASE_URL=postgresql://admin:admin@localhost:5432/task_manager

JWT_SECRET=troque-por-uma-chave-secreta
JWT_REFRESH_SECRET=troque-por-outra-chave-secreta

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_FROM=Task Manager <no-reply@task-manager.local>
MAIL_PROVIDER=smtp

EMAIL_VERIFICATION_EXPIRES_MINUTES=15
EMAIL_VERIFICATION_ENABLED=false
PASSWORD_RESET_EXPIRES_MINUTES=15

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_COOKIE_SECRET=troque-por-uma-chave-longa-e-aleatoria
```

> Em produção, use segredos fortes, configure um servidor SMTP real e nunca mantenha as credenciais de exemplo.

3. Inicie PostgreSQL, Redis e Mailpit:

```bash
docker compose up -d
```

4. Gere o Prisma Client e aplique as migrations:

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

5. Inicie a API em modo de desenvolvimento:

```bash
pnpm start:dev
```

A aplicação ficará disponível nos seguintes endereços:

| Serviço | URL |
| --- | --- |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| AdminJS | `http://localhost:3000/admin` |
| Filas | `http://localhost:3000/admin/queues` |
| Mailpit | `http://localhost:8025` |

### Mailtrap no Railway

Para testar e-mails no Railway sem usar SMTP, configure o Mailtrap Email Sandbox pela API HTTPS:

```env
MAIL_PROVIDER=mailtrap
MAILTRAP_API_KEY=seu-token-da-api
MAILTRAP_USE_SANDBOX=true
MAILTRAP_INBOX_ID=id-numerico-do-inbox
MAIL_FROM_NAME=Task Manager
MAIL_FROM_EMAIL=sandbox@example.com
```

O token é criado em **Settings → API Tokens** no Mailtrap. O ID numérico está disponível no inbox do Email Sandbox. As mensagens serão capturadas pelo Mailtrap e não chegarão ao destinatário real.

Para envio real, verifique um domínio no Mailtrap e use:

```env
MAIL_PROVIDER=mailtrap
MAILTRAP_API_KEY=seu-token-de-producao
MAILTRAP_USE_SANDBOX=false
MAIL_FROM_NAME=Task Manager
MAIL_FROM_EMAIL=no-reply@seu-dominio.com
```

## Autenticação

O login devolve o access token no corpo da resposta e também grava os cookies HTTP-only `access_token` e `refresh_token`. As rotas protegidas aceitam o cookie de acesso ou o cabeçalho:

```http
Authorization: Bearer <access_token>
```

Ao consumir a API pelo navegador com cookies, habilite o envio de credenciais no cliente. Exemplo com `fetch`:

```ts
fetch('http://localhost:3000/projects', {
  credentials: 'include',
});
```

## Documentação com Swagger

A API disponibiliza uma documentação interativa gerada com Swagger/OpenAPI. Com a aplicação em execução, acesse:

```text
http://localhost:3000/docs
```

Pela interface é possível consultar as rotas, parâmetros e corpos de requisição disponíveis, além de enviar chamadas para a API pelo botão **Try it out**.

### Testando rotas autenticadas

Para testar uma rota protegida:

1. Execute `POST /auth/login` com o e-mail e a senha de um usuário confirmado.
2. O navegador armazenará os cookies HTTP-only devolvidos pela API.
3. Execute as demais rotas pela mesma página do Swagger; os cookies serão enviados para a API.

Em clientes externos, como Postman e Insomnia, também é possível copiar o `accessToken` retornado pelo login e enviá-lo como Bearer token:

```http
Authorization: Bearer <access_token>
```

O documento OpenAPI também pode ser obtido em formatos JSON ou YAML:

```text
http://localhost:3000/docs-json
http://localhost:3000/docs-yaml
```

Esse arquivo pode ser importado em ferramentas como Postman e Insomnia ou usado para gerar clientes da API.

## Principais rotas

Todas as rotas são protegidas por padrão. As rotas públicas estão indicadas na tabela.

| Método | Rota | Descrição | Acesso |
| --- | --- | --- | --- |
| `GET` | `/hello` | Verifica se a API está respondendo | Público |
| `POST` | `/users` | Cria uma conta | Público |
| `POST` | `/users/verify-email` | Confirma o e-mail com um código de 6 dígitos | Público |
| `POST` | `/users/resend-verification-email` | Reenvia o código de confirmação | Público |
| `POST` | `/users/forgot-password` | Solicita a recuperação de senha | Público |
| `POST` | `/users/reset-password` | Redefine a senha com o código recebido | Público |
| `POST` | `/auth/login` | Autentica e cria a sessão | Público |
| `POST` | `/auth/refresh` | Renova os tokens da sessão | Público |
| `POST` | `/auth/logout` | Invalida a sessão e remove os cookies | Público |
| `POST` | `/projects` | Cria um projeto | Protegido |
| `GET` | `/projects` | Lista os projetos do usuário | Protegido |
| `GET` | `/projects/:projectId` | Busca um projeto | Protegido |
| `PATCH` | `/projects/:id` | Atualiza um projeto | Protegido |
| `DELETE` | `/projects/:id` | Remove um projeto | Protegido |
| `GET` | `/projects/:projectId/members` | Lista os membros do projeto | Protegido |
| `GET` | `/projects/:projectId/events` | Abre o stream SSE do projeto | Protegido |
| `POST` | `/steps/:projectId` | Cria uma etapa | Protegido |
| `GET` | `/steps/:projectId` | Lista as etapas do projeto | Protegido |
| `GET` | `/steps/:projectId/:stepId` | Busca uma etapa | Protegido |
| `PATCH` | `/steps/:projectId/:stepId` | Atualiza ou reposiciona uma etapa | Protegido |
| `DELETE` | `/steps/:projectId/:stepId` | Remove uma etapa | Protegido |
| `POST` | `/tasks/:projectId` | Cria uma tarefa | Protegido |
| `GET` | `/tasks/:projectId` | Lista as tarefas do projeto | Protegido |
| `GET` | `/tasks/:projectId/:taskId` | Busca uma tarefa | Protegido |
| `PATCH` | `/tasks/:projectId/:taskId` | Atualiza, move ou reposiciona uma tarefa | Protegido |
| `DELETE` | `/tasks/:projectId/:taskId` | Remove uma tarefa | Protegido |

### Exemplo de uso

Crie uma conta:

```bash
curl -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"secret123"}'
```

Abra o Mailpit em `http://localhost:8025`, copie o código recebido e confirme o e-mail:

```bash
curl -X POST http://localhost:3000/users/verify-email \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","code":"123456"}'
```

Faça login e salve os cookies da sessão:

```bash
curl -c cookies.txt -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@example.com","password":"secret123"}'
```

Crie um projeto autenticado:

```bash
curl -b cookies.txt -X POST http://localhost:3000/projects \
  -H 'Content-Type: application/json' \
  -d '{"name":"Meu projeto","description":"Planejamento inicial"}'
```

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `pnpm start` | Inicia a aplicação |
| `pnpm start:dev` | Inicia em modo watch |
| `pnpm start:debug` | Inicia em modo debug e watch |
| `pnpm build` | Gera o build de produção |
| `pnpm start:prod` | Executa o build gerado |
| `pnpm lint` | Analisa e corrige o código com ESLint |
| `pnpm format` | Formata os arquivos com Prettier |
| `pnpm test` | Executa os testes unitários |
| `pnpm test:watch` | Executa testes em modo watch |
| `pnpm test:cov` | Gera o relatório de cobertura |
| `pnpm test:e2e` | Executa os testes end-to-end |

Para aplicar migrations em produção, use:

```bash
pnpm exec prisma migrate deploy
```

## Arquitetura

A aplicação segue uma arquitetura modular em camadas. Os controllers recebem as requisições HTTP, os services e casos de uso concentram as regras de negócio, os repositories isolam o acesso aos dados e o Prisma persiste as entidades no PostgreSQL.

```mermaid
flowchart LR
    Client[Cliente web ou mobile]
    Admin[Administrador]

    subgraph API[API NestJS]
        HTTP[Controllers e validação]
        Guard[JWT Auth Guard]

        subgraph Modules[Módulos de domínio]
            Auth[Auth]
            Users[Users]
            Projects[Projects]
            Steps[Steps]
            Tasks[Tasks]
        end

        Events[Events Service / SSE]
        Mail[Mail Service]
        Worker[Mail Worker]
        Prisma[Repositories / Prisma]
        AdminJS[AdminJS]
        BullBoard[Bull Board]
        Swagger[Swagger]
    end

    DB[(PostgreSQL)]
    Redis[(Redis / BullMQ)]
    SMTP[Servidor SMTP / Mailpit]

    Client -->|HTTP + cookies ou Bearer token| HTTP
    HTTP --> Guard
    Guard --> Auth
    Guard --> Users
    Guard --> Projects
    Guard --> Steps
    Guard --> Tasks

    Auth --> Prisma
    Users --> Prisma
    Projects --> Prisma
    Steps --> Prisma
    Tasks --> Prisma
    Prisma --> DB

    Users -->|agenda e-mails| Mail
    Mail -->|publica jobs| Redis
    Redis -->|entrega jobs| Worker
    Worker -->|envia e-mails| SMTP

    Projects --> Events
    Events -->|stream SSE| Client

    Admin --> AdminJS
    AdminJS --> DB
    Admin --> BullBoard
    BullBoard --> Redis
    Client -.->|consulta a documentação| Swagger
```

O fluxo principal é dividido da seguinte forma:

1. O cliente envia uma requisição à API usando cookies HTTP-only ou um Bearer token.
2. O guard global libera rotas públicas ou valida o JWT antes de encaminhar a requisição.
3. O módulo responsável executa as regras de negócio e acessa o banco por meio dos repositories e do Prisma.
4. E-mails são enviados fora do ciclo da requisição: a API publica um job no Redis e o worker o processa de forma assíncrona.
5. Alterações em projetos são publicadas pelo módulo de eventos e entregues aos clientes conectados via SSE.

## Estrutura do projeto

```text
src/
├── admin/             # AdminJS e painel das filas
├── common/            # Decorators e recursos compartilhados
├── database/          # Integração do Prisma com PostgreSQL
├── modules/
│   ├── auth/          # Login, logout, tokens e guard JWT
│   ├── events/        # Eventos em tempo real via SSE
│   ├── mail/          # Fila e processamento de e-mails
│   ├── projects/      # Projetos, membros e permissões
│   ├── steps/         # Etapas do quadro
│   ├── tasks/         # Tarefas do projeto
│   └── users/         # Contas, verificação e recuperação de senha
└── main.ts            # Bootstrap, CORS, validação e Swagger

prisma/
├── migrations/        # Histórico de migrations
└── schema.prisma      # Modelos e relacionamentos do banco
```

## Testes

```bash
# testes unitários
pnpm test

# testes end-to-end
pnpm test:e2e

# cobertura
pnpm test:cov
```

## Licença

Este projeto está marcado como privado e `UNLICENSED` no `package.json`.
