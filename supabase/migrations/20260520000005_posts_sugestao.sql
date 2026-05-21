-- Adiciona status 'sugestao' ao check constraint de posts
alter table posts drop constraint if exists posts_status_check;
alter table posts add constraint posts_status_check
  check (status in ('sugestao', 'rascunho', 'publicado'));
