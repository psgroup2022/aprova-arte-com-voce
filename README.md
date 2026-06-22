# AprovaArte — Plataforma de Aprovação de Pautas

> Sistema web para agências de comunicação gerenciarem o ciclo completo de aprovação de artes e materiais criativos por clientes.

---

## Visão Geral

O **AprovaArte** é uma plataforma SaaS desenvolvida para agências digitais que precisam enviar pautas (briefings de materiais) para aprovação dos clientes de forma estruturada. O sistema permite:

- Criar e organizar **pautas** com múltiplos materiais (posts, stories, banners, etc.)
- Compartilhar um **link público** com o cliente para visualização e aprovação
- O cliente pode **aprovar, rejeitar ou deixar comentários pontuais** diretamente sobre as imagens
- Integração bidirecional com o **MiraPauta** para importar tarefas e sincronizar clientes/usuários
- Geração automática de **documentos Word (.docx)** de revisão com imagens e textos

---

## Stack Tecnológica

| Camada               | Tecnologia                                              |
| -------------------- | ------------------------------------------------------- |
| **Frontend**         | React 18 + TypeScript + Vite                            |
| **UI**               | shadcn/ui + Tailwind CSS                                |
| **Estado / Cache**   | TanStack React Query v5                                 |
| **Roteamento**       | React Router DOM v6                                     |
| **Backend / Auth**   | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| **Formulários**      | React Hook Form + Zod                                   |
| **Exportação**       | docx (Word) + jsPDF                                     |
| **Monitoramento**    | Sentry                                                  |
| **Testes**           | Vitest + Testing Library                                |
| **Linting / Format** | ESLint + Prettier + Husky                               |

---

## Estrutura do Projeto

```
aprova-arte-com-voce/
├── src/
│   ├── components/         # Componentes reutilizáveis
│   │   ├── ui/             # Biblioteca shadcn/ui
│   │   ├── pauta/          # Componentes específicos de pauta
│   │   └── criar-pauta/    # Componentes do fluxo de criação
│   ├── hooks/              # Custom hooks com toda a lógica de negócio
│   ├── integrations/
│   │   ├── supabase/       # Client, tipos gerados e queries
│   │   └── mirapauta/      # Client e tipos da integração MiraPauta
│   ├── pages/              # Páginas da aplicação (uma por rota)
│   ├── types/              # Tipos TypeScript globais
│   ├── utils/              # Utilitários (logger, sanitize, etc.)
│   └── lib/                # Schemas de validação e error handler
├── supabase/
│   ├── functions/          # Edge Functions (Deno)
│   │   ├── parse-briefing/ # Parseia briefings importados
│   │   └── sync-mirapauta/ # Sincronização automática com MiraPauta
│   └── migrations/         # Histórico completo de migrações SQL
├── scripts/                # Scripts auxiliares de desenvolvimento
└── public/                 # Assets estáticos
```

---

## Páginas e Rotas

| Rota                | Componente        | Descrição                                   | Acesso      |
| ------------------- | ----------------- | ------------------------------------------- | ----------- |
| `/`                 | `Dashboard`       | Listagem de pautas com filtros e stats      | Autenticado |
| `/auth`             | `Auth`            | Login / Cadastro via Supabase Auth          | Público     |
| `/criar-pauta`      | `CriarPauta`      | Formulário multi-etapa para nova pauta      | Autenticado |
| `/editar-pauta/:id` | `EditarPauta`     | Edição de pauta existente                   | Autenticado |
| `/pauta/:id`        | `VisualizarPauta` | Visualização pública para o cliente aprovar | **Público** |
| `/agenda`           | `Agenda`          | Calendário de prazos das pautas             | Autenticado |
| `/mensagens`        | `Mensagens`       | Central de mensagens e notificações         | Autenticado |
| `/relatorios`       | `Relatorios`      | Relatórios de aprovação e métricas          | Autenticado |
| `/equipe`           | `Equipe`          | Gerenciamento de membros da equipe          | Autenticado |
| `/integracoes`      | `Integracoes`     | Integração com MiraPauta                    | Autenticado |
| `/configuracoes`    | `Configuracoes`   | Preferências de perfil e sistema            | Autenticado |

---

## Funcionalidades Principais

### 📋 Pautas

- Criação de pautas com múltiplos **blocos de material** (post, story, banner, carrossel, reels, etc.)
- Cada bloco suporta: imagens/arquivos, texto de chamada, legenda e configurações específicas
- Versionamento de pautas (versões v1, v2…)
- Status: `rascunho` → `aguardando_aprovacao` → `aprovada` | `rejeitada`
- Link de aprovação único e público por pauta

### ✅ Aprovação pelo Cliente

- Rota `/pauta/:id` acessível sem login
- Cliente visualiza as peças e pode aprovar ou rejeitar com justificativa
- **Comentários pontuais**: o cliente clica diretamente sobre a imagem para marcar um ponto e deixar um comentário (coordenadas X/Y em percentual)
- Comentários podem ser respondidos, editados e marcados como resolvidos pela equipe

### 🔗 Integração MiraPauta

- Conexão via Supabase separado (variáveis `VITE_MIRAPAUTA_*`)
- Importação de **clientes**, **pautas** e **tarefas** do MiraPauta
- Sincronização automática de tarefas via Edge Function a cada 15 minutos
- Visualização de tarefas por responsável em abas

### 📄 Geração de Documentos

- Exportação de pauta em formato **Word (.docx)** com imagens e textos formatados
- Upload automático do documento para o Supabase Storage

---

## Configuração do Ambiente

### Pré-requisitos

