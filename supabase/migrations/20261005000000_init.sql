-- Bora Vôlei — schema inicial
--
-- Regras:
-- * Não existe status de inscrição. Os primeiros N inscritos (N = jogos.vagas),
--   em ordem de (criado_em, id), são os confirmados; o resto é lista de espera.
-- * O cliente anônimo não lê nem escreve nas tabelas. Leitura só pelas views
--   (sem tokens) e escrita só pelas funções RPC security definer abaixo.

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabelas
-- ─────────────────────────────────────────────────────────────────────────────

create table public.jogos (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  titulo      text not null,
  organizador text,
  data_hora   timestamptz not null,
  local       text not null,
  vagas       int not null,
  valor       numeric(8,2),
  publico     boolean not null default false,
  admin_token text not null,
  criado_em   timestamptz not null default clock_timestamp()
);

create index jogos_publico_data_idx on public.jogos (data_hora) where publico;

create table public.inscricoes (
  id           uuid primary key default gen_random_uuid(),
  jogo_id      uuid not null references public.jogos (id) on delete cascade,
  nome         text not null check (char_length(nome) between 1 and 40),
  cancel_token text not null,
  -- clock_timestamp() (e não now()) para que duas inscrições na mesma
  -- transação ainda tenham ordem definida.
  criado_em    timestamptz not null default clock_timestamp()
);

create index inscricoes_ordem_idx on public.inscricoes (jogo_id, criado_em, id);

alter table public.jogos enable row level security;
alter table public.inscricoes enable row level security;

-- Sem policies: com RLS ativo, anon/authenticated não enxergam nenhuma linha.
-- Além disso tiramos os privilégios que o Supabase concede por padrão.
revoke all on public.jogos from anon, authenticated;
revoke all on public.inscricoes from anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Views públicas (sem admin_token / cancel_token)
-- ─────────────────────────────────────────────────────────────────────────────
-- As views pertencem ao postgres e rodam com os privilégios dele
-- (security_invoker = false), então ignoram o RLS das tabelas e expõem só as
-- colunas listadas aqui.

create view public.jogos_publicos with (security_invoker = false) as
select
  j.id,
  j.slug,
  j.titulo,
  j.organizador,
  j.data_hora,
  j.local,
  j.vagas,
  j.valor,
  j.publico,
  j.criado_em,
  c.inscritos,
  greatest(j.vagas - c.inscritos, 0) as vagas_restantes
from public.jogos j
cross join lateral (
  select count(*)::int as inscritos from public.inscricoes i where i.jogo_id = j.id
) c;

create view public.inscricoes_publicas with (security_invoker = false) as
select i.id, i.jogo_id, i.nome, i.criado_em
from public.inscricoes i;

revoke all on public.jogos_publicos, public.inscricoes_publicas from anon, authenticated;
grant select on public.jogos_publicos, public.inscricoes_publicas to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Funções internas (não expostas)
-- ─────────────────────────────────────────────────────────────────────────────

create function public._erro(msg text) returns void
language plpgsql as $$
begin
  raise exception using message = msg, errcode = 'P0001';
end $$;

create function public._token(bytes int) returns text
language sql volatile set search_path = '' as $$
  select encode(extensions.gen_random_bytes(bytes), 'hex');
$$;

-- 6 caracteres sem os ambíguos (0, o, 1, l, i).
create function public._gerar_slug() returns text
language plpgsql volatile set search_path = '' as $$
declare
  alfabeto constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  b bytea;
  s text;
begin
  loop
    b := extensions.gen_random_bytes(6);
    s := '';
    for i in 0..5 loop
      s := s || substr(alfabeto, (get_byte(b, i) % length(alfabeto)) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.jogos where slug = s);
  end loop;
  return s;
end $$;

