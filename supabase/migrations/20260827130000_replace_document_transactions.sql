-- Re-confirming an already archived document must replace its ledger rows.
-- Otherwise an edited amount generates a second transaction because the
-- historical dedupe key also contains the amount.  Keep the original
-- document as the source of truth and rebuild the daily projection through
-- the transaction trigger installed by the previous reconciliation migration.
create or replace function public.confirm_document_transactions(p_document_id uuid, p_operations jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
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

  if jsonb_typeof(p_operations) <> 'array' then
    raise exception 'Operaciones no válidas';
  end if;

  -- One document can have several central movements (billing, tips,
  -- refunds, fuel, etc.).  Replacing all of them atomically also removes a
  -- value that the user cleared during review and prevents edited uploads
  -- from accumulating stale amounts.
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
$$;

revoke all on function public.confirm_document_transactions(uuid, jsonb) from public, anon, service_role;
grant execute on function public.confirm_document_transactions(uuid, jsonb) to authenticated;
