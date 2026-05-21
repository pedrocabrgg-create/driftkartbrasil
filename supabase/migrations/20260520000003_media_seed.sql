-- Seed: arquivos estáticos existentes (url = path em /public)
insert into media (nome, tipo, url, alt, categoria, posicao) values
  ('kart-02.jpg',          'imagem', '/images/kart-02.jpg',          'Kart elétrico Drift #05 na pista',          'galeria', 1),
  ('kart-01.jpg',          'imagem', '/images/kart-01.jpg',          'Karts elétricos na pista',                  'galeria', 2),
  ('kart-bateria.jpg',     'imagem', '/images/kart-bateria.jpg',     'Sistema de bateria elétrica',               'galeria', 3),
  ('pista-track.jpg',      'imagem', '/images/pista-track.jpg',      'Vista panorâmica da pista indoor',          'galeria', 4),
  ('pista-panoramica.jpg', 'imagem', '/images/pista-panoramica.jpg', 'Pista panorâmica Drift Kart Brasil',        'galeria', 5),
  ('evento-grupo.jpg',     'imagem', '/images/evento-grupo.jpg',     'Evento em grupo na pista',                  'galeria', 6),
  ('kart-motor.jpg',       'imagem', '/images/kart-motor.jpg',       'Motor e transmissão do kart elétrico',      'galeria', 7),
  ('funcionarios.jpg',     'imagem', '/images/funcionarios.jpg',     'Equipe Drift Kart Brasil',                  'galeria', 8),
  ('hero.mp4',             'video',  '/videos/hero.mp4',             'Sessão rápida de kart',                     'hero',    1),
  ('hero2.mp4',            'video',  '/videos/hero2.mp4',            'Sessão completa de kart',                   'hero',    2),
  ('logo-intro.mp4',       'video',  '/videos/logo-intro.mp4',       'Vídeo de introdução com logo',              'video_intro', 1);
