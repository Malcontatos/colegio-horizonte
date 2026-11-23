# Colégio Horizonte · Portal Escolar

Portal escolar completo com três áreas integradas: **Administração**, **Professor** e **Aluno**. O sistema reúne gestão acadêmica, lançamento de notas, boletim por disciplina e uma biblioteca digital com materiais, atividades e avaliações.

A identidade visual foi construída para o fictício **Colégio Horizonte**: azul-marinho, dourado e verde-água, com tipografia Sora + Inter.

---

## Visão geral por perfil

### Administração
- Painel com indicadores da escola, turmas em operação, matrículas recentes e publicações.
- Cadastro e ativação/desativação de alunos, com matrícula em turma.
- Cadastro de professores.
- Cadastro de disciplinas, turmas e vínculos de ensino (professor × disciplina × turma).

### Professor
- Painel com turmas, disciplinas, notas lançadas e materiais publicados.
- Diário de notas por turma, disciplina e período (1º ao 4º), com notas de 0 a 10.
- Publicação de materiais, atividades e avaliações para turmas específicas.
- Exclusão dos próprios materiais.

### Aluno
- Painel com média geral, desempenho por disciplina, notas recentes e materiais da turma.
- Boletim com notas por período, média por disciplina e professor responsável.
- Biblioteca digital filtrável por disciplina, tipo e texto, com download autenticado.

---

## Stack

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, Vite 8, TypeScript, React Router, TanStack Query, React Hook Form, Tailwind CSS 4, lucide-react, sonner |
| Backend | Node.js, Express 5, TypeScript, Prisma 7, `@prisma/adapter-pg`, Zod, JWT, bcryptjs, Multer |
| Banco | PostgreSQL 18 (desenvolvimento via `embedded-postgres`) |
| Build | npm workspaces, `tsx`, `concurrently` |

---

## Requisitos

- **Node.js 22.12 ou superior** (testado com Node 26).
- **npm 10 ou superior**.
- PostgreSQL local **não é obrigatório em desenvolvimento**: o projeto sobe um cluster embarcado na porta `5433`.

---

## Como rodar

```bash
# 1. Instale as dependências (raiz do monorepo)
npm install

# 2. Crie o arquivo de ambiente do backend
copy backend\.env.example backend\.env   # Windows
# cp backend/.env.example backend/.env   # macOS/Linux

# 3. Gere uma chave JWT forte e cole em JWT_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Suba banco + API + frontend
npm run dev
```

Acesse **http://localhost:5173**.

Na primeira execução o script:

1. inicializa o PostgreSQL embarcado em `%LOCALAPPDATA%\colegio-horizonte\postgres` (Windows) ou `~/.local/share/colegio-horizonte/postgres`;
2. aplica as migrations;
3. executa o seed idempotente com dados de demonstração;
4. inicia a API em `http://localhost:4000` e o Vite em `http://localhost:5173`.

> **Windows + caminho com acentos:** o projeto copia automaticamente os binários do PostgreSQL para `%LOCALAPPDATA%\colegio-horizonte\pg-native`, pois o `initdb` não funciona em caminhos não-ASCII.

### Contas de demonstração

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administração | `admin@colegiohorizonte.edu.br` | `Admin@123` |
| Professor | `helena.martins@colegiohorizonte.edu.br` | `Professor@123` |
| Aluno | `ana.lima@aluno.colegiohorizonte.edu.br` | `Aluno@123` |

O seed cria 3 turmas (7º, 8º e 9º Ano A), 6 disciplinas, 5 professores, 21 alunos, 252 notas e 8 materiais em PDF. A aluna Ana Beatriz Lima cursa o 9º Ano A e possui notas em todos os períodos, incluindo uma nota de atenção em História no 2º período.

---

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe banco embarcado, API e frontend em paralelo. |
| `npm run dev:db` | Apenas o PostgreSQL local (porta 5433). |
| `npm run dev:api` | Apenas a API (porta 4000). |
| `npm run dev:web` | Apenas o Vite (porta 5173). |
| `npm run typecheck` | Typecheck de backend e frontend. |
| `npm run build` | Compila backend e frontend para produção. |
| `npm start` | Inicia o backend compilado, servindo também o frontend. |
| `npm run db:migrate` | Cria/aplica migrations em desenvolvimento. |
| `npm run db:seed` | Repopula os dados de demonstração. |
| `npm run db:studio` | Abre o Prisma Studio. |

---

## Estrutura do projeto

```text
sistema-escolar/
├─ backend/
│  ├─ prisma/
│  │  ├─ schema.prisma          # modelo de dados
│  │  ├─ migrations/            # migrations versionadas
│  │  └─ seed.ts                # dados demo + PDFs
│  ├─ src/
│  │  ├─ generated/prisma/      # client gerado
│  │  ├─ lib/                   # env, prisma, jwt, serializers
│  │  ├─ middleware/            # autenticação, roles, erros, upload
│  │  └─ routes/                # auth, admin, teacher, student, library
│  └─ uploads/                  # PDFs do seed (fallback local)
├─ frontend/
│  └─ src/
│     ├─ components/            # design system, AppShell, rotas protegidas
│     ├─ context/               # sessão do usuário
│     ├─ lib/                   # API, formatadores, utilitários
│     └─ pages/                 # admin, professor, aluno e login
├─ scripts/dev-db.mjs           # PostgreSQL embarcado (Windows/Linux/macOS)
└─ render.yaml                  # blueprint de deploy gratuito no Render
```

