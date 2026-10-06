import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("Mantenimiento sigue compacto y Neto incorpora el desglose semanal", () => {
  const card = app.match(/function ReportStatCard\([^]*?\n}\n/)?.[0] ?? "";
  assert.match(card, /report-stat-card--single-line/);
  assert.match(card, /report-stat-card__topline/);
  assert.match(card, /<small>Total<\/small><strong>\{value\}<\/strong>/);
  assert.doesNotMatch(card, /Por día|Por km|daily|perKm/);
  assert.match(app, /<ReportStatCard icon=\{IconTool\} label="Mantenimiento"/);
  assert.match(app, /<NetWeeklyCard value=\{formatMainAmount\(periodTotals\.net\)\}/);
  assert.match(app, /COBRADO EN EFECTIVO/);
  assert.match(app, /COBRADO EN APP/);
  assert.match(app, /INGRESADO EN BANCO/);
  assert.match(app, /net-weekly-card__heading[^]*?net-weekly-card__details/);
  assert.match(css, /net-weekly-card__heading\s*\{[^}]*border-bottom:/);
  assert.match(css, /net-weekly-card__details\s*\{[^}]*background:/);
});

test("Conductores gana altura frente a las tarjetas compactas", () => {
  assert.match(css, /report-stat-card--wide\.report-stat-card--drivers\s*\{\s*min-height:\s*160px/);
  assert.match(css, /report-stat-card--wide\.report-stat-card--single-line\s*\{\s*min-height:\s*64px/);
  assert.match(css, /@media \(max-width: 820px\)[^]*?report-stat-card--wide\.report-stat-card--drivers\s*\{\s*min-height:\s*132px/);
});
