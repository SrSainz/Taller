-- Keep one notification per user action. A document upload also creates central
-- transactions and refreshes the driver projection; those derived rows must not
-- enqueue duplicate push messages for the same upload.

create or replace function private.enqueue_app_push_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  webhook_secret text;
  subscriptions jsonb;
  payload jsonb;
  event_type text;
  actor_id uuid;
  actor_name text;
  vehicle_plate text;
  category text;
  event_id text;
  driver_id uuid;
  entry_date date;
begin
  -- The source document notification is emitted by the documents INSERT. The
  -- following central and projection rows are implementation details of that
  -- same action and must not notify the administrator again.
  if tg_table_name = 'transactions'
     and coalesce(new.source_document_id, old.source_document_id) is not null then
    return new;
  end if;

  if tg_table_name = 'driver_entries' then
    driver_id := coalesce(new.driver_id, old.driver_id);
    entry_date := coalesce(new.entry_date, old.entry_date);

    if exists (
      select 1
      from public.transactions as source_transaction
      where source_transaction.driver_id = driver_id
        and source_transaction.occurred_on = entry_date
        and source_transaction.source_document_id is not null
    ) then
      return new;
    end if;
  end if;

  select decrypted_secret
    into webhook_secret
  from vault.decrypted_secrets
  where name = 'sobre-ruedas-push-webhook'
  limit 1;

  if coalesce(webhook_secret, '') = '' then
    return new;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'endpoint', subscription.endpoint,
    'keys', jsonb_build_object('p256dh', subscription.p256dh, 'auth', subscription.auth)
  )), '[]'::jsonb)
    into subscriptions
  from public.push_subscriptions as subscription
  join public.profiles as recipient on recipient.id = subscription.user_id
  where recipient.role = 'admin'
    and recipient.active is true
    and subscription.endpoint <> ''
    and subscription.p256dh <> ''
    and subscription.auth <> '';

  if subscriptions = '[]'::jsonb then
    return new;
  end if;

  event_id := coalesce(new.id, old.id)::text;
  event_type := 'data';
  actor_id := null;
  vehicle_plate := null;
  category := null;

  if tg_table_name = 'documents' then
    event_type := 'document';
    actor_id := new.owner_id;
    vehicle_plate := new.vehicle_plate;
    category := new.category;
  elsif tg_table_name = 'maintenance_reports' then
    event_type := 'maintenance';
    actor_id := new.reporter_id;
    vehicle_plate := new.vehicle_plate;
  elsif tg_table_name = 'profiles' then
    event_type := 'profile';
    actor_id := new.id;
    vehicle_plate := new.vehicle_plate;
  elsif tg_table_name = 'driver_entries' then
    actor_id := new.driver_id;
    vehicle_plate := new.vehicle_plate;
  elsif tg_table_name = 'transactions' then
    actor_id := new.driver_id;
    vehicle_plate := new.vehicle_plate;
    category := new.category;
  elsif tg_table_name = 'driver_period_financials' then
    actor_id := new.driver_id;
  elsif tg_table_name = 'commission_reports' then
    actor_id := new.driver_id;
    vehicle_plate := new.vehicle_plate;
  end if;

  select full_name into actor_name
  from public.profiles
  where id = actor_id
  limit 1;

  payload := jsonb_build_object(
    'eventId', event_id,
    'eventType', event_type,
    'table', tg_table_name,
    'category', category,
    'actorName', actor_name,
    'vehiclePlate', vehicle_plate,
    'subscriptions', subscriptions
  );

  perform net.http_post(
    url := 'https://talleria-flota.vercel.app/api/push/notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Sobre-Ruedas-Webhook-Secret', webhook_secret
    ),
    body := payload,
    timeout_milliseconds := 5000
  );

  return new;
exception
  when others then
    -- Notification delivery must never roll back a driver's saved record.
    raise warning 'SOBRE RUEDAS push notification could not be queued: %', sqlerrm;
    return new;
end;
$function$;

revoke all on function private.enqueue_app_push_notification() from public, anon, authenticated, service_role;

-- A newly archived document/report is the user-visible event. Re-reviewing a
-- row does not create a second notification for the same underlying upload.
drop trigger if exists documents_enqueue_app_push on public.documents;
create trigger documents_enqueue_app_push
  after insert on public.documents
  for each row execute function private.enqueue_app_push_notification();

drop trigger if exists maintenance_reports_enqueue_app_push on public.maintenance_reports;
create trigger maintenance_reports_enqueue_app_push
  after insert on public.maintenance_reports
  for each row execute function private.enqueue_app_push_notification();

drop trigger if exists profiles_enqueue_app_push on public.profiles;
create trigger profiles_enqueue_app_push
  after update on public.profiles
  for each row execute function private.enqueue_app_push_notification();

drop trigger if exists driver_entries_enqueue_app_push on public.driver_entries;
create trigger driver_entries_enqueue_app_push
  after insert or update on public.driver_entries
  for each row execute function private.enqueue_app_push_notification();

drop trigger if exists transactions_enqueue_app_push on public.transactions;
create trigger transactions_enqueue_app_push
  after insert or update on public.transactions
  for each row execute function private.enqueue_app_push_notification();

drop trigger if exists driver_period_financials_enqueue_app_push on public.driver_period_financials;
create trigger driver_period_financials_enqueue_app_push
  after insert or update on public.driver_period_financials
  for each row execute function private.enqueue_app_push_notification();

drop trigger if exists commission_reports_enqueue_app_push on public.commission_reports;
create trigger commission_reports_enqueue_app_push
  after insert or update on public.commission_reports
  for each row execute function private.enqueue_app_push_notification();
