import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getManualNetExpenseEntries } from "../src/manualNetExpenseDetails.js";

test("los gastos agrupados conservan cada fecha, importe y justificante sin alterar la suma", () => {
  const entries = [
    { id: "old", label: "ITV", date: "2026-10-02", amount: 25, manualPhotos: [{ path: "itv.webp", name: "ITV.webp" }] },
    { id: "new", label: "ITV", date: "2026-10-18", amount: 40, manualPhotos: [] },
  ];
  const expense = { key: "itv", amount: 75, manualEntries: entries };
  const details = getManualNetExpenseEntries(expense);
  assert.deepEqual(details.map(entry => entry.id), ["new", "old"]);
  assert.equal(details[1].manualPhotos[0].path, "itv.webp");
  assert.equal(details.reduce((sum, entry) => sum + entry.amount, 0), 65);
  assert.equal(expense.amount, 75);
  assert.equal(expense.manualEntries[0].id, "old");
});

test("una categoría nueva y los gastos locales antiguos también tienen detalle consultable", () => {
  const oldExpense = { id: "legacy", manual: true, label: "Aparcamiento", amount: 12, date: "", categoryKey: "" };
  assert.deepEqual(getManualNetExpenseEntries(oldExpense), [oldExpense]);
  assert.equal(getManualNetExpenseEntries(oldExpense)[0].date, "");
  assert.deepEqual(getManualNetExpenseEntries({ amount: 0 }), []);
});

test("Neto abre el detalle también sin desglose previo y conserva las entradas al agrupar", () => {
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(app, /canonicalExpense\.manualEntries = \[\.\.\.\(canonicalExpense\.manualEntries \?\? \[\]\), manualExpense\]/);
  assert.match(app, /const expandable = [^;]+manualEntries\.length > 0/);
  assert.match(app, /aria-expanded=\{breakdownOpen\}[\s\S]*?onClick=\{\(\) => toggleExpenseRow\(rowKey\)\}/);
  assert.match(app, /<ManualNetExpenseDetails entries=\{manualEntries\} plate=\{detail\.vehicle\.plate\}/);
});
