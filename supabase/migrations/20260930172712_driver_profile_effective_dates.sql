-- Keep each driver's validity period so a replacement can preserve the
-- outgoing profile and its dated document history.
alter table public.profiles
  add column if not exists effective_from date not null default date '1900-01-01',
  add column if not exists effective_to date,
  add column if not exists replaced_by uuid references public.profiles(id) on delete set null,
  add column if not exists replaces_profile_id uuid references public.profiles(id) on delete set null;

alter table public.profiles alter column effective_from set default current_date;

create index if not exists profiles_replaces_profile_id_idx
  on public.profiles (replaces_profile_id)
  where replaces_profile_id is not null;
