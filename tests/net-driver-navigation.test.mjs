import test from "node:test";
import assert from "node:assert/strict";
import { findDriverNavigationRow } from "../src/driverNavigation.js";

const rows = [
  { key: "5043 MLC-Alex", driverId: "driver-alex", driver: "Alex", plate: "5043 MLC" },
  { key: "5043 MLC-Tirso", driverId: "driver-tirso", driver: "Tirso", plate: "5043 MLC" },
  { key: "5750 MJV-Mauricio", driverId: "driver-mauricio", driver: "Mauricio", plate: "5750 MJV" },
  { key: "5750 MJV-Amin", driverId: "driver-amin", driver: "Amin", plate: "5750 MJV" },
  { key: "5754 MJV-Andrés", driverId: "driver-andres", driver: "Andrés", plate: "5754 MJV" },
  { key: "5754 MJV-Fernando", driverId: "driver-fernando", driver: "Fernando", plate: "5754 MJV" },
];

test("Neto abre la ficha exacta de cualquiera de los seis conductores", () => {
  rows.forEach((row) => {
    assert.equal(findDriverNavigationRow(rows, { driverId: row.driverId, driver: row.driver, plate: row.plate }), row);
  });
});

test("la navegación sigue funcionando con matrícula compacta y nombre sin acento", () => {
  assert.equal(findDriverNavigationRow(rows, { driver: "Andres", plate: "5754MJV" })?.key, "5754 MJV-Andrés");
  assert.equal(findDriverNavigationRow(rows, { driver: "Desconocido", plate: "5754 MJV" }), null);
});