create function public._validar_jogo(
  p_titulo text, p_organizador text, p_local text, p_vagas int, p_valor numeric
) returns void
language plpgsql set search_path = '' as $$
begin
  if p_titulo is null or char_length(p_titulo) not between 1 and 60 then
    perform public._erro('O nome do jogo precisa ter de 1 a 60 caracteres');
  end if;
  if p_organizador is not null and char_length(p_organizador) > 40 then
    perform public._erro('O nome do organizador pode ter até 40 caracteres');
  end if;
  if p_local is null or char_length(p_local) not between 1 and 80 then
    perform public._erro('O local precisa ter de 1 a 80 caracteres');
  end if;
  if p_vagas is null or p_vagas not between 2 and 30 then
    perform public._erro('As vagas precisam ficar entre 2 e 30');
  end if;
  if p_valor is not null and p_valor not between 0 and 9999 then
    perform public._erro('Valor inválido');
  end if;
end $$;

create function public._validar_data(p_data timestamptz) returns void
language plpgsql set search_path = '' as $$
begin
  if p_data is null then
    perform public._erro('Informe a data e a hora do jogo');
  end if;
  if p_data < now() - interval '1 hour' then
    perform public._erro('A data do jogo já passou');
  end if;
  if p_data > now() + interval '1 year' then
    perform public._erro('A data precisa ser nos próximos 12 meses');
  end if;
end $$;

-- Lê um campo de texto do jsonb, com trim; string vazia vira null.
create function public._txt(dados jsonb, chave text) returns text
language sql immutable set search_path = '' as $$
  select nullif(btrim(dados ->> chave), '');
$$;

create function public._jogo_admin(p_slug text, p_admin_token text) returns public.jogos
language plpgsql set search_path = '' as $$
declare
  j public.jogos;
begin
  select * into j from public.jogos
   where slug = p_slug and admin_token = p_admin_token
   for update;
  if not found then
    perform public._erro('Link de admin inválido');
  end if;
  return j;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPCs públicas
-- ─────────────────────────────────────────────────────────────────────────────

