-- The maintenance history is shared by the two drivers assigned to the
-- vehicle, while the original reporter identity and timestamp remain part of
-- every historical record.
alter table public.maintenance_reports
  add column if not exists reporter_name text;

-- Backfill the historical display name before the trigger protects future
-- inserts. The reporter_id remains the canonical identity for permissions.
update public.maintenance_reports as report
set reporter_name = profile.full_name
from public.profiles as profile
where profile.id = report.reporter_id
  and nullif(trim(coalesce(report.reporter_name, '')), '') is null;

create or replace function private.sync_maintenance_report_reporter_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  select profile.full_name
    into new.reporter_name
  from public.profiles as profile
  where profile.id = new.reporter_id;

  return new;
end;
$function$;

revoke all on function private.sync_maintenance_report_reporter_name()
from public, anon, authenticated, service_role;

drop trigger if exists maintenance_reports_sync_reporter_name
on public.maintenance_reports;

create trigger maintenance_reports_sync_reporter_name
before insert or update of reporter_id on public.maintenance_reports
for each row
execute function private.sync_maintenance_report_reporter_name();

-- A driver can read the complete history of their assigned vehicle, including
-- notices written by the other assigned driver. Updating and deleting remain
-- restricted to the original reporter or an administrator.
drop policy if exists maintenance_reports_select_own_or_admin
on public.maintenance_reports;

create policy maintenance_reports_select_own_admin_or_vehicle
on public.maintenance_reports
for select to authenticated
using (
  reporter_id = (select auth.uid())
  or (select private.is_admin())
  or exists (
    select 1
    from public.profiles as viewer
    where viewer.id = (select auth.uid())
      and viewer.role = 'driver'
      and viewer.active = true
      and nullif(upper(regexp_replace(coalesce(viewer.vehicle_plate, ''), '[^A-Z0-9]', '', 'g')), '') is not null
      and upper(regexp_replace(coalesce(viewer.vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
        = upper(regexp_replace(coalesce(maintenance_reports.vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
  )
);

-- Maintenance photos use the second path segment for the sanitized vehicle
-- plate. Allow the other assigned driver to view that evidence, without
-- giving them update or delete access to another driver's file.
drop policy if exists maintenance_reports_storage_select_own_or_admin
on storage.objects;

create policy maintenance_reports_storage_select_own_admin_or_vehicle
on storage.objects
for select to authenticated
using (
  bucket_id = 'maintenance-reports'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select private.is_admin())
    or exists (
      select 1
      from public.profiles as viewer
      where viewer.id = (select auth.uid())
        and viewer.role = 'driver'
        and viewer.active = true
        and nullif(upper(regexp_replace(coalesce(viewer.vehicle_plate, ''), '[^A-Z0-9]', '', 'g')), '') is not null
        and upper(regexp_replace(coalesce(viewer.vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
          = upper(regexp_replace(coalesce((storage.foldername(name))[2], ''), '[^A-Z0-9]', '', 'g'))
    )
  )
);
