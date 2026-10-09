import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("mantenimiento oculta el nombre textual de la marca y destaca la matrícula", () => {
  const start = source.indexOf("function MaintenanceView(");
  const end = source.indexOf("function MaintenanceEditWorkflow", start);
  const maintenanceSource = source.slice(start, end);

  assert.doesNotMatch(maintenanceSource, /maintenance-vehicle-identity"><small>\{brand\}<\/small>/);
  assert.match(maintenanceSource, /maintenance-vehicle-identity"><VehiclePlateLabel[^>]*maintenance-vehicle-plate/);
  assert.match(css, /\.maintenance-page \.maintenance-vehicle-banner-row \.maintenance-vehicle-identity > \.maintenance-vehicle-plate\s*\{\s*font-size:\s*21px;/s);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*?font-size:\s*clamp\(19\.5px, 5\.55vw, 27px\)/s);
});

test("los cinco coches comparten matrícula y distribución; las métricas automáticas de Toyota se conservan", () => {
  assert.match(source, /has-service-tracking`\}/);
  assert.match(source, /maintenance-vehicle-identity"><VehiclePlateLabel[^>]*maintenance-vehicle-plate/);
  assert.match(source, /vehicle\.serviceTracking\?\.instrumentKm \?\? details\.instrumentKm/);
  assert.match(source, /vehicle\.serviceTracking\?\.remainingKm \?\? details\.remainingKm/);
  assert.match(source, /Revisión: \{remainingKm == null \? "—" : formatKm\(remainingKm\)\}/);
  assert.match(source, /ITV: \{formatMaintenanceItvDate\(details\.itvDate\)\}/);
  assert.match(css, /has-service-tracking \.maintenance-vehicle-banner\s*\{[^}]*grid-template-areas:[^}]*"number brand plate type latest"[^}]*"number brand tracking type latest"/s);
  assert.match(css, /has-service-tracking \.maintenance-vehicle-banner\s*\{[^}]*height:\s*112px;[^}]*min-height:\s*112px/s);
  assert.match(css, /has-service-tracking \.vehicle-brand-mark\s*\{[^}]*width:\s*41\.6px;[^}]*height:\s*41\.6px/s);
  assert.match(css, /has-service-tracking \.maintenance-vehicle-identity > \.maintenance-vehicle-plate\s*\{[^}]*font-size:\s*21px/s);
  assert.match(css, /has-service-tracking \.maintenance-vehicle-identity > \.maintenance-vehicle-plate > strong\s*\{[^}]*font-size:\s*inherit/s);
  assert.match(css, /has-service-tracking \.maintenance-vehicle-identity\s*\{[^}]*align-self:\s*center;[^}]*transform:\s*translateY\(4px\)/s);
  assert.match(css, /has-service-tracking \.maintenance-vehicle-km-tracking\s*\{[^}]*font-size:\s*16\.9px/s);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*?grid-template-areas:[^}]*"brand plate"[^}]*"brand tracking"/s);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*?has-service-tracking \.maintenance-vehicle-banner\s*\{[^}]*height:\s*108px;[^}]*min-height:\s*108px/s);
});
