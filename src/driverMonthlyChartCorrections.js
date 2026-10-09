// Importes históricos de agosto de 2026 facilitados directamente por el usuario.
// Corrigen la gráfica mensual sin crear movimientos diarios ni documentos ficticios.
export const august2026DriverBilling = Object.freeze({
  alex: 6989.85,
  tirso: 4257.56,
  amin: 3447.19,
  mauricio: 5522.55,
  fernando: 3318.64,
});

export const getDriverMonthlyChartAmount = (driverName, periodKey, calculatedAmount) => {
  if (periodKey !== "2026-08") return calculatedAmount;
  const key = String(driverName ?? "").trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/)[0];
  return august2026DriverBilling[key] ?? calculatedAmount;
};