- Node.js 18 ou 20
- npm (ou bun)
- Conta no [Supabase](https://supabase.com)

### Instalação

```sh
# 1. Clone o repositório
git clone <URL_DO_REPOSITÓRIO>
cd aprova-arte-com-voce

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# 4. Inicie o servidor de desenvolvimento
npm run dev
# Acesse: http://localhost:8080
```

### Variáveis de Ambiente

| Variável                           | Obrigatória | Descrição                                 |
| ---------------------------------- | ----------- | ----------------------------------------- |
| `VITE_SUPABASE_URL`                | ✅          | URL do projeto Supabase principal         |
| `VITE_SUPABASE_ANON_KEY`           | ✅          | Chave anônima pública do Supabase         |
| `VITE_MIRAPAUTA_SUPABASE_URL`      | ⚙️          | URL do Supabase do MiraPauta (integração) |
| `VITE_MIRAPAUTA_SUPABASE_ANON_KEY` | ⚙️          | Chave anônima do MiraPauta                |
| `VITE_SENTRY_DSN`                  | 🔵          | DSN do Sentry para monitoramento de erros |
| `VITE_APP_VERSION`                 | 🔵          | Versão da aplicação (padrão: `1.0.0`)     |

> ⚙️ Necessária apenas se usar a integração com MiraPauta  
> 🔵 Opcional

**Atenção**: Nunca exponha a chave de serviço (`service_role`) do Supabase no frontend. Use-a apenas em contextos server-side (Edge Functions ou GitHub Actions com runner self-hosted).

### Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Em **Authentication → URL Configuration**, adicione:
   - Site URL: `http://localhost:8080`
   - Redirect URLs: `http://localhost:8080`
3. Execute as migrações em ordem via Supabase CLI:
   ```sh
   supabase db push
   ```
4. O sistema usa RLS (Row Level Security) — garanta que as políticas estejam habilitadas ao criar novas tabelas.

---

## Scripts npm

| Script          | Comando                 | Descrição                             |
| --------------- | ----------------------- | ------------------------------------- |
| `dev`           | `npm run dev`           | Servidor Vite em `localhost:8080`     |
| `build`         | `npm run build`         | Build de produção em `dist/`          |
| `build:dev`     | `npm run build:dev`     | Build em modo desenvolvimento         |
| `preview`       | `npm run preview`       | Pré-visualização do build             |
| `lint`          | `npm run lint`          | ESLint sobre `src/`                   |
| `typecheck`     | `npm run typecheck`     | Verificação TypeScript (sem emissão)  |
| `format`        | `npm run format`        | Formata com Prettier                  |
| `test`          | `npm run test`          | Executa testes com Vitest (sem watch) |
| `test:watch`    | `npm run test:watch`    | Testes em modo watch                  |
| `test:coverage` | `npm run test:coverage` | Testes com relatório de cobertura     |

O relatório de cobertura é gerado em `coverage/` — abra `coverage/index.html` para visualizar o HTML.

---

## CI / CD

Pipeline via **GitHub Actions** (`.github/workflows/ci.yml`) — roda em push e PRs:

1. **Lint** — ESLint
2. **Typecheck** — `tsc --noEmit`
3. **Test Matrix** — Node 18 e 20
4. **Coverage** — Node 20, sobe o artefato `coverage/`
5. **Build** — Sobe o artefato `dist/`

### Secrets necessários no repositório

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Os artefatos de CI ficam disponíveis por **7 dias**.

---

## Banco de Dados

O schema principal inclui as seguintes tabelas (simplificado):

| Tabela                 | Descrição                                         |
| ---------------------- | ------------------------------------------------- |
| `pautas`               | Pautas com status, cliente, prazo e conteúdo JSON |
| `clientes`             | Clientes cadastrados na agência                   |
| `comentarios_pontuais` | Comentários com coordenadas X/Y sobre as imagens  |
| `profiles`             | Usuários sincronizados do MiraPauta               |
| `audit_logs`           | Log de auditoria de todas as operações            |

As migrações estão em `supabase/migrations/` em ordem cronológica.

---

## Edge Functions

| Função           | Trigger               | Descrição                                            |
| ---------------- | --------------------- | ---------------------------------------------------- |
| `sync-mirapauta` | Manual / Cron (15min) | Busca tarefas do MiraPauta e cria/atualiza pautas    |
| `parse-briefing` | Manual                | Parseia briefings importados para o formato de pauta |

---

## Segurança

- RLS habilitado em todas as tabelas — cada usuário acessa apenas seus próprios dados
- Inputs sanitizados via `isomorphic-dompurify` antes de persistir
- Validação de formulários com **Zod** antes de enviar ao banco
- Chave de serviço do Supabase jamais exposta no frontend
- Audit log de operações sensíveis
- Detalhes completos: [SECURITY.md](./SECURITY.md)

---

## Deploy

O projeto pode ser publicado em qualquer hospedagem estática (Vercel, Netlify, Cloudflare Pages):

1. Configure as variáveis de ambiente na plataforma de hospedagem
2. Execute `npm run build`
3. Faça deploy da pasta `dist/`

Ou utilize a plataforma **Lovable**: abra o projeto em [lovable.dev](https://lovable.dev/projects/44272730-8708-4b09-ba3f-4ab3f8e5196a) e clique em **Share → Publish**.

---

## Contribuindo

1. Faça um fork e crie um branch a partir de `main`
2. Instale as dependências: `npm install`
3. O Husky rodará lint + format automaticamente no commit (via `lint-staged`)
4. Abra um Pull Request com descrição clara da mudança

---

## Licença

Proprietário — todos os direitos reservados.
