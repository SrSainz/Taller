import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("William tiene un objetivo mensual de facturación de 6.000 euros", () => {
  const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(appSource, /driverBillingGoals = Object\.freeze\(\{[^}]*william: 6000/);
  assert.match(appSource, /billingGoal = getDriverBillingGoal\(profile\.full_name\)/);
});
