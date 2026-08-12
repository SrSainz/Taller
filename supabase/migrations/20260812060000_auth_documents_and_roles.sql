-- SOBRE RUEDAS: authenticated profiles, driver daily entries and private documents.
-- Apply with the Supabase migration workflow for a fresh project. The linked
-- project was provisioned with the same statements through the Supabase SQL tool.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'driver' check (role in ('admin', 'driver')),
  email text not null default '',
  vehicle_plate text,
  active boolean not null default true,
  must_change_password boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.driver_entries (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references auth.users(id) on delete cascade,
  vehicle_plate text not null,
  entry_date date not null default current_date,
  fuel_cost numeric not null default 0 check (fuel_cost >= 0),
  fuel_liters numeric not null default 0 check (fuel_liters >= 0),
  odometer_km integer not null default 0 check (odometer_km >= 0),
  billing numeric not null default 0 check (billing >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (driver_id, entry_date)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('billing', 'consumption')),
  vehicle_plate text,
  file_path text not null unique,
  file_name text not null,
  mime_type text not null,
  file_size integer not null default 0 check (file_size >= 0),
  extracted_data jsonb not null default '{}'::jsonb,
  field_confidence jsonb not null default '{}'::jsonb,
  overall_confidence numeric,
  status text not null default 'review' check (status in ('review', 'approved', 'rejected')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists driver_entries_driver_id_entry_date_key on public.driver_entries (driver_id, entry_date);
create index if not exists driver_entries_driver_date_idx on public.driver_entries (driver_id, entry_date desc);
create index if not exists documents_owner_created_idx on public.documents (owner_id, created_at desc);
create index if not exists documents_plate_created_idx on public.documents (vehicle_plate, created_at desc);

update public.profiles set must_change_password = false where role = 'driver';

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.driver_entries to authenticated;
grant select, insert, update, delete on public.documents to authenticated;

alter table public.profiles enable row level security;
alter table public.driver_entries enable row level security;
alter table public.documents enable row level security;

create policy profiles_select_self_or_admin on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'));
create policy profiles_insert_self_or_admin on public.profiles for insert to authenticated
  with check ((((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin') or ((select auth.uid()) = id and role = 'driver')));
create policy profiles_update_self_or_admin on public.profiles for update to authenticated
  using ((select auth.uid()) = id or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'))
  with check ((((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin') or ((select auth.uid()) = id and role = 'driver')));
create policy profiles_delete_admin on public.profiles for delete to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy driver_entries_select_self_or_admin on public.driver_entries for select to authenticated
  using (driver_id = (select auth.uid()) or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'));
create policy driver_entries_insert_self_or_admin on public.driver_entries for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin' or (driver_id = (select auth.uid()) and vehicle_plate = (select profiles.vehicle_plate from public.profiles where profiles.id = (select auth.uid()))));
create policy driver_entries_update_self_or_admin on public.driver_entries for update to authenticated
  using (driver_id = (select auth.uid()) or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'))
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin' or (driver_id = (select auth.uid()) and vehicle_plate = (select profiles.vehicle_plate from public.profiles where profiles.id = (select auth.uid()))));
create policy driver_entries_delete_self_or_admin on public.driver_entries for delete to authenticated
  using (driver_id = (select auth.uid()) or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'));

create policy documents_select_self_or_admin on public.documents for select to authenticated
  using (owner_id = (select auth.uid()) or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'));
create policy documents_insert_self_or_admin on public.documents for insert to authenticated
  with check (owner_id = (select auth.uid()) or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'));
create policy documents_update_self_or_admin on public.documents for update to authenticated
  using (owner_id = (select auth.uid()) or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'))
  with check (owner_id = (select auth.uid()) or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'));
create policy documents_delete_self_or_admin on public.documents for delete to authenticated
  using (owner_id = (select auth.uid()) or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 12582912, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy documents_storage_select_own_or_admin on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (((storage.foldername(name))[1] = (select auth.uid())::text) or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')));
create policy documents_storage_insert_own_or_admin on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (((storage.foldername(name))[1] = (select auth.uid())::text) or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')));
create policy documents_storage_update_own_or_admin on storage.objects for update to authenticated
  using (bucket_id = 'documents' and (((storage.foldername(name))[1] = (select auth.uid())::text) or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')))
  with check (bucket_id = 'documents' and (((storage.foldername(name))[1] = (select auth.uid())::text) or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')));
create policy documents_storage_delete_own_or_admin on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (((storage.foldername(name))[1] = (select auth.uid())::text) or (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')));
