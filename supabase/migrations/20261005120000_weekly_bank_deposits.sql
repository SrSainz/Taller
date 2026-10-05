create table if not exists public.weekly_bank_deposits (
  week_start date primary key,
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.weekly_bank_deposits enable row level security;
grant select, insert, update on public.weekly_bank_deposits to authenticated;

create policy weekly_bank_deposits_admin_select on public.weekly_bank_deposits
  for select to authenticated using ((select private.is_admin()));
create policy weekly_bank_deposits_admin_insert on public.weekly_bank_deposits
  for insert to authenticated with check ((select private.is_admin()) and created_by = (select auth.uid()));
create policy weekly_bank_deposits_admin_update on public.weekly_bank_deposits
  for update to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
