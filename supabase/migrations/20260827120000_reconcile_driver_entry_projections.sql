-- Keep the central transaction ledger and the daily driver projection aligned
-- when a document is deleted or a transaction is corrected. Without this
-- trigger, the derived driver_entries row could keep the old amount forever.

drop index if exists public.documents_file_hash_key;
create unique index if not exists documents_owner_file_hash_key
  on public.documents (owner_id, file_hash)
  where file_hash is not null;

create index if not exists commission_reports_created_by_idx
  on public.commission_reports (created_by);

create index if not exists driver_period_financials_created_by_idx
  on public.driver_period_financials (created_by);

create or replace function private.rebuild_driver_entry_projection(p_driver_id uuid, p_entry_date date)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  has_transactions boolean;
  has_billing boolean;
  has_cash boolean;
  has_tips boolean;
  has_fuel boolean;
  has_liters boolean;
  has_odometer boolean;
  has_tolls boolean;
  has_refunds boolean;
  has_wash boolean;
  has_miscellaneous boolean;
begin
  if p_driver_id is null or p_entry_date is null then
    return;
  end if;

  select exists (
    select 1 from public.transactions
    where driver_id = p_driver_id and occurred_on = p_entry_date
  ) into has_transactions;

  if not has_transactions then
    -- Washes and miscellaneous expenses can be entered manually by a driver;
    -- leave those two fields intact when their last central document is gone.
    update public.driver_entries
    set billing = 0,
        cash_collected = 0,
        tips = 0,
        fuel_cost = 0,
        fuel_liters = 0,
        odometer_km = 0,
        tolls = 0,
        refunds = 0,
        updated_at = timezone('utc', now())
    where driver_id = p_driver_id and entry_date = p_entry_date;
    return;
  end if;

  select
    exists (select 1 from public.transactions where driver_id = p_driver_id and occurred_on = p_entry_date and type = 'billing'),
    exists (select 1 from public.transactions where driver_id = p_driver_id and occurred_on = p_entry_date and type = 'cash'),
    exists (select 1 from public.transactions where driver_id = p_driver_id and occurred_on = p_entry_date and type = 'tip'),
    exists (select 1 from public.transactions where driver_id = p_driver_id and occurred_on = p_entry_date and type = 'fuel'),
    exists (select 1 from public.transactions where driver_id = p_driver_id and occurred_on = p_entry_date and type = 'fuel' and jsonb_typeof(metadata->'liters') = 'number'),
    exists (select 1 from public.transactions where driver_id = p_driver_id and occurred_on = p_entry_date and jsonb_typeof(metadata->'odometerKm') = 'number'),
    exists (select 1 from public.transactions where driver_id = p_driver_id and occurred_on = p_entry_date and type = 'toll'),
    exists (select 1 from public.transactions where driver_id = p_driver_id and occurred_on = p_entry_date and type = 'refund'),
    exists (select 1 from public.transactions where driver_id = p_driver_id and occurred_on = p_entry_date and type = 'wash'),
    exists (select 1 from public.transactions where driver_id = p_driver_id and occurred_on = p_entry_date and type = 'miscellaneous')
  into has_billing, has_cash, has_tips, has_fuel, has_liters, has_odometer, has_tolls, has_refunds, has_wash, has_miscellaneous;

  insert into public.driver_entries (
    driver_id, vehicle_plate, entry_date, billing, cash_collected, tips,
    fuel_cost, fuel_liters, odometer_km, tolls, refunds, wash_expenses,
    other_expenses, updated_at
  )
  select
    p_driver_id,
    coalesce(max(vehicle_plate), ''),
    p_entry_date,
    coalesce(sum(amount) filter (where type = 'billing'), 0),
    coalesce(sum(amount) filter (where type = 'cash'), 0),
    coalesce(sum(amount) filter (where type = 'tip'), 0),
    coalesce(sum(amount) filter (where type = 'fuel'), 0),
    coalesce(sum((metadata->>'liters')::numeric) filter (where type = 'fuel' and jsonb_typeof(metadata->'liters') = 'number'), 0),
    coalesce((max((metadata->>'odometerKm')::numeric) filter (where jsonb_typeof(metadata->'odometerKm') = 'number'))::integer, 0),
    coalesce(sum(amount) filter (where type = 'toll'), 0),
    coalesce(sum(amount) filter (where type = 'refund'), 0),
    coalesce(sum(amount) filter (where type = 'wash'), 0),
    coalesce(sum(amount) filter (where type = 'miscellaneous'), 0),
    timezone('utc', now())
  from public.transactions
  where driver_id = p_driver_id and occurred_on = p_entry_date
  on conflict (driver_id, entry_date) do update set
    vehicle_plate = coalesce(nullif(excluded.vehicle_plate, ''), public.driver_entries.vehicle_plate),
    billing = case when has_billing then excluded.billing else public.driver_entries.billing end,
    cash_collected = case when has_cash then excluded.cash_collected else public.driver_entries.cash_collected end,
    tips = case when has_tips then excluded.tips else public.driver_entries.tips end,
    fuel_cost = case when has_fuel then excluded.fuel_cost else public.driver_entries.fuel_cost end,
    fuel_liters = case when has_liters then excluded.fuel_liters else public.driver_entries.fuel_liters end,
    odometer_km = case when has_odometer then excluded.odometer_km else public.driver_entries.odometer_km end,
    tolls = case when has_tolls then excluded.tolls else public.driver_entries.tolls end,
    refunds = case when has_refunds then excluded.refunds else public.driver_entries.refunds end,
    wash_expenses = case when has_wash then excluded.wash_expenses else public.driver_entries.wash_expenses end,
    other_expenses = case when has_miscellaneous then excluded.other_expenses else public.driver_entries.other_expenses end,
    updated_at = timezone('utc', now());
end;
$function$;

create or replace function private.sync_driver_entry_projection()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op in ('DELETE', 'UPDATE') then
    perform private.rebuild_driver_entry_projection(old.driver_id, old.occurred_on);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform private.rebuild_driver_entry_projection(new.driver_id, new.occurred_on);
  end if;
  return coalesce(new, old);
end;
$function$;

revoke all on function private.rebuild_driver_entry_projection(uuid, date) from public, anon, authenticated, service_role;
revoke all on function private.sync_driver_entry_projection() from public, anon, authenticated, service_role;

drop trigger if exists transactions_sync_driver_entry_projection on public.transactions;
create trigger transactions_sync_driver_entry_projection
  after insert or update or delete on public.transactions
  for each row execute function private.sync_driver_entry_projection();
