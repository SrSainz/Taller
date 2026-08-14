-- Central economic ledger: every amount has one source document and one row.
alter table public.documents add column if not exists file_hash text;
alter table public.documents add column if not exists document_date date;

create unique index if not exists documents_file_hash_key
  on public.documents (file_hash) where file_hash is not null;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('billing', 'fuel', 'cash', 'tip', 'toll', 'wash', 'maintenance', 'miscellaneous')),
  occurred_on date not null,
  amount numeric(12,2) not null check (amount >= 0),
  driver_id uuid references public.profiles(id) on delete set null,
  vehicle_plate text,
  source_document_id uuid not null references public.documents(id) on delete cascade,
  category text not null,
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text not null unique,
  created_by uuid not null references public.profiles(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists transactions_driver_date_idx on public.transactions (driver_id, occurred_on desc);
create index if not exists transactions_vehicle_date_idx on public.transactions (vehicle_plate, occurred_on desc);
create index if not exists transactions_type_date_idx on public.transactions (type, occurred_on desc);
create index if not exists transactions_document_idx on public.transactions (source_document_id);
create index if not exists transactions_created_by_idx on public.transactions (created_by);

grant select, insert on public.transactions to authenticated;
alter table public.transactions enable row level security;

create policy transactions_select_self_or_admin on public.transactions for select to authenticated
  using (driver_id = (select auth.uid()) or created_by = (select auth.uid()) or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'));
create policy transactions_insert_self_or_admin on public.transactions for insert to authenticated
  with check (
    created_by = (select auth.uid()) and
    (driver_id = (select auth.uid()) or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'))
  );

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
  v_driver uuid;
  v_date date;
  v_plate text;
begin
  select * into v_document from public.documents where id = p_document_id;
  if not found then raise exception 'Documento no disponible'; end if;
  if jsonb_typeof(p_operations) <> 'array' then raise exception 'Operaciones no válidas'; end if;

  for v_operation in select value from jsonb_array_elements(p_operations)
  loop
    insert into public.transactions (type, occurred_on, amount, driver_id, vehicle_plate, source_document_id, category, metadata, dedupe_key, created_by)
    values (
      v_operation->>'type', (v_operation->>'date')::date, round((v_operation->>'amount')::numeric, 2),
      nullif(v_operation->>'driverId', '')::uuid, nullif(v_operation->>'vehiclePlate', ''), p_document_id,
      coalesce(nullif(v_operation->>'category', ''), v_operation->>'type'), coalesce(v_operation->'metadata', '{}'::jsonb),
      v_operation->>'dedupeKey', (select auth.uid())
    ) on conflict (dedupe_key) do nothing;
    if found then v_inserted := v_inserted + 1; end if;
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
      coalesce(max((metadata->>'liters')::numeric) filter (where metadata ? 'liters'),0),
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

  return jsonb_build_object('created', v_inserted, 'duplicate', v_inserted = 0);
end;
$$;

revoke all on function public.confirm_document_transactions(uuid, jsonb) from public, anon;
grant execute on function public.confirm_document_transactions(uuid, jsonb) to authenticated;
