alter table public.net_expenses add column version integer not null default 1;
grant update(label,category_key,cadence,amount,expense_date,version) on public.net_expenses to authenticated;
create policy net_expenses_admin_update on public.net_expenses for update to authenticated using((select private.is_admin())) with check((select private.is_admin()));
create table public.net_expense_overrides (
 id uuid primary key default gen_random_uuid(), created_by uuid not null references auth.users(id),
 period_key text not null check(period_key ~ '^[0-9]{4}-(0?[0-9]|1[01])$'), vehicle_plate text not null,
 expense_key text not null, breakdown_key text not null, driver_label text not null, concept text not null check(length(trim(concept)) between 1 and 160),
 amount numeric(12,2) not null check(amount>=0), expense_date date not null, version integer not null default 1,
 unique(period_key,vehicle_plate,expense_key,breakdown_key)
);
alter table public.net_expense_overrides enable row level security;
revoke all on public.net_expense_overrides from anon;
grant select,insert,update,delete on public.net_expense_overrides to authenticated;
create policy net_overrides_admin on public.net_expense_overrides for all to authenticated using((select private.is_admin())) with check((select private.is_admin()));
