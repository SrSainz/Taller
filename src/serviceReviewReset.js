import { isOilAndFilterMaintenance, oilServiceIntervalKm } from "./vehicleServiceTracking.js";

export const maintenanceVehicleDetailsChangedEvent = "sobre-ruedas:maintenance-vehicle-details-changed";

export function requestServiceReviewReset({ recordType, fields, plate, confirm, prompt }) {
  if (!isOilAndFilterMaintenance({ recordType, fields })) return null;
  if (!confirm(`La factura de ${plate} contiene mantenimiento, revisión, aceite o filtros. ¿Quieres restablecer los kilómetros de revisión?`)) return { serviceCounterReset: false };
  const value = prompt("Kilómetros que deben quedar hasta la próxima revisión (puedes indicar 0):", String(oilServiceIntervalKm));
  if (value === null) return { serviceCounterReset: false };
  const text = String(value).trim().replace(/\s/g, "");
  const interval = Number(/^\d{1,3}(\.\d{3})+$/.test(text) ? text.replace(/\./g, "") : text.replace(",", "."));
  if (!text || !Number.isFinite(interval) || interval < 0 || !Number.isInteger(interval)) throw new Error("Indica un número entero de kilómetros igual o mayor que cero para la revisión.");
  return { serviceCounterReset: true, serviceIntervalKm: interval };
}
