-- Fase 5: busca pública e avaliações
create extension if not exists unaccent with schema extensions;

-- Busca: roda como o chamador (security invoker) => a RLS já limita a publicados / avaliações aprovadas.
create or replace function search_professionals(
  p_q text default null,
  p_category text default null,
  p_city text default null,
  p_online boolean default false,
  p_sort text default 'relevance',
  p_limit integer default 12,
  p_offset integer default 0
)
returns table (
  id uuid, slug text, name text, category_name text, category_slug text,
  city text, state text, online boolean, whatsapp text, hero_url text,
  min_price_cents integer, avg_rating numeric, review_count integer, total_count bigint
)
language sql stable security invoker
set search_path = public, extensions
as $$
  with base as (
    select
      p.id, p.slug, p.name, c.name as category_name, c.slug as category_slug,
      p.city, p.state, p.online, p.whatsapp,
      (select s->'image'->>'url' from jsonb_array_elements(p.sections) s where s->>'type' = 'hero' limit 1) as hero_url,
      -- "a partir de": menor preço mensal equivalente entre os planos com preço
      (select min(round((i->>'priceCents')::numeric / greatest(coalesce((i->>'periodMonths')::int, 1), 1)))::int
         from jsonb_array_elements(p.sections) s,
              jsonb_array_elements(case when jsonb_typeof(s->'items') = 'array' then s->'items' else '[]'::jsonb end) i
        where s->>'type' = 'plans'
          and coalesce((s->>'enabled')::boolean, true)
          and i->>'priceCents' is not null) as min_price_cents,
      r.avg_rating,
      coalesce(r.review_count, 0)::int as review_count
    from professionals p
    left join categories c on c.id = p.category_id
    left join lateral (
      select round(avg(rv.rating)::numeric, 1) as avg_rating, count(*) as review_count
      from reviews rv where rv.professional_id = p.id and rv.status = 'approved'
    ) r on true
    where p.status = 'published'
      and (coalesce(p_category, '') = '' or c.slug = p_category)
      and (not p_online or p.online)
      and (coalesce(p_city, '') = '' or unaccent(coalesce(p.city, '')) ilike '%' || unaccent(p_city) || '%')
      and (coalesce(p_q, '') = ''
           or unaccent(p.name || ' ' || coalesce(p.city, '') || ' ' || coalesce(c.name, '')) ilike '%' || unaccent(p_q) || '%')
  )
  select base.*, count(*) over () as total_count
  from base
  order by
    case when p_sort = 'price' then min_price_cents end asc nulls last,
    case when p_sort = 'name' then name end asc,
    case when p_sort in ('relevance', 'rating') then avg_rating end desc nulls last,
    case when p_sort in ('relevance', 'rating') then review_count end desc,
    name asc
  limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0)
$$;

grant execute on function search_professionals to anon, authenticated;

-- Envio de avaliação: único caminho público de escrita em `reviews`.
-- Força status 'pending' e aplica limite por IP (hash): 1 por profissional/24h e 5 no total/24h.
create index if not exists reviews_ip_idx on reviews (ip_hash, created_at);

create or replace function submit_review(
  p_professional uuid, p_author text, p_rating integer, p_comment text, p_ip_hash text
) returns text
language plpgsql security definer
set search_path = public
as $$
begin
  if not exists (select 1 from professionals where id = p_professional and status = 'published') then
    return 'not_found';
  end if;
  if p_rating not between 1 and 5
     or char_length(trim(coalesce(p_author, ''))) not between 1 and 80
     or char_length(coalesce(p_comment, '')) > 1000
     or coalesce(p_ip_hash, '') = '' then
    return 'invalid';
  end if;
  if exists (select 1 from reviews where professional_id = p_professional and ip_hash = p_ip_hash
             and created_at > now() - interval '24 hours')
     or (select count(*) from reviews where ip_hash = p_ip_hash and created_at > now() - interval '24 hours') >= 5 then
    return 'rate_limited';
  end if;
  insert into reviews (professional_id, author_name, rating, comment, status, ip_hash)
  values (p_professional, trim(p_author), p_rating, nullif(trim(coalesce(p_comment, '')), ''), 'pending', p_ip_hash);
  return 'ok';
end $$;

revoke all on function submit_review from public;
grant execute on function submit_review to anon, authenticated;

-- Escrita direta de avaliações pelo público deixa de existir (só via submit_review).
drop policy if exists reviews_insert_public on reviews;
