import assert from "node:assert/strict";
import test from "node:test";

import { getCurrentDriverWeekRange, getDriverEditableWeekRange, isDriverDateInEditableWindow } from "../src/driverEditWindow.js";

test("la ventana editable incluye la semana actual y la inmediatamente anterior", () => {
  const now = new Date("2026-09-04T10:00:00.000Z");
  assert.deepEqual(getCurrentDriverWeekRange(now), {
    todayDateKey: "2026-09-04",
    startDateKey: "2026-08-31",
    endDateKey: "2026-09-06",
    timeZone: "Europe/Madrid",
  });
  assert.deepEqual(getDriverEditableWeekRange(now), {
    todayDateKey: "2026-09-04",
    startDateKey: "2026-08-24",
    endDateKey: "2026-09-06",
    timeZone: "Europe/Madrid",
  });
  assert.equal(isDriverDateInEditableWindow("2026-08-24", now), true);
  assert.equal(isDriverDateInEditableWindow("2026-08-30", now), true);
  assert.equal(isDriverDateInEditableWindow("2026-08-23", now), false);
  assert.equal(isDriverDateInEditableWindow("2026-08-31", now), true);
  assert.equal(isDriverDateInEditableWindow("2026-09-06", now), true);
  assert.equal(isDriverDateInEditableWindow("2026-09-07", now), false);
});

test("la fecha se calcula con horario de Madrid al pasar la medianoche UTC", () => {
  const now = new Date("2026-09-06T22:30:00.000Z");
  assert.deepEqual(getCurrentDriverWeekRange(now), {
    todayDateKey: "2026-09-07",
    startDateKey: "2026-09-07",
    endDateKey: "2026-09-13",
    timeZone: "Europe/Madrid",
  });
  assert.equal(isDriverDateInEditableWindow("2026-08-31", now), true);
  assert.equal(isDriverDateInEditableWindow("2026-09-06", now), true);
  assert.equal(isDriverDateInEditableWindow("2026-08-30", now), false);
  assert.equal(isDriverDateInEditableWindow("2026-09-07", now), true);
});
