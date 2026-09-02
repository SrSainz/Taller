-- Let an active administrator move a driver's accounting day without
-- separating the document from any of its central economic movements.
-- The printed OCR date remains in extracted_data for audit; document_date is
-- the editable day used by the application for accounting and projections.
create or replace function public.reassign_driver_document_date(
  p_document_id uuid,
  p_target_date date
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_document public.documents%rowtype;
  v_previous_date date;
  v_moved_transactions integer := 0;
begin
  if (select auth.uid()) is null then
    raise exception 'Sesión no disponible';
  end if;
  if p_document_id is null or p_target_date is null then
    raise exception 'Documento y fecha son obligatorios';
  end if;
  if not (select private.is_admin()) then
    raise exception 'Solo un administrador puede cambiar el día del documento';
  end if;

  select *
  into v_document
  from public.documents
  where id = p_document_id
  for update;
  if not found then
    raise exception 'Documento no disponible';
  end if;

  v_previous_date := v_document.document_date;

  update public.transactions
  set occurred_on = p_target_date,
      dedupe_key = case
        when array_length(string_to_array(dedupe_key, ':'), 1) = 7 then concat_ws(
          ':',
          split_part(dedupe_key, ':', 1),
          split_part(dedupe_key, ':', 2),
          p_target_date::text,
          split_part(dedupe_key, ':', 4),
          split_part(dedupe_key, ':', 5),
          split_part(dedupe_key, ':', 6),
          split_part(dedupe_key, ':', 7)
        )
        else dedupe_key
      end
  where source_document_id = p_document_id;
  get diagnostics v_moved_transactions = row_count;

  update public.documents
  set document_date = p_target_date,
      updated_at = timezone('utc', now())
  where id = p_document_id;

  return jsonb_build_object(
    'documentId', p_document_id,
    'previousDate', v_previous_date,
    'targetDate', p_target_date,
    'transactionsMoved', v_moved_transactions
  );
end;
$function$;

revoke all on function public.reassign_driver_document_date(uuid, date)
from public, anon, service_role;
grant execute on function public.reassign_driver_document_date(uuid, date)
to authenticated;
