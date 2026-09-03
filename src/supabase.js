import { createClient } from "@supabase/supabase-js";
import { getDocumentMimeType, validateDocumentFile } from "./documentAnalysis.js";
import { hashDocumentFile } from "./transactions.js";

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

const hasValidSupabaseUrl = (() => {
  try {
    const parsedUrl = new URL(supabaseUrl);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
})();

export const isSupabaseConfigured = Boolean(hasValidSupabaseUrl && supabasePublishableKey);

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

const appRealtimeTables = ({ userId, isAdmin }) => {
  if (isAdmin) {
    return [
      "profiles",
      "driver_entries",
      "transactions",
      "documents",
      "driver_daily_comparison",
      "maintenance_reports",
      "driver_period_financials",
      "commission_reports",
    ].map((table) => ({ table }));
  }
  return [
    { table: "profiles", filter: `id=eq.${userId}` },
    { table: "driver_entries", filter: `driver_id=eq.${userId}` },
    { table: "documents", filter: `owner_id=eq.${userId}` },
    // This table contains only daily totals/counts, never another driver's
    // identity or raw document data.
    { table: "driver_daily_comparison" },
    { table: "maintenance_reports", filter: `reporter_id=eq.${userId}` },
  ];
};

/**
 * Subscribe to the tables that can change a visible app screen. Postgres
 * Changes still respects each table's RLS policies, so a driver only receives
 * events for their own records while the administrator receives the fleet
 * stream. The caller owns the refresh strategy and must dispose the returned
 * channel when its screen unmounts.
 */
export const subscribeToAppChanges = ({ userId, isAdmin = false, onChange, onStatus } = {}) => {
  if (!supabase || !userId) return () => {};
  const channel = supabase.channel(`app-sync-${isAdmin ? "admin" : "driver"}-${userId}`);
  appRealtimeTables({ userId, isAdmin }).forEach(({ table, filter }) => {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
      (payload) => onChange?.({ table, payload }),
    );
  });
  channel.subscribe((status, error) => onStatus?.(status, error));
  return () => {
    supabase.removeChannel(channel);
  };
};

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
const driverDailyComparisonColumns = "entry_date, total_km, drivers_with_km, total_consumption, drivers_with_consumption, total_km_per_connection_hour, drivers_with_km_per_connection_hour, updated_at";

export const listDriverDailyComparisons = async ({ startDate = "", endDate = "" } = {}) => {
  if (!supabase) return { data: [], error: null };
  let query = supabase
    .from("driver_daily_comparison")
    .select(driverDailyComparisonColumns)
    .order("entry_date", { ascending: true });
  if (startDate) query = query.gte("entry_date", startDate);
  if (endDate) query = query.lte("entry_date", endDate);
  return query;
};

const randomUploadToken = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const maintenancePhotoMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const getMaintenancePhotoMimeType = (file) => {
  const explicitType = String(file?.type ?? "").split(";", 1)[0].trim().toLocaleLowerCase("es");
  const extension = String(file?.name ?? "").split(".").pop()?.toLocaleLowerCase("es") ?? "";
  if (explicitType && explicitType !== "application/octet-stream" && explicitType !== "image/*") {
    if (explicitType === "image/jpg") return "image/jpeg";
    return maintenancePhotoMimeTypes.has(explicitType) ? explicitType : "";
  }
  return ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif" })[extension] ?? "";
};

export const validateMaintenancePhotoFile = (file) => {
  if (!file) return { valid: false, message: "No se ha seleccionado ninguna fotografía." };
  const mimeType = getMaintenancePhotoMimeType(file);
  if (!mimeType) return { valid: false, message: "Fotografía no compatible. Selecciona JPG, PNG, WEBP, HEIC o HEIF." };
  if (file.size > 8 * 1024 * 1024) return { valid: false, message: "La fotografía supera el límite de 8 MB." };
  return { valid: true, mimeType };
};

/**
 * PostgREST commonly caps a response at 1,000 rows. Every operational list
 * uses this helper so a busy fleet does not silently lose older documents,
 * entries, transactions or notices from the visible application.
 */
export const fetchAllSupabaseRows = async (queryFactory, { pageSize = 500, maxRows = 100000 } = {}) => {
  if (!supabase) return { data: [], error: null };
  const safePageSize = Math.max(1, Math.min(1000, Number(pageSize) || 500));
  const safeMaxRows = Math.max(safePageSize, Number(maxRows) || 100000);
  const rows = [];
  for (let offset = 0; offset < safeMaxRows; offset += safePageSize) {
    const { data, error } = await queryFactory().range(offset, Math.min(offset + safePageSize - 1, safeMaxRows - 1));
    if (error) return { data: null, error };
    const page = data ?? [];
    rows.push(...page);
    if (page.length < safePageSize) return { data: rows, error: null };
  }
  return { data: rows, error: new Error("La lista supera el límite de seguridad de registros cargables.") };
};

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
  if (!document) return document;
  // A re-review of the same original file must update the extracted fields
  // as well as its central movements. Keep an already approved document
  // approved while replacing its review values; otherwise a corrected amount
  // would be written only to transactions and the archived document would
  // display stale data on the next reload.
  const { data, error } = await supabase
    .from("documents")
    .update({ ...values, status: document.status === "approved" ? "approved" : "review", updated_at: new Date().toISOString() })
    .eq("id", document.id)
    .select(documentRecordColumns)
    .single();
  if (error) throw error;
  return data;
};

