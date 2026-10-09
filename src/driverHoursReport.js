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

const WORKERS_5043_MLC = Object.freeze({
  alex: Object.freeze({ name: "Alexandru Florin Radu", nif: "Y3789801J", affiliation: "28/14202868-68" }),
  tirso: Object.freeze({ name: "Tirso Rafael Rojano Gutiérrez", nif: "Z2451698H", affiliation: "28/16614610-02" }),
});

const WORKERS_5754_MJV = Object.freeze({
  fernando: Object.freeze({ name: "Fernando Herrera Jiménez", nif: "05236080S", affiliation: "28/03298802-20" }),
});

const WORKERS_5750_MJV = Object.freeze({
  mauricio: Object.freeze({ name: "Mauricio Marchant Román", nif: "X0431578Y", affiliation: "28/04367992-CT6" }),
  amin: Object.freeze({ name: "Amin Sellami EL HASSANAOUI", nif: "05732189Z", affiliation: "28/13198435-70" }),
});

const WORKERS_BY_PLATE = Object.freeze({ "5043 MLC": WORKERS_5043_MLC, "5750 MJV": WORKERS_5750_MJV, "5754 MJV": WORKERS_5754_MJV });

export const getDriverHoursWorker = (name, plate) => WORKERS_BY_PLATE[String(plate ?? "").trim().toUpperCase()]?.[driverKey(name)]
  ?? { name: String(name ?? ""), nif: "", affiliation: "" };

export const buildDriverHoursRows = ({ calendarRows = [], month, year, driverName = "", today = new Date() }) => {
  const todayKey = isoDate(today.getFullYear(), today.getMonth(), today.getDate());
  const rows = calendarRows.map((row) => {
    const dateKey = isoDate(year, month, row.day);
    const date = new Date(year, month, row.day, 12);
    const future = dateKey > todayKey;
    return { ...row, dateKey, date, weekKey: startOfMondayWeek(date), future, active: !future && Boolean(row.active), billing: Number(row.billing) || 0 };
  });
  const key = driverKey(driverName);
  const fixedNightRest = ["alex", "amin"].includes(key);
  const fixedRestDays = { alex: [1, 2], amin: [1, 2], fernando: [0, 6], william: [0, 1], tirso: [0, 1], mauricio: [0, 4] }[key];
  const selectedRestDates = new Set();
  const weeks = new Map();
  rows.filter((row) => !row.future).forEach((row) => weeks.set(row.weekKey, [...(weeks.get(row.weekKey) ?? []), row]));
  weeks.forEach((weekRows) => {
    if (fixedRestDays) return;
    const emptyDays = weekRows.filter((row) => !row.active).length;
    const restNeeded = 1;
    weekRows.filter((row) => row.active).sort((a, b) => a.billing - b.billing || a.day - b.day).slice(0, restNeeded).forEach((row) => selectedRestDates.add(row.dateKey));
  });
  return rows.map((row) => {
    const weeklyLowest = selectedRestDates.has(row.dateKey);
    const fixedRest = fixedRestDays?.includes(row.date.getDay());
    const status = row.future ? "Pendiente" : fixedRest ? "Descanso" : !row.active ? "Sin datos" : weeklyLowest ? "Menor facturación semanal" : "Trabajado";
    const hours = status === "Trabajado" ? (fixedNightRest ? ([5, 6].includes(row.date.getDay()) ? 9 : 7) : 8) : 0;
    return { ...row, weeklyLowest, hours, status };
  });
};

export const getDriverHoursDefaultShift = (driverName, date, status) => {
  const key = driverKey(driverName);
  const weekday = date.getDay();
  const fixedRest = ({ fernando: [0, 6], william: [0, 1], tirso: [0, 1], mauricio: [0, 4], alex: [1, 2], amin: [1, 2], andres: [0, 1] }[key] ?? []).includes(weekday);
  if (status !== "Trabajado" || fixedRest) return { entry: "", exit: "", ordinary: "", agreed: "", voluntary: "" };
  if (key === "fernando") return { entry: "17:00", exit: "01:00 (+1 día)", ordinary: "8", agreed: "", voluntary: "" };
  if (key === "william") return { entry: "05:00 / 11:00", exit: "09:00 / 15:00", ordinary: "8", agreed: "", voluntary: "" };
  if (key === "andres") return { entry: "05:00 / 10:00", exit: "09:00 / 14:00", ordinary: "8", agreed: "", voluntary: "" };
  if (["mauricio", "tirso"].includes(key)) return { entry: "07:00 / 13:00", exit: "11:00 / 17:00", ordinary: "8", agreed: "", voluntary: "" };
  if (!["alex", "amin"].includes(key)) return { entry: "", exit: "", ordinary: "", agreed: "", voluntary: "" };
  const fridayOrSaturday = [5, 6].includes(date.getDay());
  return fridayOrSaturday
    ? { entry: "18:00 / 00:00", exit: "22:00 / 05:00", ordinary: "9", agreed: "", voluntary: "" }
    : { entry: "18:00", exit: "01:00 (+1 día)", ordinary: "7", agreed: "", voluntary: "" };
};

export const migrateNightShiftRows = (driverName, rows = {}, defaults = {}, year, month) => {
  const key = driverKey(driverName);
  if (!["alex", "amin", "fernando", "william", "tirso", "mauricio"].includes(key)) return rows;
  return Object.fromEntries(Object.entries(rows).map(([dateKey, values]) => {
    const day = Number(dateKey.slice(-2));
    const weekday = new Date(year, month, day, 12).getDay();
    const old = key === "fernando"
      ? { entry: "16:30 / 21:30", exit: "20:30 / 02:30", ordinary: "9" }
      : ["tirso", "mauricio"].includes(key)
      ? { entry: "06:30 / 12:00", exit: "10:30 / 16:00", ordinary: "8" }
      : [5, 6].includes(weekday)
      ? { entry: "19:00 / 00:30", exit: "23:00 / 04:30", ordinary: "8" }
      : { entry: "19:00 / 00:00", exit: "00:00 / 03:00", ordinary: "8" };
    const next = { ...values };
    const previousTemplate = ["entry", "exit", "ordinary"].every((field) => next[field] === old[field]);
    const emptyOldRest = ["entry", "exit", "ordinary"].every((field) => !next[field]) && Boolean(defaults[dateKey]?.entry);
    if (previousTemplate || emptyOldRest) {
      for (const field of ["entry", "exit", "ordinary"]) next[field] = defaults[dateKey]?.[field] ?? "";
    }
    return [dateKey, next];
  }));
};
