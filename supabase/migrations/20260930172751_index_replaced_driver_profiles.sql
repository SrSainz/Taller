create index if not exists profiles_replaced_by_idx
  on public.profiles (replaced_by)
  where replaced_by is not null;
