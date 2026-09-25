import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("administración muestra documentos mensuales por conductor y no el icono verde del coche", () => {
  const adminStart = source.indexOf("function AdminView(");
  const adminEnd = source.indexOf("function VehiclePlateLabel", adminStart);
  const adminSource = source.slice(adminStart, adminEnd > adminStart ? adminEnd : undefined);

  assert.match(adminSource, /documents = \[\]/);
  assert.match(adminSource, /currentDocumentPeriod/);
  assert.match(adminSource, /driverDocumentCount/);
  assert.match(adminSource, /admin-driver-card__documents/);
  assert.doesNotMatch(adminSource, /admin-vehicle-card__icon/);
});

test("administración reduce las matrículas y amplía los nombres de conductores", () => {
  assert.match(css, /\.app-shell--admin \.admin-vehicle-plate\s*\{[^}]*font-size:\s*19\.2px/s);
  assert.match(css, /\.app-shell--admin \.admin-driver-card__trigger strong\s*\{[^}]*font-size:\s*15px/s);
  assert.match(css, /@media \(max-width: 380px\)[\s\S]*?\.app-shell--admin \.admin-driver-card__trigger strong\s*\{[^}]*font-size:\s*13\.5px/s);
});

test("el gesto semanal se inicia desde la propia tabla del calendario", () => {
  assert.doesNotMatch(source, /closest\("\.driver-mobile-week-table-wrap"\)\) return/);
  assert.match(source, /shiftDriverWeek\(direction\)/);
});

test("el cambio de semana anima solo la salida y reajusta el carrusel sin escalón", () => {
  assert.match(source, /const weekSwipeDuration = 440/);
  assert.match(source, /flushSync\(\(\) => \{[\s\S]*shiftDriverWeek\(direction\)[\s\S]*setWeekSwipeOffset\(0\)[\s\S]*setWeekSwipeTransition\(false\)/);
  assert.match(css, /\.driver-mobile-week-track\s*\{[^}]*transition:\s*none/s);
  assert.match(css, /\.driver-mobile-week-track\.is-animating\s*\{[^}]*transition:\s*transform 440ms cubic-bezier\(\.22,1,\.36,1\)/s);
});
