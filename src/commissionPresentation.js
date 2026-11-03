const textKeys = new Set(["driverName", "plate", "monthlyBilling", "commissionRate", "commissionBase", "thresholdBonus", "tips", "totalBenefitMonth", "payroll", "advance", "otherConcept", "totalToCollect"]);

export const getCommissionText = (adjustments, key, fallback) => typeof adjustments?.display?.[key] === "string" && adjustments.display[key].trim() ? adjustments.display[key] : fallback;

export function withCommissionText(adjustments, key, value) {
  if (!textKeys.has(key)) throw new Error("Este texto no se puede editar.");
  const display = { ...adjustments?.display };
  if (value === null) delete display[key];
  else {
    const text = String(value).trim();
    if (!text || text.length > 80) throw new Error("Introduce un texto de entre 1 y 80 caracteres.");
    display[key] = text;
  }
  return { ...adjustments, display };
}
