-- An owned Storage file must not bypass the calendar's current-week rule.
-- The guarded document RPC issues a short-lived cleanup grant before removing
-- the ledger row. This also covers old paths moved into the current week.
create table if not exists private.document_storage_cleanup (
  file_path text primary key,
  owner_id uuid not null,
  expires_at timestamptz not null
);
alter table private.document_storage_cleanup enable row level security;
revoke all on private.document_storage_cleanup from public, anon, authenticated;

create or replace function private.can_delete_document_object(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (
    (select private.is_admin())
    or exists (
      select 1 from private.document_storage_cleanup c
      where (p_path = c.file_path or p_path = c.file_path || '.thumbnail.webp')
        and c.owner_id = (select auth.uid()) and c.expires_at > now()
    )
    or (
      (storage.foldername(p_path))[1] = (select auth.uid())::text
      and not exists (
        select 1 from public.documents d
        where p_path = d.file_path or p_path = d.file_path || '.thumbnail.webp'
      )
      and private.is_current_driver_week(case
        when (storage.foldername(p_path))[3] ~ '^\d{4}-\d{2}-\d{2}$'
        then (storage.foldername(p_path))[3]::date else null end)
    )
  );
$$;
revoke all on function private.can_delete_document_object(text) from public, anon;
grant execute on function private.can_delete_document_object(text) to authenticated;

create or replace function private.delete_document_with_cleanup_authorized(p_document_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_document public.documents%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'Sesión no disponible'; end if;
  select * into v_document from public.documents where id = p_document_id for update;
  if not found then raise exception 'Documento no disponible'; end if;
  if not (v_document.owner_id = (select auth.uid()) or (select private.is_admin())) then
    raise exception 'No tienes permiso para borrar este documento';
  end if;
  if not (select private.is_admin()) and not private.is_current_driver_week(v_document.document_date) then
    raise exception 'Los conductores solo pueden modificar la semana en curso';
  end if;
  delete from private.document_storage_cleanup where expires_at < now();
  insert into private.document_storage_cleanup(file_path, owner_id, expires_at)
    values (v_document.file_path, (select auth.uid()), now() + interval '1 day')
    on conflict (file_path) do update set owner_id=excluded.owner_id, expires_at=excluded.expires_at;
  return private.delete_document_with_cleanup_impl(p_document_id);
end;
$$;
revoke all on function private.delete_document_with_cleanup_authorized(uuid) from public, anon, service_role;
grant execute on function private.delete_document_with_cleanup_authorized(uuid) to authenticated;

drop policy if exists documents_storage_delete_own_or_admin on storage.objects;
create policy documents_storage_delete_own_or_admin on storage.objects
for delete to authenticated using (
  bucket_id = 'documents' and private.can_delete_document_object(name)
);
