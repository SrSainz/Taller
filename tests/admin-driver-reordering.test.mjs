import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const adminUsers = fs.readFileSync(new URL("../supabase/functions/admin-users/index.ts", import.meta.url), "utf8");

test("crear acceso admite nuevos conductores aunque el coche ya tenga dos", () => {
  assert.doesNotMatch(adminUsers, /Ese coche ya tiene dos conductores asignados/);
  assert.match(app, /invokeAdminUsers\(\{ action: "create", \.\.\.form \}\)/);
  assert.match(app, /Vehículo profesional/);
});

test("las tarjetas de conductor se pueden arrastrar, reordenar y cambiar de coche", () => {
  assert.match(app, /sobre-ruedas-admin-driver-order/);
  assert.match(app, /setPointerCapture/);
  assert.match(app, /elementFromPoint/);
  assert.match(app, /invokeAdminUsers\(\{ action: "update", userId: driver\.id, vehiclePlate: targetPlate \}\)/);
  assert.match(styles, /admin-driver-card\.is-dragging/);
  assert.match(styles, /admin-vehicle-card\.is-drop-target/);
});
