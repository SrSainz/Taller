import assert from "node:assert/strict";
import test from "node:test";
import { getVehicleDriverNames, vehicleDriverNamesByPlate } from "../src/data/vehicleRegistry.js";

test("mantiene la asociación profesional de conductores por matrícula", () => {
  assert.deepEqual(vehicleDriverNamesByPlate["5043 MLC"], ["Alex", "Tirso"]);
  assert.deepEqual(vehicleDriverNamesByPlate["5750 MJV"], ["Mauricio", "Amin"]);
  assert.deepEqual(vehicleDriverNamesByPlate["5754 MJV"], ["Andrés", "Fernando"]);
});

test("resuelve la misma asociación con o sin espacios en la matrícula", () => {
  assert.deepEqual(getVehicleDriverNames("5043MLC"), ["Alex", "Tirso"]);
  assert.deepEqual(getVehicleDriverNames({ plate: "5750 MJV" }), ["Mauricio", "Amin"]);
});
