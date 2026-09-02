import test from "node:test";
import assert from "node:assert/strict";
import { getNetMonthlyFixedBilling, getNetMonthlyFixedInsurance, netMonthlyFixedBillingByDriver, netMonthlyFixedInsuranceByPlate } from "../src/data/netMonthlyBilling.js";

test("mantiene los importes mensuales fijos de facturación de Neto", () => {
  assert.deepEqual(netMonthlyFixedBillingByDriver, {
    alex: 1323.72,
    amin: 1323.72,
    andres: 1323.72,
    fernando: 1332.24,
    mauricio: 1323.72,
    tirso: 1323.37,
  });
  assert.equal(getNetMonthlyFixedBilling("Fernando"), 1332.24);
  assert.equal(getNetMonthlyFixedBilling("Andrés García"), 1323.72);
  assert.equal(getNetMonthlyFixedBilling("nuevo conductor"), null);
  assert.deepEqual(netMonthlyFixedInsuranceByPlate, { "5043 MLC": 220.83, "5750 MJV": 310 });
  assert.equal(getNetMonthlyFixedInsurance("5043MLC"), 220.83);
  assert.equal(getNetMonthlyFixedInsurance("5750 MJV"), 310);
  assert.equal(getNetMonthlyFixedInsurance("5754 MJV"), null);
});
