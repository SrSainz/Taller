alter table if exists public.driver_entries
  add column if not exists cash_collected numeric not null default 0 check (cash_collected >= 0),
  add column if not exists tips numeric not null default 0 check (tips >= 0),
  add column if not exists tolls numeric not null default 0 check (tolls >= 0),
  add column if not exists other_expenses numeric not null default 0 check (other_expenses >= 0);
