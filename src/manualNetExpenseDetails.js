// Keep each saved entry intact even when its amount is merged into a category.
// Old local expenses have the entry on the row itself rather than manualEntries.
export const getManualNetExpenseEntries = (expense) => {
  const entries = expense?.manual ? [expense] : expense?.manualEntries ?? [];
  return [...entries].sort((left, right) => String(right.date || "").localeCompare(String(left.date || "")));
};
