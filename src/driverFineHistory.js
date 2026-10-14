export function getDriverFineHistory(fines, driverId) {
  if (!driverId) return [];
  return (Array.isArray(fines) ? fines : [])
    .filter((fine) => fine.driver_id === driverId)
    .sort((left, right) => String(right.fine_date ?? "").localeCompare(String(left.fine_date ?? ""))
      || String(right.created_at ?? "").localeCompare(String(left.created_at ?? "")));
}

export function isValidFineDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""))) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
