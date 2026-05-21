-- =============================================================
-- Conteúdo editável do site via painel admin
-- =============================================================

-- Adiciona campos de apresentação às modalidades
alter table modalidades
  add column if not exists descricao text not null default '',
  add column if not exists destaque text;   -- null = sem badge | 'MAIS ESCOLHIDO', etc.

-- Seed das descrições das modalidades existentes
update modalidades set
  descricao = 'Perfeito para a primeira vez. Sinta a adrenalina do kart elétrico.',
  destaque = null
where duracao_min = 25;

update modalidades set
  descricao = 'Mais tempo para evoluir a técnica e disputar com amigos.',
  destaque = 'MAIS ESCOLHIDO'
where duracao_min = 40;

update modalidades set
  descricao = 'Pista exclusiva para o seu grupo — ideal para aniversários e eventos.',
  destaque = 'GRUPO EXCLUSIVO'
where duracao_min = 60;

-- Seed do conteúdo de texto editável no site
insert into configuracoes (chave, valor, descricao) values
  ('site_descricao_footer',    'Kart elétrico indoor em Barueri/SP. Aulas, sessões, aniversários e eventos.',         'Texto de descrição no rodapé'),
  ('site_endereco_rua',        'Estr. Dr. Cícero Borges de Morais, 100 B',                                            'Endereço — linha 1'),
  ('site_endereco_complemento','Jardim Regina Alice — Barueri/SP',                                                    'Endereço — linha 2'),
  ('site_endereco_cep',        '06407-000',                                                                           'CEP'),
  ('site_instagram',           'driftkartbrasil',                                                                     'Handle do Instagram (sem @)'),
  ('site_whatsapp_display',    '(11) 97662-6414',                                                                     'WhatsApp formatado para exibição'),
  ('site_sobre_titulo',        'Apaixonados por kart desde sempre',                                                   'Título da seção Quem Somos'),
  ('site_sobre_texto_1',       'Nossa equipe é formada por instrutores experientes e amantes do automobilismo. Estamos aqui para garantir que você viva a melhor experiência possível na pista — com segurança, técnica e muita adrenalina.', 'Seção Quem Somos — parágrafo 1'),
  ('site_sobre_texto_2',       'Crianças, adultos, iniciantes ou experientes: temos a sessão certa para você.',        'Seção Quem Somos — parágrafo 2'),
  ('site_numeros_karts',       '5',                                                                                    'Quantidade de karts exibida na home'),
  ('site_nota_fechamento',     'Segunda, terça e quarta: fechado. Reserve com antecedência.',                         'Nota de dias fechados exibida nos horários'),
  ('site_cta_titulo',          'Pronto para acelerar?',                                                               'Título do CTA final da home'),
  ('site_cta_subtitulo',       'Garanta seu horário antes que esgote. Capacete e instrução inclusos em todas as sessões.', 'Subtítulo do CTA final da home')
on conflict (chave) do nothing;
