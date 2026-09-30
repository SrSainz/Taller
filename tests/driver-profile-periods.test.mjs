import test from "node:test";
import assert from "node:assert/strict";
import { driverProfileCoversWholePeriod, isDriverProfileValidDuringPeriod, isDriverProfileValidOnDate } from "../src/driverProfilePeriods.js";

test("a replacement splits a month at midnight without merging profile histories", () => {
  const outgoing = { effective_from: "1900-01-01", effective_to: "2026-09-29" };
  const incoming = { effective_from: "2026-09-30", effective_to: null };

  assert.equal(isDriverProfileValidOnDate(outgoing, "2026-09-29"), true);
  assert.equal(isDriverProfileValidOnDate(outgoing, "2026-09-30"), false);
  assert.equal(isDriverProfileValidOnDate(incoming, "2026-09-29"), false);
  assert.equal(isDriverProfileValidOnDate(incoming, "2026-09-30"), true);
  assert.equal(isDriverProfileValidDuringPeriod(outgoing, "2026-09-01", "2026-09-30"), true);
  assert.equal(isDriverProfileValidDuringPeriod(incoming, "2026-09-01", "2026-09-30"), true);
  assert.equal(isDriverProfileValidDuringPeriod(incoming, "2026-08-01", "2026-08-31"), false);
  assert.equal(isDriverProfileValidDuringPeriod(outgoing, "2026-10-01", "2026-10-31"), false);
  assert.equal(driverProfileCoversWholePeriod(outgoing, "2026-08-01", "2026-08-31"), true);
  assert.equal(driverProfileCoversWholePeriod(outgoing, "2026-09-01", "2026-09-30"), false);
  assert.equal(driverProfileCoversWholePeriod(incoming, "2026-09-01", "2026-09-30"), false);
});
