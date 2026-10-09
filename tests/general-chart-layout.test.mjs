import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("los seis filtros rectangulares muestran sus nombres a la izquierda sin reducir la altura de las barras", () => {
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(app, /selectableChartMetrics\.map\(\(option\) =>/);
  assert.match(app, /summary: \{ title: "RESUMEN GENERAL", description: ""/);
  assert.match(app, /billing: \{ title: "FACTURACIÓN", description: "", color: BILLING_COLOR, data: displayedBillingChartData \}/);
  assert.match(app, /value: getDriverMonthlyChartAmount\(row\.label,/);
  assert.doesNotMatch(app, /RESUMEN GENERAL POR COCHE/);
  assert.match(css, /\.report-chart--summary \{ grid-template-columns: 122px minmax\(0, 1fr\); grid-template-rows: minmax\(0, 1fr\); gap: 1px;/);
  assert.match(css, /@media \(max-width: 720px\) \{\s*\.report-chart--summary \{ grid-template-columns: 92px minmax\(0, 1fr\); gap: 1px; \}/);
  assert.match(css, /\.report-chart--summary > \.recharts-responsive-container \{ grid-column: 2; grid-row: 1;/);
  assert.match(css, /\.report-chart--summary > \.report-chart-legend \{ grid-column: 1; grid-row: 1;/);
  assert.match(css, /\.report-chart-legend \{ grid-template-columns: minmax\(0, 1fr\); grid-template-rows: repeat\(6,/);
  assert.match(css, /\.report-chart-legend__button \{ width: 100%; max-width: 100%; height: 100%;/);
  assert.match(css, /\.report-chart--summary \.report-chart-legend__swatch \{ display: none; \}/);
  assert.match(css, /max-height: 850px[\s\S]*report-chart-card--compact-preview \{ min-height: 190px;/);
  assert.match(app, /const fontSize = Math\.min\(11\.5, \(barWidth - 4\) \* 0\.8, \(barHeight - 8\) \/ \(label\.length \* 0\.58\)\)/);
});
