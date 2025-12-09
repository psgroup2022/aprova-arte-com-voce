# Configuração de Secrets do GitHub

Este projeto requer secrets do GitHub para rodar corretamente no CI/CD.

## Secrets Necessários

Para configurar os secrets, siga estes passos:

### 1. Acesse as Configurações do Repositório

1. Vá para o seu repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral esquerdo, clique em **Secrets and variables** → **Actions**
4. Clique em **New repository secret**

### 2. Adicione os Seguintes Secrets

#### **Secrets do AprovaArte (Obrigatórios)**

##### **VITE_SUPABASE_URL**

- **Nome do Secret:** `VITE_SUPABASE_URL`
- **Valor:** URL do projeto AprovaArte Supabase
- **Exemplo:** `https://uaqxgzoprrxdswnomccc.supabase.co`
- **Como obter:**
  1. Acesse [app.supabase.com](https://app.supabase.com)
  2. Selecione o projeto **AprovaArte** (`uaqxgzoprrxdswnomccc`)
  3. Vá em **Settings** → **API**
  4. Copie a **Project URL**

##### **VITE_SUPABASE_ANON_KEY**

- **Nome do Secret:** `VITE_SUPABASE_ANON_KEY`
- **Valor:** Chave anônima do AprovaArte
- **Exemplo:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Como obter:**
  1. Acesse [app.supabase.com](https://app.supabase.com)
  2. Selecione o projeto **AprovaArte**
  3. Vá em **Settings** → **API**
  4. Copie a **anon** / **public** key

#### **Secrets do MiraPauta (Obrigatórios)**

##### **VITE_MIRAPAUTA_SUPABASE_URL**

- **Nome do Secret:** `VITE_MIRAPAUTA_SUPABASE_URL`
- **Valor:** URL do projeto MiraPauta Supabase
- **Exemplo:** `https://vjxkbddfavhoqnuabmrt.supabase.co`
- **Como obter:**
  1. Acesse [app.supabase.com](https://app.supabase.com)
  2. Selecione o projeto **MiraPauta** (`vjxkbddfavhoqnuabmrt`)
  3. Vá em **Settings** → **API**
  4. Copie a **Project URL**

##### **VITE_MIRAPAUTA_SUPABASE_ANON_KEY**

- **Nome do Secret:** `VITE_MIRAPAUTA_SUPABASE_ANON_KEY`
- **Valor:** Chave anônima do MiraPauta
- **Exemplo:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Como obter:**
  1. Acesse [app.supabase.com](https://app.supabase.com)
  2. Selecione o projeto **MiraPauta**
  3. Vá em **Settings** → **API**
  4. Copie a **anon** / **public** key

#### **VITE_SENTRY_DSN** (Opcional)

- **Nome do Secret:** `VITE_SENTRY_DSN`
- **Valor:** DSN do Sentry para monitoramento de erros
- **Exemplo:** `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
- **Como obter:**
  1. Acesse [sentry.io](https://sentry.io)
  2. Selecione seu projeto
  3. Vá em **Settings** → **Client Keys (DSN)**
  4. Copie o DSN

#### **VITE_APP_VERSION** (Opcional)

- **Nome do Secret:** `VITE_APP_VERSION`
- **Valor:** Versão da aplicação
- **Exemplo:** `1.0.0`

## Verificação

Depois de adicionar os secrets:

1. Faça um commit e push para o repositório
2. Vá em **Actions** no GitHub
3. Verifique se o workflow está rodando sem erros

## Valores Fallback para CI

Se os secrets não estiverem configurados, o CI usará valores fallback temporários:

**AprovaArte:**

- `VITE_SUPABASE_URL`: `http://localhost:54321`
- `VITE_SUPABASE_ANON_KEY`: `dummy-key-for-ci`

**MiraPauta:**

- `VITE_MIRAPAUTA_SUPABASE_URL`: `http://localhost:54322`
- `VITE_MIRAPAUTA_SUPABASE_ANON_KEY`: `dummy-mirapauta-key-for-ci`

⚠️ **Importante:** Esses valores fallback permitem que o lint e typecheck rodem, mas não são adequados para produção ou testes de integração completos.

## Segurança

- ❌ **NUNCA** commite secrets no código
- ❌ **NUNCA** compartilhe secrets publicamente
- ✅ Mantenha os secrets apenas no GitHub Secrets
- ✅ Use `.env.example` para documentar variáveis necessárias
- ✅ Adicione `.env` no `.gitignore`

## Troubleshooting

### Erro: "Missing secret: VITE_SUPABASE_URL"

**Solução:** Configure os secrets conforme as instruções acima.

### Pipeline falha após adicionar secrets

**Solução:**

1. Verifique se os nomes dos secrets estão corretos (são case-sensitive)
2. Verifique se os valores não têm espaços extras no início ou fim
3. Tente re-rodar o workflow

### Como atualizar um secret?

1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Clique no secret que deseja atualizar
3. Clique em **Update secret**
4. Cole o novo valor e salve

## Ajuda Adicional

Se precisar de ajuda, consulte a [documentação oficial do GitHub Actions](https://docs.github.com/en/actions/security-guides/encrypted-secrets).
