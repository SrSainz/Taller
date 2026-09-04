const maintenanceReportStatuses = Object.freeze({
  pending: "Pendiente",
  reviewed: "Revisado",
  resolved: "Resuelto",
});

const getFirstNonEmptyValue = (...values) => values.find((value) => String(value ?? "").trim()) ?? "";

export const getMaintenanceReportRecordedAt = (report = {}) => getFirstNonEmptyValue(
  report.createdAt,
  report.created_at,
  report.recordedAt,
  report.recorded_at,
);

export const getMaintenanceReportVehiclePlate = (report = {}) => getFirstNonEmptyValue(
  report.vehiclePlate,
  report.vehicle_plate,
);

export const getMaintenanceReportPlateKey = (value = "") => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleUpperCase("es")
  .replace(/[^A-Z0-9]/g, "");

export const isMaintenanceReportForVehicle = (report, vehiclePlate) => (
  getMaintenanceReportPlateKey(getMaintenanceReportVehiclePlate(report))
  === getMaintenanceReportPlateKey(vehiclePlate)
);

export const getMaintenanceReportNote = (report = {}) => getFirstNonEmptyValue(
  report.note,
  report.message,
  report.description,
  report.text,
).toString().trim();

export const getMaintenanceReportReporterName = (report = {}, { currentDriverId = "", currentDriverName = "", fallbackDriverNames = [] } = {}) => {
  const storedName = getFirstNonEmptyValue(
    report.reporterName,
    report.reporter_name,
    report.driverName,
    report.driver_name,
  ).toString().trim();
  if (storedName) return storedName;

  const reporterId = getFirstNonEmptyValue(report.reporterId, report.reporter_id);
  if (reporterId && currentDriverId && String(reporterId) === String(currentDriverId) && String(currentDriverName).trim()) {
    return String(currentDriverName).trim();
  }

  const fallback = (fallbackDriverNames ?? []).find((name) => String(name ?? "").trim());
  return String(fallback ?? "Conductor").trim() || "Conductor";
};

export const getMaintenanceReportDisplayMessage = (report = {}) => {
  const note = getMaintenanceReportNote(report);
  if (note) return note;
  const photoPath = getFirstNonEmptyValue(report.photoPath, report.photo_path);
  return photoPath
    ? "Sin texto escrito; se conservó la fotografía adjunta."
    : "Sin texto escrito en este aviso.";
};

export const getMaintenanceReportCounts = (reports = []) => {
  const counts = { total: 0, pending: 0, reviewed: 0, resolved: 0 };
  for (const report of reports ?? []) {
    counts.total += 1;
    const status = Object.prototype.hasOwnProperty.call(maintenanceReportStatuses, report?.status)
      ? report.status
      : "pending";
    counts[status] += 1;
  }
  return counts;
};

export const sortMaintenanceReportsByRecordedAt = (reports = []) => [...reports].sort((left, right) => (
  String(getMaintenanceReportRecordedAt(right)).localeCompare(String(getMaintenanceReportRecordedAt(left)))
));

export const getMaintenanceReportStatusLabel = (status) => maintenanceReportStatuses[status] ?? maintenanceReportStatuses.pending;
