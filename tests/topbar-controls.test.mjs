import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stylesSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

test("el botón de actualización tiene el mismo tamaño base que la campana", () => {
  assert.match(stylesSource, /\.topbar-refresh-button \{[^}]*width: 30px;[^}]*height: 30px;[^}]*min-height: 30px;/s);
  assert.match(stylesSource, /\.bell-button \{[^}]*width: 30px;[^}]*height: 30px;/s);
  assert.match(stylesSource, /\.topbar-refresh-button span \{[^}]*width: 1px;[^}]*clip: rect\(0, 0, 0, 0\);/s);
  assert.match(appSource, /className=\{`topbar-refresh-button/);
  assert.match(appSource, /aria-label="Actualizar datos" title="Actualizar datos ahora"/);
});
