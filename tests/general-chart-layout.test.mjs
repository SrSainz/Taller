import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("los seis filtros se mantienen a la izquierda y las barras ganan altura sin cambiar la tarjeta", () => {
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(app, /selectableChartMetrics\.map\(\(option\) =>/);
  assert.match(css, /\.report-chart--summary \{ grid-template-columns: 48px minmax\(0, 1fr\); grid-template-rows: minmax\(0, 1fr\)/);
  assert.match(css, /\.report-chart--summary > \.recharts-responsive-container \{ grid-column: 2; grid-row: 1;/);
  assert.match(css, /\.report-chart--summary > \.report-chart-legend \{ grid-column: 1; grid-row: 1;/);
  assert.match(css, /\.report-chart-legend \{ grid-template-columns: minmax\(0, 1fr\); grid-template-rows: repeat\(6,/);
  assert.match(css, /\.report-chart-legend__button \{[^}]*aspect-ratio: 1;/);
});
