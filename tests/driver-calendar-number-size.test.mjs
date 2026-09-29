import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("los números del calendario de conductores son un 20 por ciento más pequeños", () => {
  assert.match(css, /\.driver-mobile-week-table thead button strong\s*\{[^}]*font-size:\s*15\.2px/s);
  assert.match(css, /\.driver-mobile-week-table tbody td\s*\{[^}]*font-size:\s*12px/s);
  assert.match(css, /\.driver-mobile-week-table tr\.is-total th,[\s\S]*?\.driver-mobile-week-table tr\.is-total td\s*\{[^}]*font-size:\s*12\.8px/s);
});