---

## Modelo de dados

- **User** — credenciais, papel (`ADMIN`, `TEACHER`, `STUDENT`), status ativo.
- **Student** — matrícula, dados pessoais, vínculo com `User` e matrícula em turma.
- **Teacher** — dados profissionais e vínculo com `User`.
- **SchoolClass** — nome, ano letivo e turno.
- **Subject** — nome, código e carga horária.
- **TeachingAssignment** — professor × disciplina × turma (define o que cada professor pode lecionar).
- **Enrollment** — aluno × turma × ano letivo, com status (`ACTIVE`, `TRANSFERRED`, `COMPLETED`).
- **Grade** — nota por matrícula, disciplina e período. Única por combinação e limitada entre 0 e 10 por constraint no banco.
- **LibraryResource** — metadados do arquivo, tipo, disciplina, turma opcional, autor, tamanho e contador de downloads.
- **LibraryFile** — conteúdo binário do material (`bytea`) no PostgreSQL. Assim os arquivos sobrevivem a reinícios e deploys em hospedagens com disco efêmero, como o plano gratuito do Render.

---

## API

Todas as respostas de sucesso usam `{ "data": ... }`; erros usam `{ "error": { "message", "code", "details?" } }`.

### Autenticação

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/auth/login` | Login; grava JWT em cookie `httpOnly`. |
| GET | `/api/auth/me` | Retorna o usuário da sessão. |
| POST | `/api/auth/logout` | Encerra a sessão. |
| PATCH | `/api/auth/password` | Troca a senha do usuário autenticado. |

### Administração (`ADMIN`)

| Método | Rota |
| --- | --- |
| GET | `/api/admin/overview` |
| GET / POST | `/api/admin/students` |
| PATCH | `/api/admin/students/:id` |
| GET / POST | `/api/admin/teachers` |
| GET / POST | `/api/admin/subjects` |
| GET / POST | `/api/admin/classes` |
| GET / POST | `/api/admin/assignments` |
| DELETE | `/api/admin/assignments/:id` |

### Professor (`TEACHER`)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/teacher/overview` | Indicadores e publicações recentes. |
| GET | `/api/teacher/assignments` | Turmas/disciplinas do professor. |
| GET | `/api/teacher/gradebook?subjectId=&classId=&period=` | Diário da turma. |
| PUT | `/api/teacher/grades` | Salva notas em lote (remove notas vazias). |
| GET / POST | `/api/teacher/resources` | Lista e publica materiais (multipart). |
| DELETE | `/api/teacher/resources/:id` | Remove um material próprio. |

### Aluno (`STUDENT`)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/student/overview` | Médias, notas recentes e materiais. |
| GET | `/api/student/subjects` | Boletim por disciplina e período. |
| GET | `/api/student/resources?search=&subjectId=&type=` | Biblioteca da turma. |

### Biblioteca

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/library/:id/download` | Download autenticado, respeitando o papel e a turma. |

### Saúde

`GET /api/health` → `{ "data": { "status": "ok", "timestamp": "..." } }`

---

## Segurança

- Senhas com **bcrypt** (custo 10); nunca retornadas pela API.
- Sessão em **JWT httpOnly**, `SameSite=Lax` e `Secure` em produção.
- Middleware de autenticação e autorização por papel em todas as rotas privadas.
- **Rate limit** no login e nas rotas de escrita.
- **Helmet** para cabeçalhos HTTP e CORS restrito ao `CLIENT_URL`.
- Validação de payloads com **Zod**, incluindo notas (0–10) e períodos (1–4).
- Uploads com limite de 15 MB, extensões permitidas e nome físico em UUID.
- Arquivos armazenados no PostgreSQL (`LibraryFile`) e entregues somente pelo endpoint autenticado.
- Downloads autenticados: aluno só acessa materiais da própria turma; professor só os das turmas que leciona.
- Constraint no banco garante a faixa válida de notas mesmo fora da API.

---

## Deploy gratuito (Render + Neon)

O projeto inclui `render.yaml` e já está preparado para a combinação gratuita mais estável:

- **Render Web Service Free** — API + frontend no mesmo domínio, sem cartão. Hiberna após 15 minutos sem acesso e acorda na próxima visita (~1 min).
- **Neon Free** — PostgreSQL gerenciado, sem cartão, com suspensão automática após alguns minutos de inatividade.
- **Arquivos no PostgreSQL** — o disco do Render Free é efêmero; por isso os materiais da biblioteca são gravados em `LibraryFile` (`bytea`) e sobrevivem a reinícios e novos deploys.

### 1. Banco de dados no Neon

1. Crie uma conta em [neon.com](https://neon.com) e um projeto PostgreSQL.
2. Copie a **connection string com pooling** (o host contém `-pooler`) e mantenha `sslmode=require`.
3. Guarde-a para o passo 3.

### 2. Código no GitHub

```bash
cd sistema-escolar
git init
git add .
git commit -m "Portal Escolar Colégio Horizonte"
gh repo create colegio-horizonte --public --source=. --remote=origin --push
```

Sem GitHub CLI: crie o repositório em [github.com](https://github.com), adicione o remote e faça push.

### 3. Publicar no Render

1. Crie uma conta em [render.com](https://render.com) e conecte o GitHub.
2. **New → Blueprint**, selecione o repositório. O Render lê o `render.yaml`.
3. Informe `DATABASE_URL` com a string do Neon.
4. Clique em **Apply**. O build roda `npm ci && npm run build`; o start aplica migrations, executa o seed idempotente e sobe API + SPA.
5. A URL ficará no formato `https://colegio-horizonte.onrender.com` (ou o nome disponível).

