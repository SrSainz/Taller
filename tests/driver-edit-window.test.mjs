import assert from "node:assert/strict";
import test from "node:test";

import { getCurrentDriverWeekRange, isDriverDateInCurrentWeek } from "../src/driverEditWindow.js";

test("la ventana editable del conductor es la semana natural de lunes a domingo", () => {
  const now = new Date("2026-09-04T10:00:00.000Z");
  assert.deepEqual(getCurrentDriverWeekRange(now), {
    todayDateKey: "2026-09-04",
    startDateKey: "2026-08-31",
    endDateKey: "2026-09-06",
    timeZone: "Europe/Madrid",
  });
  assert.equal(isDriverDateInCurrentWeek("2026-08-31", now), true);
  assert.equal(isDriverDateInCurrentWeek("2026-09-06", now), true);
  assert.equal(isDriverDateInCurrentWeek("2026-08-30", now), false);
  assert.equal(isDriverDateInCurrentWeek("2026-09-07", now), false);
});

test("la fecha se calcula con horario de Madrid al pasar la medianoche UTC", () => {
  const now = new Date("2026-09-06T22:30:00.000Z");
  assert.deepEqual(getCurrentDriverWeekRange(now), {
    todayDateKey: "2026-09-07",
    startDateKey: "2026-09-07",
    endDateKey: "2026-09-13",
    timeZone: "Europe/Madrid",
  });
  assert.equal(isDriverDateInCurrentWeek("2026-09-06", now), false);
  assert.equal(isDriverDateInCurrentWeek("2026-09-07", now), true);
});
