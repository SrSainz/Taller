-- Keep the document confirmation RPC callable by the application while
-- keeping the privileged transaction replacement function out of the exposed
-- API surface. The public wrapper runs as the caller and validates ownership;
-- the private implementation is the only function allowed to bypass RLS for
-- the atomic replace plus projection trigger.

create or replace function private.confirm_document_transactions_impl(
  p_document_id uuid,
  p_operations jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_document public.documents%rowtype;
  v_operation jsonb;
  v_inserted integer := 0;
  v_duplicates integer := 0;
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
    raise exception 'No tienes permiso para confirmar este documento';
  end if;

  if coalesce(jsonb_typeof(p_operations), '') <> 'array' then
    raise exception 'Operaciones no válidas';
  end if;

  if jsonb_array_length(p_operations) > 50 then
    raise exception 'Demasiadas operaciones para un documento';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_operations) as item(value)
    where jsonb_typeof(item.value) <> 'object'
      or nullif(item.value->>'type', '') is null
      or nullif(item.value->>'date', '') is null
      or nullif(item.value->>'amount', '') is null
  ) then
    raise exception 'Operaciones incompletas';
  end if;

  -- A driver may only confirm movements for their own account and the vehicle
  -- already attached to the uploaded document. Administrators can confirm
  -- another driver/vehicle from the management workflow.
  if not (select private.is_admin()) and exists (
    select 1
    from jsonb_array_elements(p_operations) as item(value)
    where item.value->>'driverId' is distinct from (select auth.uid())::text
      or nullif(item.value->>'vehiclePlate', '') is distinct from nullif(v_document.vehicle_plate, '')
  ) then
    raise exception 'El documento no coincide con tu conductor o vehículo';
  end if;

  -- One document can have several central movements. Replacing all of them
  -- atomically also removes a value cleared during review and prevents an
  -- edited upload from accumulating stale amounts.
  delete from public.transactions
  where source_document_id = p_document_id;

  for v_operation in select value from jsonb_array_elements(p_operations)
  loop
    insert into public.transactions (
      type,
      occurred_on,
      amount,
      driver_id,
      vehicle_plate,
      source_document_id,
      category,
      metadata,
      dedupe_key,
      created_by
    )
    values (
      v_operation->>'type',
      (v_operation->>'date')::date,
      round((v_operation->>'amount')::numeric, 2),
      nullif(v_operation->>'driverId', '')::uuid,
      nullif(v_operation->>'vehiclePlate', ''),
      p_document_id,
      coalesce(nullif(v_operation->>'category', ''), v_operation->>'type'),
      coalesce(v_operation->'metadata', '{}'::jsonb),
      v_operation->>'dedupeKey',
      (select auth.uid())
    )
    on conflict (dedupe_key) do nothing;

    if found then
      v_inserted := v_inserted + 1;
    else
      v_duplicates := v_duplicates + 1;
    end if;
  end loop;

  update public.documents
  set status = case
        when v_inserted > 0 or v_duplicates > 0 then 'approved'
        else status
      end,
      document_date = case
        when jsonb_array_length(p_operations) > 0
          then nullif(p_operations->0->>'date', '')::date
        else document_date
      end,
      updated_at = timezone('utc', now())
  where id = p_document_id;

  return jsonb_build_object(
    'created', v_inserted,
    'duplicate', v_inserted = 0 and v_duplicates > 0
  );
end;
$function$;

create or replace function public.confirm_document_transactions(
  p_document_id uuid,
  p_operations jsonb
)
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

  if coalesce(jsonb_typeof(p_operations), '') <> 'array' then
    raise exception 'Operaciones no válidas';
  end if;

  -- This read is evaluated with the caller's RLS policies. It gives the
  -- public RPC a safe ownership boundary before it delegates to the private
  -- atomic writer.
  select * into v_document
  from public.documents
  where id = p_document_id;

  if not found then
    raise exception 'Documento no disponible';
  end if;

  if not (v_document.owner_id = (select auth.uid()) or (select private.is_admin())) then
    raise exception 'No tienes permiso para confirmar este documento';
  end if;

  return private.confirm_document_transactions_impl(p_document_id, p_operations);
end;
$function$;

revoke all on function private.confirm_document_transactions_impl(uuid, jsonb)
from public, anon, authenticated, service_role;
grant execute on function public.confirm_document_transactions(uuid, jsonb)
to authenticated;
