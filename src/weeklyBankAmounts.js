export const weeklyBankVehiclePlates = ["5043 MLC", "5750 MJV", "5754 MJV"];

export function parseWeeklyBankAmounts(drafts = {}) {
  let cents = 0;
  const vehicleAmounts = {};
  for (const plate of weeklyBankVehiclePlates) {
    const raw = String(drafts[plate] ?? "").trim();
    const normalized = raw.replace(/\s|€/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
    if (raw && !/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error(`Introduce un importe válido para ${plate}.`);
    const amount = normalized ? Number(normalized) : 0;
    if (!Number.isFinite(amount) || amount < 0 || amount > 9999999999.99) throw new Error(`Introduce un importe válido para ${plate}.`);
    const value = Math.round(amount * 100);
    vehicleAmounts[plate] = value / 100;
    cents += value;
  }
  if (cents > 999999999999) throw new Error("El total supera el importe máximo permitido.");
  return { amount: cents / 100, vehicleAmounts };
}
