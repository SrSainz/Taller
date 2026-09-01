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
    { driverName: "Alex", category: "billing", time: [0, 0] },
    { driverName: "Amin", category: "consumption", recordType: "fuel", time: [8, 59] },
    { driverName: "Fernando", category: "consumption", recordType: "total-km", time: [4, 30] },
  ];

  cases.forEach(({ driverName, category, recordType, time }) => {
    const capturedAt = new Date(2026, 7, 28, time[0], time[1]);
    assert.equal(resolveDriverUploadDate({
      driverName,
      category,
      recordType,
      captureAt: capturedAt,
      captureDate: getDriverDateKey(capturedAt),
    }), "2026-08-27");
  });
});

test("a las 09:00 empieza el día actual y los demás conductores no cambian", () => {
  const capturedAt = new Date(2026, 7, 28, 9, 0);
  assert.equal(resolveDriverUploadDate({ driverName: "Fernando", category: "billing", captureAt: capturedAt, captureDate: getDriverDateKey(capturedAt) }), "2026-08-28");
  assert.equal(resolveDriverUploadDate({ driverName: "Tirso", category: "billing", captureAt: new Date(2026, 7, 28, 8, 30), captureDate: "2026-08-28" }), "2026-08-28");
  assert.equal(resolveDriverUploadDate({ driverName: "Mauricio", category: "consumption", captureAt: new Date(2026, 7, 28, 7, 15), captureDate: "2026-08-28" }), "2026-08-28");
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
