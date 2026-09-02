import assert from "node:assert/strict";
import test from "node:test";
import { operationsFromDocument, transactionsToDriverEntries } from "../src/transactions.js";

const toRows = (operations, documentId) => operations.map((operation, index) => ({
  id: `${documentId}-${index}`,
  type: operation.type,
  occurred_on: operation.date,
  amount: operation.amount,
  driver_id: operation.driverId || null,
  vehicle_plate: operation.vehiclePlate || null,
  source_document_id: documentId,
  category: operation.category,
  metadata: operation.metadata,
  dedupe_key: operation.dedupeKey,
}));

const sum = (rows, type, plate = "5754 MJV") => rows
  .filter((row) => row.type === type && row.vehicle_plate === plate)
  .reduce((total, row) => total + row.amount, 0);

test("PRUEBA 1: gasolina alimenta consumo, gasolina, gastos, neto y resumen del vehiculo", () => {
  const operations = operationsFromDocument({
    category: "consumption",
    fields: { date: "2026-08-15", cost: 60, consumption: 38.2, unit: "L", vehicle: "5754 MJV", supplyType: "Gasolina" },
    driverId: "driver-aida",
    vehiclePlate: "5754 MJV",
    fileHash: "fuel-60",
  });
  const rows = toRows(operations, "document-fuel");
  assert.equal(sum(rows, "fuel"), 60);
  assert.equal(rows[0].occurred_on, "2026-08-15");
  assert.equal(rows[0].metadata.liters, 38.2);
  assert.equal(transactionsToDriverEntries(rows)[0].fuel_cost, 60);
});

test("PRUEBA 2: una factura de taller se clasifica como mantenimiento y gasto del vehiculo", () => {
  const operations = operationsFromDocument({
    category: "billing",
    fields: { serviceDate: "2026-08-15", odometerKm: 210735, total: 300, company: "Taller Funes Motorsport", concept: "Reparacion y mantenimiento", expenseCategory: "Taller", vehicle: "5754 MJV", invoiceNumber: "FMS-300" },
    vehiclePlate: "5754 MJV",
    fileHash: "workshop-300",
  });
  const rows = toRows(operations, "document-workshop");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].type, "maintenance");
  assert.equal(sum(rows, "maintenance"), 300);
  assert.equal(rows[0].category, "taller");
  assert.equal(rows[0].metadata.odometerKm, 210735);
});

test("PRUEBA 3: facturacion, efectivo y propinas se guardan separados", () => {
  const operations = operationsFromDocument({
    category: "billing",
    fields: { serviceDate: "2026-08-15", total: 200, cashCollected: 40, tips: 5, vehicle: "5754 MJV" },
    driverId: "driver-aida",
    vehiclePlate: "5754 MJV",
    fileHash: "billing-200",
  });
  const rows = toRows(operations, "document-billing");
  const entry = transactionsToDriverEntries(rows)[0];
  assert.equal(sum(rows, "billing"), 200);
  assert.equal(sum(rows, "cash"), 40);
  assert.equal(sum(rows, "tip"), 5);
  assert.equal(entry.billing, 200);
  assert.equal(entry.cash_collected, 40);
  assert.equal(entry.tips, 5);
});

test("PRUEBA 4: el mismo ticket conserva la misma clave y no se puede volver a sumar", () => {
  const input = { category: "consumption", fields: { date: "2026-08-15", cost: 60, vehicle: "5754 MJV", provider: "Gasolinera" }, driverId: "driver-aida", vehiclePlate: "5754 MJV", fileHash: "same-ticket" };
  const first = operationsFromDocument(input)[0];
  const second = operationsFromDocument(input)[0];
  assert.equal(first.dedupeKey, second.dedupeKey);
  const uniqueRows = new Map([first, second].map((operation) => [operation.dedupeKey, operation]));
  assert.equal([...uniqueRows.values()].reduce((total, operation) => total + operation.amount, 0), 60);
});
