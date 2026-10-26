-- Existing totals remain untouched until the administrator supplies a breakdown.
alter table public.weekly_bank_deposits
  add column if not exists vehicle_amounts jsonb
  check (vehicle_amounts is null or jsonb_typeof(vehicle_amounts) = 'object');
