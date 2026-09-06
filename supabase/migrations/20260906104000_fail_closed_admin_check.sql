-- SQL NULL must never bypass an IF NOT is_admin() authorization guard when a
-- valid driver's JWT has no app_metadata.role. Missing role means not admin.
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (
    coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin', false)
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin' and profiles.active = true
    )
  );
$$;
