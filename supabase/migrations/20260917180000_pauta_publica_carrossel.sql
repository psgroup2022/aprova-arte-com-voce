-- Fase 3 — o cliente precisa ver a peça inteira.
--
-- `pauta_publica` da baseline pegava um único `bloco_itens` por peça:
--
--   left join lateral (select * from bloco_itens x where x.bloco_id = b.id
--                      order by x.ordem limit 1) i on true
--
-- Num carrossel de três slides o cliente recebia um. Medido: 3 slides e 3 artes
-- no banco, `arquivos` devolvia 1. Ele aprovaria a peça tendo visto um terço
-- dela — e a decisão voltaria ao ciclo como se fosse sobre a peça toda.
--
-- Agora `arquivos` junta as artes de todos os itens. `chamada` e `legenda`
-- continuam vindo do primeiro item, que é onde a peça guarda seu texto; o que
-- os outros itens carregam de próprio viaja junto de cada arte, em `item_*`,
-- para a tela poder rotular "Slide 2" sem uma segunda consulta.
--
-- A ordem também estava frouxa: `order by a.created_at` entre artes inseridas
-- na mesma instrução dá empate, e slide fora de ordem é carrossel errado.
-- Agora ordena por item e desempata pelo id, que é estável.
--
-- `arquivo_id` entra em cada comentário: sem ele a tela não sabe sobre qual
-- arte da peça o pino foi cravado, e com carrossel isso deixou de ser óbvio.

create or replace function public.pauta_publica(p_token text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'pauta', jsonb_build_object(
      'id', p.id, 'titulo', p.titulo, 'cliente', p.cliente,
      'descricao', p.descricao, 'data_prazo', p.data_prazo, 'status', p.status
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
            -- Posição do item dono desta arte: 0 é o primeiro. Só interessa
            -- quando a peça tem mais de um — aí vira "Slide 2", "Cena 3".
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

-- `create or replace` preserva os grants, mas deixar explícito evita que uma
-- futura troca de assinatura derrube o acesso do cliente em silêncio.
grant execute on function public.pauta_publica(text) to anon, authenticated;
