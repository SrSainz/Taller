const ISO_DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const EARLY_MORNING_DRIVER_KEYS = new Set(["alex", "amin", "fernando"]);
const DRIVER_UPLOAD_CATEGORIES = new Set([
  "billing",
  "billing_daily",
  "consumption",
  "fuel",
  "fuel_receipt",
  "mileage",
  "daily-km",
  "total-km",
  "kilometraje diario",
  "kilometraje total",
  "km diarios",
  "km acumulados",
]);

const asDateKey = (value) => {
  const candidate = String(value ?? "").trim();
  return ISO_DATE_KEY.test(candidate) ? candidate : "";
};

const normalizeDriverKey = (value) => String(value ?? "")
  .trim()
  .toLocaleLowerCase("es")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .split(/\s+/)[0];

const asValidDate = (value) => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (value === null || value === undefined || value === "") return null;
  const candidate = new Date(value);
  return Number.isNaN(candidate.getTime()) ? null : candidate;
};

const previousDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (![year, month, day].every(Number.isFinite)) return dateKey;
  const previous = new Date(year, month - 1, day, 12, 0, 0, 0);
  previous.setDate(previous.getDate() - 1);
  return getDriverDateKey(previous);
};

/**
 * Returns the local calendar date, rather than the UTC date. This keeps a
 * capture made around midnight associated with the day shown on the device.
 */
export const getDriverDateKey = (date = new Date()) => {
  const localDate = asValidDate(date) ?? new Date();
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * A driver document starts on the date of the capture/upload. A date only
 * wins over that default when the driver deliberately edits it in review.
 * Alex, Amin and Fernando work with a night shift: captures made locally
 * between 00:00 (inclusive) and 09:00 (exclusive) belong to the previous
 * operating day. The rule is deliberately limited to driver document
 * categories and to those three drivers; all other uploads remain unchanged.
 */
export const resolveDriverUploadDate = ({
  captureDate = "",
  captureAt = null,
  intentionalDate = "",
  driverName = "",
  category = "",
  recordType = "",
  now = new Date(),
} = {}) => {
  const explicitDate = asDateKey(intentionalDate);
  if (explicitDate) return explicitDate;

  const captureMoment = asValidDate(captureAt) ?? asValidDate(now) ?? new Date();
  const dateKey = asDateKey(captureDate) || getDriverDateKey(captureMoment);
  const categoryKey = String(recordType || category || "").trim().toLocaleLowerCase("es");
  const isDriverDocument = DRIVER_UPLOAD_CATEGORIES.has(categoryKey);
  const isEarlyMorningDriver = EARLY_MORNING_DRIVER_KEYS.has(normalizeDriverKey(driverName));

  if (isDriverDocument && isEarlyMorningDriver && captureMoment.getHours() < 9) {
    return previousDateKey(dateKey);
  }
  return dateKey;
};
