alter table public.driver_period_financials
  add column if not exists commission_adjustments jsonb not null default '{}'::jsonb
  check (jsonb_typeof(commission_adjustments) = 'object');