export const uploadDocumentRecord = async ({ ownerId, category, vehiclePlate, file, fileHash = null, documentDate = null, extractedData = {}, fieldConfidence = {}, overallConfidence = null, status = "review" }) => {
  if (!supabase || !ownerId || !file) throw new Error("No se puede guardar el documento sin una sesión activa.");
  const validation = validateDocumentFile(file, "upload");
  if (!validation.valid) throw new Error(validation.message);
  const mimeType = getDocumentMimeType(file);
  let resolvedFileHash = fileHash;
  if (!resolvedFileHash) {
    try {
      resolvedFileHash = await hashDocumentFile(file);
    } catch {
      resolvedFileHash = "";
    }
  }
  const documentValues = {
    category,
    vehicle_plate: vehiclePlate || null,
    file_name: file.name || "documento",
    mime_type: mimeType,
    file_size: file.size || 0,
    document_date: documentDate || null,
    extracted_data: extractedData,
    field_confidence: fieldConfidence,
    overall_confidence: overallConfidence,
  };
  const existingDocument = await findDocumentByHash(ownerId, resolvedFileHash);
  if (existingDocument) return refreshPendingDocument(existingDocument, documentValues);

  const path = `${ownerId}/${category}/${randomUploadToken()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: mimeType, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      owner_id: ownerId,
      ...documentValues,
      file_path: path,
      file_hash: resolvedFileHash || null,
      status,
    })
    .select(documentRecordColumns)
    .single();

  if (error) {
    await supabase.storage.from("documents").remove([path]);
    if (resolvedFileHash && (error.code === "23505" || /file_hash|duplicad/i.test(error.message ?? ""))) {
      const racedDocument = await findDocumentByHash(ownerId, resolvedFileHash);
      if (racedDocument) return refreshPendingDocument(racedDocument, documentValues);
    }
    throw error;
  }
  return data;
};

export const confirmDocumentTransactions = async (documentId, operations) => {
  if (!supabase || !documentId || !Array.isArray(operations)) throw new Error("No hay operaciones válidas para guardar.");
  const { data, error } = await supabase.rpc("confirm_document_transactions", { p_document_id: documentId, p_operations: operations });
  if (error) throw error;
  return data;
};

export const reassignDriverDocumentDate = async (documentId, targetDate) => {
  if (!supabase || !documentId || !targetDate) throw new Error("No se puede cambiar el día sin una sesión activa, un documento y una fecha.");
  const { data, error } = await supabase.rpc("reassign_driver_document_date", {
    p_document_id: documentId,
    p_target_date: targetDate,
  });
  if (error) throw error;
  return data;
};

export const deleteDocumentRecord = async (document) => {
  if (!supabase || !document?.id) throw new Error("No se puede borrar el documento sin una sesión activa.");
  const { data, error } = await supabase.rpc("delete_document_with_cleanup", { p_document_id: document.id });
  if (error) throw error;
  let storageError = null;
  const filePath = document.file_path || data?.file_path || "";
  if (filePath) {
    const result = await supabase.storage.from("documents").remove([filePath]);
    storageError = result.error ?? null;
  }
  return { ...(data ?? {}), deleted: true, storageError: storageError?.message || "" };
};

export const listMaintenanceReports = async ({ vehiclePlate = "", reporterId = "", limit = null } = {}) => {
  if (!supabase) return { data: [], error: null };
  const queryFactory = () => {
    let query = supabase
      .from("maintenance_reports")
      .select(maintenanceReportColumns)
      .order("created_at", { ascending: false });
    if (vehiclePlate) query = query.eq("vehicle_plate", vehiclePlate);
    if (reporterId) query = query.eq("reporter_id", reporterId);
    return Number.isFinite(Number(limit)) && Number(limit) > 0 ? query.limit(Number(limit)) : query;
  };
  return Number.isFinite(Number(limit)) && Number(limit) > 0
    ? queryFactory()
    : fetchAllSupabaseRows(queryFactory);
};

export const createMaintenanceReport = async ({ reporterId, vehiclePlate, note = "", photoFile = null, status = "pending" } = {}) => {
  if (!supabase || !reporterId || !vehiclePlate) throw new Error("Falta la asociación del conductor o la matrícula.");
  const trimmedNote = String(note ?? "").trim();
  if (!trimmedNote && !photoFile) throw new Error("Escribe una incidencia o añade una fotografía.");
  const normalizedStatus = ["pending", "reviewed", "resolved"].includes(status) ? status : "pending";
  const photoValidation = photoFile ? validateMaintenancePhotoFile(photoFile) : { valid: true, mimeType: "" };
  if (!photoValidation.valid) throw new Error(photoValidation.message);

  let photoPath = null;
  if (photoFile) {
    const pathPlate = safeFileName(vehiclePlate).toLowerCase() || "vehiculo";
    photoPath = `${reporterId}/${pathPlate}/${randomUploadToken()}-${safeFileName(photoFile.name || "incidencia.jpg")}`;
    const { error: uploadError } = await supabase.storage
      .from("maintenance-reports")
      .upload(photoPath, photoFile, { contentType: photoValidation.mimeType, upsert: false });
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
      photo_mime_type: photoFile ? photoValidation.mimeType : null,
      photo_size: photoFile?.size || 0,
      status: normalizedStatus,
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
  const queryFactory = () => supabase
    .from("commission_reports")
    .select("id, driver_id, vehicle_plate, period_start, period_end, driver_name, billing, commission_rate, commission_base, threshold_bonus, tips, tolls, total_benefit_month, payroll, total_to_collect, file_path, file_name, created_at, updated_at")
    .order("period_start", { ascending: false })
    .order("created_at", { ascending: false });
  return fetchAllSupabaseRows(queryFactory);
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
