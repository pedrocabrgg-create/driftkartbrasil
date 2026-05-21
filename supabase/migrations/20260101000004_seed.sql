-- =============================================================
-- Seed inicial — Drift Kart Brasil
-- =============================================================

-- Modalidades (preços confirmados pelo cliente)
insert into modalidades (nome, duracao_min, capacidade_max, preco_cheio_cents, preco_promo_cents, sinal_percent, exclusiva, ativa)
values
  (
    'Bateria 25 minutos',
    25,
    4,        -- máx 4 karts em paralelo
    8000,     -- R$ 80,00
    null,
    30,
    false,
    true
  ),
  (
    'Bateria 40 minutos',
    40,
    4,
    12000,    -- R$ 120,00
    null,
    30,
    false,
    true
  ),
  (
    'Bateria 60 minutos — Grupo',
    60,
    10,       -- até 10 pessoas
    25000,    -- R$ 250,00 (a confirmar valor real)
    null,
    30,
    true,     -- exclusiva = ocupa pista inteira
    true
  );

-- Grade de horários padrão
-- 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sáb
insert into grade_horarios (dia_semana, data_excecao, hora_inicio, hora_fim, ativo)
values
  (4, null, '16:00', '23:00', true),  -- Qui
  (5, null, '16:00', '23:00', true),  -- Sex
  (6, null, '09:00', '21:00', true),  -- Sáb
  (0, null, '12:00', '21:00', true);  -- Dom

-- Karts (4 slots lógicos, todos ativos)
insert into karts (id, apelido, ativo)
values
  (1, 'Kart 01', true),
  (2, 'Kart 02', true),
  (3, 'Kart 03', true),
  (4, 'Kart 04', true);

-- Configurações globais
insert into configuracoes (chave, valor, descricao)
values
  ('altura_min_cm',        '130',  'Altura mínima para participar (cm)'),
  ('buffer_entre_sessoes', '10',   'Buffer de troca de bateria/limpeza entre sessões (min)'),
  ('granularidade_slot',   '15',   'Granularidade dos slots do calendário (min)'),
  ('sinal_pct',            '30',   'Percentual do sinal obrigatório para confirmação'),
  ('sinal_reembolsavel',   'false','Se o sinal é reembolsável em caso de cancelamento'),
  ('ttl_aguardando_sinal', '1440', 'TTL da reserva aguardando sinal (minutos, default 24h)'),
  ('whatsapp_numero',      '5511976626414', 'Número do WhatsApp do estabelecimento'),
  ('pix_chave',            '',     'Chave Pix do estabelecimento (a confirmar com o cliente)');
