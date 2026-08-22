export const vehicleOrder = Object.freeze([
  "5043 MLC",
  "5750 MJV",
  "5754 MJV",
  "0344 LCP",
  "9401 LTG",
]);

export const vehicleOwnerByPlate = Object.freeze({
  "5043 MLC": Object.freeze({ name: "David Díaz Muñoz", initials: "DM", dni: "504-446-50S", location: "Sevilla" }),
  "5750 MJV": Object.freeze({ name: "Aida Díaz Pérez", initials: "ADP", dni: "01-93-803-7B", location: "Burgos" }),
  "5754 MJV": Object.freeze({ name: "Aida Pérez Salt", initials: "APS", dni: "500-944-52S" }),
});

const plateAliases = Object.freeze({
  "3456 HTR": "0344 LCP",
  "7890 GYL": "9401 LTG",
});

const normalizePlateKey = (value) => String(value ?? "")
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .toLocaleUpperCase("es")
  .replace(/[^A-Z0-9]/g, "");

const canonicalPlateByKey = Object.freeze(Object.fromEntries([
  ...vehicleOrder,
  ...Object.keys(plateAliases),
].map((plate) => [normalizePlateKey(plate), plateAliases[plate] ?? plate])));

export const canonicalizeVehiclePlate = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const canonical = canonicalPlateByKey[normalizePlateKey(raw)];
  if (canonical) return canonical;
  return raw.toLocaleUpperCase("es").replace(/\s+/g, " ").trim();
};

export const getVehicleOwner = (vehicleOrPlate) => {
  const plate = typeof vehicleOrPlate === "string" ? vehicleOrPlate : vehicleOrPlate?.plate;
  return vehicleOrPlate?.owner ?? vehicleOwnerByPlate[canonicalizeVehiclePlate(plate)] ?? null;
};
