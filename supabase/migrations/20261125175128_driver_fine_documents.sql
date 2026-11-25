alter table public.driver_fines
  add column if not exists attachments jsonb not null default '[]'::jsonb;
alter table public.driver_fines
  add constraint driver_fines_attachments_array check (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 19);
alter table public.driver_fines drop constraint if exists driver_fines_photo_mime_type_check;
alter table public.driver_fines add constraint driver_fines_photo_mime_type_check
  check (photo_mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf'));
update storage.buckets set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
where id = 'driver-fines';
