const COMPANY_BY_PLATE = Object.freeze({
  "5043 MLC": Object.freeze({ name: "David Díaz Muñoz", cif: "504-446-50S", workplace: "Boadilla del Monte" }),
  "5750 MJV": Object.freeze({ name: "Aida Díaz Pérez", cif: "01-93-803-7B", workplace: "Boadilla del Monte" }),
  "5754 MJV": Object.freeze({ name: "Aida Pérez Sal", cif: "500-944-52S", workplace: "Boadilla del Monte" }),
});

const isoDate = (year, month, day) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const startOfMondayWeek = (date) => {
  const copy = new Date(date);
  const weekday = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - weekday);
  return `${copy.getFullYear()}-${String(copy.getMonth() + 1).padStart(2, "0")}-${String(copy.getDate()).padStart(2, "0")}`;
};

export const getDriverHoursCompany = (plate) => COMPANY_BY_PLATE[String(plate ?? "").trim().toUpperCase()] ?? Object.freeze({ name: "", cif: "", workplace: "Boadilla del Monte" });

export const buildDriverHoursRows = ({ calendarRows = [], month, year, today = new Date() }) => {
  const todayKey = isoDate(today.getFullYear(), today.getMonth(), today.getDate());
  const rows = calendarRows.map((row) => {
    const dateKey = isoDate(year, month, row.day);
    const date = new Date(year, month, row.day, 12);
    const future = dateKey > todayKey;
    return { ...row, dateKey, date, weekKey: startOfMondayWeek(date), future, active: !future && Boolean(row.active), billing: Number(row.billing) || 0 };
  });
  const lowestActiveByWeek = new Map();
  rows.filter((row) => row.active).forEach((row) => {
    const current = lowestActiveByWeek.get(row.weekKey);
    if (!current || row.billing < current.billing || (row.billing === current.billing && row.day < current.day)) lowestActiveByWeek.set(row.weekKey, row);
  });
  return rows.map((row) => {
    const weeklyLowest = lowestActiveByWeek.get(row.weekKey)?.dateKey === row.dateKey;
    const status = row.future ? "Pendiente" : !row.active ? "Sin datos" : weeklyLowest ? "Menor facturación semanal" : "Trabajado";
    return { ...row, weeklyLowest, hours: status === "Trabajado" ? 8 : 0, status };
  });
};

export const getDriverHoursDefaultShift = (driverName, date, status) => {
  if (status !== "Trabajado") return { entry: "", exit: "", ordinary: "", agreed: "", voluntary: "" };
  const key = String(driverName ?? "").trim().toLocaleLowerCase("es").normalize("NFD").replace(/\p{Diacritic}/gu, "").split(/\s+/)[0];
  if (!["alex", "amin"].includes(key)) return { entry: "", exit: "", ordinary: "", agreed: "", voluntary: "" };
  const fridayOrSaturday = [5, 6].includes(date.getDay());
  return fridayOrSaturday
    ? { entry: "19:00 / 00:30", exit: "23:00 / 04:30", ordinary: "8", agreed: "", voluntary: "" }
    : { entry: "19:00 / 00:00", exit: "00:00 / 03:00", ordinary: "8", agreed: "", voluntary: "" };
};
