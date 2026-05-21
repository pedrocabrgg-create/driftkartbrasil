-- =============================================================
-- Row Level Security (RLS)
-- =============================================================

alter table modalidades       enable row level security;
alter table grade_horarios    enable row level security;
alter table clientes          enable row level security;
alter table karts             enable row level security;
alter table reservas          enable row level security;
alter table reserva_pilotos   enable row level security;
alter table kart_alocacoes    enable row level security;
alter table leads             enable row level security;
alter table configuracoes     enable row level security;
alter table audit_log         enable row level security;

-- =============================================================
-- Helper: verifica se o usuário autenticado tem role admin
-- =============================================================
create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role',
    ''
  ) = any(array['owner','staff','instrutor'])
$$;

-- =============================================================
-- Modalidades: qualquer um pode ler; só admin escreve
-- =============================================================
create policy "modalidades_read_all"
  on modalidades for select
  using (true);

create policy "modalidades_admin_write"
  on modalidades for all
  using (is_admin())
  with check (is_admin());

-- =============================================================
-- Grade de horários: leitura pública; escrita admin
-- =============================================================
create policy "grade_read_all"
  on grade_horarios for select
  using (true);

create policy "grade_admin_write"
  on grade_horarios for all
  using (is_admin())
  with check (is_admin());

-- =============================================================
-- Karts: leitura pública (pra mostrar capacidade); escrita admin
-- =============================================================
create policy "karts_read_all"
  on karts for select
  using (true);

create policy "karts_admin_write"
  on karts for all
  using (is_admin())
  with check (is_admin());

-- =============================================================
-- Configurações: leitura pública; escrita admin
-- =============================================================
create policy "configuracoes_read_all"
  on configuracoes for select
  using (true);

create policy "configuracoes_admin_write"
  on configuracoes for all
  using (is_admin())
  with check (is_admin());

-- =============================================================
-- Clientes: usuário lê/atualiza só o próprio; admin vê todos
-- =============================================================
create policy "clientes_own_read"
  on clientes for select
  using (
    is_admin()
    or id = auth.uid()
  );

create policy "clientes_own_insert"
  on clientes for insert
  with check (true);   -- insert via service role na criação de reserva

create policy "clientes_admin_update"
  on clientes for update
  using (is_admin())
  with check (is_admin());

-- =============================================================
-- Reservas: organizador vê as próprias; admin vê todas
-- Mutações financeiras APENAS via service role (não passam pelo RLS)
-- =============================================================
create policy "reservas_read_own"
  on reservas for select
  using (
    is_admin()
    or cliente_organizador_id = auth.uid()
  );

-- Insert/Update/Delete via service role somente (no server action)

-- =============================================================
-- Reserva pilotos: organizador vê as próprias; admin vê todas
-- =============================================================
create policy "reserva_pilotos_read"
  on reserva_pilotos for select
  using (
    is_admin()
    or exists (
      select 1 from reservas r
      where r.id = reserva_pilotos.reserva_id
        and r.cliente_organizador_id = auth.uid()
    )
  );

-- =============================================================
-- Kart alocações: admin e service role apenas
-- =============================================================
create policy "kart_alocacoes_admin"
  on kart_alocacoes for select
  using (is_admin());

-- =============================================================
-- Leads: insert público; leitura/escrita admin
-- =============================================================
create policy "leads_insert_public"
  on leads for insert
  with check (true);

create policy "leads_admin_read"
  on leads for select
  using (is_admin());

create policy "leads_admin_update"
  on leads for update
  using (is_admin())
  with check (is_admin());

-- =============================================================
-- Audit log: só admin lê; insert apenas via service role
-- =============================================================
create policy "audit_admin_read"
  on audit_log for select
  using (is_admin());
