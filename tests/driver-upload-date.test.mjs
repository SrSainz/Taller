import test from "node:test";
import assert from "node:assert/strict";

import { getDriverDateKey, resolveDriverUploadDate } from "../src/driverUploadDate.js";

test("usa la fecha local del dispositivo para una captura", () => {
  const localDate = new Date(2026, 7, 28, 23, 59, 30);
  assert.equal(getDriverDateKey(localDate), "2026-08-28");
  assert.equal(resolveDriverUploadDate({ captureDate: "2026-08-28", now: new Date(2026, 7, 29) }), "2026-08-28");
});

test("una fecha editada de forma intencionada tiene prioridad", () => {
  assert.equal(resolveDriverUploadDate({ captureDate: "2026-08-28", intentionalDate: "2026-08-15" }), "2026-08-15");
});

test("si falta la fecha de captura, usa la fecha local actual como respaldo", () => {
  const localDate = new Date(2026, 7, 28, 8, 15);
  assert.equal(resolveDriverUploadDate({ now: localDate }), "2026-08-28");
  assert.equal(resolveDriverUploadDate({ captureDate: "fecha inválida", now: localDate }), "2026-08-28");
});

test("Alex, Amin y Fernando imputan sus documentos de madrugada al día anterior", () => {
  const cases = [
    { driverName: "Alex", vehiclePlate: "5043 MLC", category: "billing", time: [0, 0] },
    { driverName: "Amin", vehiclePlate: "5750 MJV", category: "consumption", recordType: "fuel", time: [8, 59] },
    { driverName: "Fernando", vehiclePlate: "5754 MJV", category: "consumption", recordType: "total-km", time: [4, 30] },
  ];

  cases.forEach(({ driverName, vehiclePlate, category, recordType, time }) => {
    const capturedAt = new Date(2026, 7, 28, time[0], time[1]);
    assert.equal(resolveDriverUploadDate({
      driverName,
      vehiclePlate,
      category,
      recordType,
      captureAt: capturedAt,
      captureDate: getDriverDateKey(capturedAt),
    }), "2026-08-27");
  });
});

test("a las 09:00 empieza el día actual y los demás conductores no cambian", () => {
  const capturedAt = new Date(2026, 7, 28, 9, 0);
  assert.equal(resolveDriverUploadDate({ driverName: "Fernando", vehiclePlate: "5754 MJV", category: "billing", captureAt: capturedAt, captureDate: getDriverDateKey(capturedAt) }), "2026-08-28");
  assert.equal(resolveDriverUploadDate({ driverName: "Tirso", vehiclePlate: "5043 MLC", category: "billing", captureAt: new Date(2026, 7, 28, 8, 30), captureDate: "2026-08-28" }), "2026-08-28");
  assert.equal(resolveDriverUploadDate({ driverName: "Mauricio", vehiclePlate: "5750 MJV", category: "consumption", captureAt: new Date(2026, 7, 28, 7, 15), captureDate: "2026-08-28" }), "2026-08-28");
});

test("un sustituto desconocido hereda la política de la plaza del vehículo", () => {
  const capturedAt = new Date(2026, 7, 28, 8, 15);
  assert.equal(resolveDriverUploadDate({ driverName: "Nuevo conductor", vehiclePlate: "5750MJV", category: "billing", captureAt: capturedAt, captureDate: "2026-08-28" }), "2026-08-27");
  assert.equal(resolveDriverUploadDate({ driverName: "Nuevo conductor", vehiclePlate: "5043MLC", category: "billing", captureAt: capturedAt, captureDate: "2026-08-28" }), "2026-08-27");
  assert.equal(resolveDriverUploadDate({ driverName: "Nuevo conductor", vehiclePlate: "5754 MJV", category: "billing", captureAt: capturedAt, captureDate: "2026-08-28" }), "2026-08-27");
  assert.equal(resolveDriverUploadDate({ driverName: "Nuevo conductor", vehiclePlate: "9401 LTG", category: "billing", captureAt: capturedAt, captureDate: "2026-08-28" }), "2026-08-28");
});

test("la fecha editada expresamente mantiene prioridad incluso durante la madrugada", () => {
  assert.equal(resolveDriverUploadDate({
    driverName: "Alex",
    category: "billing",
    captureAt: new Date(2026, 7, 28, 6, 10),
    captureDate: "2026-08-28",
    intentionalDate: "2026-08-25",
  }), "2026-08-25");
});
