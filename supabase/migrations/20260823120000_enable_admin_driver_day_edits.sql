-- Allow the administrator to correct the daily driver ledger and explicitly
-- override an imported monthly billing value, including an intentional zero.
alter table if exists public.driver_entries
  add column if not exists billing_override boolean not null default false;

grant update, delete on public.transactions to authenticated;

drop policy if exists transactions_update_admin on public.transactions;
create policy transactions_update_admin on public.transactions for update to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists transactions_delete_admin on public.transactions;
create policy transactions_delete_admin on public.transactions for delete to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
