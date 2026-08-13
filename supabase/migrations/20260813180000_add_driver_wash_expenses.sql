alter table if exists public.driver_entries
  add column if not exists wash_expenses numeric not null default 0 check (wash_expenses >= 0);
