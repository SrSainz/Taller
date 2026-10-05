import { test } from "node:test";
import assert from "node:assert/strict";
import { getWeeksTouchingMonth, sumWeeklyCollections } from "../src/weeklyCollections.js";

test("Monday–Sunday weeks include dates across month boundaries", () => {
  const weeks = getWeeksTouchingMonth(9, 2026);
  assert.deepEqual(weeks[0], { start: "2026-09-28", end: "2026-10-04" });
  assert.deepEqual(weeks.at(-1), { start: "2026-10-26", end: "2026-11-01" });
  assert.equal(weeks.length, 5);
  assert.equal(getWeeksTouchingMonth(7, 2026).length, 6);
});

test("weekly cash and APP sum all driver days in cents", () => {
  const totals = sumWeeklyCollections(getWeeksTouchingMonth(9, 2026), [
    ["2026-09-30", { billing: 100.25, cash: 30.1 }],
    ["2026-10-01", { billing: 200, cash: 70 }],
    ["2026-10-01", { billing: 50, cash: 10 }],
    ["2026-10-05", { billing: 25, cash: 5 }],
  ]);
  assert.equal(totals[0].cash, 110.1);
  assert.equal(totals[0].app, 240.15);
  assert.equal(totals[1].cash, 5);
  assert.equal(totals[1].app, 20);
});
