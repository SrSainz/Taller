const maintenanceReportStatuses = Object.freeze({
  pending: "Pendiente",
  reviewed: "Revisado",
  resolved: "Resuelto",
});

export const getMaintenanceReportRecordedAt = (report = {}) => report.createdAt ?? report.created_at ?? "";

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
