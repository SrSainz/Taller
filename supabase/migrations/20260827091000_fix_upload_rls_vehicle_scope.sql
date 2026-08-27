-- The vehicle comparison must use the value being inserted, not the
-- identically named value from the profiles subquery. Keep the driver path
-- restricted to the driver's assigned vehicle while allowing the administrator
-- to act on behalf of a selected driver.
drop policy if exists driver_entries_insert_self_or_admin on public.driver_entries;
create policy driver_entries_insert_self_or_admin on public.driver_entries for insert to authenticated
  with check (
    (select private.is_admin())
    or (
      driver_id = (select auth.uid())
      and upper(regexp_replace(coalesce(vehicle_plate, ''), '[^A-Z0-9]', '', 'g')) = (
        select upper(regexp_replace(coalesce(p.vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
        from public.profiles as p
        where p.id = (select auth.uid())
      )
    )
  );

drop policy if exists driver_entries_update_self_or_admin on public.driver_entries;
create policy driver_entries_update_self_or_admin on public.driver_entries for update to authenticated
  using (driver_id = (select auth.uid()) or (select private.is_admin()))
  with check (
    (select private.is_admin())
    or (
      driver_id = (select auth.uid())
      and upper(regexp_replace(coalesce(vehicle_plate, ''), '[^A-Z0-9]', '', 'g')) = (
        select upper(regexp_replace(coalesce(p.vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
        from public.profiles as p
        where p.id = (select auth.uid())
      )
    )
  );

drop policy if exists maintenance_reports_insert_driver_or_admin on public.maintenance_reports;
create policy maintenance_reports_insert_driver_or_admin on public.maintenance_reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and (
      (select private.is_admin())
      or (
        upper(regexp_replace(coalesce(vehicle_plate, ''), '[^A-Z0-9]', '', 'g')) = (
          select upper(regexp_replace(coalesce(p.vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
          from public.profiles as p
          where p.id = (select auth.uid())
            and p.role = 'driver'
            and p.active = true
        )
        and upper(regexp_replace(coalesce(vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
          in ('5043MLC', '5750MJV', '5754MJV')
      )
    )
  );
