-- =====================================================================
-- Quadras de Palmas — RASCUNHO do banco no Supabase
--
-- Como usar: Supabase → SQL Editor → cole este arquivo → Run.
-- Depois rode carga-inicial.sql. Passo a passo completo: LEIA-ME.md.
--
-- ATENÇÃO: rascunho escrito junto com o site, ainda NÃO executado num
-- projeto de verdade. Revise antes de rodar.
--
-- Os valores dos CHECKs são os mesmos catálogos de js/regras.js.
-- Mudou um lá (ex.: nova modalidade)? Mude aqui também.
-- =====================================================================


-- =====================================================================
-- 1. Tabelas
-- =====================================================================

create table public.quadras (
  id            text primary key check (id ~ '^[a-z0-9-]+$'),
  nome          text not null check (char_length(nome) between 3 and 120),
  regiao        text not null default '',
  lat           double precision not null check (lat between -90 and 90),
  lng           double precision not null check (lng between -180 and 180),
  piso          text not null check (piso in ('areia', 'gramado', 'cimento', 'emborrachado')),
  modalidades   text[] not null default '{}'
                check (modalidades <@ array['volei', 'basquete', 'futsal', 'society', 'peteca']::text[]),
  -- { "postesVolei": true, "redeVolei": false, "aroBasquete": true, "traves": true, "iluminacao": true }
  equipamentos  jsonb not null default '{}'::jsonb,
  -- { "bebedouro": true, "banheiro": false }
  estrutura     jsonb not null default '{}'::jsonb,
  coberta       boolean not null default false,
  conservacao   text check (conservacao in ('boa', 'regular', 'ruim')),
  fotos         text[] not null default '{}',
  maps          text not null default '',
  precisa       text[] not null default '{}',     -- materiais que faltam
  demo          boolean not null default false,
  publicada     boolean not null default true,
  criado_em     timestamptz not null default now()
);

create table public.sugestoes (
  id                uuid primary key default gen_random_uuid(),
  tipo              text not null check (tipo in ('nova', 'correcao')),
  -- só em correção; se a quadra for apagada, a correção some junto
  quadra_id         text references public.quadras (id) on delete cascade,
  -- só em "nova": nome, localizacao {lat,lng}, referencia, piso, modalidades,
  -- equipamentos, estrutura, coberta, conservacao
  dados             jsonb not null default '{}'::jsonb check (octet_length(dados::text) < 10000),
  descricao         text check (descricao is null or char_length(descricao) between 10 and 1000),
  foto_path         text,                           -- caminho no bucket fotos-sugestoes
  contato_nome      text not null default '' check (char_length(contato_nome) <= 80),
  contato_whatsapp  text not null default '' check (contato_whatsapp ~ '^([0-9]{10,11})?$'),
  status            text not null default 'pendente' check (status in ('pendente', 'aprovada', 'recusada')),
  criado_em         timestamptz not null default now(),
  decidido_em       timestamptz,
  constraint correcao_completa check (
    tipo = 'nova' or (quadra_id is not null and descricao is not null)
  )
);

create table public.doacoes (
  id          uuid primary key default gen_random_uuid(),
  materiais   text[] not null check (cardinality(materiais) between 1 and 10),
  quantidade  integer not null check (quantidade between 1 and 99),
  estado      text not null check (estado in ('novo', 'usado-bom', 'usado-desgaste')),
  quadra_id   text references public.quadras (id) on delete set null,   -- null = onde precisar mais
  entrega     text not null check (entrega in ('ponto-coleta', 'combinar')),
  nome        text not null check (char_length(nome) between 2 and 80),
  whatsapp    text not null check (whatsapp ~ '^[0-9]{10,11}$'),
  status      text not null default 'nova' check (status in ('nova', 'combinada', 'recebida', 'entregue')),
  criado_em   timestamptz not null default now()
);

-- Quem pode usar o painel. Só estar logado NÃO basta: precisa estar aqui.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create index sugestoes_status_idx on public.sugestoes (status, criado_em desc);
create index doacoes_status_idx on public.doacoes (status, criado_em desc);


-- =====================================================================
-- 2. Funções
-- =====================================================================

-- true se o usuário logado estiver na tabela admins
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Contador público da tela de doação: devolve SÓ o número.
-- O visitante nunca lê a tabela doacoes (ela tem nome e WhatsApp das pessoas).
create or replace function public.total_materiais_entregues()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(quantidade), 0)::integer from public.doacoes where status = 'entregue';
$$;

revoke all on function public.total_materiais_entregues() from public;
grant execute on function public.total_materiais_entregues() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;


-- =====================================================================
-- 3. Permissões por coluna (camada extra além do RLS)
--    O visitante (anon) só consegue escrever as colunas do formulário:
--    status, datas e ids ficam sempre com o valor padrão.
-- =====================================================================

revoke all on public.quadras from anon;
grant select on public.quadras to anon;

revoke all on public.sugestoes from anon;
grant insert (tipo, quadra_id, dados, descricao, foto_path, contato_nome, contato_whatsapp)
  on public.sugestoes to anon;

revoke all on public.doacoes from anon;
grant insert (materiais, quantidade, estado, quadra_id, entrega, nome, whatsapp)
  on public.doacoes to anon;

revoke all on public.admins from anon, authenticated;


-- =====================================================================
-- 4. Regras de acesso (RLS) — OBRIGATÓRIAS
-- =====================================================================

alter table public.quadras   enable row level security;
alter table public.sugestoes enable row level security;
alter table public.doacoes   enable row level security;
alter table public.admins    enable row level security;   -- sem política = ninguém lê pela API

-- ---- quadras ----
create policy "visitante le quadras publicadas"
  on public.quadras for select
  to anon, authenticated
  using (publicada or public.is_admin());

create policy "admin gerencia quadras"
  on public.quadras for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---- sugestoes: visitante só ENVIA ----
create policy "qualquer um envia sugestao pendente"
  on public.sugestoes for insert
  to anon, authenticated
  with check (status = 'pendente' and decidido_em is null);

create policy "admin le sugestoes"
  on public.sugestoes for select
  to authenticated
  using (public.is_admin());

create policy "admin decide sugestoes"
  on public.sugestoes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin apaga sugestoes"
  on public.sugestoes for delete
  to authenticated
  using (public.is_admin());

-- ---- doacoes: visitante só ENVIA ----
create policy "qualquer um envia doacao nova"
  on public.doacoes for insert
  to anon, authenticated
  with check (status = 'nova');

create policy "admin le doacoes"
  on public.doacoes for select
  to authenticated
  using (public.is_admin());

create policy "admin atualiza doacoes"
  on public.doacoes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin apaga doacoes"
  on public.doacoes for delete
  to authenticated
  using (public.is_admin());


-- =====================================================================
-- 5. Fotos (Storage)
-- =====================================================================

-- Fotos enviadas nas sugestões: privadas, só a equipe vê
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-sugestoes', 'fotos-sugestoes', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Fotos das quadras publicadas: qualquer um vê, só a equipe envia
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-quadras', 'fotos-quadras', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "qualquer um envia foto de sugestao"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'fotos-sugestoes');

create policy "admin ve fotos de sugestao"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'fotos-sugestoes' and public.is_admin());

create policy "admin apaga fotos de sugestao"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'fotos-sugestoes' and public.is_admin());

create policy "admin gerencia fotos das quadras"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'fotos-quadras' and public.is_admin())
  with check (bucket_id = 'fotos-quadras' and public.is_admin());
