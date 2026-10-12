create table if not exists public.net_expenses (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  period_key text not null check (period_key ~ '^[0-9]{4}-(0?[0-9]|1[01])$'),
  vehicle_plate text not null,
  label text not null,
  category_key text not null default '',
  cadence text not null default 'Manual',
  amount numeric(12, 2) not null check (amount > 0),
  expense_date date not null,
  photo_path text,
  photo_name text,
  photo_mime_type text,
  extraction jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint net_expenses_photo_metadata_check check (
    (photo_path is null and photo_name is null and photo_mime_type is null)
    or (photo_path is not null and photo_name is not null and photo_mime_type in ('image/jpeg', 'image/png', 'image/webp'))
  )
);

create index if not exists net_expenses_period_vehicle_idx on public.net_expenses(period_key, vehicle_plate);
alter table public.net_expenses enable row level security;
grant select, insert, delete on public.net_expenses to authenticated;

drop policy if exists net_expenses_admin_select on public.net_expenses;
create policy net_expenses_admin_select on public.net_expenses
  for select to authenticated using ((select private.is_admin()));
drop policy if exists net_expenses_admin_insert on public.net_expenses;
create policy net_expenses_admin_insert on public.net_expenses
  for insert to authenticated with check ((select private.is_admin()) and created_by = (select auth.uid()));
drop policy if exists net_expenses_admin_delete on public.net_expenses;
create policy net_expenses_admin_delete on public.net_expenses
  for delete to authenticated using ((select private.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('net-expense-documents', 'net-expense-documents', false, 12582912, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists net_expense_documents_admin_select on storage.objects;
create policy net_expense_documents_admin_select on storage.objects
  for select to authenticated using (bucket_id = 'net-expense-documents' and (select private.is_admin()));
drop policy if exists net_expense_documents_admin_insert on storage.objects;
create policy net_expense_documents_admin_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'net-expense-documents'
    and (select private.is_admin())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists net_expense_documents_admin_delete on storage.objects;
create policy net_expense_documents_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'net-expense-documents' and (select private.is_admin()));
