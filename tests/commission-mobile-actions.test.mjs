import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const dialog = app.slice(app.indexOf("function DriverCommissionDialog("), app.indexOf("function DriverHoursDialog("));

test("la ficha compartida muestra solo los tramos alcanzados, sin fila Siguiente", () => {
  assert.match(dialog, /reachedRows\.length > 0 &&/);
  assert.match(dialog, /reachedRows\.map\(/);
  assert.doesNotMatch(dialog, /"Siguiente"|evolutionRows\.map\(/);
  assert.match(dialog, /const nextThreshold = evolutionRows\.find/);
});

test("Cerrar e Imprimir están fuera del contenido desplazable y reservan la navegación móvil", () => {
  assert.match(dialog, /className="driver-commission-sheet__content"/);
  assert.match(dialog, /<\/div>\s*<footer className="driver-commission-sheet__actions"/);
  assert.match(css, /\.driver-commission-sheet__content\s*\{[^}]*min-height:\s*0[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.driver-commission-sheet__actions\s*\{[^}]*flex:\s*0 0 auto/s);
  assert.match(css, /\.driver-commission-sheet\s*\{[^}]*max-height:\s*calc\(100dvh - var\(--bottom-navigation-height, 58px\) - env\(safe-area-inset-bottom, 0px\) - 16px\)/s);
  assert.match(css, /\.driver-commission-sheet__actions button\s*\{[^}]*min-height:\s*48px/s);
  assert.match(css, /body:has\(\.driver-commission-sheet\) \.driver-commission-sheet__content\s*\{[^}]*overflow:\s*visible/s);
});
