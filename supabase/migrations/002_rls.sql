-- Fase 1: RLS em todas as tabelas
-- Admin = usuário com app_metadata.role = 'admin' (definido só pelo painel/service role).
create or replace function is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

alter table categories    enable row level security;
alter table professionals enable row level security;
alter table plans         enable row level security;
alter table media         enable row level security;
alter table reviews       enable row level security;
alter table events        enable row level security;
alter table briefings     enable row level security;

-- categories: leitura pública, escrita admin
create policy categories_read   on categories for select using (true);
create policy categories_admin  on categories for all to authenticated
  using (is_admin()) with check (is_admin());

-- professionals: público só publicados
create policy professionals_read_public on professionals for select
  using (status = 'published');
create policy professionals_admin on professionals for all to authenticated
  using (is_admin()) with check (is_admin());

-- plans / media: públicos se o profissional está publicado
create policy plans_read_public on plans for select
  using (exists (select 1 from professionals p where p.id = professional_id and p.status = 'published'));
create policy plans_admin on plans for all to authenticated
  using (is_admin()) with check (is_admin());

create policy media_read_public on media for select
  using (exists (select 1 from professionals p where p.id = professional_id and p.status = 'published'));
create policy media_admin on media for all to authenticated
  using (is_admin()) with check (is_admin());

-- reviews: público lê só aprovadas de publicados; insere só como pending
create policy reviews_read_public on reviews for select
  using (status = 'approved'
    and exists (select 1 from professionals p where p.id = professional_id and p.status = 'published'));
create policy reviews_insert_public on reviews for insert to anon, authenticated
  with check (status = 'pending'
    and exists (select 1 from professionals p where p.id = professional_id and p.status = 'published'));
create policy reviews_admin on reviews for all to authenticated
  using (is_admin()) with check (is_admin());

-- events: público só insere (de profissionais publicados); leitura admin
create policy events_insert_public on events for insert to anon, authenticated
  with check (exists (select 1 from professionals p where p.id = professional_id and p.status = 'published'));
create policy events_admin on events for all to authenticated
  using (is_admin()) with check (is_admin());

-- briefings: só admin
create policy briefings_admin on briefings for all to authenticated
  using (is_admin()) with check (is_admin());
