import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("efectivo y repostaje comparten el visor ampliado sin cambiar las tarjetas del calendario", () => {
  assert.match(app, /cashDocumentDialogDate && <div className="driver-mobile-calendar-document-dialog"/);
  assert.match(app, /fuelDocumentDialogDate && <div className="driver-mobile-calendar-document-dialog"/);
  assert.match(css, /driver-mobile-calendar-document-dialog__panel\s*\{[^}]*width: min\(1080px, calc\(100vw - 24px\)\)/);
  assert.match(css, /driver-mobile-calendar-document-dialog__panel \.driver-mobile-calendar-document__preview\s*\{ width: 116px; height: 96px/);
  assert.match(css, /driver-mobile-calendar-document-dialog__panel \.driver-mobile-calendar-document__info strong\s*\{ font-size: 18px/);
  assert.match(css, /driver-mobile-calendar-document-dialog__panel\s*\{[^}]*max-height: calc\(100dvh - 8px\)/);
});
