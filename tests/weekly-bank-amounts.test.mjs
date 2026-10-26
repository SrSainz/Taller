import test from "node:test";
import assert from "node:assert/strict";
import { parseWeeklyBankAmounts } from "../src/weeklyBankAmounts.js";

test("el total bancario suma los tres coches en céntimos, con coma decimal española", () => {
  assert.deepEqual(parseWeeklyBankAmounts({ "5043 MLC": "2.474,54", "5750 MJV": "2419,87", "5754 MJV": "1648,85" }), { amount: 6543.26, vehicleAmounts: { "5043 MLC": 2474.54, "5750 MJV": 2419.87, "5754 MJV": 1648.85 } });
  assert.equal(parseWeeklyBankAmounts({ "5043 MLC": "0.10", "5750 MJV": "0,20" }).amount, 0.3);
});
test("se pueden guardar ceros y rechaza negativos o importes inválidos sin inventar datos", () => {
  assert.equal(parseWeeklyBankAmounts({}).amount, 0);
  for (const value of ["-1", "texto", "1,234", "Infinity"]) assert.throws(() => parseWeeklyBankAmounts({ "5043 MLC": value }));
});
