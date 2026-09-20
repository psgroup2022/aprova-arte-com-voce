import { describe, expect, it } from 'vitest';
// @ts-expect-error script de build em JS puro, sem tipos
import {
  ehLocal,
  lerEnv,
  papelDaChave,
  resolverAmbiente,
  veredito,
} from '../../scripts/conferir-ambiente.mjs';

/** JWT sintético, só com o corpo que importa. Assinatura não é verificada. */
const jwt = (papel: string) =>
  `cabecalho.${Buffer.from(JSON.stringify({ role: papel })).toString('base64url')}.assinatura`;

const REMOTO = 'https://exemplo.supabase.co';
const LOCAL = 'http://127.0.0.1:54321';

const producao = (over: Record<string, unknown> = {}) => ({
  modo: 'production',
  permitirLocal: false,
  temChave: true,
  origem: '.env.local',
  ...over,
});

describe('conferir-ambiente', () => {
  it('reconhece endereço local em qualquer das formas', () => {
    expect(ehLocal(LOCAL)).toBe(true);
    expect(ehLocal('http://localhost:8080')).toBe(true);
    expect(ehLocal(REMOTO)).toBe(false);
    expect(ehLocal('')).toBe(false);
  });

  // O defeito real: as variáveis existiam, só apontavam para o ambiente de
  // desenvolvimento. Uma checagem de "está preenchido?" não teria pego.
  it('recusa build de produção contra endereço local', () => {
    const r = veredito(producao({ url: LOCAL }));
    expect(r.ok).toBe(false);
    expect(r.mensagem).toMatch(/endereço local/);
  });

  it('aceita build de produção contra endereço remoto', () => {
    expect(veredito(producao({ url: REMOTO })).ok).toBe(true);
  });

  it('recusa quando falta a chave, mesmo com URL remota', () => {
    expect(veredito(producao({ url: REMOTO, temChave: false })).ok).toBe(false);
  });

  it('a saída de emergência libera o endereço local', () => {
    expect(veredito(producao({ url: LOCAL, permitirLocal: true })).ok).toBe(true);
  });

  it('build de desenvolvimento não é conferido', () => {
    expect(veredito(producao({ url: LOCAL, modo: 'development' })).ok).toBe(true);
  });

  // A precedência é o que decide qual valor entra no bundle. Errar a ordem
  // aqui faria a trava aprovar um build que vai quebrar.
  it('.env.local vence .env, e a linha de comando vence os dois', () => {
    const arquivos = {
      '.env': { VITE_SUPABASE_URL: REMOTO, VITE_SUPABASE_ANON_KEY: 'a' },
      '.env.local': { VITE_SUPABASE_URL: LOCAL, VITE_SUPABASE_ANON_KEY: 'a' },
    };

    const semShell = resolverAmbiente({ modo: 'production', arquivos });
    expect(semShell.url).toBe(LOCAL);
    expect(semShell.origem).toBe('.env.local');

    const comShell = resolverAmbiente({
      modo: 'production',
      arquivos,
      shell: { VITE_SUPABASE_URL: REMOTO },
    });
    expect(comShell.url).toBe(REMOTO);
    expect(comShell.origem).toBe('linha de comando');
  });

  it('.env.production vence .env.local', () => {
    const { url, origem } = resolverAmbiente({
      modo: 'production',
      arquivos: {
        '.env.local': { VITE_SUPABASE_URL: LOCAL, VITE_SUPABASE_ANON_KEY: 'a' },
        '.env.production': { VITE_SUPABASE_URL: REMOTO, VITE_SUPABASE_ANON_KEY: 'a' },
      },
    });
    expect(url).toBe(REMOTO);
    expect(origem).toBe('.env.production');
  });

  // A anon e a service_role são strings parecidas. A troca não daria erro:
  // o build passaria e o site funcionaria, melhor do que deveria.
  it('lê o papel declarado dentro do JWT', () => {
    expect(papelDaChave(jwt('anon'))).toBe('anon');
    expect(papelDaChave(jwt('service_role'))).toBe('service_role');
    expect(papelDaChave('nao-e-jwt')).toBe('');
    expect(papelDaChave('')).toBe('');
  });

  it('recusa chave service_role, que ignora o RLS', () => {
    const r = veredito(producao({ url: REMOTO, papel: 'service_role' }));
    expect(r.ok).toBe(false);
    expect(r.mensagem).toMatch(/ignora o RLS/);
  });

  // O bundle sai da máquina mesmo num build de desenvolvimento.
  it('recusa service_role também fora de produção', () => {
    expect(veredito(producao({ url: REMOTO, papel: 'service_role', modo: 'development' })).ok).toBe(
      false,
    );
  });

  it('aceita a chave anon', () => {
    expect(veredito(producao({ url: REMOTO, papel: 'anon' })).ok).toBe(true);
  });

  it('resolverAmbiente devolve o papel, nunca a chave', () => {
    const r = resolverAmbiente({
      modo: 'production',
      arquivos: {
        '.env.production': { VITE_SUPABASE_URL: REMOTO, VITE_SUPABASE_ANON_KEY: jwt('anon') },
      },
    });
    expect(r.papel).toBe('anon');
    expect(r.temChave).toBe(true);
    expect(JSON.stringify(r)).not.toContain('assinatura');
  });

  it('lê pares com aspas e ignora comentário', () => {
    const vars = lerEnv('# nota\nVITE_SUPABASE_URL="https://x.supabase.co"\nVAZIO\n');
    expect(vars.VITE_SUPABASE_URL).toBe('https://x.supabase.co');
    expect(Object.keys(vars)).toHaveLength(1);
  });
});
