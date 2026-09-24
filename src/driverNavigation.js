import { canonicalizeVehiclePlate } from "./data/vehicleRegistry.js";

const getDriverKey = (driver = "") => String(driver)
  .trim()
  .toLocaleLowerCase("es")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .split(/\s+/)[0];

export const findDriverNavigationRow = (driverRows = [], target = null) => {
  if (!target) return null;
  const targetPlate = canonicalizeVehiclePlate(target.plate);
  const targetDriverKey = getDriverKey(target.driver);
  return driverRows.find((row) => target.driverId && row.driverId === target.driverId)
    ?? driverRows.find((row) => canonicalizeVehiclePlate(row.plate) === targetPlate && getDriverKey(row.driver) === targetDriverKey)
    ?? null;
};
