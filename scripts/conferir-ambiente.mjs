#!/usr/bin/env node
/**
 * Recusa um build de produção que aponte para um Supabase local.
 *
 * O MiraCheck foi ao ar duas vezes contendo
 * `createClient("http://127.0.0.1:54321", …)`. Nenhum navegador fora da
 * máquina que compilou alcança esse endereço, então o link público do cliente
 * nunca abriu em produção — e a tela só dizia "este link não abre nenhuma
 * pauta", sem nada apontando para a causa.
 *
 * A variável é lida em tempo de compilação e fica congelada dentro do bundle.
 * Compilar no Mac, onde `.env.local` aponta para o ambiente de
 * desenvolvimento, assa o endereço errado no arquivo que vai para o servidor.
 *
 * Isto roda como `prebuild`, não como hook de editor: quem quebrou foi um
 * `npm run build` comum. Uma trava que só vale para o assistente não cobre a
 * pessoa nem a CI.
 *
 * Saída de emergência, para compilar de propósito contra o ambiente local:
 *   MIRACHECK_BUILD_LOCAL=1 npm run build
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const LOCAIS = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1'];

const CHAVES = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

/** `.env` raso: `CHAVE=valor`, com aspas opcionais. Não expande nada. */
export function lerEnv(texto) {
  const vars = {};
  for (const linha of texto.split('\n')) {
    const par = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
    if (!par) continue;
    vars[par[1]] = par[2].trim().replace(/^["']|["']$/g, '');
  }
  return vars;
}

export function ordemDoVite(modo) {
  return [`.env.${modo}.local`, `.env.${modo}`, '.env.local', '.env'];
}

/**
 * A ordem do Vite, do mais específico para o menos. O shell vence todos.
 *
 * Reproduzir isso aqui é o ponto: dizer qual valor o build vai usar de fato,
 * e não qual arquivo alguém acha que manda.
 */
export function resolverAmbiente({ modo, arquivos, shell = {} }) {
  const valores = {};
  const origens = {};

  for (const chave of CHAVES) {
    if (shell[chave]) {
      valores[chave] = shell[chave];
      origens[chave] = 'linha de comando';
      continue;
    }
    for (const nome of ordemDoVite(modo)) {
      const valor = arquivos[nome]?.[chave];
      if (valor) {
        valores[chave] = valor;
        origens[chave] = nome;
        break;
      }
    }
  }

  return {
    url: valores.VITE_SUPABASE_URL ?? '',
    temChave: Boolean(valores.VITE_SUPABASE_ANON_KEY),
    origem: origens.VITE_SUPABASE_URL ?? 'lugar nenhum',
  };
}

export function ehLocal(url) {
  if (!url) return false;
  try {
    return LOCAIS.includes(new URL(url).hostname);
  } catch {
    return LOCAIS.some((h) => url.includes(h));
  }
}

export function veredito({ url, temChave, origem, modo, permitirLocal }) {
  if (modo !== 'production') return { ok: true };

  if (!url || !temChave)
    return {
      ok: false,
      mensagem:
        'Falta VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY.\n' +
        'Sem elas o cliente Supabase nasce apontando para http://localhost, e o link do cliente não abre.',
    };

  if (ehLocal(url) && !permitirLocal)
    return {
      ok: false,
      mensagem:
        `VITE_SUPABASE_URL aponta para um endereço local (${url}), vindo de ${origem}.\n` +
        'Esse endereço fica congelado dentro do bundle, e nenhum navegador fora desta máquina o alcança.\n' +
        'Foi assim que o link público do cliente parou duas vezes, sem erro em lugar nenhum.\n\n' +
        'Para compilar para produção, passe o ambiente na linha de comando, que vence os arquivos .env:\n' +
        '  VITE_SUPABASE_URL=https://<projeto>.supabase.co VITE_SUPABASE_ANON_KEY=<anon> npm run build\n\n' +
        'Para compilar contra o ambiente local de propósito:\n' +
        '  MIRACHECK_BUILD_LOCAL=1 npm run build',
    };

  return { ok: true, url };
}

/** Só os nomes dos arquivos; nenhum valor sai daqui para a tela. */
function carregarArquivos(modo) {
  const arquivos = {};
  for (const nome of ordemDoVite(modo)) {
    const caminho = path.join(RAIZ, nome);
    if (fs.existsSync(caminho)) arquivos[nome] = lerEnv(fs.readFileSync(caminho, 'utf-8'));
  }
  return arquivos;
}

// Entrada de linha de comando. Importado por teste, não roda nada.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // `build:dev` compila em modo development e não vai para produção.
  const modo = process.env.npm_lifecycle_event === 'prebuild:dev' ? 'development' : 'production';

  const shell = {};
  for (const chave of CHAVES) if (process.env[chave]) shell[chave] = process.env[chave];

  const ambiente = resolverAmbiente({ modo, arquivos: carregarArquivos(modo), shell });
  const r = veredito({
    ...ambiente,
    modo,
    permitirLocal: process.env.MIRACHECK_BUILD_LOCAL === '1',
  });

  if (!r.ok) {
    console.error(`\nBuild recusado.\n\n${r.mensagem}\n`);
    process.exit(1);
  }

  if (r.url) console.log(`ambiente conferido: ${r.url} (de ${ambiente.origem})`);
}
