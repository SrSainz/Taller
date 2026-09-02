-- Publish only daily fleet aggregates needed by the driver's comparison
-- charts. Raw entries and documents remain protected by their existing RLS
-- policies; this table contains no driver ids, names, plates, or amounts.
create table if not exists public.driver_daily_comparison (
  entry_date date primary key,
  total_km numeric not null default 0 check (total_km >= 0),
  drivers_with_km integer not null default 0 check (drivers_with_km >= 0),
  total_consumption numeric not null default 0 check (total_consumption >= 0),
  drivers_with_consumption integer not null default 0 check (drivers_with_consumption >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.driver_daily_comparison is
  'Privacy-safe daily fleet totals for driver comparison charts; no driver identity is exposed.';

grant usage on schema public to authenticated;
grant select on public.driver_daily_comparison to authenticated;

alter table public.driver_daily_comparison enable row level security;
drop policy if exists driver_daily_comparison_select_authenticated on public.driver_daily_comparison;
create policy driver_daily_comparison_select_authenticated
  on public.driver_daily_comparison
  for select
  to authenticated
  using (true);

create or replace function private.rebuild_driver_daily_comparison(target_date date)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  delete from public.driver_daily_comparison
  where entry_date = target_date;

  insert into public.driver_daily_comparison (
    entry_date,
    total_km,
    drivers_with_km,
    total_consumption,
    drivers_with_consumption,
    updated_at
  )
  with effective_entries as (
    select
      e.driver_id,
      e.entry_date,
      coalesce(
        nullif(e.manual_overrides #>> '{mileage,odometerKm}', '')::numeric,
        e.odometer_km::numeric,
        0
      ) as odometer_km,
      coalesce(
        nullif(e.manual_overrides #>> '{mileage,dailyKm}', '')::numeric,
        null
      ) as manual_daily_km,
      greatest(0, coalesce(
        nullif(e.manual_overrides #>> '{fuel,liters}', '')::numeric,
        e.fuel_liters::numeric,
        0
      )) as fuel_liters
    from public.driver_entries e
    where upper(regexp_replace(coalesce(e.vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g')) in ('5043MLC', '5750MJV', '5754MJV')
  ), ordered_entries as (
    select
      e.*,
      lag(e.odometer_km) over (
        partition by e.driver_id
        order by e.entry_date
      ) as previous_odometer_km
    from effective_entries e
  ), driver_daily as (
    select
      e.driver_id,
      e.entry_date,
      case
        when e.manual_daily_km is not null then greatest(0, e.manual_daily_km)
        when e.previous_odometer_km is null then 0
        else greatest(0, e.odometer_km - e.previous_odometer_km)
      end as daily_km,
      e.fuel_liters
    from ordered_entries e
    where e.entry_date = target_date
  ), consumption_documents as (
    select
      d.owner_id as driver_id,
      d.document_date as entry_date,
      avg(
        nullif(
          regexp_replace(
            replace(trim(coalesce(
              d.extracted_data ->> 'consumption',
              d.extracted_data ->> 'consumptionRate',
              d.extracted_data ->> 'consumption_rate',
              d.extracted_data #>> '{fields,consumption}',
              d.extracted_data #>> '{fields,consumptionRate}',
              d.extracted_data #>> '{fields,consumption_rate}',
              ''
            )), ',', '.'),
            '[^0-9.-]', '', 'g'
          ),
          ''
        )::numeric
      ) as document_consumption
    from public.documents d
    where d.category = 'consumption'
      and d.document_date = target_date
      and upper(regexp_replace(coalesce(d.vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g')) in ('5043MLC', '5750MJV', '5754MJV')
      and lower(coalesce(d.extracted_data ->> 'recordType', d.extracted_data ->> 'metric', '')) in ('consumption', 'consumption rate', 'consumo')
    group by d.owner_id, d.document_date
  ), daily_values as (
    select
      coalesce(e.driver_id, d.driver_id) as driver_id,
      target_date as entry_date,
      coalesce(e.daily_km, 0) as daily_km,
      coalesce(
        d.document_consumption,
        case when e.daily_km > 0 and e.fuel_liters > 0 then e.fuel_liters / e.daily_km * 100 end
      ) as consumption
    from driver_daily e
    full join consumption_documents d
      on d.driver_id = e.driver_id
     and d.entry_date = e.entry_date
  )
  select
    target_date,
    coalesce(sum(daily_km), 0),
    count(*) filter (where daily_km > 0),
    coalesce(sum(consumption) filter (where consumption > 0), 0),
    count(*) filter (where consumption > 0),
    timezone('utc', now())
  from daily_values
  having count(*) > 0;
end;
$function$;

create or replace function private.refresh_driver_daily_comparison_from_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.entry_date is distinct from new.entry_date) then
    perform private.rebuild_driver_daily_comparison(old.entry_date);
  end if;
  if tg_op <> 'DELETE' and new.entry_date is not null then
    perform private.rebuild_driver_daily_comparison(new.entry_date);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;

create or replace function private.refresh_driver_daily_comparison_from_document()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.document_date is distinct from new.document_date) then
    perform private.rebuild_driver_daily_comparison(old.document_date);
  end if;
  if tg_op <> 'DELETE' and new.document_date is not null then
    perform private.rebuild_driver_daily_comparison(new.document_date);
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$function$;

drop trigger if exists driver_entries_refresh_daily_comparison on public.driver_entries;
create trigger driver_entries_refresh_daily_comparison
  after insert or update or delete on public.driver_entries
  for each row execute function private.refresh_driver_daily_comparison_from_entry();

drop trigger if exists documents_refresh_daily_comparison on public.documents;
create trigger documents_refresh_daily_comparison
  after insert or update or delete on public.documents
  for each row execute function private.refresh_driver_daily_comparison_from_document();

revoke all on function private.rebuild_driver_daily_comparison(date) from public, anon, authenticated, service_role;
revoke all on function private.refresh_driver_daily_comparison_from_entry() from public, anon, authenticated, service_role;
revoke all on function private.refresh_driver_daily_comparison_from_document() from public, anon, authenticated, service_role;

do $backfill$
declare
  day_key date;
begin
  for day_key in
    select distinct entry_date
    from public.driver_entries
    where upper(regexp_replace(coalesce(vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g')) in ('5043MLC', '5750MJV', '5754MJV')
  loop
    perform private.rebuild_driver_daily_comparison(day_key);
  end loop;
  for day_key in
    select distinct document_date
    from public.documents
    where document_date is not null
      and category = 'consumption'
      and upper(regexp_replace(coalesce(vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g')) in ('5043MLC', '5750MJV', '5754MJV')
  loop
    perform private.rebuild_driver_daily_comparison(day_key);
  end loop;
end;
$backfill$;

do $publication$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'driver_daily_comparison'
     ) then
    execute 'alter publication supabase_realtime add table public.driver_daily_comparison';
  end if;
end;
$publication$;
