import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { formatMaintenanceItvDate, normalizeMaintenanceVehicleDetails, normalizeMaintenanceVehicleDetailsMap } from "../src/maintenanceVehicleDetails.js";

const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("Lexus y Peugeot conservan sus kilómetros y revisión por matrícula", () => {
  const values = normalizeMaintenanceVehicleDetailsMap({
    "0344 LCP": { instrumentKm: "142001", remainingKm: "12500", itvDate: "2026-11-30" },
    "9401 LTG": { instrumentKm: 78000, remainingKm: 0, itvDate: "2027-02-01" },
    "1891 KPK": { instrumentKm: 1 },
  });
  assert.deepEqual(values["0344 LCP"], { instrumentKm: 142001, remainingKm: 12500, itvDate: "2026-11-30" });
  assert.deepEqual(values["9401 LTG"], { instrumentKm: 78000, remainingKm: 0, itvDate: "2027-02-01" });
  assert.equal(values["1891 KPK"], undefined);
  assert.equal(normalizeMaintenanceVehicleDetails("0344 LCP", { instrumentKm: "", remainingKm: "" }).instrumentKm, null);
});

test("la ITV se guarda individualmente en los cinco coches", () => {
  assert.deepEqual(normalizeMaintenanceVehicleDetails("5043 MLC", { instrumentKm: 1, itvDate: "2026-10-09" }), { itvDate: "2026-10-09" });
  assert.equal(formatMaintenanceItvDate("2026-10-09"), "09/10/2026");
  assert.equal(formatMaintenanceItvDate(""), "—");
});

test("las cinco tarjetas muestran las métricas y el editor no abre el historial", () => {
  assert.match(app, /has-service-tracking`\}/);
  assert.match(app, /Km cuadro: \{instrumentKm == null/);
  assert.match(app, /Revisión: \{remainingKm == null/);
  assert.match(app, /ITV: \{formatMaintenanceItvDate\(details\.itvDate\)\}/);
  assert.match(app, /className="maintenance-vehicle-edit" onClick=\{\(\) => openVehicleDetailsEditor\(vehicle\)\}/);
  assert.match(styles, /maintenance-vehicle-editor-overlay/);
});
