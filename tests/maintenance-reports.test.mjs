import test from "node:test";
import assert from "node:assert/strict";
import { getMaintenanceReportRecordedAt, getMaintenanceReportStatusLabel, sortMaintenanceReportsByRecordedAt } from "../src/maintenanceReports.js";

test("conserva la fecha original del aviso aunque después se revise", () => {
  const report = {
    created_at: "2026-09-03T07:42:11.000Z",
    updated_at: "2026-09-03T07:45:00.000Z",
    status: "reviewed",
  };

  assert.equal(getMaintenanceReportRecordedAt(report), "2026-09-03T07:42:11.000Z");
});

test("ordena los avisos más recientes primero y conserva todos los registros", () => {
  const reports = [
    { id: "old", createdAt: "2026-09-01T08:00:00.000Z" },
    { id: "new", createdAt: "2026-09-03T08:00:00.000Z" },
    { id: "middle", createdAt: "2026-09-02T08:00:00.000Z" },
  ];

  assert.deepEqual(sortMaintenanceReportsByRecordedAt(reports).map((report) => report.id), ["new", "middle", "old"]);
  assert.equal(reports.length, 3);
});

test("traduce el estado visible del historial", () => {
  assert.equal(getMaintenanceReportStatusLabel("pending"), "Pendiente");
  assert.equal(getMaintenanceReportStatusLabel("reviewed"), "Revisado");
  assert.equal(getMaintenanceReportStatusLabel("resolved"), "Resuelto");
  assert.equal(getMaintenanceReportStatusLabel("otro"), "Pendiente");
});
