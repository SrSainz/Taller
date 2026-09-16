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

/**
 * Drivers can edit the complete current calendar month and the complete
 * immediately preceding month. Older months and future dates stay read-only.
 */
export const getDriverEditableMonthRange = (now = new Date(), timeZone = "Europe/Madrid") => {
  const todayDateKey = dateKeyFromTimeZone(now, timeZone);
  const today = dateKeyToUtcDate(todayDateKey) ?? dateKeyToUtcDate(dateKeyFromTimeZone(new Date(), timeZone));
  const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
  return {
    todayDateKey,
    startDateKey: utcDateToDateKey(start),
    endDateKey: utcDateToDateKey(end),
    timeZone,
  };
};

// Compatibility alias for older imports; the returned range is month-based.
export const getDriverEditableWeekRange = getDriverEditableMonthRange;

export const isDriverDateInEditableWindow = (dateKey, now = new Date(), timeZone = "Europe/Madrid") => {
  if (!dateKeyToUtcDate(String(dateKey ?? ""))) return false;
  const range = getDriverEditableMonthRange(now, timeZone);
  return String(dateKey) >= range.startDateKey && String(dateKey) <= range.endDateKey;
};
