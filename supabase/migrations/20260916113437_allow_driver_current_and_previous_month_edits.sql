-- Drivers can correct calendar data and manage their documents throughout the
-- complete current calendar month and the complete immediately preceding
-- month. The calculation uses the Madrid calendar and crosses year boundaries.
-- Existing RLS policies and guarded RPCs call the legacy week-named helper, so
-- it delegates to the new month-specific predicate without widening ownership.

create or replace function private.is_driver_editable_month(p_date date)
returns boolean
language sql
stable
set search_path = ''
as $function$
  with madrid_clock as (
    select (timezone('Europe/Madrid', now()))::date as today
  )
  select coalesce(
    p_date >= (date_trunc('month', today) - interval '1 month')::date
    and p_date < (date_trunc('month', today) + interval '1 month')::date,
    false
  )
  from madrid_clock;
$function$;

revoke all on function private.is_driver_editable_month(date)
from public, anon, service_role;
grant usage on schema private to authenticated;
grant execute on function private.is_driver_editable_month(date) to authenticated;

create or replace function private.is_current_driver_week(p_date date)
returns boolean
language sql
stable
set search_path = ''
as $function$
  select private.is_driver_editable_month(p_date);
$function$;

revoke all on function private.is_current_driver_week(date)
from public, anon, service_role;
grant execute on function private.is_current_driver_week(date) to authenticated;
