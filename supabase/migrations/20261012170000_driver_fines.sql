create table if not exists public.driver_fines (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  driver_id uuid not null references public.profiles(id),
  vehicle_plate text not null,
  fine_date date not null,
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  note text not null default '',
  photo_path text not null,
  photo_name text not null,
  photo_mime_type text not null check (photo_mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  created_at timestamptz not null default now()
);

create index if not exists driver_fines_driver_date_idx on public.driver_fines(driver_id, fine_date);
alter table public.driver_fines enable row level security;
grant select, insert, delete on public.driver_fines to authenticated;

create policy driver_fines_admin_select on public.driver_fines
  for select to authenticated using ((select private.is_admin()));
create policy driver_fines_admin_insert on public.driver_fines
  for insert to authenticated with check ((select private.is_admin()) and created_by = (select auth.uid()));
create policy driver_fines_admin_delete on public.driver_fines
  for delete to authenticated using ((select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('driver-fines', 'driver-fines', false, 12582912, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy driver_fines_storage_admin_select on storage.objects
  for select to authenticated using (bucket_id = 'driver-fines' and (select private.is_admin()));
create policy driver_fines_storage_admin_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'driver-fines'
    and (select private.is_admin())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy driver_fines_storage_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'driver-fines' and (select private.is_admin()));
