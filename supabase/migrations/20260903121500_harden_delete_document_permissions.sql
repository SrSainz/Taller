revoke all on function public.delete_document_with_cleanup(uuid)
from public, anon, service_role;
grant execute on function public.delete_document_with_cleanup(uuid)
to authenticated;
