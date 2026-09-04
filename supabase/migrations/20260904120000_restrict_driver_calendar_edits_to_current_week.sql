-- Drivers may consult every historical period, but their calendar writes are
-- limited to the current Monday-Sunday week. Administrators keep full access
-- so they can correct historical records from the management area.

create or replace function private.is_current_driver_week(p_date date)
returns boolean
language sql
stable
set search_path = ''
as $function$
  with madrid_clock as (
    select (timezone('Europe/Madrid', now()))::date as today
  )
  select coalesce(
    p_date between
      (today - (extract(isodow from today)::integer - 1))
      and (today + (7 - extract(isodow from today)::integer)),
    false
  )
  from madrid_clock;
$function$;

revoke all on function private.is_current_driver_week(date)
from public, anon, service_role;
grant usage on schema private to authenticated;
grant execute on function private.is_current_driver_week(date) to authenticated;

drop policy if exists driver_entries_insert_self_or_admin on public.driver_entries;
create policy driver_entries_insert_self_or_admin on public.driver_entries for insert to authenticated
  with check (
    (select private.is_admin())
    or (
      driver_id = (select auth.uid())
      and (select private.is_current_driver_week(entry_date))
      and upper(regexp_replace(coalesce(vehicle_plate, ''), '[^A-Z0-9]', '', 'g')) = (
        select upper(regexp_replace(coalesce(p.vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
        from public.profiles as p
        where p.id = (select auth.uid())
      )
    )
  );

drop policy if exists driver_entries_update_self_or_admin on public.driver_entries;
create policy driver_entries_update_self_or_admin on public.driver_entries for update to authenticated
  using (
    (select private.is_admin())
    or (
      driver_id = (select auth.uid())
      and (select private.is_current_driver_week(entry_date))
    )
  )
  with check (
    (select private.is_admin())
    or (
      driver_id = (select auth.uid())
      and (select private.is_current_driver_week(entry_date))
      and upper(regexp_replace(coalesce(vehicle_plate, ''), '[^A-Z0-9]', '', 'g')) = (
        select upper(regexp_replace(coalesce(p.vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
        from public.profiles as p
        where p.id = (select auth.uid())
      )
    )
  );

drop policy if exists driver_entries_delete_self_or_admin on public.driver_entries;
create policy driver_entries_delete_self_or_admin on public.driver_entries for delete to authenticated
  using (
    (select private.is_admin())
    or (
      driver_id = (select auth.uid())
      and (select private.is_current_driver_week(entry_date))
    )
  );

drop policy if exists documents_insert_self_or_admin on public.documents;
create policy documents_insert_self_or_admin on public.documents for insert to authenticated
  with check (
    (select private.is_admin())
    or (
      owner_id = (select auth.uid())
      and (select private.is_current_driver_week(document_date))
    )
  );

drop policy if exists documents_update_self_or_admin on public.documents;
create policy documents_update_self_or_admin on public.documents for update to authenticated
  using (
    (select private.is_admin())
    or (
      owner_id = (select auth.uid())
      and (select private.is_current_driver_week(document_date))
    )
  )
  with check (
    (select private.is_admin())
    or (
      owner_id = (select auth.uid())
      and (select private.is_current_driver_week(document_date))
    )
  );

drop policy if exists documents_delete_self_or_admin on public.documents;
create policy documents_delete_self_or_admin on public.documents for delete to authenticated
  using (
    (select private.is_admin())
    or (
      owner_id = (select auth.uid())
      and (select private.is_current_driver_week(document_date))
    )
  );

drop policy if exists transactions_insert_self_or_admin on public.transactions;
create policy transactions_insert_self_or_admin on public.transactions for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (
      (select private.is_admin())
      or (
        driver_id = (select auth.uid())
        and (select private.is_current_driver_week(occurred_on))
      )
    )
  );

-- The date-bearing object path lets Storage reject a driver's historical
-- upload before the corresponding documents row is created.
drop policy if exists documents_storage_insert_own_or_admin on storage.objects;
create policy documents_storage_insert_own_or_admin on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (
      (select private.is_admin())
      or (
        (storage.foldername(name))[1] = (select auth.uid())::text
        and (select private.is_current_driver_week(
          case
            when (storage.foldername(name))[3] ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              then (storage.foldername(name))[3]::date
            else null
          end
        ))
      )
    )
  );

drop policy if exists documents_storage_update_own_or_admin on storage.objects;
create policy documents_storage_update_own_or_admin on storage.objects for update to authenticated
  using (
    bucket_id = 'documents'
    and (
      (select private.is_admin())
      or (
        (storage.foldername(name))[1] = (select auth.uid())::text
        and (select private.is_current_driver_week(
          case
            when (storage.foldername(name))[3] ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              then (storage.foldername(name))[3]::date
            else null
          end
        ))
      )
    )
  )
  with check (
    bucket_id = 'documents'
    and (
      (select private.is_admin())
      or (
        (storage.foldername(name))[1] = (select auth.uid())::text
        and (select private.is_current_driver_week(
          case
            when (storage.foldername(name))[3] ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
              then (storage.foldername(name))[3]::date
            else null
          end
        ))
      )
    )
  );

-- Keep the public RPC as the final gate because its implementation is a
-- security-definer projection/transaction operation.
create or replace function public.confirm_document_transactions(p_document_id uuid, p_operations jsonb)
returns jsonb
language plpgsql
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

  select * into v_document
  from public.documents
  where id = p_document_id;

  if not found then
    raise exception 'Documento no disponible';
  end if;

  if not (v_document.owner_id = (select auth.uid()) or (select private.is_admin())) then
    raise exception 'No tienes permiso para confirmar este documento';
  end if;

  if not (select private.is_admin())
     and (
       not (select private.is_current_driver_week(v_document.document_date))
       or exists (
         select 1
         from jsonb_array_elements(p_operations) as item(value)
         where not (select private.is_current_driver_week(
           case
             when nullif(item.value->>'date', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
               then (item.value->>'date')::date
             else null
           end
         ))
       )
     ) then
    raise exception 'Los conductores solo pueden modificar la semana en curso';
  end if;

  return private.confirm_document_transactions_impl(p_document_id, p_operations);
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

  if not (select private.is_admin())
     and not (select private.is_current_driver_week(v_document.document_date)) then
    raise exception 'Los conductores solo pueden modificar la semana en curso';
  end if;

  return private.delete_document_with_cleanup_impl(p_document_id);
end;
$function$;

revoke all on function public.confirm_document_transactions(uuid, jsonb)
from public, anon, service_role;
grant execute on function public.confirm_document_transactions(uuid, jsonb) to authenticated;

revoke all on function public.delete_document_with_cleanup(uuid)
from public, anon, service_role;
grant execute on function public.delete_document_with_cleanup(uuid) to authenticated;
