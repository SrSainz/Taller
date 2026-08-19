-- Keep the administrator views synchronized with the central document ledger.
-- Postgres Changes only emits rows that belong to supabase_realtime.
alter table public.transactions replica identity full;
alter table public.driver_entries replica identity full;
alter table public.documents replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    execute 'create publication supabase_realtime';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'transactions'
  ) then
    execute 'alter publication supabase_realtime add table public.transactions';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'driver_entries'
  ) then
    execute 'alter publication supabase_realtime add table public.driver_entries';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'documents'
  ) then
    execute 'alter publication supabase_realtime add table public.documents';
  end if;
end;
$$;
