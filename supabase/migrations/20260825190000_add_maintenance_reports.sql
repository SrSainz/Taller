-- Cross-device maintenance incidents. Each report stays linked to the
-- reporter, vehicle plate and its optional private photo.
create table if not exists public.maintenance_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_plate text not null,
  note text not null default '',
  photo_path text,
  photo_name text,
  photo_mime_type text,
  photo_size integer not null default 0 check (photo_size >= 0),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint maintenance_reports_has_content check (char_length(trim(note)) > 0 or photo_path is not null)
);

create index if not exists maintenance_reports_vehicle_created_idx
  on public.maintenance_reports (vehicle_plate, created_at desc);
create index if not exists maintenance_reports_reporter_created_idx
  on public.maintenance_reports (reporter_id, created_at desc);

grant select, insert, update, delete on public.maintenance_reports to authenticated;
alter table public.maintenance_reports enable row level security;

create policy maintenance_reports_select_own_or_admin
  on public.maintenance_reports for select to authenticated
  using (
    reporter_id = (select auth.uid())
    or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  );

create policy maintenance_reports_insert_driver_or_admin
  on public.maintenance_reports for insert to authenticated
  with check (
    (
      reporter_id = (select auth.uid())
      and (
        ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
        or (
          ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'driver'
          and exists (
            select 1
            from public.profiles
            where profiles.id = (select auth.uid())
              and profiles.role = 'driver'
              and profiles.active = true
              and upper(regexp_replace(coalesce(profiles.vehicle_plate, ''), '[^A-Z0-9]', '', 'g'))
                = upper(regexp_replace(vehicle_plate, '[^A-Z0-9]', '', 'g'))
          )
          and upper(regexp_replace(vehicle_plate, '[^A-Z0-9]', '', 'g')) in ('5043MLC', '5750MJV', '5754MJV')
        )
      )
    )
  );

create policy maintenance_reports_update_own_or_admin
  on public.maintenance_reports for update to authenticated
  using (
    reporter_id = (select auth.uid())
    or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  )
  with check (
    reporter_id = (select auth.uid())
    or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  );

create policy maintenance_reports_delete_own_or_admin
  on public.maintenance_reports for delete to authenticated
  using (
    reporter_id = (select auth.uid())
    or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'maintenance-reports',
  'maintenance-reports',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy maintenance_reports_storage_select_own_or_admin
  on storage.objects for select to authenticated
  using (
    bucket_id = 'maintenance-reports'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
    )
  );

create policy maintenance_reports_storage_insert_own_or_admin
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'maintenance-reports'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
    )
  );

create policy maintenance_reports_storage_update_own_or_admin
  on storage.objects for update to authenticated
  using (
    bucket_id = 'maintenance-reports'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
    )
  )
  with check (
    bucket_id = 'maintenance-reports'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
    )
  );

create policy maintenance_reports_storage_delete_own_or_admin
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'maintenance-reports'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
    )
  );
