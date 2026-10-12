export const realCostCategoryKeys = Object.freeze([
  "workshop", "accounting", "fuel", "social-security", "taxes", "eu-vat",
  "leasing", "insurance", "inspection", "road-tax", "license-loan", "annex-insurance",
]);

export const calculateVehicleCostMetrics = ({ expenses = [], kilometres = 0, billing = 0 }) => {
  const cost = expenses
    .filter((expense) => realCostCategoryKeys.includes(expense.key))
    .reduce((total, expense) => total + (Number(expense.amount) || 0), 0);
  const fuel = expenses
    .filter((expense) => expense.key === "fuel")
    .reduce((total, expense) => total + (Number(expense.amount) || 0), 0);
  const km = Math.max(0, Number(kilometres) || 0);
  const revenue = Math.max(0, Number(billing) || 0);
  return {
    cost,
    fuel,
    kilometres: km,
    billing: revenue,
    realCostPerKm: km > 0 ? cost / km : null,
    fuelPerKm: km > 0 ? fuel / km : null,
    fuelPerBilling: revenue > 0 ? fuel / revenue * 100 : null,
  };
};
