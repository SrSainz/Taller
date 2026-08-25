import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

// Supabase puede consumir el hash de recuperación durante la inicialización
// del cliente antes de que React monte la aplicación. Conservamos esta
// intención al principio para que el primer acceso abra el formulario de
// cambio de contraseña y no se trate como un inicio de sesión normal.
const hasInitialPasswordRecoveryIntent = () => {
  if (typeof window === "undefined") return false;
  const searchParams = new URLSearchParams(window.location.search ?? "");
  const hashParams = new URLSearchParams((window.location.hash ?? "").replace(/^#/, ""));
  return searchParams.get("type") === "recovery"
    || hashParams.get("type") === "recovery"
    || searchParams.has("code");
};

export const initialPasswordRecoveryIntent = hasInitialPasswordRecoveryIntent();

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

const documentRecordColumns = "id, owner_id, category, vehicle_plate, file_path, file_name, mime_type, file_size, file_hash, document_date, extracted_data, field_confidence, overall_confidence, status, created_at, updated_at";
const maintenanceReportColumns = "id, reporter_id, vehicle_plate, note, photo_path, photo_name, photo_mime_type, photo_size, status, created_at, updated_at";

const findDocumentByHash = async (ownerId, fileHash) => {
  if (!fileHash) return null;
  const { data, error } = await supabase
    .from("documents")
    .select(documentRecordColumns)
    .eq("owner_id", ownerId)
    .eq("file_hash", fileHash)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
};

const refreshPendingDocument = async (document, values) => {
  if (!document || document.status === "approved") return document;
  const { data, error } = await supabase
    .from("documents")
    .update({ ...values, status: "review", updated_at: new Date().toISOString() })
    .eq("id", document.id)
    .select(documentRecordColumns)
    .single();
  if (error) throw error;
  return data;
};

export const uploadDocumentRecord = async ({ ownerId, category, vehiclePlate, file, fileHash = null, documentDate = null, extractedData = {}, fieldConfidence = {}, overallConfidence = null, status = "review" }) => {
  if (!supabase || !ownerId || !file) throw new Error("No se puede guardar el documento sin una sesión activa.");
  const documentValues = {
    category,
    vehicle_plate: vehiclePlate || null,
    file_name: file.name || "documento",
    mime_type: file.type || "application/octet-stream",
    file_size: file.size || 0,
    document_date: documentDate || null,
    extracted_data: extractedData,
    field_confidence: fieldConfidence,
    overall_confidence: overallConfidence,
  };
  const existingDocument = await findDocumentByHash(ownerId, fileHash);
  if (existingDocument) return refreshPendingDocument(existingDocument, documentValues);

  const path = `${ownerId}/${category}/${Date.now()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      owner_id: ownerId,
      ...documentValues,
      file_path: path,
      file_hash: fileHash || null,
      status,
    })
    .select(documentRecordColumns)
    .single();

  if (error) {
    await supabase.storage.from("documents").remove([path]);
    if (fileHash && (error.code === "23505" || /file_hash|duplicad/i.test(error.message ?? ""))) {
      const racedDocument = await findDocumentByHash(ownerId, fileHash);
      if (racedDocument) return refreshPendingDocument(racedDocument, documentValues);
    }
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

export const deleteDocumentRecord = async (document) => {
  if (!supabase || !document?.id) throw new Error("No se puede borrar el documento sin una sesión activa.");
  const { error } = await supabase.from("documents").delete().eq("id", document.id);
  if (error) throw error;
  let storageError = null;
  if (document.file_path) {
    const result = await supabase.storage.from("documents").remove([document.file_path]);
    storageError = result.error ?? null;
  }
  return { deleted: true, storageError: storageError?.message || "" };
};

export const listMaintenanceReports = async ({ vehiclePlate = "", reporterId = "", limit = 500 } = {}) => {
  if (!supabase) return { data: [], error: null };
  let query = supabase
    .from("maintenance_reports")
    .select(maintenanceReportColumns)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (vehiclePlate) query = query.eq("vehicle_plate", vehiclePlate);
  if (reporterId) query = query.eq("reporter_id", reporterId);
  return query;
};

export const createMaintenanceReport = async ({ reporterId, vehiclePlate, note = "", photoFile = null } = {}) => {
  if (!supabase || !reporterId || !vehiclePlate) throw new Error("Falta la asociación del conductor o la matrícula.");
  const trimmedNote = String(note ?? "").trim();
  if (!trimmedNote && !photoFile) throw new Error("Escribe una incidencia o añade una fotografía.");

  let photoPath = null;
  if (photoFile) {
    const pathPlate = safeFileName(vehiclePlate).toLowerCase() || "vehiculo";
    photoPath = `${reporterId}/${pathPlate}/${Date.now()}-${safeFileName(photoFile.name || "incidencia.jpg")}`;
    const { error: uploadError } = await supabase.storage
      .from("maintenance-reports")
      .upload(photoPath, photoFile, { contentType: photoFile.type || "image/jpeg", upsert: false });
    if (uploadError) throw uploadError;
  }

  const { data, error } = await supabase
    .from("maintenance_reports")
    .insert({
      reporter_id: reporterId,
      vehicle_plate: vehiclePlate,
      note: trimmedNote,
      photo_path: photoPath,
      photo_name: photoFile?.name || null,
      photo_mime_type: photoFile?.type || null,
      photo_size: photoFile?.size || 0,
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .select(maintenanceReportColumns)
    .single();

  if (error) {
    if (photoPath) await supabase.storage.from("maintenance-reports").remove([photoPath]);
    throw error;
  }
  return data;
};

export const createMaintenanceReportPhotoUrl = async (photoPath, expiresIn = 600) => {
  if (!supabase || !photoPath) return "";
  const { data, error } = await supabase.storage.from("maintenance-reports").createSignedUrl(photoPath, expiresIn);
  if (error) throw error;
  return data?.signedUrl ?? "";
};

export const updateMaintenanceReportStatus = async (reportId, status = "reviewed") => {
  if (!supabase || !reportId) throw new Error("Aviso de mantenimiento no disponible.");
  const { data, error } = await supabase
    .from("maintenance_reports")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", reportId)
    .select(maintenanceReportColumns)
    .single();
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
