-- Keep the public RPC invoker-safe while allowing it to delegate to the
-- privileged cleanup implementation. The previous public wrapper called the
-- private implementation directly, but that function is intentionally not
-- executable by authenticated clients; Postgres therefore rejected the
-- driver's delete with "permission denied for function ..._impl".

create or replace function private.delete_document_with_cleanup_authorized(p_document_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_document public.documents%rowtype;
begin
  -- Keep this guard inside the definer boundary as well as in the public
  -- wrapper. This prevents the private delegate from becoming an unguarded
  -- deletion path if it is ever called through another authenticated route.
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

revoke all on function private.delete_document_with_cleanup_authorized(uuid)
from public, anon, service_role;
grant execute on function private.delete_document_with_cleanup_authorized(uuid)
to authenticated;

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

  return private.delete_document_with_cleanup_authorized(p_document_id);
end;
$function$;

revoke all on function public.delete_document_with_cleanup(uuid)
from public, anon, service_role;
grant execute on function public.delete_document_with_cleanup(uuid)
to authenticated;
