import test from "node:test";
import assert from "node:assert/strict";
import { requestServiceReviewReset } from "../src/serviceReviewReset.js";
import { buildServiceCounterResetMetadata, buildInstrumentClusterTracking } from "../src/vehicleServiceTracking.js";

test("mantenimiento, revisión, aceite o filtros ofrecen reinicio individualmente", () => {
  for (const concept of ["Mantenimiento", "Revisión general", "Cambio de aceite", "Filtro de aire", "Filtros"]) {
    let asked = 0;
    const result = requestServiceReviewReset({ recordType: "maintenance", fields: { concept }, plate: "5043 MLC", confirm: () => { asked++; return true; }, prompt: () => "15.000" });
    assert.equal(asked, 1);
    assert.deepEqual(result, { serviceCounterReset: true, serviceIntervalKm: 15000 });
  }
});

test("rechazar o cancelar conserva la revisión; conceptos ajenos no preguntan", () => {
  const args = { recordType: "maintenance", fields: { concept: "Aceite" }, plate: "0344 LCP", prompt: () => null };
  assert.deepEqual(requestServiceReviewReset({ ...args, confirm: () => false }), { serviceCounterReset: false });
  assert.deepEqual(requestServiceReviewReset({ ...args, confirm: () => true }), { serviceCounterReset: false });
  assert.equal(requestServiceReviewReset({ ...args, fields: { concept: "Neumáticos" }, confirm: () => { throw Error("No preguntar"); } }), null);
  assert.equal(requestServiceReviewReset({ ...args, recordType: "billing", confirm: () => { throw Error("No preguntar"); } }), null);
});

test("el reinicio admite cero y valida el intervalo, el nuevo objetivo descuenta kilómetros posteriores", () => {
  const args = { recordType: "maintenance", fields: { concept: "Aceite" }, plate: "5750 MJV", confirm: () => true };
  assert.equal(requestServiceReviewReset({ ...args, prompt: () => "0" }).serviceIntervalKm, 0);
  for (const value of ["", "-1", "1,5", "abc"]) assert.throws(() => requestServiceReviewReset({ ...args, prompt: () => value }));
  const reset = buildServiceCounterResetMetadata({ vehiclePlate: "5750 MJV", instrumentKm: 10000, intervalKm: 15000 });
  const tracked = buildInstrumentClusterTracking({ vehiclePlate: "5750 MJV", entries: [{ vehicle_plate: "5750 MJV", entry_date: "2026-10-21", odometer_km: 10150 }], documents: [{ vehicle_plate: "5750 MJV", document_date: "2026-10-20", extracted_data: reset }] });
  assert.equal(tracked.remainingKm, 14850);
});
