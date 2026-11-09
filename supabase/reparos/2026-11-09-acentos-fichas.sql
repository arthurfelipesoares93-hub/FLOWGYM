-- Reparo direto das fichas de avaliação: "TerÃ§a" -> "Terça", "ForÃ§a" -> "Força".
-- As colunas goals e available_days são listas de texto (text[]).
-- Abra este ARQUIVO num editor (UTF-8), copie tudo e cole no SQL Editor do Supabase.

create or replace function pg_temp.fix_moji(s text) returns text
language plpgsql as $f$
begin
  return convert_from(convert_to(s, 'WIN1252'), 'UTF8');
exception when others then
  return s;
end $f$;

update public.assessments
set available_days = array(select pg_temp.fix_moji(x) from unnest(available_days) as x),
    goals = array(select pg_temp.fix_moji(x) from unnest(goals) as x)
where available_days::text ~ 'Ã|Â' or goals::text ~ 'Ã|Â';

-- Conferência: deve listar 0 linhas com acento corrompido.
select count(*) as fichas_com_acento_corrompido
from public.assessments
where available_days::text ~ 'Ã|Â' or goals::text ~ 'Ã|Â';

-- Amostra: deve mostrar "Terça".
select available_days from public.assessments limit 3;
