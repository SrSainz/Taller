-- Publish the productivity metric as a privacy-safe daily aggregate. The
-- table stores only the sum and the number of drivers that have a valid ratio;
-- the client never receives another driver's identity, hours, or kilometres.
alter table public.driver_daily_comparison
  add column if not exists total_km_per_connection_hour numeric not null default 0 check (total_km_per_connection_hour >= 0),
  add column if not exists drivers_with_km_per_connection_hour integer not null default 0 check (drivers_with_km_per_connection_hour >= 0);

comment on column public.driver_daily_comparison.total_km_per_connection_hour is
  'Sum of each eligible professional driver''s daily kilometres divided by connection hours.';
comment on column public.driver_daily_comparison.drivers_with_km_per_connection_hour is
  'Number of professional drivers with positive daily kilometres and connection hours.';

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
    total_km_per_connection_hour,
    drivers_with_km_per_connection_hour,
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
      nullif(e.manual_overrides #>> '{mileage,dailyKm}', '')::numeric as manual_daily_km,
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
  ), daily_km_document_values as (
    select
      d.owner_id as driver_id,
      d.document_date as entry_date,
      nullif(
        regexp_replace(
          replace(trim(coalesce(
            d.extracted_data ->> 'dailyKm',
            d.extracted_data ->> 'daily_km',
            d.extracted_data ->> 'kilometres',
            d.extracted_data ->> 'kilometers',
            d.extracted_data ->> 'km',
            d.extracted_data #>> '{fields,dailyKm,value}',
            d.extracted_data #>> '{fields,daily_km,value}',
            d.extracted_data #>> '{fields,kilometres,value}',
            d.extracted_data #>> '{fields,kilometers,value}',
            d.extracted_data #>> '{fields,km,value}',
            d.extracted_data #>> '{fields,dailyKm}',
            d.extracted_data #>> '{fields,daily_km}',
            d.extracted_data #>> '{fields,kilometres}',
            d.extracted_data #>> '{fields,kilometers}',
            d.extracted_data #>> '{fields,km}',
            ''
          )), ',', '.'),
          '[^0-9.-]', '', 'g'
        ),
        ''
      )::numeric as document_daily_km
    from public.documents d
    where d.category = 'consumption'
      and d.document_date = target_date
      and upper(regexp_replace(coalesce(d.vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g')) in ('5043MLC', '5750MJV', '5754MJV')
      and lower(coalesce(d.extracted_data ->> 'recordType', d.extracted_data ->> 'metric', '')) in ('daily-km', 'partial-1', 'daily_km', 'kilometraje diario', 'km diarios')
  ), daily_km_documents as (
    select driver_id, entry_date, sum(document_daily_km) as document_daily_km
    from daily_km_document_values
    where document_daily_km > 0
    group by driver_id, entry_date
  ), daily_readings as (
    select
      coalesce(e.driver_id, k.driver_id) as driver_id,
      target_date as entry_date,
      coalesce(k.document_daily_km, e.daily_km, 0) as daily_km,
      e.fuel_liters
    from driver_daily e
    full join daily_km_documents k
      on k.driver_id = e.driver_id
     and k.entry_date = e.entry_date
  ), consumption_document_values as (
    select
      d.owner_id as driver_id,
      d.document_date as entry_date,
      nullif(
        regexp_replace(
          replace(trim(coalesce(
            d.extracted_data ->> 'consumption',
            d.extracted_data ->> 'consumptionRate',
            d.extracted_data ->> 'consumption_rate',
            d.extracted_data #>> '{fields,consumption,value}',
            d.extracted_data #>> '{fields,consumptionRate,value}',
            d.extracted_data #>> '{fields,consumption_rate,value}',
            d.extracted_data #>> '{fields,consumption}',
            d.extracted_data #>> '{fields,consumptionRate}',
            d.extracted_data #>> '{fields,consumption_rate}',
            ''
          )), ',', '.'),
          '[^0-9.-]', '', 'g'
        ),
        ''
      )::numeric as document_consumption
    from public.documents d
    where d.category = 'consumption'
      and d.document_date = target_date
      and upper(regexp_replace(coalesce(d.vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g')) in ('5043MLC', '5750MJV', '5754MJV')
      and lower(coalesce(d.extracted_data ->> 'recordType', d.extracted_data ->> 'metric', '')) in ('consumption', 'consumption rate', 'consumo')
  ), consumption_documents as (
    select driver_id, entry_date, avg(document_consumption) as document_consumption
    from consumption_document_values
    where document_consumption > 0
    group by driver_id, entry_date
  ), billing_connection_sources as (
    select
      d.owner_id as driver_id,
      d.document_date as entry_date,
      'document'::text as source_kind,
      coalesce(
        nullif(trim(d.extracted_data ->> 'connection'), ''),
        nullif(trim(d.extracted_data ->> 'connectionTime'), ''),
        nullif(trim(d.extracted_data ->> 'connectionHours'), ''),
        nullif(trim(d.extracted_data ->> 'connection_hours'), ''),
        nullif(trim(d.extracted_data ->> 'duration'), ''),
        nullif(trim(d.extracted_data #>> '{fields,connection,value}'), ''),
        nullif(trim(d.extracted_data #>> '{fields,connectionTime,value}'), ''),
        nullif(trim(d.extracted_data #>> '{fields,connectionHours,value}'), ''),
        nullif(trim(d.extracted_data #>> '{fields,connection_hours,value}'), ''),
        nullif(trim(d.extracted_data #>> '{fields,duration,value}'), ''),
        nullif(trim(d.extracted_data #>> '{fields,connection}'), ''),
        nullif(trim(d.extracted_data #>> '{fields,connectionTime}'), ''),
        nullif(trim(d.extracted_data #>> '{fields,connectionHours}'), ''),
        nullif(trim(d.extracted_data #>> '{fields,connection_hours}'), ''),
        nullif(trim(d.extracted_data #>> '{fields,duration}'), '')
      ) as connection_text
    from public.documents d
    where d.category = 'billing'
      and d.document_date = target_date
      and upper(regexp_replace(coalesce(d.vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g')) in ('5043MLC', '5750MJV', '5754MJV')
    union all
    select
      e.driver_id,
      e.entry_date,
      'entry'::text as source_kind,
      nullif(trim(e.manual_overrides #>> '{billing,connection}'), '') as connection_text
    from public.driver_entries e
    where e.entry_date = target_date
      and upper(regexp_replace(coalesce(e.vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g')) in ('5043MLC', '5750MJV', '5754MJV')
      and nullif(trim(e.manual_overrides #>> '{billing,connection}'), '') is not null
  ), billing_connection_values as (
    select
      driver_id,
      entry_date,
      source_kind,
      greatest(0, case
        when connection_text ~ '^[[:space:]]*[0-9]{1,3}[[:space:]]*:[[:space:]]*[0-9]{1,2}([:][[:space:]]*[0-9]{1,2})?[[:space:]]*$' then
          split_part(regexp_replace(trim(connection_text), '[[:space:]]+', '', 'g'), ':', 1)::numeric
          + split_part(regexp_replace(trim(connection_text), '[[:space:]]+', '', 'g'), ':', 2)::numeric / 60
          + case
              when split_part(regexp_replace(trim(connection_text), '[[:space:]]+', '', 'g'), ':', 3) <> ''
                then split_part(regexp_replace(trim(connection_text), '[[:space:]]+', '', 'g'), ':', 3)::numeric / 3600
              else 0
            end
        when connection_text ~* '([0-9]+([.,][0-9]+)?)[[:space:]]*(horas|hora|hrs|hr|h)' or connection_text ~* '([0-9]+([.,][0-9]+)?)[[:space:]]*(minutos|minuto|mins|min|m)' then
          coalesce(nullif(replace((regexp_match(lower(connection_text), '([0-9]+([.,][0-9]+)?)[[:space:]]*(horas|hora|hrs|hr|h)'))[1], ',', '.'), '')::numeric, 0)
          + coalesce(nullif(replace((regexp_match(lower(connection_text), '([0-9]+([.,][0-9]+)?)[[:space:]]*(minutos|minuto|mins|min|m)'))[1], ',', '.'), '')::numeric, 0) / 60
        when connection_text ~ '^[[:space:]]*[0-9]+([.,][0-9]+)?[[:space:]]*$' then
          replace(trim(connection_text), ',', '.')::numeric
        else 0
      end) as connection_hours
    from billing_connection_sources
    where connection_text is not null
  ), billing_connections as (
    select
      driver_id,
      entry_date,
      case
        when count(*) filter (where source_kind = 'entry') > 0
          then coalesce(sum(connection_hours) filter (where source_kind = 'entry'), 0)
        else coalesce(sum(connection_hours) filter (where source_kind = 'document'), 0)
      end as connection_hours
    from billing_connection_values
    group by driver_id, entry_date
  ), daily_values as (
    select
      coalesce(r.driver_id, d.driver_id, c.driver_id) as driver_id,
      target_date as entry_date,
      coalesce(r.daily_km, 0) as daily_km,
      coalesce(
        d.document_consumption,
        case when r.daily_km > 0 and r.fuel_liters > 0 then r.fuel_liters / r.daily_km * 100 end
      ) as consumption,
      coalesce(c.connection_hours, 0) as connection_hours
    from daily_readings r
    full join consumption_documents d
      on d.driver_id = r.driver_id
     and d.entry_date = r.entry_date
    full join billing_connections c
      on c.driver_id = coalesce(r.driver_id, d.driver_id)
     and c.entry_date = target_date
  ), daily_metrics as (
    select
      daily_km,
      consumption,
      case
        when daily_km > 0 and connection_hours > 0 then daily_km / connection_hours
      end as km_per_connection_hour
    from daily_values
  )
  select
    target_date,
    coalesce(sum(daily_km), 0),
    count(*) filter (where daily_km > 0),
    coalesce(sum(consumption) filter (where consumption > 0), 0),
    count(*) filter (where consumption > 0),
    coalesce(sum(km_per_connection_hour) filter (where km_per_connection_hour > 0), 0),
    count(*) filter (where km_per_connection_hour > 0),
    timezone('utc', now())
  from daily_metrics
  having count(*) > 0;
end;
$function$;

revoke all on function private.rebuild_driver_daily_comparison(date) from public, anon, authenticated, service_role;

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
      and category in ('billing', 'consumption')
      and upper(regexp_replace(coalesce(vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g')) in ('5043MLC', '5750MJV', '5754MJV')
  loop
    perform private.rebuild_driver_daily_comparison(day_key);
  end loop;
end;
$backfill$;
