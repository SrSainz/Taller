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

test("un toque abre la aplicación del conductor y mantener pulsada la foto abre su gestión", () => {
  assert.match(app, /onPreviewDriver\(driver\)/);
  assert.match(app, /event\.target\.closest\("\.admin-driver-card__avatar"\)/);
  assert.match(app, /longPressRef\.current\.triggered = true;\s*setDriverActionId\(driverKey\)/);
});

test("administración muestra los perfiles vigentes juntos y en el orden inicial acordado", () => {
  assert.match(app, /"5043 MLC": \{ tirso: 0, alex: 1 \}/);
  assert.match(app, /"5750 MJV": \{ mauricio: 0, amin: 1 \}/);
  assert.match(app, /"5754 MJV": \{ william: 0, fernando: 1 \}/);
  assert.match(app, /setDrivers\(await loadDriverAvatarUrls/);
  assert.match(app, /profilesReady && vehicleDrivers\.map/);
  assert.match(app, /vehicle\.plate && !driver\.replaced_by/);
  assert.doesNotMatch(app.slice(app.indexOf("const driversForVehicle ="), app.indexOf("const resetDriverDrag =")), /vehicle\.drivers/);
  assert.match(app, /driver\.avatar_url \|\| \(!driver\.avatar_path/);
  assert.match(app, /onProfile=\{openAdminProfile\}/);
  assert.match(app, /if \(isAdmin && !driverProfilesReady\) \{/);
  assert.match(app, /await Promise\.all\(avatarUrls\.map/);
  assert.match(app, /<AdminView initialDrivers=\{driverProfiles\} initialReady=\{driverProfilesReady\}/);
  assert.match(app, /const \[drivers, setDrivers\] = useState\(initialDrivers\)/);
  assert.doesNotMatch(app, /Cargando conductores/);
});
