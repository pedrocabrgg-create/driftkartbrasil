-- =============================================================
-- Tabela de gerenciamento de mídia (imagens e vídeos)
-- =============================================================
create table media (
  id        uuid    primary key default uuid_generate_v4(),
  nome      text    not null,
  tipo      text    not null check (tipo in ('imagem', 'video')),
  url       text    not null,            -- URL pública (storage ou /images/xxx)
  storage_path text,                     -- path no bucket (null = arquivo estático legado)
  alt       text    not null default '',
  categoria text    not null default 'galeria'
              check (categoria in ('galeria', 'hero', 'video_intro', 'outro')),
  posicao   int     not null default 0,
  ativo     bool    not null default true,
  tamanho_bytes bigint,
  created_at timestamptz default now()
);

create index idx_media_categoria_posicao on media(categoria, posicao) where ativo = true;

-- RLS
alter table media enable row level security;

create policy "media_read_public"
  on media for select using (true);

create policy "media_admin_write"
  on media for all
  using (is_admin())
  with check (is_admin());

-- =============================================================
-- Storage bucket: instruções para criar via dashboard Supabase
-- Bucket name: "media", public: true
-- Storage RLS policies (aplicar no dashboard):
--   INSERT: bucket_id = 'media' AND (select is_admin())
--   DELETE: bucket_id = 'media' AND (select is_admin())
--   SELECT: bucket_id = 'media'
-- =============================================================
