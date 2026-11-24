-- Cole este script no Supabase: SQL Editor → New query → Run

-- 1) Tabela de tarefas
create table if not exists public.tasks (
  id         bigint generated always as identity primary key,
  title      text    not null check (char_length(trim(title)) between 1 and 120),
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2) Segurança: ativa o RLS sem políticas públicas.
--    Assim ninguém acessa a tabela direto pela internet;
--    só o seu backend, usando a chave "service_role".
alter table public.tasks enable row level security;

-- 3) Duas tarefas de exemplo (só insere se a tabela estiver vazia)
insert into public.tasks (title, done)
select v.title, false
from (values
  ('Bem-vindo! Marque esta tarefa como concluída'),
  ('Edite ou exclua esta tarefa de exemplo')
) as v(title)
where not exists (select 1 from public.tasks);
