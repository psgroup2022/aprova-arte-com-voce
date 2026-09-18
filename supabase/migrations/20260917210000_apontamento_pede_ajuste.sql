-- Dois defeitos encontrados usando a tela.
--
-- 1. Apontar um ponto na arte não mudava a decisão da peça.
--
--    O formulário pergunta "O que precisa mudar neste ponto?" e o cliente
--    escreve "remover o copo". Isso é pedido de ajuste. Mas a peça continuava
--    marcada como aprovada, e quem apontou saiu achando que tinha pedido a
--    mudança. Observado ao vivo: P01 com três apontamentos e o selo "Aprovada".
--
--    Agora o apontamento decide. Ele é o motivo — por isso `decisao_nota` não é
--    tocada: o texto do pino viaja em `comentarios_pontuais` e a coleta o junta
--    à nota quando manda para o ciclo.
--
--    Quem quiser aprovar mesmo assim continua podendo: o botão "Aprovar assim
--    mesmo" chama `decidir_bloco`, que sobrepõe.
--
-- 2. Faltava o cliente dizer "terminei".
--
--    As decisões eram gravadas uma a uma e recolhidas de 30 em 30 segundos.
--    Nunca havia o momento de entregar — o cliente não sabia se já podia fechar
--    a aba, e a Mirador não sabia se ele tinha acabado ou só parado no meio.

begin;

alter table public.pautas
  add column if not exists revisao_enviada_em timestamptz,
  add column if not exists revisao_enviada_por text;

comment on column public.pautas.revisao_enviada_em is
  'Quando o cliente declarou a revisão terminada. Zerada por qualquer mudança posterior: uma revisão entregue e depois alterada não está mais entregue.';

-- ── Apontar é pedir ajuste ──────────────────────────────────────────────────

