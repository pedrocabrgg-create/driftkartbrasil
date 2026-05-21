-- =============================================================
-- Posts de blog com suporte a SEO e carrossel Instagram
-- =============================================================

create table posts (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  slug text not null unique,
  resumo text not null,
  conteudo text not null,
  capa_url text,
  status text not null default 'rascunho'
    check (status in ('sugestao', 'rascunho', 'publicado')),
  -- SEO
  meta_title text,
  meta_description text,
  -- Instagram
  carrossel_urls text[] not null default '{}',
  instagram_post_id text,
  instagram_publicado_at timestamptz,
  -- Datas
  publicado_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_posts_status on posts(status);
create index idx_posts_slug on posts(slug);
create index idx_posts_publicado_at on posts(publicado_at desc);

-- Trigger updated_at
create trigger trg_posts_updated_at
  before update on posts
  for each row
  execute function set_updated_at();

-- RLS: leitura pública apenas para posts publicados
alter table posts enable row level security;

create policy "posts_public_read"
  on posts for select
  using (status = 'publicado');

create policy "posts_admin_all"
  on posts for all
  using (auth.role() = 'service_role');
