-- The private photo path uses a lower-case, sanitized plate (for example
-- 5043-mlc). Compare both sides with a case-insensitive alphanumeric key so
-- the assigned driver can open the other driver's evidence reliably.
drop policy if exists maintenance_reports_select_own_admin_or_vehicle
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
      and nullif(upper(regexp_replace(coalesce(viewer.vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g')), '') is not null
      and upper(regexp_replace(coalesce(viewer.vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g'))
        = upper(regexp_replace(coalesce(maintenance_reports.vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g'))
  )
);

drop policy if exists maintenance_reports_storage_select_own_admin_or_vehicle
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
        and nullif(upper(regexp_replace(coalesce(viewer.vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g')), '') is not null
        and upper(regexp_replace(coalesce(viewer.vehicle_plate, ''), '[^A-Za-z0-9]', '', 'g'))
          = upper(regexp_replace(coalesce((storage.foldername(name))[2], ''), '[^A-Za-z0-9]', '', 'g'))
    )
  )
);
