import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { formatMaintenanceItvDate, normalizeMaintenanceVehicleDetails, normalizeMaintenanceVehicleDetailsMap, resolveMaintenanceVehicleDetails } from "../src/maintenanceVehicleDetails.js";

const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

test("Lexus y Peugeot conservan sus kilómetros y revisión por matrícula", () => {
  const values = normalizeMaintenanceVehicleDetailsMap({
    "0344 LCP": { instrumentKm: "142001", remainingKm: "12500", itvDate: "2026-11-30" },
    "9401 LTG": { instrumentKm: 78000, remainingKm: 0, itvDate: "2027-02-01" },
    "1891 KPK": { instrumentKm: 1 },
  });
  assert.equal(values["0344 LCP"].instrumentKm, 142001);
  assert.equal(values["0344 LCP"].remainingKm, 12500);
  assert.equal(values["0344 LCP"].itvDate, "2026-11-30");
  assert.equal(values["9401 LTG"].instrumentKm, 78000);
  assert.equal(values["9401 LTG"].remainingKm, 0);
  assert.equal(values["9401 LTG"].itvDate, "2027-02-01");
  assert.equal(values["1891 KPK"], undefined);
  assert.equal(normalizeMaintenanceVehicleDetails("0344 LCP", { instrumentKm: "", remainingKm: "" }).instrumentKm, null);
});

test("la ITV se guarda individualmente en los cinco coches", () => {
  assert.equal(normalizeMaintenanceVehicleDetails("5043 MLC", { instrumentKm: 1, itvDate: "2026-10-09" }).itvDate, "2026-10-09");
  assert.equal(formatMaintenanceItvDate("2026-10-09"), "09/10/2026");
  assert.equal(formatMaintenanceItvDate(""), "—");
});

test("los Toyota admiten correcciones y revisión a cero sin congelar las siguientes lecturas", () => {
  const vehicle = { plate: "5043 MLC", serviceTracking: { instrumentKm: 120000, realKm: 540000, remainingKm: 5000, nextServiceInstrumentKm: 125000 } };
  const saved = normalizeMaintenanceVehicleDetails(vehicle.plate, { instrumentKm: 121000, realKm: 541000, remainingKm: 0, trackingInstrumentKm: 120000, trackingServiceTargetKm: 125000 });
  assert.equal(resolveMaintenanceVehicleDetails(vehicle, saved).remainingKm, 0);
  vehicle.serviceTracking.instrumentKm += 300;
  assert.equal(resolveMaintenanceVehicleDetails(vehicle, saved).instrumentKm, 121300);
  assert.equal(resolveMaintenanceVehicleDetails(vehicle, saved).realKm, 541300);
  assert.equal(resolveMaintenanceVehicleDetails(vehicle, saved).remainingKm, 0);
  vehicle.serviceTracking.nextServiceInstrumentKm = 145300;
  vehicle.serviceTracking.remainingKm = 25000;
  assert.equal(resolveMaintenanceVehicleDetails(vehicle, saved).remainingKm, 25000);
  assert.equal(resolveMaintenanceVehicleDetails(vehicle, {}).instrumentKm, 120300);
});

test("Bomba del agua, Correa y Bujías se conservan separados por coche", () => {
  const peugeot = normalizeMaintenanceVehicleDetails("9401 LTG", { waterPump: "no", timingBelt: "120.000 km", sparkPlugs: "2027-05-10" });
  assert.equal(peugeot.waterPump, "");
  assert.equal(peugeot.timingBelt, "120.000 km");
  assert.equal(peugeot.sparkPlugs, "2027-05-10");
  const toyota = normalizeMaintenanceVehicleDetails("5750 MJV", { waterPump: "  200.000 km  ", timingBelt: "no", sparkPlugs: "Revisadas" });
  assert.equal(toyota.waterPump, "200.000 km");
  assert.equal(toyota.timingBelt, "");
  assert.equal(toyota.sparkPlugs, "Revisadas");
});

test("las cinco tarjetas muestran las métricas y el editor no abre el historial", () => {
  assert.match(app, /has-service-tracking`\}/);
  assert.match(app, /Km cuadro: \{instrumentKm == null/);
  assert.match(app, /Revisión: \{remainingKm == null/);
  assert.match(app, /ITV: \{formatMaintenanceItvDate\(details\.itvDate\)\}/);
  assert.match(app, /className="maintenance-vehicle-edit" onClick=\{\(\) => openVehicleDetailsEditor\(vehicle\)\}/);
  assert.match(styles, /maintenance-vehicle-editor-overlay/);
});
