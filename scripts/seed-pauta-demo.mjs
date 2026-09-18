// Publica um ciclo real do Mirador Team como pauta, para exercitar a tela do
// cliente enquanto a Fase 4 não existe.
//
// Isto é andaime, não o caminho definitivo. Quem vai publicar de verdade é
// `Mirador Team/server/src/aprovaarte/publicar.ts`, disparado por um botão no
// painel de peças. Este script faz o mínimo para que a Fase 3 possa ser vista e
// verificada: pega um ciclo que já existe no disco e escreve as tabelas.
//
// Usa um ciclo real, e não texto inventado, porque legenda de mil caracteres e
// chamada com quebra de linha editorial são exatamente o que quebra um layout.
// Fixture bonita esconde defeito.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:pauta-demo
//
// Opcional: RUN_ID para escolher outro ciclo.

import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const RAIZ_MIRADOR = path.resolve(import.meta.dirname, '../../Mirador Team');
const RUN_ID = process.env.RUN_ID || 'c874447f-89e2-48f6-a752-f507108f01a0';
const LARGURA_ARTE = 1200;

const url = process.env.SUPABASE_URL;
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !chave) {
  console.error(
    [
      'Faltam variáveis. Rode assim:',
      '',
      '  SUPABASE_URL=<API_URL> \\',
      '  SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY> \\',
      '  npm run seed:pauta-demo',
      '',
      'Local: `npx supabase status` imprime API_URL e SERVICE_ROLE_KEY.',
    ].join('\n'),
  );
  process.exit(1);
}

