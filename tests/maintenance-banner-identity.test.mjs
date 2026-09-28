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

test("5754 MJV coloca el logo arriba, el kilometraje debajo y duplica la matrícula", () => {
  assert.match(source, /maintenance-vehicle-identity"><VehiclePlateLabel[\s\S]*?!vehicle\.serviceTracking/);
  assert.match(source, /vehicle\.serviceTracking && <span className="maintenance-vehicle-km-tracking"/);
  assert.match(source, /Próxima revisión: \{formatKm\(vehicle\.serviceTracking\.remainingKm\)\}/);
  assert.match(css, /has-service-tracking \.maintenance-vehicle-banner\s*\{[^}]*grid-template-areas:[^}]*"number brand plate type latest"[^}]*"number tracking tracking type latest"/s);
  assert.match(css, /has-service-tracking \.maintenance-vehicle-identity > \.maintenance-vehicle-plate\s*\{[^}]*font-size:\s*42px/s);
  assert.match(css, /has-service-tracking \.maintenance-vehicle-identity > \.maintenance-vehicle-plate > strong\s*\{[^}]*font-size:\s*inherit/s);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*?grid-template-areas:[^}]*"brand plate"[^}]*"tracking tracking"/s);
});
