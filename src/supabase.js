import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

// Evita que el navegador o una capa intermedia reutilice respuestas de perfil,
// funciones, documentos o transacciones que ya han cambiado en Supabase.
const noStoreFetch = (input, init = {}) => fetch(input, { ...init, cache: "no-store" });

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: { fetch: noStoreFetch },
    })
  : null;

export const getProfile = async (user) => {
  if (!supabase || !user?.id) return { data: null, error: new Error("Supabase no está configurado.") };
  const result = await supabase
    .from("profiles")
    .select("id, full_name, role, email, vehicle_plate, active, must_change_password, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();
  return result;
};

export const roleFromUser = (user, profile) => user?.app_metadata?.role ?? profile?.role ?? "driver";

const safeFileName = (value = "documento") => String(value)
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .replace(/[^a-zA-Z0-9._-]+/g, "-")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 100) || "documento";

export const uploadDocumentRecord = async ({ ownerId, category, vehiclePlate, file, fileHash = null, documentDate = null, extractedData = {}, fieldConfidence = {}, overallConfidence = null, status = "review" }) => {
  if (!supabase || !ownerId || !file) throw new Error("No se puede guardar el documento sin una sesión activa.");
  const path = `${ownerId}/${category}/${Date.now()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      owner_id: ownerId,
      category,
      vehicle_plate: vehiclePlate || null,
      file_path: path,
      file_name: file.name || "documento",
      mime_type: file.type || "application/octet-stream",
      file_size: file.size || 0,
      file_hash: fileHash || null,
      document_date: documentDate || null,
      extracted_data: extractedData,
      field_confidence: fieldConfidence,
      overall_confidence: overallConfidence,
      status,
    })
    .select("id, owner_id, category, vehicle_plate, file_path, file_name, mime_type, file_size, file_hash, document_date, status, created_at")
    .single();

  if (error) {
    await supabase.storage.from("documents").remove([path]);
    throw error;
  }
  return data;
};

export const confirmDocumentTransactions = async (documentId, operations) => {
  if (!supabase || !documentId || !operations?.length) throw new Error("No hay operaciones válidas para guardar.");
  const { data, error } = await supabase.rpc("confirm_document_transactions", { p_document_id: documentId, p_operations: operations });
  if (error) throw error;
  return data;
};

export const invokeAdminUsers = async (body) => {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { data, error } = await supabase.functions.invoke("admin-users", { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};
