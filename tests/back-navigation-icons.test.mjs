import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

test("las acciones de volver usan una flecha curva grande y gruesa", () => {
  assert.match(source, /aria-label="Volver al resumen general"><IconArrowBackUp size=\{26\} stroke=\{3\.5\}/);
  assert.match(source, /aria-label=\{`Volver desde el calendario de \$\{row\.driver\}`\}><IconArrowBackUp size=\{26\} stroke=\{3\.5\}/);
  assert.match(source, /setSelectedDriverKey\(""\)[\s\S]*?<IconArrowBackUp size=\{26\} stroke=\{3\.5\}/);
});

test("las acciones que solo cierran diálogos conservan la X", () => {
  assert.match(source, /aria-label="Cerrar fotos de efectivo"[^\n]*<IconX/);
  assert.match(source, /aria-label="Cerrar ventana"><IconX/);
  assert.match(source, /expanded \? <IconX size=\{17\} \/> : <IconArrowBackUp/);
});
