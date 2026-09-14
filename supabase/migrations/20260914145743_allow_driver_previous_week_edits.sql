-- Keep historical data read-only, but let drivers correct documents and
-- calendar values during the current natural week and the immediately
-- preceding Monday-Sunday week. Every existing RLS policy and guarded RPC
-- uses this helper, so entries, transactions, documents and Storage objects
-- share the same authorization window. Administrators retain full access.

create or replace function private.is_current_driver_week(p_date date)
returns boolean
language sql
stable
set search_path = ''
as $function$
  with madrid_clock as (
    select (timezone('Europe/Madrid', now()))::date as today
  )
  select coalesce(
    p_date between
      (today - (extract(isodow from today)::integer - 1) - 7)
      and (today + (7 - extract(isodow from today)::integer)),
    false
  )
  from madrid_clock;
$function$;

revoke all on function private.is_current_driver_week(date)
from public, anon, service_role;
grant usage on schema private to authenticated;
grant execute on function private.is_current_driver_week(date) to authenticated;
