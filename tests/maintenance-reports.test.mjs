import test from "node:test";
import assert from "node:assert/strict";
import { getLatestPendingMaintenanceNote, getMaintenanceReportCounts, getMaintenanceReportDisplayMessage, getMaintenanceReportNote, getMaintenanceReportRecordedAt, getMaintenanceReportReporterName, getMaintenanceReportStatusLabel, isMaintenanceReportForVehicle, sortMaintenanceReportsByRecordedAt } from "../src/maintenanceReports.js";

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

test("cuenta el histórico completo aunque algunos avisos ya estén revisados", () => {
  assert.deepEqual(getMaintenanceReportCounts([
    { id: "pending", status: "pending" },
    { id: "reviewed", status: "reviewed" },
    { id: "resolved", status: "resolved" },
    { id: "legacy", status: "estado-desconocido" },
  ]), { total: 4, pending: 2, reviewed: 1, resolved: 1 });
});

test("encuentra el histórico aunque la matrícula use otro formato", () => {
  assert.equal(isMaintenanceReportForVehicle({ vehicle_plate: "5043MLC" }, "5043 MLC"), true);
  assert.equal(isMaintenanceReportForVehicle({ vehiclePlate: "5750 MJV" }, "5754 MJV"), false);
});

test("mantiene visible un aviso que solo contiene una fotografía", () => {
  assert.equal(
    getMaintenanceReportDisplayMessage({ note: "", photo_path: "david/5043-mlc/incidencia.jpg" }),
    "Sin texto escrito; se conservó la fotografía adjunta.",
  );
  assert.equal(getMaintenanceReportDisplayMessage({ note: "  Revisar neumáticos  " }), "Revisar neumáticos");
});

test("recupera el texto del aviso aunque venga con una clave descriptiva heredada", () => {
  assert.equal(getMaintenanceReportNote({ description: "Revisar puerta trasera" }), "Revisar puerta trasera");
});

test("solo repone en el formulario el aviso pendiente más reciente del conductor", () => {
  assert.equal(getLatestPendingMaintenanceNote([
    { id: "reviewed", reporter_id: "driver-1", note: "Aviso ya visto", status: "reviewed", created_at: "2026-09-03T09:00:00.000Z" },
    { id: "pending", reporter_id: "driver-1", note: "Revisar neumáticos", status: "pending", created_at: "2026-09-04T09:00:00.000Z" },
    { id: "other-driver", reporter_id: "driver-2", note: "Otro aviso", status: "pending", created_at: "2026-09-04T10:00:00.000Z" },
  ], "driver-1"), "Revisar neumáticos");
  assert.equal(getLatestPendingMaintenanceNote([
    { id: "reviewed", reporter_id: "driver-1", note: "Aviso ya visto", status: "reviewed", created_at: "2026-09-03T09:00:00.000Z" },
  ], "driver-1"), "");
});

test("conserva el nombre histórico del conductor aunque el perfil cambie", () => {
  assert.equal(getMaintenanceReportReporterName({ reporter_name: "Tirso" }, { currentDriverName: "Otro conductor" }), "Tirso");
});

test("usa el nombre de la sesión solo como respaldo para el autor actual", () => {
  assert.equal(getMaintenanceReportReporterName({ reporter_id: "driver-1" }, { currentDriverId: "driver-1", currentDriverName: "Alex" }), "Alex");
  assert.equal(getMaintenanceReportReporterName({ reporter_id: "driver-2" }, { currentDriverId: "driver-1", currentDriverName: "Alex", fallbackDriverNames: ["Tirso"] }), "Tirso");
});
