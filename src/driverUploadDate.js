const ISO_DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const asDateKey = (value) => {
  const candidate = String(value ?? "").trim();
  return ISO_DATE_KEY.test(candidate) ? candidate : "";
};

/**
 * Returns the local calendar date, rather than the UTC date. This keeps a
 * capture made around midnight associated with the day shown on the device.
 */
export const getDriverDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * A driver document starts on the date of the capture/upload. A date only
 * wins over that default when the driver deliberately edits it in review.
 */
export const resolveDriverUploadDate = ({ captureDate = "", intentionalDate = "", now = new Date() } = {}) => (
  asDateKey(intentionalDate) || asDateKey(captureDate) || getDriverDateKey(now)
);