create function public.criar_jogo(dados jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_titulo text := public._txt(dados, 'titulo');
  v_organizador text := public._txt(dados, 'organizador');
  v_local text := public._txt(dados, 'local');
  v_data timestamptz;
  v_vagas int;
  v_valor numeric;
  v_publico boolean;
  v_slug text;
  v_token text;
begin
  begin
    v_data := (dados ->> 'data_hora')::timestamptz;
    v_vagas := (dados ->> 'vagas')::int;
    v_valor := public._txt(dados, 'valor')::numeric;
    v_publico := coalesce((dados ->> 'publico')::boolean, false);
  exception when others then
    perform public._erro('Dados do jogo inválidos');
  end;

  perform public._validar_jogo(v_titulo, v_organizador, v_local, v_vagas, v_valor);
  perform public._validar_data(v_data);

  v_slug := public._gerar_slug();
  v_token := public._token(16);

  insert into public.jogos (slug, titulo, organizador, data_hora, local, vagas, valor, publico, admin_token)
  values (v_slug, v_titulo, v_organizador, v_data, v_local, v_vagas, v_valor, v_publico, v_token);

  return jsonb_build_object('slug', v_slug, 'admin_token', v_token);
end $$;

create function public.inscrever(p_slug text, p_nome text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_nome text := btrim(coalesce(p_nome, ''));
  j public.jogos;
  v_id uuid;
  v_token text := public._token(16);
  v_posicao int;
begin
  if char_length(v_nome) not between 1 and 40 then
    perform public._erro('O nome precisa ter de 1 a 40 caracteres');
  end if;

  -- Trava o jogo para serializar inscrições simultâneas.
  select * into j from public.jogos where slug = p_slug for update;
  if not found then
    perform public._erro('Jogo não encontrado');
  end if;
  if j.data_hora < now() - interval '3 hours' then
    perform public._erro('Esse jogo já aconteceu');
  end if;
  if (select count(*) from public.inscricoes where jogo_id = j.id) >= 100 then
    perform public._erro('A lista desse jogo está cheia');
  end if;

  insert into public.inscricoes (jogo_id, nome, cancel_token)
  values (j.id, v_nome, v_token)
  returning id into v_id;

  select count(*) into v_posicao from public.inscricoes where jogo_id = j.id;

  return jsonb_build_object(
    'inscricao_id', v_id,
    'cancel_token', v_token,
    'posicao', v_posicao,
    'confirmado', v_posicao <= j.vagas
  );
end $$;

create function public.cancelar_inscricao(p_inscricao_id uuid, p_cancel_token text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.inscricoes where id = p_inscricao_id and cancel_token = p_cancel_token;
  if not found then
    perform public._erro('Inscrição não encontrada');
  end if;
  return true;
end $$;

create function public.admin_validar(p_slug text, p_admin_token text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.jogos where slug = p_slug and admin_token = p_admin_token);
$$;

create function public.admin_remover_inscricao(p_slug text, p_admin_token text, p_inscricao_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  j public.jogos := public._jogo_admin(p_slug, p_admin_token);
begin
  delete from public.inscricoes where id = p_inscricao_id and jogo_id = j.id;
  if not found then
    perform public._erro('Inscrição não encontrada');
  end if;
  return true;
end $$;

-- Atualiza só as chaves presentes em `dados`.
create function public.admin_atualizar_jogo(p_slug text, p_admin_token text, dados jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  j public.jogos := public._jogo_admin(p_slug, p_admin_token);
  v_data timestamptz := j.data_hora;
begin
  begin
    if dados ? 'titulo' then j.titulo := public._txt(dados, 'titulo'); end if;
    if dados ? 'organizador' then j.organizador := public._txt(dados, 'organizador'); end if;
    if dados ? 'local' then j.local := public._txt(dados, 'local'); end if;
    if dados ? 'data_hora' then j.data_hora := (dados ->> 'data_hora')::timestamptz; end if;
    if dados ? 'vagas' then j.vagas := (dados ->> 'vagas')::int; end if;
    if dados ? 'valor' then j.valor := public._txt(dados, 'valor')::numeric; end if;
    if dados ? 'publico' then j.publico := (dados ->> 'publico')::boolean; end if;
  exception when others then
    perform public._erro('Dados do jogo inválidos');
  end;

  perform public._validar_jogo(j.titulo, j.organizador, j.local, j.vagas, j.valor);
  if j.data_hora is distinct from v_data then
    perform public._validar_data(j.data_hora);
  end if;
  if j.publico is null then
    perform public._erro('Dados do jogo inválidos');
  end if;

  update public.jogos set
    titulo = j.titulo,
    organizador = j.organizador,
    local = j.local,
    data_hora = j.data_hora,
    vagas = j.vagas,
    valor = j.valor,
    publico = j.publico
  where id = j.id;
  return true;
end $$;

-- Cria o mesmo jogo 7 dias depois, sem inscritos e com o mesmo admin_token.
create function public.repetir_jogo(p_slug text, p_admin_token text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  j public.jogos := public._jogo_admin(p_slug, p_admin_token);
  v_slug text := public._gerar_slug();
begin
  insert into public.jogos (slug, titulo, organizador, data_hora, local, vagas, valor, publico, admin_token)
  values (v_slug, j.titulo, j.organizador, j.data_hora + interval '7 days', j.local, j.vagas, j.valor, j.publico, j.admin_token);
  return v_slug;
end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Realtime: avisa o canal público "jogo:<id>" quando algo muda.
-- O payload vai vazio; o cliente só refaz a leitura pelas views.
-- ─────────────────────────────────────────────────────────────────────────────

create function public._avisar_mudanca() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_jogo uuid;
begin
  if tg_table_name = 'jogos' then
    v_jogo := coalesce(new.id, old.id);
  else
    v_jogo := coalesce(new.jogo_id, old.jogo_id);
  end if;
  perform realtime.send('{}'::jsonb, 'mudou', 'jogo:' || v_jogo::text, false);
  return null;
end $$;

create trigger inscricoes_avisar after insert or delete on public.inscricoes
for each row execute function public._avisar_mudanca();

create trigger jogos_avisar after update on public.jogos
for each row execute function public._avisar_mudanca();

-- ─────────────────────────────────────────────────────────────────────────────
-- Permissões das funções
-- ─────────────────────────────────────────────────────────────────────────────

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.criar_jogo(jsonb),
  public.inscrever(text, text),
  public.cancelar_inscricao(uuid, text),
  public.admin_validar(text, text),
  public.admin_remover_inscricao(text, text, uuid),
  public.admin_atualizar_jogo(text, text, jsonb),
  public.repetir_jogo(text, text)
to anon, authenticated;
