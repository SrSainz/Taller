-- Keep document confirmation idempotent and project all fuel litres for the day.
create or replace function public.confirm_document_transactions(p_document_id uuid, p_operations jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_document public.documents%rowtype;
  v_operation jsonb;
  v_inserted integer := 0;
  v_duplicates integer := 0;
  v_driver uuid;
  v_date date;
  v_plate text;
begin
  select * into v_document from public.documents where id = p_document_id;
  if not found then raise exception 'Documento no disponible'; end if;
  if jsonb_typeof(p_operations) <> 'array' then raise exception 'Operaciones no validas'; end if;

  for v_operation in select value from jsonb_array_elements(p_operations)
  loop
    insert into public.transactions (type, occurred_on, amount, driver_id, vehicle_plate, source_document_id, category, metadata, dedupe_key, created_by)
    values (
      v_operation->>'type', (v_operation->>'date')::date, round((v_operation->>'amount')::numeric, 2),
      nullif(v_operation->>'driverId', '')::uuid, nullif(v_operation->>'vehiclePlate', ''), p_document_id,
      coalesce(nullif(v_operation->>'category', ''), v_operation->>'type'), coalesce(v_operation->'metadata', '{}'::jsonb),
      v_operation->>'dedupeKey', (select auth.uid())
    ) on conflict (dedupe_key) do nothing;
    if found then v_inserted := v_inserted + 1; else v_duplicates := v_duplicates + 1; end if;
  end loop;

  update public.documents set status = case when v_inserted > 0 then 'approved' else status end,
    document_date = nullif(p_operations->0->>'date', '')::date, updated_at = timezone('utc', now())
  where id = p_document_id;

  for v_driver, v_date, v_plate in
    select distinct driver_id, occurred_on, vehicle_plate from public.transactions
    where source_document_id = p_document_id and driver_id is not null
  loop
    insert into public.driver_entries (driver_id, vehicle_plate, entry_date, billing, cash_collected, tips, fuel_cost, fuel_liters, odometer_km, tolls, wash_expenses, other_expenses)
    select v_driver, coalesce(v_plate, ''), v_date,
      coalesce(sum(amount) filter (where type='billing'),0), coalesce(sum(amount) filter (where type='cash'),0),
      coalesce(sum(amount) filter (where type='tip'),0), coalesce(sum(amount) filter (where type='fuel'),0),
      coalesce(sum((metadata->>'liters')::numeric) filter (where type='fuel' and metadata ? 'liters'),0),
      coalesce(max((metadata->>'odometerKm')::integer) filter (where metadata ? 'odometerKm'),0),
      coalesce(sum(amount) filter (where type='toll'),0), coalesce(sum(amount) filter (where type='wash'),0),
      coalesce(sum(amount) filter (where type='miscellaneous'),0)
    from public.transactions where driver_id=v_driver and occurred_on=v_date
    on conflict (driver_id, entry_date) do update set
      vehicle_plate=excluded.vehicle_plate, billing=excluded.billing, cash_collected=excluded.cash_collected,
      tips=excluded.tips, fuel_cost=excluded.fuel_cost, fuel_liters=excluded.fuel_liters,
      odometer_km=greatest(public.driver_entries.odometer_km, excluded.odometer_km), tolls=excluded.tolls,
      wash_expenses=excluded.wash_expenses, other_expenses=excluded.other_expenses, updated_at=timezone('utc', now());
  end loop;

  return jsonb_build_object('created', v_inserted, 'duplicates', v_duplicates, 'duplicate', v_inserted = 0);
end;
$$;

revoke all on function public.confirm_document_transactions(uuid, jsonb) from public, anon;
grant execute on function public.confirm_document_transactions(uuid, jsonb) to authenticated;