create or replace function public.comentar_bloco(
  p_token text, p_bloco_id uuid, p_arquivo_id uuid,
  p_x integer, p_y integer, p_texto text, p_por text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_pauta uuid;
begin
  if coalesce(trim(p_texto), '') = '' then
    raise exception 'O comentário não pode ficar vazio.';
  end if;

  select p.id into v_pauta
  from pautas p
  join pauta_versoes v on v.pauta_id = p.id and v.ativa
  join blocos_material b on b.versao_id = v.id
  where p.token_publico = p_token and b.id = p_bloco_id;

  if v_pauta is null then
    raise exception 'Peça não encontrada neste link.';
  end if;

  insert into comentarios_pontuais
    (pauta_id, bloco_id, arquivo_id, x_coordenada, y_coordenada, comentario, autor_nome)
  values
    (v_pauta, p_bloco_id, p_arquivo_id,
     greatest(0, least(100, coalesce(p_x, 0))),
     greatest(0, least(100, coalesce(p_y, 0))),
     trim(p_texto), nullif(trim(coalesce(p_por, '')), ''));

  -- Marcar um ponto na arte é pedir que ela mude. A peça sai de aprovada ou de
  -- pendente e passa a esperar ajuste; já reprovada, fica como está, para não
  -- sobrescrever quem decidiu antes.
  update blocos_material
  set decisao_status = 'reprovada',
      decisao_por = coalesce(nullif(trim(coalesce(p_por, '')), ''), decisao_por),
      decisao_em = now()
  where id = p_bloco_id and decisao_status is distinct from 'reprovada';

  -- A revisão entregue deixou de valer: o cliente mexeu depois de entregar.
  update pautas set revisao_enviada_em = null, revisao_enviada_por = null
  where id = v_pauta and revisao_enviada_em is not null;

  return public.pauta_publica(p_token);
end;
$$;

-- ── Decidir também reabre a revisão ─────────────────────────────────────────

create or replace function public.decidir_bloco(
  p_token text, p_bloco_id uuid, p_status text, p_nota text, p_por text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_pauta uuid;
begin
  if p_status not in ('aprovada', 'reprovada') then
    raise exception 'Decisão inválida.';
  end if;
  if p_status = 'reprovada' and coalesce(trim(p_nota), '') = '' then
    raise exception 'Diga no comentário o que precisa mudar.';
  end if;
  if coalesce(trim(p_por), '') = '' then
    raise exception 'Identifique quem está revisando.';
  end if;

  select p.id into v_pauta
  from pautas p
  join pauta_versoes v on v.pauta_id = p.id and v.ativa
  join blocos_material b on b.versao_id = v.id
  where p.token_publico = p_token and b.id = p_bloco_id;

  if v_pauta is null then
    raise exception 'Peça não encontrada neste link.';
  end if;

  update blocos_material
  set decisao_status = p_status::decisao_cliente,
      decisao_nota = nullif(trim(coalesce(p_nota, '')), ''),
      decisao_por = trim(p_por),
      decisao_em = now()
  where id = p_bloco_id;

  update pautas set revisao_enviada_em = null, revisao_enviada_por = null
  where id = v_pauta and revisao_enviada_em is not null;

  return public.pauta_publica(p_token);
end;
$$;

-- ── Entregar a revisão ──────────────────────────────────────────────────────

create or replace function public.enviar_revisao(p_token text, p_por text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_pauta uuid; v_pendentes integer; v_reprovadas integer;
begin
  if coalesce(trim(p_por), '') = '' then
    raise exception 'Identifique quem está revisando.';
  end if;

  select p.id into v_pauta
  from pautas p
  join pauta_versoes v on v.pauta_id = p.id and v.ativa
  where p.token_publico = p_token and p_token is not null and length(p_token) >= 32;

  if v_pauta is null then
    raise exception 'Este link não abre nenhuma pauta.';
  end if;

  -- O step-12 só deixa o ciclo seguir com todas as peças decididas. Entregar
  -- pela metade daria à Mirador um sinal que ela não pode usar.
  select count(*) filter (where b.decisao_status = 'pendente'),
         count(*) filter (where b.decisao_status = 'reprovada')
    into v_pendentes, v_reprovadas
  from blocos_material b
  join pauta_versoes v on v.id = b.versao_id
  where v.pauta_id = v_pauta and v.ativa;

  if v_pendentes > 0 then
    raise exception 'Faltam % peça(s) para decidir.', v_pendentes;
  end if;

  update pautas
  set revisao_enviada_em = now(),
      revisao_enviada_por = trim(p_por),
      -- A pauta inteira só é aprovada quando nenhuma peça pede ajuste. O
      -- `::pauta_status` é obrigatório: um `case` devolve `text`, e o Postgres
      -- não converte text para enum sozinho — sem ele a entrega falha inteira.
      status = (case when v_reprovadas > 0 then 'rejeitada' else 'aprovada' end)::pauta_status
  where id = v_pauta;

  return public.pauta_publica(p_token);
end;
$$;

-- ── O cliente precisa ver que entregou ──────────────────────────────────────

create or replace function public.pauta_publica(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'pauta', jsonb_build_object(
      'id', p.id, 'titulo', p.titulo, 'cliente', p.cliente,
      'descricao', p.descricao, 'data_prazo', p.data_prazo, 'status', p.status,
      'revisao_enviada_em', p.revisao_enviada_em,
      'revisao_enviada_por', p.revisao_enviada_por
    ),
    'pecas', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', b.id,
        'peca', b.origem_peca_id,
        'tipo', b.tipo_material,
        'data_postagem', b.data_postagem,
        'ordem', b.ordem,
        'decisao', b.decisao_status,
        'decisao_nota', b.decisao_nota,
        'decisao_por', b.decisao_por,
        'decisao_em', b.decisao_em,
        'chamada', primeiro.titulo,
        'legenda', primeiro.texto_conteudo,
        'hashtags', primeiro.hashtags,
        'arquivos', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', a.id, 'url', a.url, 'tipo', a.tipo, 'nome', a.nome_arquivo,
            'item_ordem', i.ordem, 'item_titulo', i.titulo
          ) order by i.ordem, a.created_at, a.id)
          from bloco_itens i
          join bloco_arquivos a on a.item_id = i.id
          where i.bloco_id = b.id
        ), '[]'::jsonb),
        'comentarios', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', c.id, 'x', c.x_coordenada, 'y', c.y_coordenada,
            'arquivo_id', c.arquivo_id,
            'texto', c.comentario, 'autor', c.autor_nome,
            'resolvido', c.resolvido, 'resposta', c.resposta,
            'criado_em', c.created_at
          ) order by c.created_at, c.id)
          from comentarios_pontuais c where c.bloco_id = b.id
        ), '[]'::jsonb)
      ) order by b.ordem, b.origem_peca_id)
      from blocos_material b
      left join lateral (
        select * from bloco_itens x where x.bloco_id = b.id order by x.ordem, x.id limit 1
      ) primeiro on true
      where b.versao_id = v.id
    ), '[]'::jsonb)
  )
  from pautas p
  join pauta_versoes v on v.pauta_id = p.id and v.ativa
  where p.token_publico = p_token and p_token is not null and length(p_token) >= 32;
$$;

grant execute on function public.pauta_publica(text) to anon, authenticated;
grant execute on function public.enviar_revisao(text, text) to anon, authenticated;

commit;
