-- Adiciona CPF ao cadastro de clientes (nullable, único onde preenchido)
alter table clientes add column if not exists cpf text;

create unique index if not exists idx_clientes_cpf
  on clientes(cpf)
  where cpf is not null;
