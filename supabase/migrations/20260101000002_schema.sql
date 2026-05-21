-- =============================================================
-- Drift Kart Brasil — Schema principal
-- =============================================================

-- Modalidades de sessão (Bateria 25min, 40min, 60min Grupo)
create table modalidades (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  duracao_min int not null check (duracao_min > 0),
  capacidade_max int not null check (capacidade_max > 0),
  preco_cheio_cents int not null check (preco_cheio_cents > 0),
  preco_promo_cents int check (preco_promo_cents > 0),
  sinal_percent int not null default 30 check (sinal_percent between 1 and 100),
  exclusiva bool not null default false,    -- true = sessão ocupa pista inteira
  ativa bool not null default true,
  created_at timestamptz default now()
);

-- Grade de horários operacionais (recorrentes e exceções)
create table grade_horarios (
  id uuid primary key default uuid_generate_v4(),
  dia_semana int check (dia_semana between 0 and 6),  -- 0=dom..6=sab, null se exceção
  data_excecao date,                                    -- null se recorrente
  hora_inicio time not null,
  hora_fim time not null,
  ativo bool not null default true,
  constraint chk_grade_tipo check (
    (dia_semana is not null and data_excecao is null) or
    (dia_semana is null and data_excecao is not null)
  )
);

-- Clientes (deduplicados por telefone)
create table clientes (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  telefone text not null,           -- normalizado: só dígitos com DDD (11976626414)
  email text,                        -- só do organizador
  is_organizador bool not null default false,
  observacoes_internas text,
  created_at timestamptz default now(),
  unique (telefone)
);

-- Karts ativos (slots lógicos — admin configura quantos estão disponíveis)
create table karts (
  id smallint primary key,           -- 1..N (default 1..4)
  apelido text,                       -- "Kart 01 — Verde", etc.
  ativo bool not null default true,
  observacao text,
  updated_at timestamptz default now()
);

-- Reservas principais
create table reservas (
  id uuid primary key default uuid_generate_v4(),
  modalidade_id uuid not null references modalidades(id),
  cliente_organizador_id uuid not null references clientes(id),
  inicio_at timestamptz not null,
  fim_at timestamptz not null,
  janela tstzrange generated always as
    (tstzrange(inicio_at, fim_at, '[)')) stored,
  status text not null check (status in
    ('aguardando_sinal','confirmada','cancelada','no_show','concluida')),
  nivel_experiencia text check (nivel_experiencia in
    ('iniciante','ja_tive_contato')),
  exclusiva bool not null default false,  -- true = sessão exclusiva (grupo 1h)
  pilotos_count int not null check (pilotos_count > 0),
  total_cents int not null check (total_cents > 0),
  sinal_cents int not null check (sinal_cents > 0),
  sinal_pago_at timestamptz,
  pagamento_id text,
  termo_aceito_em timestamptz,
  ciente_sinal_nao_reembolsavel_em timestamptz,
  expires_at timestamptz,            -- TTL pra aguardando_sinal (default now() + 24h)
  motivo_cancelamento text,
  cancelado_por uuid,                -- actor_user_id do admin que cancelou
  created_at timestamptz default now(),
  constraint chk_janela_valida check (fim_at > inicio_at)
);

-- Pilotos de cada reserva (1 por participante)
create table reserva_pilotos (
  id uuid primary key default uuid_generate_v4(),
  reserva_id uuid not null references reservas(id) on delete cascade,
  cliente_id uuid not null references clientes(id),
  presenca text not null default 'pendente'
    check (presenca in ('pendente','presente','no_show'))
);

-- Alocação de kart por piloto durante a janela da reserva.
-- Esta é a tabela que garante que o mesmo kart não pode ser alocado duas vezes
-- em janelas sobrepostas (constraint EXCLUDE via GiST).
create table kart_alocacoes (
  id uuid primary key default uuid_generate_v4(),
  reserva_id uuid not null references reservas(id) on delete cascade,
  kart_id smallint not null references karts(id),
  janela tstzrange not null,
  -- Denormalizado para uso no WHERE da constraint EXCLUDE (parcial)
  status_reserva text not null check (status_reserva in
    ('aguardando_sinal','confirmada','cancelada','no_show','concluida')),
  -- REGRA CENTRAL: mesmo kart não pode ter 2 alocações ativas com janelas sobrepostas
  exclude using gist (
    kart_id with =,
    janela with &&
  ) where (status_reserva in ('aguardando_sinal','confirmada'))
);

create index idx_kart_alocacoes_reserva on kart_alocacoes(reserva_id);
create index idx_kart_alocacoes_kart_janela on kart_alocacoes using gist (kart_id, janela);
create index idx_reservas_inicio on reservas(inicio_at);
create index idx_reservas_status on reservas(status);
create index idx_reservas_janela on reservas using gist (janela);

-- Leads de aulas/eventos/aniversários
create table leads (
  id uuid primary key default uuid_generate_v4(),
  tipo text not null check (tipo in ('aula','aniversario','corporativo')),
  nome text not null,
  telefone text,
  email text,
  data_desejada date,
  participantes int,
  mensagem text,
  status text not null default 'novo'
    check (status in ('novo','em_contato','convertido','perdido')),
  created_at timestamptz default now()
);

-- Configurações globais do sistema
create table configuracoes (
  chave text primary key,
  valor text not null,
  descricao text
);

-- Audit log de ações administrativas
create table audit_log (
  id bigserial primary key,
  actor_user_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  diff jsonb,
  created_at timestamptz default now()
);

create index idx_audit_log_entity on audit_log(entity, entity_id);
create index idx_audit_log_actor on audit_log(actor_user_id);

-- =============================================================
-- Trigger: mantém status_reserva em kart_alocacoes sincronizado
-- com reservas.status (necessário para a constraint EXCLUDE parcial)
-- =============================================================
create or replace function sync_kart_alocacao_status()
returns trigger
language plpgsql
as $$
begin
  update kart_alocacoes
    set status_reserva = new.status
    where reserva_id = new.id;
  return new;
end;
$$;

create trigger trg_sync_kart_status
  after update of status on reservas
  for each row
  execute function sync_kart_alocacao_status();

-- =============================================================
-- Trigger: atualiza updated_at em karts
-- =============================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_karts_updated_at
  before update on karts
  for each row
  execute function set_updated_at();
