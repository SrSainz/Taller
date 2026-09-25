import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("mantenimiento oculta el nombre textual de la marca y amplía la matrícula un 50 por ciento", () => {
  const start = source.indexOf("function MaintenanceView(");
  const end = source.indexOf("function MaintenanceEditWorkflow", start);
  const maintenanceSource = source.slice(start, end);

  assert.doesNotMatch(maintenanceSource, /maintenance-vehicle-identity"><small>\{brand\}<\/small>/);
  assert.match(maintenanceSource, /maintenance-vehicle-identity"><VehiclePlateLabel[^>]*maintenance-vehicle-plate/);
  assert.match(css, /\.maintenance-page \.maintenance-vehicle-banner-row \.maintenance-vehicle-identity > \.maintenance-vehicle-plate\s*\{\s*font-size:\s*21px;/s);
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*?font-size:\s*clamp\(19\.5px, 5\.55vw, 27px\)/s);
});
