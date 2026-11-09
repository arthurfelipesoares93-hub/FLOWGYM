-- Reparo único: corrige acentos corrompidos ("estÃ¡" -> "está") no projeto Flow gym.
--
-- Causa: os scripts de migração foram servidos como texto sem charset, e o Chrome leu
-- UTF-8 como Windows-1252 antes de colar no SQL Editor. Cada letra acentuada virou 2 caracteres.
--
-- Este script desfaz a conversão (WIN1252 -> UTF8) em:
--   1) colunas text, varchar, jsonb e text[] das tabelas do schema public;
--   2) funções do schema public cujo código tem acentos corrompidos.
-- Valores que não tiverem o padrão corrompido não são tocados. É seguro rodar mais de uma vez.
--
-- Como usar: abra este ARQUIVO num editor (UTF-8), copie tudo e cole no SQL Editor do Supabase.

create or replace function pg_temp.fix_moji(s text) returns text
language plpgsql as $f$
begin
  return convert_from(convert_to(s, 'WIN1252'), 'UTF8');
exception when others then
  return s;
end $f$;

do $$
declare
  r record;
  n bigint;
  total bigint := 0;
begin
  -- 1) colunas de texto
  for r in
    select c.table_name, c.column_name, c.data_type
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
      and (c.data_type in ('text', 'character varying', 'jsonb')
           or (c.data_type = 'ARRAY' and c.udt_name = '_text'))
  loop
    begin
      if r.data_type = 'ARRAY' then
        execute format(
          'update public.%I set %I = array(select pg_temp.fix_moji(x) from unnest(%I) as x) where %I::text ~ %L',
          r.table_name, r.column_name, r.column_name, r.column_name, 'Ã|Â');
      elsif r.data_type = 'jsonb' then
        execute format(
          'update public.%I set %I = pg_temp.fix_moji(%I::text)::jsonb where %I::text ~ %L',
          r.table_name, r.column_name, r.column_name, r.column_name, 'Ã|Â');
      else
        execute format(
          'update public.%I set %I = pg_temp.fix_moji(%I) where %I ~ %L',
          r.table_name, r.column_name, r.column_name, r.column_name, 'Ã|Â');
      end if;
      get diagnostics n = row_count;
      total := total + n;
    exception when others then
      raise notice 'coluna ignorada %.%: %', r.table_name, r.column_name, sqlerrm;
    end;
  end loop;
  raise notice 'linhas corrigidas: %', total;

  -- 2) funções com acentos corrompidos
  for r in
    select p.oid, pg_get_functiondef(p.oid) as def
    from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace
    where ns.nspname = 'public' and p.prokind = 'f'
      and pg_get_functiondef(p.oid) ~ 'Ã|Â'
  loop
    begin
      execute pg_temp.fix_moji(r.def);
    exception when others then
      raise notice 'função ignorada %: %', r.oid::regprocedure, sqlerrm;
    end;
  end loop;
end $$;

-- Conferência: todos devem devolver 0.
select
  (select count(*) from public.notifications where title ~ 'Ã|Â' or body ~ 'Ã|Â') as notificacoes,
  (select count(*) from public.assessments where available_days::text ~ 'Ã|Â' or goals::text ~ 'Ã|Â') as fichas,
  (select count(*) from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public' and p.prokind = 'f' and pg_get_functiondef(p.oid) ~ 'Ã|Â') as funcoes;