const supabase = createClient(url, chave, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * As peças ficam embutidas no prompt de cada decisão de imagem, em JSON. É o
 * formato do ciclo, não um contrato — `pieces.ts` é quem sabe lê-lo de verdade,
 * e é dele que a Fase 4 vai partir. Aqui basta recuperar o texto aprovado.
 */
function lerPecas() {
  const arquivo = path.join(RAIZ_MIRADOR, 'server/runs', `${RUN_ID}.json`);
  if (!existsSync(arquivo)) throw new Error(`ciclo não encontrado: ${arquivo}`);

  const ciclo = JSON.parse(readFileSync(arquivo, 'utf8'));
  const porId = new Map();
  for (const decisao of ciclo.production?.decisions ?? []) {
    const prompt = decisao.previous?.prompt;
    if (!prompt) continue;
    const bruto = prompt.match(/\{"id":.*\}/s);
    if (!bruto) continue;
    try {
      const peca = JSON.parse(bruto[0]);
      if (peca.id && !porId.has(peca.id)) porId.set(peca.id, peca);
    } catch {
      // Prompt que não carrega JSON de peça: não é erro, só não serve aqui.
    }
  }

  const pecas = [...porId.values()].sort((a, b) => a.id.localeCompare(b.id));
  if (!pecas.length) throw new Error(`nenhuma peça legível no ciclo ${RUN_ID}`);
  return pecas;
}

/** A legenda traz as hashtags no fim; a tabela guarda as duas separadas. */
function separarHashtags(legenda) {
  const linhas = (legenda ?? '').split('\n');
  const ultima = linhas[linhas.length - 1]?.trim() ?? '';
  if (!ultima.startsWith('#')) return { texto: legenda ?? '', hashtags: null };
  return { texto: linhas.slice(0, -1).join('\n').trim(), hashtags: ultima };
}

/** Acha a arte composta da peça, preferindo a da etapa de layout. */
function acharArte(pecaId) {
  const base = path.join(RAIZ_MIRADOR, 'squads/marca/output/vwpp', RUN_ID);
  const candidatos = [
    path.join(base, 'etapa-09', `${pecaId.toLowerCase()}.png`),
    path.join(base, 'etapa-08', `${pecaId.toLowerCase()}.png`),
  ];
  const direto = candidatos.find((c) => existsSync(c));
  if (direto) return direto;

  // Sem arte nomeada pela peça, qualquer cópia imutável serve de stand-in: o
  // que se está exercitando é a tela, não a correspondência peça↔arte.
  const revisoes = path.join(base, 'revisoes');
  if (!existsSync(revisoes)) return null;
  const png = readdirSync(revisoes).find((f) => f.endsWith('.png'));
  return png ? path.join(revisoes, png) : null;
}

/**
 * Encolhe antes de subir. Os originais têm ~4 MB; numa pauta de nove peças isso
 * é 36 MB para o cliente baixar, boa parte pelo celular. `sips` vem com o
 * macOS; sem ele, sobe o original e avisa.
 */
function reduzir(origem) {
  const destino = path.join(tmpdir(), `arte-${path.basename(origem)}`);
  try {
    copyFileSync(origem, destino);
    execFileSync('sips', ['-Z', String(LARGURA_ARTE), destino], { stdio: 'ignore' });
    return { bytes: readFileSync(destino), reduzido: true, limpar: destino };
  } catch {
    rmSync(destino, { force: true });
    return { bytes: readFileSync(origem), reduzido: false, limpar: null };
  }
}

async function main() {
  const pecas = lerPecas();
  console.log(`Ciclo ${RUN_ID}: ${pecas.length} peça(s).`);

  // Idempotente pelo ciclo de origem: rodar de novo troca a pauta inteira, e o
  // `on delete cascade` leva versões, blocos, itens, arquivos e comentários.
  await supabase.from('pautas').delete().eq('origem_run_id', RUN_ID);

  const token = randomBytes(24).toString('hex');

  const { data: pauta, error: erroPauta } = await supabase
    .from('pautas')
    .insert({
      titulo: 'Dezembro 2026',
      descricao: 'Peças do ciclo de dezembro. Aprove uma a uma ou peça ajuste.',
      cliente: 'VWPP',
      status: 'aguardando_aprovacao',
      origem_run_id: RUN_ID,
      token_publico: token,
      publicado_em: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (erroPauta) throw new Error(`pauta: ${erroPauta.message}`);

  const { data: versao, error: erroVersao } = await supabase
    .from('pauta_versoes')
    .insert({ pauta_id: pauta.id, numero_versao: 1, ativa: true, origem_revision: 1 })
    .select('id')
    .single();
  if (erroVersao) throw new Error(`versão: ${erroVersao.message}`);

  let ordem = 0;
  for (const peca of pecas) {
    ordem += 1;
    console.log(`${peca.id} — ${peca.title}`);

    const { data: bloco, error: erroBloco } = await supabase
      .from('blocos_material')
      .insert({
        versao_id: versao.id,
        tipo_material: 'estatico',
        status: 'enviado_aprovacao',
        ordem,
        origem_peca_id: peca.id,
        data_postagem: peca.date ?? null,
      })
      .select('id')
      .single();
    if (erroBloco) throw new Error(`bloco ${peca.id}: ${erroBloco.message}`);

    const { texto, hashtags } = separarHashtags(peca.caption);
    const { data: item, error: erroItem } = await supabase
      .from('bloco_itens')
      .insert({
        bloco_id: bloco.id,
        titulo: peca.chamada ?? peca.title ?? null,
        texto_conteudo: texto,
        hashtags,
        ordem: 0,
      })
      .select('id')
      .single();
    if (erroItem) throw new Error(`item ${peca.id}: ${erroItem.message}`);

    const arte = acharArte(peca.id);
    if (!arte) {
      console.warn('  · sem arte no disco — peça fica sem imagem');
      continue;
    }

    const imagem = reduzir(arte);
    const nome = `${RUN_ID}/${peca.id.toLowerCase()}.png`;
    const { error: erroUpload } = await supabase.storage
      .from('pauta-arquivos')
      .upload(nome, imagem.bytes, { contentType: 'image/png', upsert: true });
    if (imagem.limpar) rmSync(imagem.limpar, { force: true });
    if (erroUpload) throw new Error(`arte ${peca.id}: ${erroUpload.message}`);

    const publica = supabase.storage.from('pauta-arquivos').getPublicUrl(nome).data.publicUrl;
    const { error: erroArquivo } = await supabase.from('bloco_arquivos').insert({
      item_id: item.id,
      url: publica,
      tipo: 'imagem',
      nome_arquivo: `${peca.id.toLowerCase()}.png`,
      tamanho: imagem.bytes.length,
    });
    if (erroArquivo) throw new Error(`arquivo ${peca.id}: ${erroArquivo.message}`);

    const kb = Math.round(imagem.bytes.length / 1024);
    console.log(`  · arte ${kb} kB${imagem.reduzido ? '' : ' (original)'}`);
  }

  console.log(`\nPauta publicada. O cliente abre em:\n\n  /aprovacao/${token}\n`);
}

main().catch((erro) => {
  console.error(`\nFalhou: ${erro.message}`);
  process.exit(1);
});
