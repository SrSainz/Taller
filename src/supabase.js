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

export const listDriverPeriodFinancials = async (periodStart) => {
  if (!supabase) return { data: [], error: null };
  return supabase
    .from("driver_period_financials")
    .select("id, driver_id, period_start, payroll, created_by, created_at, updated_at")
    .eq("period_start", periodStart)
    .order("driver_id");
};

export const upsertDriverPeriodFinancial = async ({ driverId, periodStart, payroll, createdBy }) => {
  if (!supabase || !driverId || !periodStart || !createdBy) throw new Error("Faltan datos para guardar la nómina del periodo.");
  const { data, error } = await supabase
    .from("driver_period_financials")
    .upsert({ driver_id: driverId, period_start: periodStart, payroll: Math.max(0, Number(payroll) || 0), created_by: createdBy, updated_at: new Date().toISOString() }, { onConflict: "driver_id,period_start" })
    .select("id, driver_id, period_start, payroll, created_by, created_at, updated_at")
    .single();
  if (error) throw error;
  return data;
};

export const listCommissionReports = async () => {
  if (!supabase) return { data: [], error: null };
  return supabase
    .from("commission_reports")
    .select("id, driver_id, vehicle_plate, period_start, period_end, driver_name, billing, commission_rate, commission_base, threshold_bonus, tips, tolls, total_benefit_month, payroll, total_to_collect, file_path, file_name, created_at, updated_at")
    .order("period_start", { ascending: false })
    .order("created_at", { ascending: false });
};

export const uploadCommissionReport = async ({ report, pdfBlob, createdBy }) => {
  if (!supabase || !report?.driverId || !report?.periodStart || !pdfBlob || !createdBy) throw new Error("No se puede archivar el informe sin una sesión de administrador.");
  const path = `admin/${report.driverId}/${report.periodStart}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("commission-reports")
    .upload(path, pdfBlob, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase
    .from("commission_reports")
    .upsert({
      driver_id: report.driverId,
      vehicle_plate: report.vehiclePlate,
      period_start: report.periodStart,
      period_end: report.periodEnd,
      driver_name: report.driverName,
      billing: report.calculation.monthlyBilling,
      commission_rate: report.calculation.commissionRate,
      commission_base: report.calculation.commissionBase,
      threshold_bonus: report.calculation.thresholdBonus,
      tips: report.calculation.tips,
      tolls: report.calculation.tolls,
      total_benefit_month: report.calculation.totalBenefitMonth,
      payroll: report.calculation.payroll,
      total_to_collect: report.calculation.totalToCollect,
      file_path: path,
      file_name: report.fileName,
      created_by: createdBy,
      updated_at: new Date().toISOString(),
    }, { onConflict: "driver_id,period_start" })
    .select("id, driver_id, vehicle_plate, period_start, period_end, driver_name, billing, commission_rate, commission_base, threshold_bonus, tips, tolls, total_benefit_month, payroll, total_to_collect, file_path, file_name, created_at, updated_at")
    .single();
  if (error) throw error;
  return data;
};

export const createCommissionReportDownloadUrl = async (filePath) => {
  if (!supabase || !filePath) throw new Error("Informe no disponible.");
  const { data, error } = await supabase.storage.from("commission-reports").createSignedUrl(filePath, 600);
  if (error) throw error;
  return data?.signedUrl ?? "";
};
