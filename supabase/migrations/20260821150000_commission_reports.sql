-- Monthly driver payroll and administrator-only commission report archive.
create table if not exists public.driver_period_financials (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  payroll numeric(12,2) not null default 0 check (payroll >= 0),
  created_by uuid not null references public.profiles(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (driver_id, period_start)
);

create index if not exists driver_period_financials_period_idx
  on public.driver_period_financials (period_start, driver_id);

create table if not exists public.commission_reports (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_plate text not null,
  period_start date not null,
  period_end date not null,
  driver_name text not null,
  billing numeric(12,2) not null default 0 check (billing >= 0),
  commission_rate numeric(6,4) not null default 0.32 check (commission_rate >= 0),
  commission_base numeric(12,2) not null default 0 check (commission_base >= 0),
  threshold_bonus numeric(12,2) not null default 0 check (threshold_bonus >= 0),
  tips numeric(12,2) not null default 0 check (tips >= 0),
  tolls numeric(12,2) not null default 0 check (tolls >= 0),
  total_benefit_month numeric(12,2) not null default 0,
  payroll numeric(12,2) not null default 0 check (payroll >= 0),
  total_to_collect numeric(12,2) not null default 0,
  file_path text not null unique,
  file_name text not null,
  created_by uuid not null references public.profiles(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (driver_id, period_start)
);

create index if not exists commission_reports_period_idx
  on public.commission_reports (period_start desc, created_at desc);

grant select, insert, update, delete on public.driver_period_financials to authenticated;
grant select, insert, update, delete on public.commission_reports to authenticated;

alter table public.driver_period_financials enable row level security;
alter table public.commission_reports enable row level security;

create policy driver_period_financials_admin_select on public.driver_period_financials
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy driver_period_financials_admin_insert on public.driver_period_financials
  for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin' and created_by = (select auth.uid()));
create policy driver_period_financials_admin_update on public.driver_period_financials
  for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy driver_period_financials_admin_delete on public.driver_period_financials
  for delete to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy commission_reports_admin_select on public.commission_reports
  for select to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy commission_reports_admin_insert on public.commission_reports
  for insert to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin' and created_by = (select auth.uid()));
create policy commission_reports_admin_update on public.commission_reports
  for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy commission_reports_admin_delete on public.commission_reports
  for delete to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('commission-reports', 'commission-reports', false, 1048576, array['application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy commission_reports_storage_select_admin on storage.objects
  for select to authenticated
  using (bucket_id = 'commission-reports' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy commission_reports_storage_insert_admin on storage.objects
  for insert to authenticated
  with check (bucket_id = 'commission-reports' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy commission_reports_storage_update_admin on storage.objects
  for update to authenticated
  using (bucket_id = 'commission-reports' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (bucket_id = 'commission-reports' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
create policy commission_reports_storage_delete_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'commission-reports' and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
