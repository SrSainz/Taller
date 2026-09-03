const maintenanceReportStatuses = Object.freeze({
  pending: "Pendiente",
  reviewed: "Revisado",
  resolved: "Resuelto",
});

export const getMaintenanceReportRecordedAt = (report = {}) => report.createdAt ?? report.created_at ?? "";

export const sortMaintenanceReportsByRecordedAt = (reports = []) => [...reports].sort((left, right) => (
  String(getMaintenanceReportRecordedAt(right)).localeCompare(String(getMaintenanceReportRecordedAt(left)))
));

export const getMaintenanceReportStatusLabel = (status) => maintenanceReportStatuses[status] ?? maintenanceReportStatuses.pending;
