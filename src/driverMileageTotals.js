export const getAccumulatedDriverKmThroughDay = (calendarRows, selectedDay) => {
  if (!Number.isInteger(selectedDay) || selectedDay < 1) return 0;
  return calendarRows.reduce((total, row) => {
    if (row.day > selectedDay) return total;
    return total + (Number(row.km) || 0);
  }, 0);
};
