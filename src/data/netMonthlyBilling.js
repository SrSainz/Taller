// Importes mensuales fijos que se muestran en la facturación por conductor
// dentro del detalle de Neto. No sustituyen los documentos ni las operaciones
// diarias del ledger; solo definen el fijo mensual de este resumen.
export const netMonthlyFixedBillingByDriver = Object.freeze({
  alex: 1323.72,
  amin: 1323.72,
  andres: 1323.72,
  fernando: 1332.24,
  mauricio: 1323.72,
  tirso: 1323.37,
});

const getDriverKey = (driver = "") => String(driver)
  .trim()
  .toLocaleLowerCase("es")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .split(/\s+/)[0];

export const getNetMonthlyFixedBilling = (driver) => {
  const key = getDriverKey(driver);
  return Object.prototype.hasOwnProperty.call(netMonthlyFixedBillingByDriver, key)
    ? netMonthlyFixedBillingByDriver[key]
    : null;
};
