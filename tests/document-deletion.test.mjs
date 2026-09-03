import test from "node:test";
import assert from "node:assert/strict";
import { removeDocumentLocalData } from "../src/documentDeletion.js";

const billingDocument = (id, date = "2026-09-03") => ({
  id,
  owner_id: "driver-1",
  category: "billing",
  document_date: date,
  extracted_data: { recordType: "billing", billing: 120, tips: 2 },
});

test("borrar facturación local elimina documento, movimientos y campos derivados", () => {
  const result = removeDocumentLocalData({
    document: billingDocument("doc-billing"),
    documents: [billingDocument("doc-billing")],
    transactions: [{ id: "tx-billing", source_document_id: "doc-billing", driver_id: "driver-1", occurred_on: "2026-09-03", type: "billing", amount: 120 }],
    entries: [{ id: "entry-1", driver_id: "driver-1", entry_date: "2026-09-03", billing: 120, cash_collected: 50, tips: 2, refunds: 1, wash_expenses: 8, other_expenses: 3 }],
  });

  assert.equal(result.documents.length, 0);
  assert.equal(result.transactions.length, 0);
  assert.deepEqual(result.entries[0], {
    id: "entry-1",
    driver_id: "driver-1",
    entry_date: "2026-09-03",
    billing: 0,
    cash_collected: 0,
    tips: 0,
    refunds: 0,
    wash_expenses: 8,
    other_expenses: 3,
  });
});

test("borrar kilómetros limpia el odómetro y el valor local de ese día", () => {
  const document = {
    id: "doc-daily-km",
    owner_id: "driver-1",
    category: "consumption",
    document_date: "2026-09-03",
    extracted_data: { recordType: "daily-km", dailyKm: 145, odometerKm: 12145 },
  };
  const result = removeDocumentLocalData({
    document,
    documents: [document],
    entries: [{ driver_id: "driver-1", entry_date: "2026-09-03", odometer_km: 12145, wash_expenses: 4, other_expenses: 2 }],
    circleMetricValues: { "2026-09-03": { dailyKm: 145, totalKm: 12145, consumption: 4.2 } },
  });

  assert.equal(result.entries[0].odometer_km, 0);
  assert.equal(result.entries[0].wash_expenses, 4);
  assert.deepEqual(result.circleMetricValues, { "2026-09-03": { totalKm: 12145, consumption: 4.2 } });
});

test("si queda otro documento del mismo tipo, conserva sus datos y no toca otro conductor", () => {
  const first = billingDocument("doc-first");
  const second = billingDocument("doc-second");
  const result = removeDocumentLocalData({
    document: first,
    documents: [first, second],
    transactions: [{ id: "tx-second", source_document_id: "doc-second", driver_id: "driver-1", occurred_on: "2026-09-03", type: "billing", amount: 60 }],
    entries: [
      { driver_id: "driver-1", entry_date: "2026-09-03", billing: 180, tips: 3 },
      { driver_id: "driver-2", entry_date: "2026-09-03", billing: 90, tips: 1 },
    ],
  });

  assert.deepEqual(result.documents.map(({ id }) => id), ["doc-second"]);
  assert.equal(result.transactions[0].id, "tx-second");
  assert.equal(result.entries[0].billing, 180);
  assert.equal(result.entries[1].billing, 90);
});
