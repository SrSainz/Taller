import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("las acciones de volver usan una flecha curva grande y gruesa", () => {
  assert.match(source, /aria-label="Volver al resumen general"><IconArrowBackUp size=\{26\} stroke=\{3\.5\}/);
  assert.match(source, /aria-label=\{`Volver desde el calendario de \$\{row\.driver\}`\}><IconArrowBackUp size=\{26\} stroke=\{3\.5\}/);
  assert.match(source, /setSelectedDriverKey\(""\)[\s\S]*?<IconArrowBackUp size=\{26\} stroke=\{3\.5\}/);
  assert.match(source, /net-detail-modal__header">\s*<button[^>]*app-return-button/);
  assert.match(source, /driver-billing-calendar__leading">\s*<button[^>]*app-return-button/);
  assert.match(source, /drivers-calendar-card__leading-actions">\s*\{!expanded && <button[^>]*app-return-button/);
  assert.match(source, /driver-mobile-topbar__back app-return-button[^\n]*<IconArrowBackUp size=\{26\} stroke=\{3\.5\}/);
  assert.match(css, /\.app-return-button\s*\{[^}]*width:\s*36px !important;[^}]*height:\s*36px !important;[^}]*background:\s*#e10600 !important;[^}]*color:\s*#050505 !important/s);
});

test("las acciones que solo cierran diálogos conservan la X", () => {
  assert.match(source, /aria-label="Cerrar fotos de efectivo"[^\n]*<IconX/);
  assert.match(source, /aria-label="Cerrar ventana"><IconX/);
  assert.match(source, /\{expanded && <button[\s\S]*?aria-label="Cerrar calendario ampliado"><IconX size=\{17\}/);
});
