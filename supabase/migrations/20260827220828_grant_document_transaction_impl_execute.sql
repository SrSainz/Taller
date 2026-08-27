-- The public wrapper validates the authenticated owner before delegating to
-- the private atomic writer. The writer still enforces the same ownership
-- boundary itself, but the caller needs EXECUTE permission for the wrapper
-- to invoke it under SECURITY INVOKER.
grant execute on function private.confirm_document_transactions_impl(uuid, jsonb)
to authenticated;
