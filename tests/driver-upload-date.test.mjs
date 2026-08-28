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
