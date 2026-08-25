-- Keep the administrator's maintenance queue current when a driver submits
-- an incident from another device.
alter publication supabase_realtime add table public.maintenance_reports;
