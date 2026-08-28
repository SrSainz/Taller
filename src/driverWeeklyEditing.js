export const driverEditableWeeklyRowKeys = Object.freeze(["wash", "other"]);

export const administratorEditableWeeklyRowKeys = Object.freeze([
  "cash",
  "fuel",
  "refunds",
  "wash",
  "other",
]);

export const isWeeklyRowEditable = (rowKey, isAdministrator = false) => (
  (isAdministrator ? administratorEditableWeeklyRowKeys : driverEditableWeeklyRowKeys).includes(rowKey)
);
