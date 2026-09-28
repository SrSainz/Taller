import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInstrumentClusterTracking,
  buildServiceCounterResetMetadata,
  getLatestInstrumentClusterKm,
  initialNextServiceInstrumentKm,
  instrumentClusterOffsetKm,
  isOilAndFilterMaintenance,
  oilServiceIntervalKm,
} from "../src/vehicleServiceTracking.js";

test("5754 MJV muestra kilometraje de cuadro y real a partir de las lecturas de ambos conductores", () => {
  const entries = [
    { driver_id: "andres", vehicle_plate: "5754MJV", entry_date: "2026-09-28", odometer_km: 128410 },
    { driver_id: "fernando", vehicle_plate: "5754 MJV", entry_date: "2026-09-28", odometer_km: 128460 },
    { driver_id: "other", vehicle_plate: "5043 MLC", entry_date: "2026-09-28", odometer_km: 999999 },
  ];
  assert.equal(getLatestInstrumentClusterKm(entries), 128460);
  assert.deepEqual(buildInstrumentClusterTracking({ entries }), {
    instrumentKm: 128460,
    realKm: 128460 + instrumentClusterOffsetKm,
    nextServiceInstrumentKm: initialNextServiceInstrumentKm,
    remainingKm: 71440,
  });
});

test("el kilometraje manual corregido también actualiza el cuadro", () => {
  const entries = [{
    vehicle_plate: "5754 MJV",
    entry_date: "2026-09-29",
    odometer_km: 128500,
    manual_overrides: { mileage: { odometerKm: 128640 } },
  }];
  assert.equal(getLatestInstrumentClusterKm(entries), 128640);
});

test("una revisión de aceite y filtros puede reiniciar el contador a 25.000 km", () => {
  assert.equal(isOilAndFilterMaintenance({
    recordType: "maintenance",
    fields: { concept: "Revisión completa", maintenanceItems: [{ description: "Cambio de aceite" }, { description: "Filtros" }] },
  }), true);
  const reset = buildServiceCounterResetMetadata({ instrumentKm: 128460 });
  assert.equal(reset.serviceIntervalKm, oilServiceIntervalKm);
  assert.equal(reset.nextServiceInstrumentKm, 153460);
  const tracking = buildInstrumentClusterTracking({
    entries: [{ vehicle_plate: "5754 MJV", entry_date: "2026-09-29", odometer_km: 128600 }],
    documents: [{ vehicle_plate: "5754 MJV", document_date: "2026-09-29", extracted_data: reset }],
  });
  assert.equal(tracking.remainingKm, 24860);
});

test("rechazar el reinicio conserva el objetivo inicial de 199.900 km", () => {
  const tracking = buildInstrumentClusterTracking({
    documents: [{ vehicle_plate: "5754 MJV", document_date: "2026-09-28", extracted_data: { serviceCounterReset: false } }],
  });
  assert.equal(tracking.nextServiceInstrumentKm, 199900);
});
