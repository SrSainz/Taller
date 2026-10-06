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

const driverKey = (name) => String(name ?? "").trim().toLocaleLowerCase("es").normalize("NFD").replace(/\p{Diacritic}/gu, "").split(/\s+/)[0];

export const getDriverHoursWorker = (name, plate) => driverKey(name) === "alex" && String(plate ?? "").trim().toUpperCase() === "5043 MLC"
  ? { name: "Alexandru Florin Radu", nif: "Y3789801J", affiliation: "28/14202868-68" }
  : { name: String(name ?? ""), nif: "", affiliation: "" };

export const buildDriverHoursRows = ({ calendarRows = [], month, year, driverName = "", today = new Date() }) => {
  const todayKey = isoDate(today.getFullYear(), today.getMonth(), today.getDate());
  const rows = calendarRows.map((row) => {
    const dateKey = isoDate(year, month, row.day);
    const date = new Date(year, month, row.day, 12);
    const future = dateKey > todayKey;
    return { ...row, dateKey, date, weekKey: startOfMondayWeek(date), future, active: !future && Boolean(row.active), billing: Number(row.billing) || 0 };
  });
  const key = driverKey(driverName);
  const dynamicTwoDayRest = ["alex", "amin", "mauricio", "tirso"].includes(key);
  const selectedRestDates = new Set();
  const weeks = new Map();
  rows.filter((row) => !row.future).forEach((row) => weeks.set(row.weekKey, [...(weeks.get(row.weekKey) ?? []), row]));
  weeks.forEach((weekRows) => {
    const emptyDays = weekRows.filter((row) => !row.active).length;
    const restNeeded = dynamicTwoDayRest ? Math.max(0, 2 - emptyDays) : 1;
    weekRows.filter((row) => row.active).sort((a, b) => a.billing - b.billing || a.day - b.day).slice(0, restNeeded).forEach((row) => selectedRestDates.add(row.dateKey));
  });
  return rows.map((row) => {
    const weeklyLowest = selectedRestDates.has(row.dateKey);
    const status = row.future ? "Pendiente" : !row.active ? "Sin datos" : weeklyLowest ? "Menor facturación semanal" : "Trabajado";
    return { ...row, weeklyLowest, hours: status === "Trabajado" ? 8 : 0, status };
  });
};

export const getDriverHoursDefaultShift = (driverName, date, status) => {
  const key = driverKey(driverName);
  const weekday = date.getDay();
  const fixedRest = (key === "fernando" && [0, 6].includes(weekday)) || (key === "andres" && [0, 1].includes(weekday));
  if (status !== "Trabajado" || fixedRest) return { entry: "", exit: "", ordinary: "", agreed: "", voluntary: "" };
  if (key === "fernando") return { entry: "16:30 / 21:30", exit: "20:30 / 02:30", ordinary: "9", agreed: "", voluntary: "" };
  if (key === "andres") return { entry: "05:00 / 10:00", exit: "09:00 / 14:00", ordinary: "8", agreed: "", voluntary: "" };
  if (["mauricio", "tirso"].includes(key)) return { entry: "06:30 / 12:00", exit: "10:30 / 16:00", ordinary: "8", agreed: "", voluntary: "" };
  if (!["alex", "amin"].includes(key)) return { entry: "", exit: "", ordinary: "", agreed: "", voluntary: "" };
  const fridayOrSaturday = [5, 6].includes(date.getDay());
  return fridayOrSaturday
    ? { entry: "19:00 / 00:30", exit: "23:00 / 04:30", ordinary: "8", agreed: "", voluntary: "" }
    : { entry: "19:00 / 00:00", exit: "00:00 / 03:00", ordinary: "8", agreed: "", voluntary: "" };
};
