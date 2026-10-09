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

test("weekly cash and APP break down by professional vehicle without changing totals", () => {
  const [week] = sumWeeklyCollections(getWeeksTouchingMonth(9, 2026), [
    ["2026-09-30", { plate: "5043 MLC", billing: 100.25, cash: 30.10 }],
    ["2026-10-01", { plate: "5043 MLC", billing: 200, cash: 70 }],
    ["2026-10-01", { plate: "5750 MJV", billing: 50, cash: 10 }],
  ], ["5043 MLC", "5750 MJV", "5754 MJV"]);
  assert.deepEqual(week.vehicles, [
    { plate: "5043 MLC", cash: 100.10, app: 200.15 },
    { plate: "5750 MJV", cash: 10, app: 40 },
    { plate: "5754 MJV", cash: 0, app: 0 },
  ]);
  assert.equal(week.vehicles.reduce((sum, vehicle) => sum + vehicle.cash, 0), week.cash);
  assert.equal(week.vehicles.reduce((sum, vehicle) => sum + vehicle.app, 0), week.app);
});
