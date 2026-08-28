import assert from "node:assert/strict";
import test from "node:test";
import { administratorEditableWeeklyRowKeys, driverEditableWeeklyRowKeys, isWeeklyRowEditable } from "../src/driverWeeklyEditing.js";

test("el conductor solo puede editar lavados y varios", () => {
  assert.deepEqual(driverEditableWeeklyRowKeys, ["wash", "other"]);
  assert.equal(isWeeklyRowEditable("wash"), true);
  assert.equal(isWeeklyRowEditable("other"), true);

  for (const rowKey of ["net", "cash", "fuel", "refunds", "total"]) {
    assert.equal(isWeeklyRowEditable(rowKey), false, `${rowKey} no debe ser editable por el conductor`);
  }
});

test("la administración conserva la edición de las filas operativas", () => {
  assert.deepEqual(administratorEditableWeeklyRowKeys, ["cash", "fuel", "refunds", "wash", "other"]);
  for (const rowKey of administratorEditableWeeklyRowKeys) {
    assert.equal(isWeeklyRowEditable(rowKey, true), true);
  }
  assert.equal(isWeeklyRowEditable("net", true), false);
  assert.equal(isWeeklyRowEditable("total", true), false);
});
