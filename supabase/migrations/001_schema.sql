-- Fase 1: schema base
create extension if not exists pgcrypto;

create type professional_status as enum ('draft', 'published');
create type media_kind as enum ('hero', 'about', 'results', 'testimonials', 'logo');
create type review_status as enum ('pending', 'approved', 'rejected');
create type event_type as enum ('view', 'whatsapp_click', 'checkout_click');

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  registry_label text,           -- ex.: CREF, CRP, CRN (null = sem registro)
  is_health boolean not null default false
);

create table professionals (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
    check (slug not in ('admin', 'api', 'busca', 'login', 'categorias')),
  status professional_status not null default 'draft',
  category_id uuid references categories(id) on delete set null,
  name text not null default '',
  registry text,
  city text,
  state text,
  online boolean not null default false,
  whatsapp text,
  instagram text,
  email text,
  cnpj text,
  theme jsonb not null default '{}'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index professionals_status_idx on professionals(status);
create index professionals_category_idx on professionals(category_id);
create index professionals_city_idx on professionals(lower(city));
create trigger professionals_updated_at before update on professionals
  for each row execute function set_updated_at();

create table plans (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id) on delete cascade,
  name text not null default '',
  price_cents integer check (price_cents is null or price_cents >= 0),
  period_label text,
  features text[] not null default '{}',
  checkout_url text,
  highlighted boolean not null default false,
  position integer not null default 0
);
create index plans_professional_idx on plans(professional_id, position);

create table media (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id) on delete cascade,
  storage_path text not null,
  kind media_kind not null,
  position integer not null default 0,
  alt text
);
create index media_professional_idx on media(professional_id, kind, position);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 80),
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  status review_status not null default 'pending',
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index reviews_professional_status_idx on reviews(professional_id, status);

create table events (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(id) on delete cascade,
  type event_type not null,
  created_at timestamptz not null default now()
);
create index events_professional_idx on events(professional_id, type, created_at);

create table briefings (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid references professionals(id) on delete cascade,
  raw_text text not null,
  ai_output jsonb,
  created_at timestamptz not null default now()
);
