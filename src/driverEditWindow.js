const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const dateKeyFromTimeZone = (value, timeZone) => {
  const date = value instanceof Date ? value : new Date(value);
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(safeDate);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const dateKeyToUtcDate = (dateKey) => {
  if (!DATE_KEY_PATTERN.test(String(dateKey ?? ""))) return null;
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
};

const utcDateToDateKey = (date) => [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()]
  .map((value, index) => index === 0 ? String(value).padStart(4, "0") : String(value).padStart(2, "0"))
  .join("-");

/**
 * Returns the natural Monday-Sunday week for the current date in Spain.
 * Date-only values are compared as calendar dates, avoiding DST and browser
 * locale differences at the edges of the week.
 */
export const getCurrentDriverWeekRange = (now = new Date(), timeZone = "Europe/Madrid") => {
  const todayKey = dateKeyFromTimeZone(now, timeZone);
  const today = dateKeyToUtcDate(todayKey) ?? dateKeyToUtcDate(dateKeyFromTimeZone(new Date(), timeZone));
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - mondayOffset);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return {
    todayDateKey: todayKey,
    startDateKey: utcDateToDateKey(start),
    endDateKey: utcDateToDateKey(end),
    timeZone,
  };
};

export const isDriverDateInCurrentWeek = (dateKey, now = new Date(), timeZone = "Europe/Madrid") => {
  if (!dateKeyToUtcDate(String(dateKey ?? ""))) return false;
  const range = getCurrentDriverWeekRange(now, timeZone);
  return String(dateKey) >= range.startDateKey && String(dateKey) <= range.endDateKey;
};
