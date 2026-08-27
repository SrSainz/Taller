-- Some legacy reviews stored the printed date only inside extracted_data.
-- Recover it when it is already an unambiguous ISO date; never infer a date
-- from upload time or a filename.
update public.documents
set document_date = case
  when extracted_data->>'date' ~ '^\d{4}-\d{2}-\d{2}$' then (extracted_data->>'date')::date
  when extracted_data->>'serviceDate' ~ '^\d{4}-\d{2}-\d{2}$' then (extracted_data->>'serviceDate')::date
  when extracted_data->>'issueDate' ~ '^\d{4}-\d{2}-\d{2}$' then (extracted_data->>'issueDate')::date
  else document_date
end
where document_date is null
  and (
    extracted_data->>'date' ~ '^\d{4}-\d{2}-\d{2}$'
    or extracted_data->>'serviceDate' ~ '^\d{4}-\d{2}-\d{2}$'
    or extracted_data->>'issueDate' ~ '^\d{4}-\d{2}-\d{2}$'
  );
