import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

test("administración muestra documentos mensuales por conductor y no el icono verde del coche", () => {
  const adminStart = source.indexOf("function AdminView(");
  const adminEnd = source.indexOf("function VehiclePlateLabel", adminStart);
  const adminSource = source.slice(adminStart, adminEnd > adminStart ? adminEnd : undefined);

  assert.match(adminSource, /documents = \[\]/);
  assert.match(adminSource, /currentDocumentPeriod/);
  assert.match(adminSource, /driverDocumentCount/);
  assert.match(adminSource, /admin-driver-card__documents/);
  assert.doesNotMatch(adminSource, /admin-vehicle-card__icon/);
});

test("el gesto semanal se inicia desde la propia tabla del calendario", () => {
  assert.doesNotMatch(source, /closest\("\.driver-mobile-week-table-wrap"\)\) return/);
  assert.match(source, /shiftDriverWeek\(direction\)/);
});