Também é possível criar manualmente um **Web Service** com:

| Configuração | Valor |
| --- | --- |
| Runtime | Node 22 |
| Build | `npm ci --include=dev && npm run build` |
| Start | `npm run db:deploy --workspace backend && npm run db:seed --workspace backend && npm start` |
| Health check | `/api/health` |
| Plano | Free |

Variáveis mínimas: `DATABASE_URL`, `JWT_SECRET` (48+ caracteres) e `NODE_ENV=production`. `CLIENT_URL` é detectada automaticamente via `RENDER_EXTERNAL_URL`; defina-a manualmente se usar domínio próprio.

> O primeiro acesso após inatividade pode levar cerca de 1 minuto. O Neon também acorda na primeira consulta. Para uma demonstração escolar, esses atrasos são aceitáveis; para uso contínuo, considere planos pagos.

### Outros provedores

Em um VPS, container ou PaaS com disco persistente, basta configurar `backend/.env`:

```env
DATABASE_URL="postgresql://usuario:senha@host:5432/banco?sslmode=require"
JWT_SECRET="chave-forte-com-48-bytes"
JWT_EXPIRES_IN="8h"
NODE_ENV=production
CLIENT_URL="https://portal.suaescola.com.br"
PORT=4000
UPLOAD_DIR="uploads"
MAX_UPLOAD_MB=15
```

Depois, aplique as migrations e inicie:

```bash
npm run db:deploy --workspace backend
npm run build
npm start
```

O Express serve a API e o `frontend/dist` no mesmo domínio, com fallback para SPA.

> Em produção o cookie é `Secure`: publique atrás de HTTPS (Nginx, Caddy, Cloudflare etc.). Como os arquivos ficam no PostgreSQL, o backup do banco cobre também a biblioteca.

### Checklist de go-live

- [ ] `JWT_SECRET` exclusivo e fora do repositório.
- [ ] HTTPS ativo e `NODE_ENV=production`.
- [ ] Migrations aplicadas com `migrate deploy` (nunca `migrate dev`).
- [ ] Backups automáticos do PostgreSQL (inclui os arquivos da biblioteca).
- [ ] Senhas de demonstração trocadas ou seed removido do start em produção real.
- [ ] Monitoramento de logs e limite de upload adequado ao proxy reverso.

---

## Limitações e próximos passos

- Não há recuperação de senha por e-mail nem autenticação em dois fatores.
- Não há módulo de frequência, calendário letivo ou comunicados.
- Listagens não são paginadas (adequado ao volume atual da demonstração).
- Arquivos ficam no PostgreSQL; para muitas instituições ou arquivos grandes, migrar para S3/R2 e servir via URL assinada.
- No plano gratuito do Render, a aplicação hiberna após 15 minutos sem acesso e leva ~1 min para acordar.
- Administração ainda não edita/exclui professores, turmas e disciplinas; vínculos já podem ser removidos.
- Sem suíte de testes automatizados; a validação atual cobre typecheck, build e fluxos principais no navegador.
- O bundle principal tem ~607 kB (176 kB gzip); um próximo passo é dividir as rotas com `React.lazy`.

---

## Solução de problemas

**Porta 5433 ocupada** — já existe um PostgreSQL ouvindo. O script reaproveita a instância. Para recomeçar do zero, pare os processos, remova `%LOCALAPPDATA%\colegio-horizonte\postgres` e rode `npm run dev` novamente.

**API não sobe** — confira `backend/.env`, se a porta 4000 está livre e se o banco responde em `127.0.0.1:5433`.

**Login retorna 401 em produção** — verifique se o acesso é HTTPS e se `NODE_ENV=production`; caso contrário o cookie `Secure` não é enviado.

**Primeiro acesso demora ~1 minuto** — comportamento esperado do Render Free (hibernação) e do Neon (suspensão). Basta aguardar o carregamento.

**Upload maior que 15 MB é recusado** — ajuste `MAX_UPLOAD_MB` e o limite do proxy reverso. No Render, o limite do plano gratuito também deve ser respeitado.

**Erro de encoding no PostgreSQL no Windows** — mantenha o projeto em caminho com acentos apenas se o script de cópia para `pg-native` estiver funcionando; ele existe justamente para esse cenário.
