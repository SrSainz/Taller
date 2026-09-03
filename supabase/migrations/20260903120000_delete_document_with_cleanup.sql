-- Delete an uploaded driver document as one logical operation. The document
-- row is the source of truth for its central transactions; mileage-only
-- uploads also write directly to the daily driver projection, so that value
-- needs an explicit cleanup when the last source for the day is removed.

create or replace function private.delete_document_with_cleanup_impl(p_document_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_document public.documents%rowtype;
  v_record_type text;
  v_kind text;
  v_document_date date;
  v_pairs jsonb;
  v_pair jsonb;
  v_transactions_deleted integer := 0;
  v_entries_cleaned integer := 0;
begin
  select * into v_document
  from public.documents
  where id = p_document_id;

  if not found then
    raise exception 'Documento no disponible';
  end if;

  v_document_date := v_document.document_date;
  if v_document_date is null
    and nullif(v_document.extracted_data->>'date', '') ~ '^\d{4}-\d{2}-\d{2}$'
  then
    v_document_date := (v_document.extracted_data->>'date')::date;
  end if;

  v_record_type := lower(regexp_replace(
    coalesce(v_document.extracted_data->>'recordType', v_document.extracted_data->>'metric', ''),
    '\s+', ' ', 'g'
  ));
  v_kind := case
    when v_document.category = 'billing' or v_record_type in ('billing', 'billing_daily') then 'billing'
    when v_record_type in ('daily-km', 'partial-1', 'total-km', 'total', 'odometer', 'odometro', 'kilometraje diario', 'km diarios', 'kilometraje total', 'km acumulados') then 'mileage'
    when v_record_type in ('fuel', 'fuel receipt', 'fuel_receipt', 'repostaje') then 'fuel'
    when v_record_type in ('consumption', 'consumption rate', 'consumo') then 'consumption'
    when v_document.category = 'consumption' then 'fuel'
    else ''
  end;

  select coalesce(jsonb_agg(jsonb_build_object(
    'driver_id', driver_id,
    'occurred_on', occurred_on
  )), '[]'::jsonb)
  into v_pairs
  from (
    select distinct driver_id, occurred_on
    from public.transactions
    where source_document_id = p_document_id
      and driver_id is not null
      and occurred_on is not null
  ) affected;

  select count(*) into v_transactions_deleted
  from public.transactions
  where source_document_id = p_document_id;

  -- The foreign key removes all central transactions for this document. Its
  -- delete trigger also refreshes the daily projection, and the explicit
  -- rebuild below makes the invariant clear and resilient to trigger changes.
  delete from public.documents
  where id = p_document_id;

  if v_transactions_deleted > 0 then
    for v_pair in select value from jsonb_array_elements(v_pairs)
    loop
      perform private.rebuild_driver_entry_projection(
        (v_pair->>'driver_id')::uuid,
        (v_pair->>'occurred_on')::date
      );
    end loop;
  end if;

  if v_document_date is not null and v_document.owner_id is not null then
    -- A zero-operation billing upload can still have left values in the
    -- legacy daily projection. Remove only those fields when no billing
    -- source remains for that driver and day.
    if v_kind = 'billing' and not exists (
      select 1
      from public.documents d
      where d.owner_id = v_document.owner_id
        and d.document_date = v_document_date
        and (d.category = 'billing' or lower(regexp_replace(coalesce(d.extracted_data->>'recordType', d.extracted_data->>'metric', ''), '\s+', ' ', 'g')) in ('billing', 'billing_daily'))
    ) and not exists (
      select 1
      from public.transactions t
      where t.driver_id = v_document.owner_id
        and t.occurred_on = v_document_date
        and t.type in ('billing', 'cash', 'tip', 'refund')
    ) then
      update public.driver_entries
      set billing = 0,
          cash_collected = 0,
          tips = 0,
          refunds = 0,
          updated_at = timezone('utc', now())
      where driver_id = v_document.owner_id
        and entry_date = v_document_date;
    end if;

    if v_kind = 'fuel' and not exists (
      select 1
      from public.documents d
      where d.owner_id = v_document.owner_id
        and d.document_date = v_document_date
        and (
          lower(regexp_replace(coalesce(d.extracted_data->>'recordType', d.extracted_data->>'metric', ''), '\s+', ' ', 'g')) in ('fuel', 'fuel receipt', 'fuel_receipt', 'repostaje')
          or (d.category = 'consumption' and lower(regexp_replace(coalesce(d.extracted_data->>'recordType', d.extracted_data->>'metric', ''), '\s+', ' ', 'g')) not in ('consumption', 'consumption rate', 'consumo'))
        )
    ) and not exists (
      select 1
      from public.transactions t
      where t.driver_id = v_document.owner_id
        and t.occurred_on = v_document_date
        and t.type = 'fuel'
    ) then
      update public.driver_entries
      set fuel_cost = 0,
          fuel_liters = 0,
          updated_at = timezone('utc', now())
      where driver_id = v_document.owner_id
        and entry_date = v_document_date;
    end if;

    -- daily-km, total-km and fuel uploads can provide the odometer directly
    -- without creating a central transaction. Keep it only if another
    -- mileage source or an odometer-bearing fuel/central record remains.
    if v_kind in ('fuel', 'mileage') and not exists (
      select 1
      from public.documents d
      where d.owner_id = v_document.owner_id
        and d.document_date = v_document_date
        and (
          lower(regexp_replace(coalesce(d.extracted_data->>'recordType', d.extracted_data->>'metric', ''), '\s+', ' ', 'g')) in ('daily-km', 'partial-1', 'total-km', 'total', 'odometer', 'odometro', 'kilometraje diario', 'km diarios', 'kilometraje total', 'km acumulados')
          or (
            lower(regexp_replace(coalesce(d.extracted_data->>'recordType', d.extracted_data->>'metric', ''), '\s+', ' ', 'g')) in ('fuel', 'fuel receipt', 'fuel_receipt', 'repostaje')
            and case
              when coalesce(d.extracted_data->>'odometerKm', d.extracted_data->>'odometer_km', d.extracted_data->>'totalKm') ~ '^[0-9]+([.][0-9]+)?$'
              then coalesce(d.extracted_data->>'odometerKm', d.extracted_data->>'odometer_km', d.extracted_data->>'totalKm')::numeric > 0
              else false
            end
          )
        )
    ) and not exists (
      select 1
      from public.transactions t
      where t.driver_id = v_document.owner_id
        and t.occurred_on = v_document_date
        and jsonb_typeof(t.metadata->'odometerKm') = 'number'
    ) then
      update public.driver_entries
      set odometer_km = 0,
          updated_at = timezone('utc', now())
      where driver_id = v_document.owner_id
        and entry_date = v_document_date
        and not (coalesce(manual_overrides, '{}'::jsonb) ? 'mileage');
      get diagnostics v_entries_cleaned = row_count;
    end if;
  end if;

  return jsonb_build_object(
    'deleted', true,
    'file_path', coalesce(v_document.file_path, ''),
    'transactions_deleted', v_transactions_deleted,
    'driver_entries_cleaned', v_entries_cleaned
  );
end;
$function$;

create or replace function public.delete_document_with_cleanup(p_document_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_document public.documents%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Sesión no disponible';
  end if;

  select * into v_document
  from public.documents
  where id = p_document_id;

  if not found then
    raise exception 'Documento no disponible';
  end if;

  if not (v_document.owner_id = (select auth.uid()) or (select private.is_admin())) then
    raise exception 'No tienes permiso para borrar este documento';
  end if;

  return private.delete_document_with_cleanup_impl(p_document_id);
end;
$function$;

revoke all on function private.delete_document_with_cleanup_impl(uuid)
from public, anon, authenticated, service_role;
revoke all on function public.delete_document_with_cleanup(uuid)
from public, anon, service_role;
grant execute on function public.delete_document_with_cleanup(uuid)
to authenticated;
