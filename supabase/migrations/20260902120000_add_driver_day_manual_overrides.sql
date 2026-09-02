-- Keep administrator corrections for every visible daily metric together with
-- the driver entry. The central transaction projection continues to own the
-- economic ledger, while this JSONB block records an explicit daily view
-- override for billing, fuel/refuelling count, or mileage.
alter table if exists public.driver_entries
  add column if not exists manual_overrides jsonb not null default '{}'::jsonb;

comment on column public.driver_entries.manual_overrides is
  'Explicit administrator corrections for the visible daily driver panels.';
