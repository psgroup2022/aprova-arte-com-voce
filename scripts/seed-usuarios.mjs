// Cria as contas da equipe e seus perfis.
//
// Fazer isto por script, e não pela tela, é decisão da Fase 2: criar usuário
// exige a chave `service_role`, que dá poder total sobre o banco e por isso não
// pode chegar ao navegador. A tela de Equipe administra quem já existe.
//
// É idempotente. Rodar de novo não redefine senha de quem já entrou nem devolve
// alguém ao estado de senha provisória — só preenche o que falta. É assim que se
// leva a equipe para um ambiente novo (o hospedado, mais tarde): apontar as
// variáveis para lá e rodar.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SEED_SENHA_INICIAL=... \
//     npm run seed:usuarios
//
// A senha não mora neste arquivo. Ela entra pelo ambiente e é descartada quando
// cada pessoa troca no primeiro acesso.

import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { readFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * A equipe. `avatar` aponta para os retratos que já existem no Mirador Team —
 * o pipeline chama o Rafael de `rafa` e a Carolina de `carol`, e o arquivo
 * conserva esses nomes; o que a pessoa lê é `nome`.
 */
const EQUIPE = [
  { email: 'jean@mirador360.com.br', nome: 'Jean', papel: 'admin', avatar: 'jean.png' },
  { email: 'rafael@mirador360.com.br', nome: 'Rafael', papel: 'membro', avatar: 'rafa.png' },
  { email: 'pedro@mirador360.com.br', nome: 'Pedro', papel: 'membro', avatar: 'pedro.png' },
  {
    email: 'isadora.carrard@mirador360.com.br',
    nome: 'Isadora Carrard',
    papel: 'membro',
    avatar: 'isadora.png',
  },
  {
    email: 'carlos.salamoni@mirador360.com.br',
    nome: 'Carlos Salamoni',
    papel: 'membro',
    avatar: 'carlos.png',
  },
  {
    email: 'carolina.cramer@mirador360.com.br',
    nome: 'Carolina Cramer',
    papel: 'membro',
    avatar: 'carol.png',
  },
];

const ORIGEM_AVATARES = path.resolve(import.meta.dirname, '../../Mirador Team');
const LADO_AVATAR = 256;

const url = process.env.SUPABASE_URL;
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
const senha = process.env.SEED_SENHA_INICIAL;

if (!url || !chave || !senha) {
  console.error(
    [
      'Faltam variáveis. Rode assim:',
      '',
      '  SUPABASE_URL=<API_URL> \\',
      '  SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY> \\',
      '  SEED_SENHA_INICIAL=<senha inicial> \\',
      '  npm run seed:usuarios',
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
 * Encolhe o retrato antes de subir.
 *
 * Os originais têm ~1,6 MB cada, para um círculo de 48 px na lista. Seis deles
 * são 10 MB de tráfego por visita à tela de Equipe. `sips` vem com o macOS;
 * onde ele não existir, sobe o original e diz que subiu — melhor um avatar
 * pesado do que um seed que só roda em uma máquina.
 */
function reduzir(origem) {
  const bytesOriginais = readFileSync(origem);
  const destino = path.join(tmpdir(), `avatar-${path.basename(origem)}`);
  try {
    copyFileSync(origem, destino);
    execFileSync('sips', ['-Z', String(LADO_AVATAR), destino], { stdio: 'ignore' });
    return { bytes: readFileSync(destino), reduzido: true, limpar: destino };
  } catch {
    rmSync(destino, { force: true });
    return { bytes: bytesOriginais, reduzido: false, limpar: null };
  }
}

/** Sobe o retrato e devolve a URL pública, ou null se o arquivo não estiver lá. */
async function subirAvatar(pessoa) {
  const origem = path.join(ORIGEM_AVATARES, pessoa.avatar);
  let imagem;
  try {
    imagem = reduzir(origem);
  } catch {
    console.warn(`  · avatar ausente em ${origem} — perfil fica sem retrato`);
    return null;
  }

  const destino = `${pessoa.email.split('@')[0]}.png`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(destino, imagem.bytes, { contentType: 'image/png', upsert: true });
  if (imagem.limpar) rmSync(imagem.limpar, { force: true });
  if (error) throw new Error(`avatar de ${pessoa.email}: ${error.message}`);

  const kb = Math.round(imagem.bytes.length / 1024);
  console.log(`  · avatar ${destino} (${kb} kB${imagem.reduzido ? '' : ', original'})`);
  return supabase.storage.from('avatars').getPublicUrl(destino).data.publicUrl;
}

/** Devolve o id da conta, criando-a apenas se ainda não existir. */
async function garantirConta(pessoa, existentes) {
  const atual = existentes.get(pessoa.email);
  if (atual) {
    console.log('  · conta já existe — senha preservada');
    return atual;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email: pessoa.email,
    password: senha,
    email_confirm: true,
  });
  if (error) throw new Error(`conta de ${pessoa.email}: ${error.message}`);
  console.log('  · conta criada com a senha inicial');
  return data.user.id;
}

async function main() {
  const { data: lista, error: erroLista } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (erroLista) throw new Error(`não consegui listar as contas: ${erroLista.message}`);
  const existentes = new Map(lista.users.map((u) => [u.email, u.id]));

  for (const pessoa of EQUIPE) {
    console.log(`${pessoa.nome} <${pessoa.email}> — ${pessoa.papel}`);
    const authUserId = await garantirConta(pessoa, existentes);
    const avatarUrl = await subirAvatar(pessoa);

    // `senha_provisoria` fica de fora do upsert: quem já trocou não volta a ser
    // cobrado. O default da coluna é `true`, então quem nasce agora é cobrado.
    const { data: perfil, error: erroPerfil } = await supabase
      .from('profiles')
      .upsert(
        {
          auth_user_id: authUserId,
          email: pessoa.email,
          nome: pessoa.nome,
          papel: pessoa.papel,
          ativo: true,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        },
        { onConflict: 'auth_user_id' },
      )
      .select('senha_provisoria')
      .single();
    if (erroPerfil) throw new Error(`perfil de ${pessoa.email}: ${erroPerfil.message}`);
    console.log(
      `  · perfil gravado — ${perfil.senha_provisoria ? 'troca de senha pendente' : 'senha já trocada'}`,
    );
  }

  console.log(`\n${EQUIPE.length} pessoas prontas.`);
}

main().catch((erro) => {
  console.error(`\nFalhou: ${erro.message}`);
  process.exit(1);
});
