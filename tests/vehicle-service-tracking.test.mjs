import test from "node:test";
import assert from "node:assert/strict";
import {
  buildInstrumentClusterTracking,
  buildServiceCounterResetMetadata,
  getLatestInstrumentClusterKm,
  initialNextServiceInstrumentKm,
  instrumentClusterBaselineKm,
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
  assert.equal(getLatestInstrumentClusterKm(entries), 174900);
  assert.deepEqual(buildInstrumentClusterTracking({ entries }), {
    instrumentKm: 174900,
    realKm: 486900,
    nextServiceInstrumentKm: initialNextServiceInstrumentKm,
    remainingKm: 25000,
  });
});

test("5754 MJV parte de 174.900 de cuadro, 486.900 reales y 25.000 para revisión", () => {
  assert.equal(instrumentClusterBaselineKm, 174900);
  assert.equal(instrumentClusterOffsetKm, 312000);
  assert.deepEqual(buildInstrumentClusterTracking(), {
    instrumentKm: 174900,
    realKm: 486900,
    nextServiceInstrumentKm: 199900,
    remainingKm: 25000,
  });
});

test("el kilometraje manual corregido también actualiza el cuadro", () => {
  const entries = [{
    vehicle_plate: "5754 MJV",
    entry_date: "2026-09-29",
    odometer_km: 175000,
    manual_overrides: { mileage: { odometerKm: 175140 } },
  }];
  assert.equal(getLatestInstrumentClusterKm(entries), 175140);
});

test("una revisión de aceite y filtros puede reiniciar el contador a 25.000 km", () => {
  assert.equal(isOilAndFilterMaintenance({
    recordType: "maintenance",
    fields: { concept: "Revisión completa", maintenanceItems: [{ description: "Cambio de aceite" }, { description: "Filtros" }] },
  }), true);
  const reset = buildServiceCounterResetMetadata({ instrumentKm: 174900 });
  assert.equal(reset.serviceIntervalKm, oilServiceIntervalKm);
  assert.equal(reset.nextServiceInstrumentKm, 199900);
  const tracking = buildInstrumentClusterTracking({
    entries: [{ vehicle_plate: "5754 MJV", entry_date: "2026-09-29", odometer_km: 175040 }],
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

test("5750 MJV parte de 5.843 de cuadro, 554.774 reales y 27.850 para revisión", () => {
  assert.deepEqual(buildInstrumentClusterTracking({ vehiclePlate: "5750MJV" }), {
    instrumentKm: 5843,
    realKm: 554774,
    nextServiceInstrumentKm: 33693,
    remainingKm: 27850,
  });
});

test("5750 MJV suma las nuevas lecturas a cuadro y reales y las resta de revisión", () => {
  const entries = [
    { driver_id: "mauricio", vehicle_plate: "5750 MJV", entry_date: "2026-09-29", odometer_km: 5900 },
    { driver_id: "amin", vehicle_plate: "5750MJV", entry_date: "2026-09-30", odometer_km: 6018 },
  ];
  assert.deepEqual(buildInstrumentClusterTracking({ entries, vehiclePlate: "5750 MJV" }), {
    instrumentKm: 6018,
    realKm: 554949,
    nextServiceInstrumentKm: 33693,
    remainingKm: 27675,
  });
});

test("una foto de KM ACUMULADOS actualiza mantenimiento aunque la entrada diaria aún no haya llegado", () => {
  const documents = [{
    vehicle_plate: "5750 MJV",
    document_date: "2026-09-30",
    extracted_data: { recordType: "total-km", odometerKm: 6125, source: "driver-circle" },
  }];
  assert.deepEqual(buildInstrumentClusterTracking({ documents, vehiclePlate: "5750 MJV" }), {
    instrumentKm: 6125,
    realKm: 555056,
    nextServiceInstrumentKm: 33693,
    remainingKm: 27568,
  });
});

test("usa la lectura acumulada más alta de los dos conductores del coche", () => {
  const entries = [{ vehicle_plate: "5754 MJV", entry_date: "2026-09-30", odometer_km: 175080 }];
  const documents = [
    { vehicle_plate: "5754MJV", document_date: "2026-09-30", extracted_data: { recordType: "km acumulados", odometerKm: 175120 } },
    { vehicle_plate: "5750 MJV", document_date: "2026-09-30", extracted_data: { recordType: "total-km", odometerKm: 9000 } },
  ];
  assert.equal(getLatestInstrumentClusterKm(entries, "5754 MJV", documents), 175120);
  assert.deepEqual(buildInstrumentClusterTracking({ entries, documents, vehiclePlate: "5754 MJV" }), {
    instrumentKm: 175120,
    realKm: 487120,
    nextServiceInstrumentKm: 199900,
    remainingKm: 24780,
  });
});
