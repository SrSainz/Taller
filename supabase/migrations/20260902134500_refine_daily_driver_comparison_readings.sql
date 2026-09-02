-- Prefer the explicit daily readings extracted from driver photos. The raw
-- odometer difference remains a fallback for older entries without a daily-km
-- document, while explicit consumption documents take precedence over fuel
-- litres for that driver and date.
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
  ), daily_values as (
    select
      coalesce(r.driver_id, d.driver_id) as driver_id,
      target_date as entry_date,
      coalesce(r.daily_km, 0) as daily_km,
      coalesce(
        d.document_consumption,
        case when r.daily_km > 0 and r.fuel_liters > 0 then r.fuel_liters / r.daily_km * 100 end
      ) as consumption
    from daily_readings r
    full join consumption_documents d
      on d.driver_id = r.driver_id
     and d.entry_date = r.entry_date
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
      and category = 'consumption'
      and upper(regexp_replace(coalesce(vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g')) in ('5043MLC', '5750MJV', '5754MJV')
  loop
    perform private.rebuild_driver_daily_comparison(day_key);
  end loop;
end;
$backfill$;
