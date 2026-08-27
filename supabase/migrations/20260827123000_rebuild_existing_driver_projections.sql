-- Correct any projection rows created before the reconciliation trigger.
do $function$
declare
  entry_key record;
begin
  for entry_key in
    select distinct driver_id, occurred_on
    from public.transactions
    where driver_id is not null
  loop
    perform private.rebuild_driver_entry_projection(entry_key.driver_id, entry_key.occurred_on);
  end loop;
end;
$function$;
