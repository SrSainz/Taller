import { canonicalizeVehiclePlate } from "./vehicleRegistry.js";

// Importes mensuales fijos de nómina que se muestran en el detalle de Neto
// cuando todavía no hay una nómina documental o guardada para el periodo.
// La facturación del conductor procede siempre de los documentos y del ledger
// diario compartido con Conductores; estos importes no deben sustituirla.
export const netMonthlyFixedPayrollByDriver = Object.freeze({
  alex: 1323.72,
  amin: 1323.72,
  andres: 1323.72,
  fernando: 1332.24,
  mauricio: 1323.72,
  tirso: 1323.37,
});

export const netMonthlyFixedInsuranceByPlate = Object.freeze({
  "5043 MLC": 220.83,
  "5750 MJV": 310.00,
});

const getDriverKey = (driver = "") => String(driver)
  .trim()
  .toLocaleLowerCase("es")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .split(/\s+/)[0];

export const getNetMonthlyFixedPayroll = (driver) => {
  const key = getDriverKey(driver);
  return Object.prototype.hasOwnProperty.call(netMonthlyFixedPayrollByDriver, key)
    ? netMonthlyFixedPayrollByDriver[key]
    : null;
};

export const getNetMonthlyFixedInsurance = (plate) => netMonthlyFixedInsuranceByPlate[canonicalizeVehiclePlate(plate)] ?? null;
