-- Keep authorization consistent with the application profile source of truth.
-- The UI already falls back to public.profiles when an older JWT does not yet
-- contain the role claim. RLS must make the same decision without broadening
-- access to authenticated users.
create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select (select auth.uid()) is not null
    and (
      ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
      or exists (
        select 1
        from public.profiles
        where profiles.id = (select auth.uid())
          and profiles.role = 'admin'
          and profiles.active = true
      )
    );
$function$;

revoke all on function private.is_admin() from public, anon, service_role;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (select private.is_admin()));

drop policy if exists profiles_insert_self_or_admin on public.profiles;
create policy profiles_insert_self_or_admin on public.profiles for insert to authenticated
  with check ((select private.is_admin()) or ((select auth.uid()) = id and role = 'driver'));

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin on public.profiles for update to authenticated
  using ((select auth.uid()) = id or (select private.is_admin()))
  with check ((select private.is_admin()) or ((select auth.uid()) = id and role = 'driver'));

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles for delete to authenticated
  using ((select private.is_admin()));

drop policy if exists driver_entries_select_self_or_admin on public.driver_entries;
create policy driver_entries_select_self_or_admin on public.driver_entries for select to authenticated
  using (driver_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists driver_entries_insert_self_or_admin on public.driver_entries;
create policy driver_entries_insert_self_or_admin on public.driver_entries for insert to authenticated
  with check (
    (select private.is_admin())
    or (
      driver_id = (select auth.uid())
      and exists (
        select 1
        from public.profiles
        where profiles.id = (select auth.uid())
          and upper(regexp_replace(coalesce(profiles.vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
            = upper(regexp_replace(coalesce(vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
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
      and exists (
        select 1
        from public.profiles
        where profiles.id = (select auth.uid())
          and upper(regexp_replace(coalesce(profiles.vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
            = upper(regexp_replace(coalesce(vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
      )
    )
  );

drop policy if exists driver_entries_delete_self_or_admin on public.driver_entries;
create policy driver_entries_delete_self_or_admin on public.driver_entries for delete to authenticated
  using (driver_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists documents_select_self_or_admin on public.documents;
create policy documents_select_self_or_admin on public.documents for select to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists documents_insert_self_or_admin on public.documents;
create policy documents_insert_self_or_admin on public.documents for insert to authenticated
  with check (owner_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists documents_update_self_or_admin on public.documents;
create policy documents_update_self_or_admin on public.documents for update to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()))
  with check (owner_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists documents_delete_self_or_admin on public.documents;
create policy documents_delete_self_or_admin on public.documents for delete to authenticated
  using (owner_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists transactions_select_self_or_admin on public.transactions;
create policy transactions_select_self_or_admin on public.transactions for select to authenticated
  using (
    driver_id = (select auth.uid())
    or created_by = (select auth.uid())
    or (select private.is_admin())
  );

drop policy if exists transactions_insert_self_or_admin on public.transactions;
create policy transactions_insert_self_or_admin on public.transactions for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (driver_id = (select auth.uid()) or (select private.is_admin()))
  );

drop policy if exists transactions_update_admin on public.transactions;
create policy transactions_update_admin on public.transactions for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists transactions_delete_admin on public.transactions;
create policy transactions_delete_admin on public.transactions for delete to authenticated
  using ((select private.is_admin()));

drop policy if exists documents_storage_select_own_or_admin on storage.objects;
create policy documents_storage_select_own_or_admin on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  );

drop policy if exists documents_storage_insert_own_or_admin on storage.objects;
create policy documents_storage_insert_own_or_admin on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  );

drop policy if exists documents_storage_update_own_or_admin on storage.objects;
create policy documents_storage_update_own_or_admin on storage.objects for update to authenticated
  using (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  )
  with check (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  );

drop policy if exists documents_storage_delete_own_or_admin on storage.objects;
create policy documents_storage_delete_own_or_admin on storage.objects for delete to authenticated
  using (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  );

drop policy if exists maintenance_reports_select_own_or_admin on public.maintenance_reports;
create policy maintenance_reports_select_own_or_admin on public.maintenance_reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists maintenance_reports_insert_driver_or_admin on public.maintenance_reports;
create policy maintenance_reports_insert_driver_or_admin on public.maintenance_reports for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and (
      (select private.is_admin())
      or exists (
        select 1
        from public.profiles
        where profiles.id = (select auth.uid())
          and profiles.role = 'driver'
          and profiles.active = true
          and upper(regexp_replace(coalesce(profiles.vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
            = upper(regexp_replace(coalesce(vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
          and upper(regexp_replace(coalesce(vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
            in ('5043MLC', '5750MJV', '5754MJV')
      )
    )
  );

drop policy if exists maintenance_reports_update_own_or_admin on public.maintenance_reports;
create policy maintenance_reports_update_own_or_admin on public.maintenance_reports for update to authenticated
  using (reporter_id = (select auth.uid()) or (select private.is_admin()))
  with check (reporter_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists maintenance_reports_delete_own_or_admin on public.maintenance_reports;
create policy maintenance_reports_delete_own_or_admin on public.maintenance_reports for delete to authenticated
  using (reporter_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists maintenance_reports_storage_select_own_or_admin on storage.objects;
create policy maintenance_reports_storage_select_own_or_admin on storage.objects for select to authenticated
  using (
    bucket_id = 'maintenance-reports'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  );

drop policy if exists maintenance_reports_storage_insert_own_or_admin on storage.objects;
create policy maintenance_reports_storage_insert_own_or_admin on storage.objects for insert to authenticated
  with check (
    bucket_id = 'maintenance-reports'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  );

drop policy if exists maintenance_reports_storage_update_own_or_admin on storage.objects;
create policy maintenance_reports_storage_update_own_or_admin on storage.objects for update to authenticated
  using (
    bucket_id = 'maintenance-reports'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  )
  with check (
    bucket_id = 'maintenance-reports'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  );

drop policy if exists maintenance_reports_storage_delete_own_or_admin on storage.objects;
create policy maintenance_reports_storage_delete_own_or_admin on storage.objects for delete to authenticated
  using (
    bucket_id = 'maintenance-reports'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select private.is_admin())
    )
  );

drop policy if exists driver_period_financials_admin_select on public.driver_period_financials;
create policy driver_period_financials_admin_select on public.driver_period_financials for select to authenticated
  using ((select private.is_admin()));

drop policy if exists driver_period_financials_admin_insert on public.driver_period_financials;
create policy driver_period_financials_admin_insert on public.driver_period_financials for insert to authenticated
  with check ((select private.is_admin()) and created_by = (select auth.uid()));

drop policy if exists driver_period_financials_admin_update on public.driver_period_financials;
create policy driver_period_financials_admin_update on public.driver_period_financials for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists driver_period_financials_admin_delete on public.driver_period_financials;
create policy driver_period_financials_admin_delete on public.driver_period_financials for delete to authenticated
  using ((select private.is_admin()));

drop policy if exists commission_reports_admin_select on public.commission_reports;
create policy commission_reports_admin_select on public.commission_reports for select to authenticated
  using ((select private.is_admin()));

drop policy if exists commission_reports_admin_insert on public.commission_reports;
create policy commission_reports_admin_insert on public.commission_reports for insert to authenticated
  with check ((select private.is_admin()) and created_by = (select auth.uid()));

drop policy if exists commission_reports_admin_update on public.commission_reports;
create policy commission_reports_admin_update on public.commission_reports for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists commission_reports_admin_delete on public.commission_reports;
create policy commission_reports_admin_delete on public.commission_reports for delete to authenticated
  using ((select private.is_admin()));

drop policy if exists commission_reports_storage_select_admin on storage.objects;
create policy commission_reports_storage_select_admin on storage.objects for select to authenticated
  using (bucket_id = 'commission-reports' and (select private.is_admin()));

drop policy if exists commission_reports_storage_insert_admin on storage.objects;
create policy commission_reports_storage_insert_admin on storage.objects for insert to authenticated
  with check (bucket_id = 'commission-reports' and (select private.is_admin()));

drop policy if exists commission_reports_storage_update_admin on storage.objects;
create policy commission_reports_storage_update_admin on storage.objects for update to authenticated
  using (bucket_id = 'commission-reports' and (select private.is_admin()))
  with check (bucket_id = 'commission-reports' and (select private.is_admin()));

drop policy if exists commission_reports_storage_delete_admin on storage.objects;
create policy commission_reports_storage_delete_admin on storage.objects for delete to authenticated
  using (bucket_id = 'commission-reports' and (select private.is_admin()));
