import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconAlertTriangle,
  IconBrandUber,
  IconBell,
  IconBrandWhatsapp,
  IconBriefcase,
  IconBuildingStore,
  IconCalendar,
  IconCamera,
  IconCar,
  IconChartBar,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCircleCheck,
  IconClock,
  IconCurrencyEuro,
  IconDownload,
  IconFileInvoice,
  IconGasStation,
  IconGauge,
  IconHelpCircle,
  IconHistory,
  IconHome,
  IconKey,
  IconMail,
  IconMenu2,
  IconMessageCircle,
  IconPlus,
  IconRefresh,
  IconRobot,
  IconSearch,
  IconSettings,
  IconShieldCheck,
  IconSparkles,
  IconTool,
  IconTools,
  IconTrash,
  IconUpload,
  IconUserCircle,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const BILLING_COLOR = "#7bc887";
const MAINTENANCE_COLOR = "#f39c12";
const chartMetricOptions = [
  { value: "summary", label: "Resumen" },
  { value: "billing", label: "Facturación" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "fuel", label: "Combustible" },
  { value: "net", label: "Neto" },
];

const selectableChartMetrics = chartMetricOptions.filter((option) => option.value !== "summary");
const allChartMetricValues = selectableChartMetrics.map((option) => option.value);
const chartMetricColors = { billing: BILLING_COLOR, maintenance: MAINTENANCE_COLOR, fuel: "#df4538", net: "#28923c" };

const navItems = [
  { label: "Informes", slug: "informes", icon: IconChartBar },
  { label: "Vehículos", slug: "flota", icon: IconCar },
  { label: "Lecturas", slug: "lecturas", icon: IconGauge, badge: 2 },
  { label: "Facturas", slug: "facturas", icon: IconFileInvoice, badge: 3 },
  { label: "Automatizaciones", slug: "automatizaciones", icon: IconRobot },
];

const conductorNavItem = { label: "Conductores", slug: "conductores", icon: IconUsers };

const fleetSubItems = [
  { label: "Mantenimiento", slug: "mantenimiento", icon: IconTools },
  { label: "Gasolina", slug: "gasolina", icon: IconGasStation },
];

const utilityItems = [
  { label: "Ajustes", slug: "ajustes", icon: IconSettings },
  { label: "Ayuda", slug: "ayuda", icon: IconHelpCircle },
];

const topbarItems = [navItems[4], ...utilityItems];

const vehicleOrder = ["5043 MLC", "5750 MJV", "5754 MJV", "0344 LCP", "9401 LTG"];
const vehicleBrandLogos = {
  Toyota: "/brands/toyota.svg",
  Lexus: "/brands/lexus.svg",
  Peugeot: "/brands/peugeot.svg",
};

const vehiclesSeed = [
  {
    plate: "5754 MJV",
    model: "Toyota Corolla",
    use: "Profesional",
    drivers: ["Carlos", "Fernando"],
    odometer: 128460,
    nextServiceKm: 134000,
    serviceDate: "12 ago 2026",
    fuelSchedule: [
      { label: "04:00–16:00", driver: "Carlos", start: 4, end: 16 },
      { label: "16:00–04:00", driver: "Fernando", start: 16, end: 4 },
    ],
    monthlyFuel: [
      { date: "28 jul 2026", time: "16:12", liters: 18.4, cost: 31.28 },
      { date: "28 jul 2026", time: "05:55", liters: 20.1, cost: 34.17 },
      { date: "25 jul 2026", time: "16:20", liters: 18.9, cost: 32.13 },
      { date: "25 jul 2026", time: "05:48", liters: 19.8, cost: 33.66 },
      { date: "21 jul 2026", time: "16:06", liters: 18.2, cost: 30.94 },
      { date: "21 jul 2026", time: "05:51", liters: 20.4, cost: 34.68 },
      { date: "17 jul 2026", time: "16:18", liters: 17.8, cost: 30.26 },
      { date: "17 jul 2026", time: "05:44", liters: 20.2, cost: 34.34 },
      { date: "12 jul 2026", time: "16:09", liters: 18.7, cost: 31.79 },
      { date: "12 jul 2026", time: "05:57", liters: 19.6, cost: 33.32 },
    ],
    shifts: [
      { id: "kxd-t2", label: "Turno 16:00–04:00", driver: "Fernando", time: "16:00–04:00", start: 128310, end: 128460, km: 150, liters: 18.4, cost: 31.28, revenue: 418.2, cash: 76, monthRevenue: 7954.3, monthTrips: 136, sentAt: "04:08", confidence: 98 },
      { id: "kxd-t1", label: "Turno 04:00–16:00", driver: "Carlos", time: "04:00–16:00", start: 128142, end: 128310, km: 168, liters: 20.1, cost: 34.17, revenue: 462.8, cash: 128.5, monthRevenue: 8240.5, monthTrips: 142, sentAt: "16:05", confidence: 99 },
    ],
    maintenance: [
      { date: "18 jul 2026", km: 127820, concept: "Aceite y filtros", amount: 286.4 },
      { date: "3 abr 2026", km: 121220, concept: "Pastillas de freno", amount: 342.8 },
      { date: "9 ene 2026", km: 116050, concept: "Aceite y filtros", amount: 274.2 },
    ],
  },
  {
    plate: "5750 MJV",
    model: "Toyota Corolla",
    use: "Profesional",
    drivers: ["Tirso", "Alex"],
    odometer: 142980,
    nextServiceKm: 150000,
    serviceDate: "18 ago 2026",
    fuelSchedule: [
      { label: "06:00–18:00", driver: "Tirso", start: 6, end: 18 },
      { label: "18:00–06:00", driver: "Alex", start: 18, end: 6 },
    ],
    monthlyFuel: [
      { date: "28 jul 2026", time: "18:14", liters: 16.8, cost: 28.56 },
      { date: "28 jul 2026", time: "06:08", liters: 17.4, cost: 29.58 },
      { date: "24 jul 2026", time: "18:19", liters: 17.1, cost: 29.07 },
      { date: "24 jul 2026", time: "06:11", liters: 18.2, cost: 30.94 },
      { date: "20 jul 2026", time: "18:07", liters: 16.5, cost: 28.05 },
      { date: "20 jul 2026", time: "06:02", liters: 17.9, cost: 30.43 },
      { date: "16 jul 2026", time: "18:21", liters: 16.9, cost: 28.73 },
      { date: "16 jul 2026", time: "06:16", liters: 18.1, cost: 30.77 },
      { date: "11 jul 2026", time: "18:05", liters: 17.3, cost: 29.41 },
      { date: "11 jul 2026", time: "06:13", liters: 17.8, cost: 30.26 },
    ],
    shifts: [
      { id: "lpt-t2", label: "Turno 18:00–06:00", driver: "Alex", time: "18:00–06:00", start: 142842, end: 142980, km: 138, liters: 16.8, cost: 28.56, revenue: 435.2, cash: 110, monthRevenue: 8126.4, monthTrips: 139, sentAt: "06:05", confidence: 97 },
      { id: "lpt-t1", label: "Turno 06:00–18:00", driver: "Tirso", time: "06:00–18:00", start: 142704, end: 142842, km: 138, liters: 17.4, cost: 29.58, revenue: 390.5, cash: 90, monthRevenue: 7318.8, monthTrips: 128, sentAt: "18:04", confidence: 99 },
    ],
    maintenance: [
      { date: "5 jul 2026", km: 140410, concept: "Neumáticos delanteros", amount: 498 },
      { date: "21 mar 2026", km: 132900, concept: "Aceite y filtros", amount: 318.6 },
      { date: "8 dic 2025", km: 124480, concept: "Neumáticos delanteros", amount: 472 },
    ],
  },
  {
    plate: "5043 MLC",
    model: "Toyota Corolla",
    use: "Profesional",
    drivers: ["Mauricio", "Amin"],
    odometer: 210735,
    nextServiceKm: 215000,
    serviceDate: "2 ago 2026",
    fuelSchedule: [
      { label: "07:00–19:00", driver: "Mauricio", start: 7, end: 19 },
      { label: "19:00–07:00", driver: "Amin", start: 19, end: 7 },
    ],
    monthlyFuel: [
      { date: "28 jul 2026", time: "19:12", liters: 19.2, cost: 32.64 },
      { date: "28 jul 2026", time: "07:18", liters: 12.4, cost: 21.08 },
      { date: "24 jul 2026", time: "19:09", liters: 18.8, cost: 31.96 },
      { date: "24 jul 2026", time: "07:11", liters: 13.1, cost: 22.27 },
      { date: "20 jul 2026", time: "19:17", liters: 19.5, cost: 33.15 },
      { date: "20 jul 2026", time: "07:06", liters: 12.8, cost: 21.76 },
      { date: "15 jul 2026", time: "19:04", liters: 18.9, cost: 32.13 },
      { date: "15 jul 2026", time: "07:21", liters: 13.4, cost: 22.78 },
      { date: "10 jul 2026", time: "19:15", liters: 19.1, cost: 32.47 },
      { date: "10 jul 2026", time: "07:09", liters: 12.7, cost: 21.59 },
    ],
    shifts: [
      { id: "jbv-t2", label: "Turno 19:00–07:00", driver: "Amin", time: "19:00–07:00", start: 210614, end: 210735, km: 121, liters: 19.2, cost: 32.64, revenue: 402.75, cash: 122, monthRevenue: 7542.9, monthTrips: 130, sentAt: "07:03", confidence: 96, alert: true },
      { id: "jbv-t1", label: "Turno 07:00–19:00", driver: "Mauricio", time: "07:00–19:00", start: 210494, end: 210614, km: 120, liters: 12.4, cost: 21.08, revenue: 376.4, cash: 84.5, monthRevenue: 6984.25, monthTrips: 121, sentAt: "19:02", confidence: 98 },
    ],
    maintenance: [
      { date: "24 jul 2026", km: 210120, concept: "Aceite y filtros", amount: 312.5 },
      { date: "10 abr 2026", km: 202440, concept: "Pastillas de freno", amount: 438 },
      { date: "14 ene 2026", km: 194860, concept: "Aceite y filtros", amount: 298.9 },
      { date: "3 oct 2025", km: 187020, concept: "Correa de distribución", amount: 986.4 },
    ],
  },
  {
    plate: "0344 LCP",
    model: "Lexus IS 300h",
    use: "Particular",
    drivers: ["Ana García", "David García"],
    odometer: 98215,
    nextServiceKm: 105000,
    serviceDate: "22 ago 2026",
    daily: [
      { driver: "Ana García", km: 21, liters: 0, cost: 0, revenue: 0, cash: 0, monthRevenue: 0, monthTrips: 0, time: "08:12–13:20" },
      { driver: "David García", km: 13, liters: 25.1, cost: 42.67, revenue: 0, cash: 0, monthRevenue: 0, monthTrips: 0, time: "17:40–19:05" },
    ],
    monthlyFuel: [
      { date: "26 jul 2026", time: "17:42", liters: 25.1, cost: 42.67, driver: "David García" },
      { date: "11 jul 2026", time: "08:20", liters: 23.4, cost: 39.78, driver: "Ana García" },
    ],
    shifts: [],
    maintenance: [
      { date: "12 jun 2026", km: 95310, concept: "Aceite y filtros", amount: 224.8 },
      { date: "16 ene 2026", km: 88240, concept: "Neumáticos traseros", amount: 386 },
      { date: "2 sep 2025", km: 81120, concept: "Aceite y filtros", amount: 216.5 },
    ],
  },
  {
    plate: "9401 LTG",
    model: "Peugeot 2008",
    use: "Particular",
    drivers: ["Sergio Ruiz", "María Ruiz"],
    odometer: 75840,
    nextServiceKm: 80000,
    serviceDate: "6 ago 2026",
    daily: [
      { driver: "Sergio Ruiz", km: 11, liters: 0, cost: 0, revenue: 0, cash: 0, monthRevenue: 0, monthTrips: 0, time: "09:05–12:16" },
      { driver: "María Ruiz", km: 7, liters: 18.3, cost: 30.92, revenue: 0, cash: 0, monthRevenue: 0, monthTrips: 0, time: "18:10–19:02" },
    ],
    monthlyFuel: [
      { date: "23 jul 2026", time: "18:15", liters: 18.3, cost: 30.92, driver: "María Ruiz" },
      { date: "7 jul 2026", time: "09:12", liters: 17.6, cost: 29.74, driver: "Sergio Ruiz" },
    ],
    shifts: [],
    maintenance: [
      { date: "28 may 2026", km: 72110, concept: "Aceite y filtros", amount: 198.6 },
      { date: "4 feb 2026", km: 66390, concept: "Batería", amount: 164.9 },
      { date: "20 oct 2025", km: 59800, concept: "Aceite y filtros", amount: 192.3 },
    ],
  },
];

const invoiceSeed = [
  {
    id: "FAC-2026-1874",
    date: "24 jul 2026",
    provider: "Taller AutoRápido S.L.",
    plate: "5043 MLC",
    concept: "Aceite y filtros",
    amount: 312.5,
    source: "Correo",
    status: "Asociada",
    items: [
      { concept: "Aceite motor 5W30", amount: 96.5 },
      { concept: "Filtro de aceite", amount: 24 },
      { concept: "Filtro de aire", amount: 38 },
      { concept: "Mano de obra", amount: 154 },
    ],
  },
  { id: "FAC-2026-1842", date: "18 jul 2026", provider: "Mecánica Norte", plate: "5754 MJV", concept: "Aceite y filtros", amount: 286.4, source: "Correo", status: "Asociada" },
  { id: "FAC-2026-1798", date: "5 jul 2026", provider: "Neumáticos Central", plate: "5750 MJV", concept: "Neumáticos delanteros", amount: 498, source: "Correo", status: "Revisar" },
  { id: "FAC-2026-1761", date: "12 jun 2026", provider: "Lexus Service", plate: "0344 LCP", concept: "Aceite y filtros", amount: 224.8, source: "Manual", status: "Asociada" },
  { id: "FAC-2026-1684", date: "28 may 2026", provider: "Peugeot Madrid", plate: "9401 LTG", concept: "Aceite y filtros", amount: 198.6, source: "Correo", status: "Pendiente" },
];

const maintenanceConceptRows = [
  { label: "Aceite y filtro", matches: ["aceite y filtro", "aceite motor", "filtro de aceite"] },
  { label: "Filtro habitáculo", matches: ["filtro habitaculo", "filtro de polen"] },
  { label: "Filtro de aire", matches: ["filtro de aire"] },
  { label: "Neumáticos", matches: ["neumatico", "rueda"] },
  { label: "Pastillas de freno", matches: ["pastilla de freno", "pastillas de freno"] },
  { label: "Discos de freno", matches: ["disco de freno", "discos de freno"] },
  { label: "Transmisión", matches: ["transmision"] },
  { label: "Bomba de agua", matches: ["bomba de agua"] },
  { label: "Bujías", matches: ["bujia"] },
  { label: "Aceite de caja de cambios", matches: ["aceite de caja", "aceite caja"] },
  { label: "Limpiaparabrisas", matches: ["limpiaparabrisas", "escobilla"] },
  { label: "Fundas de asientos", matches: ["funda de asiento", "fundas de asientos"] },
  { label: "Varios", matches: ["varios", "otros"] },
];

const photoInvoiceStorageKey = "talleria:photo-invoices:v1";
const migratedPlates = { "3456 HTR": "0344 LCP", "7890 GYL": "9401 LTG" };

const loadPhotoInvoices = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(photoInvoiceStorageKey) ?? "[]");
    return Array.isArray(stored)
      ? stored.filter((invoice) => invoice?.id && invoice?.plate && Array.isArray(invoice?.items)).map((invoice) => ({ ...invoice, plate: migratedPlates[invoice.plate] ?? invoice.plate }))
      : [];
  } catch {
    return [];
  }
};

const expenseCategories = [
  { label: "Leasing coche", cadence: "Mensual" },
  { label: "Préstamo licencia", cadence: "Mensual" },
  { label: "Gasolina", cadence: "Variable" },
  { label: "Taller", cadence: "Variable" },
  { label: "Seguridad Social", cadence: "Mensual" },
  { label: "Nómina", cadence: "Mensual" },
  { label: "Comisiones conductor", cadence: "Variable" },
  { label: "Impuestos trimestrales", cadence: "Trimestral" },
  { label: "IVA intracomunitario", cadence: "Trimestral" },
  { label: "Seguro", cadence: "Anual" },
  { label: "Limpieza coche", cadence: "Variable" },
  { label: "Varios", cadence: "Variable" },
];

const vehicleExpenseAmounts = {
  "5754 MJV": [780, 450, 1280.42, 286.4, 390, 1650, 824.05, 1860, 85, 870, 95, 120],
  "5750 MJV": [895, 450, 1136.28, 498, 390, 1650, 812.64, 1740, 92, 940, 110, 164.8],
  "5043 MLC": [820, 450, 1054.72, 312.5, 390, 1650, 754.29, 1695, 78, 905, 98, 98.5],
  "0344 LCP": [420, 0, 185.34, 224.8, 0, 0, 0, 0, 0, 540, 40, 60],
  "9401 LTG": [0, 310, 142.18, 198.6, 0, 0, 0, 0, 0, 495, 35, 44.9],
};

const reportMonths = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const reportMonthTokens = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const fuelPeriodSuffixPattern = /\b[a-záéíóú]{3}\s+\d{4}$/i;
const reportYears = [2025, 2026];
const reportSeasonality = [0.82, 0.87, 0.94, 0.91, 0.98, 1.03, 1, 0.96, 1.05, 1.02, 0.93, 0.79];
const getReportPeriodFactor = (month, year) => reportSeasonality[month] * (year === 2026 ? 1 : 0.9);
const calendarWeekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const getDriverBillingDays = (driver, plate, month, year, monthlyRevenue) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const seed = `${driver}-${plate}-${month}-${year}`.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const billableDays = Array.from({ length: daysInMonth }, (_, index) => index + 1).filter((day) => {
    const weekday = new Date(year, month, day).getDay();
    return weekday !== 0 && (day + seed) % 11 !== 0;
  });
  const totalCents = Math.round(monthlyRevenue * 100);
  const weights = billableDays.map((day) => 80 + ((seed + day * 17) % 71));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let assignedCents = 0;

  return new Map(billableDays.map((day, index) => {
    const cents = index === billableDays.length - 1
      ? totalCents - assignedCents
      : Math.floor((totalCents * weights[index]) / totalWeight);
    assignedCents += cents;
    return [day, cents / 100];
  }));
};
const getMaintenanceAmountForPeriod = (vehicle, month, year) => vehicle.maintenance
  .filter((item) => {
    const date = new Date(getMaintenanceDateValue(item));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month;
  })
  .reduce((sum, item) => sum + item.amount, 0);

const readingSeed = [
  { id: "LEC-4381", time: "Hoy · 04:08", driver: "Fernando", plate: "5754 MJV", total: 128460, daily: 150, confidence: 98, status: "Validada" },
  { id: "LEC-4380", time: "Hoy · 07:03", driver: "Amin", plate: "5043 MLC", total: 210735, daily: 121, confidence: 96, status: "Revisar" },
  { id: "LEC-4379", time: "Hoy · 06:05", driver: "Alex", plate: "5750 MJV", total: 142980, daily: 138, confidence: 97, status: "Validada" },
  { id: "LEC-4378", time: "Hoy · 19:05", driver: "David García", plate: "0344 LCP", total: 98215, daily: 13, confidence: 92, status: "Revisar" },
  { id: "LEC-4377", time: "Hoy · 16:05", driver: "Carlos", plate: "5754 MJV", total: 128310, daily: 168, confidence: 99, status: "Validada" },
  { id: "LEC-4376", time: "Hoy · 19:02", driver: "Mauricio", plate: "5043 MLC", total: 210614, daily: 120, confidence: 98, status: "Validada" },
];

const formatKm = (value) => `${new Intl.NumberFormat("es-ES").format(value)} km`;
const formatCurrency = (value) => `${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const formatShortCurrency = (value) => `${Math.round(value).toLocaleString("es-ES")} €`;
const normalizeText = (value = "") => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");
const maintenanceMonths = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };
const getVehicleBrand = (vehicle) => vehicle.model.split(" ")[0];
const getMaintenanceDateValue = (item) => {
  if (item.dateIso) return Date.parse(item.dateIso);
  const [day, month, year] = normalizeText(item.date).split(/\s+/);
  return Date.UTC(Number(year), maintenanceMonths[month] ?? 0, Number(day));
};
const getFuelEntryDateValue = (entry) => {
  const [day, month, year] = normalizeText(entry.date).split(/\s+/);
  const [hour = 0, minute = 0] = (entry.time ?? "").split(":").map(Number);
  return Date.UTC(Number(year), maintenanceMonths[month] ?? 0, Number(day), hour, minute);
};
const formatMaintenanceDate = (item) => {
  const date = new Date(getMaintenanceDateValue(item));
  return `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCDate()).padStart(2, "0")}`;
};
const getMaintenanceInvoice = (item, vehicle, invoices) => invoices.find((invoice) => invoice.id === item.invoiceId)
  ?? invoices.find((invoice) => invoice.plate === vehicle.plate
    && normalizeText(invoice.date) === normalizeText(item.date)
    && normalizeText(invoice.concept) === normalizeText(item.concept));
const matchesMaintenanceConcept = (value, matches) => {
  const normalized = normalizeText(value);
  return matches.some((match) => normalized.includes(normalizeText(match)));
};
const getDriverDay = (vehicle, driver) => {
  const driverShifts = vehicle.shifts.filter((shift) => shift.driver === driver);
  if (driverShifts.length > 1) {
    return driverShifts.reduce((summary, shift) => ({
      ...summary,
      km: summary.km + shift.km,
      liters: summary.liters + shift.liters,
      cost: summary.cost + shift.cost,
      revenue: summary.revenue + shift.revenue,
      cash: summary.cash + shift.cash,
      monthRevenue: summary.monthRevenue + shift.monthRevenue,
      monthTrips: summary.monthTrips + shift.monthTrips,
      confidence: Math.min(summary.confidence, shift.confidence),
    }), { driver, km: 0, liters: 0, cost: 0, revenue: 0, cash: 0, monthRevenue: 0, monthTrips: 0, time: `${driverShifts.length} turnos registrados`, sentAt: driverShifts[0].sentAt, confidence: 100 });
  }
  return driverShifts[0] ??
    vehicle.daily?.find((entry) => entry.driver === driver) ??
    { driver, km: 0, liters: 0, cost: 0, revenue: 0, cash: 0, monthRevenue: 0, monthTrips: 0, time: "Sin actividad" };
};
const getFuelAssignment = (vehicle, entry) => {
  if (entry.driver) return { driver: entry.driver, label: "Registro manual" };
  const hour = Number(entry.time?.split(":")[0]);
  return vehicle.fuelSchedule?.find((shift) =>
    shift.start < shift.end
      ? hour >= shift.start && hour < shift.end
      : hour >= shift.start || hour < shift.end
  ) ?? { driver: "Sin asignar", label: "Fuera de turno" };
};

const getDriverFuelEntriesForPeriod = (vehicle, driver, month, year) => {
  const periodFactor = getReportPeriodFactor(month, year);
  return (vehicle.monthlyFuel ?? [])
    .map((entry) => ({
      ...entry,
      date: entry.date.replace(fuelPeriodSuffixPattern, `${reportMonthTokens[month]} ${year}`),
      liters: Number(((entry.liters ?? 0) * periodFactor).toFixed(2)),
      cost: Number(((entry.cost ?? 0) * periodFactor).toFixed(2)),
    }))
    .filter((entry) => getFuelAssignment(vehicle, entry).driver === driver);
};

const distributeInteger = (total, keys, seed) => {
  const result = new Map(keys.map((key) => [key, 0]));
  if (!keys.length || total <= 0) return result;
  const weights = keys.map((key) => 50 + ((seed + key * 13) % 50));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let assigned = 0;
  keys.forEach((key, index) => {
    const value = index === keys.length - 1 ? total - assigned : Math.floor((total * weights[index]) / totalWeight);
    result.set(key, value);
    assigned += value;
  });
  return result;
};

const getDriverCalendarRows = (vehicle, row, month, year) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const billingDays = getDriverBillingDays(row.driver, row.plate, month, year, row.revenue);
  const billingDayKeys = [...billingDays.keys()];
  const seed = `${row.driver}-${row.plate}-${month}-${year}`.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const tripsByDay = distributeInteger(row.trips, billingDayKeys, seed);
  const activity = getDriverDay(vehicle, row.driver);
  const baseKm = Math.max(1, activity.km || 120);
  const fuelByDay = new Map();
  getDriverFuelEntriesForPeriod(vehicle, row.driver, month, year).forEach((entry) => {
    const day = Number(entry.date.split(" ")[0]);
    fuelByDay.set(day, [...(fuelByDay.get(day) ?? []), entry]);
  });
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const billing = billingDays.get(day) ?? 0;
    const fuelEntries = fuelByDay.get(day) ?? [];
    const km = billing > 0 ? Math.max(1, Math.round(baseKm * (0.86 + ((seed + day * 7) % 27) / 100))) : 0;
    const fuelLiters = fuelEntries.reduce((sum, entry) => sum + entry.liters, 0);
    const fuelCost = fuelEntries.reduce((sum, entry) => sum + entry.cost, 0);
    const totalKm = km > 0 ? Math.max(0, vehicle.odometer - Math.round((daysInMonth - day) * baseKm * .65)) : 0;
    return {
      day,
      billing,
      trips: tripsByDay.get(day) ?? 0,
      km,
      totalKm,
      fuelEntries,
      fuelLiters,
      fuelCost,
      active: billing > 0 || fuelEntries.length > 0,
    };
  });
};

const navFromHash = () => {
  const slug = window.location.hash.replace(/^#\/?/, "");
  if (slug === "gasolina") return "Vehículos";
  return [...navItems, conductorNavItem, ...fleetSubItems, ...utilityItems].find((item) => item.slug === slug)?.label ?? "Informes";
};

const isStandaloneApp = () => window.matchMedia("(display-mode: standalone)").matches || Boolean(window.navigator.standalone);

const initialAppNav = () => {
  if (isStandaloneApp() || !window.location.hash) {
    window.history.replaceState(null, "", "#/informes");
    return "Informes";
  }
  return navFromHash();
};

function UseBadge({ value }) {
  const Icon = value === "Profesional" ? IconBriefcase : IconHome;
  return <span className={`use-badge use-badge--${value.toLowerCase()}`}><Icon size={13} />{value}</span>;
}

function StatusBadge({ status }) {
  const statusClass = status.toLowerCase().replace(" ", "-");
  return <span className={`status-badge status-badge--${statusClass}`}><i />{status}</span>;
}

function PageIntro({ eyebrow, title, description, action }) {
  return (
    <header className="page-intro">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone = "green" }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span className="metric-card__icon"><Icon size={20} /></span>
      <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
    </article>
  );
}

function BottomNavigation({ onHome, onProfile, homeActive }) {
  return (
    <nav className="bottom-navigation" aria-label="Navegación inferior">
      <button type="button" className={`bottom-navigation__item${homeActive ? " bottom-navigation__item--active" : ""}`} onClick={onHome} aria-label="Ir a la página principal" aria-current={homeActive ? "page" : undefined} title="Página principal"><IconHome size={21} /></button>
      <button type="button" className="bottom-navigation__add" aria-label="Añadir" title="Añadir"><IconPlus size={24} /></button>
      <button type="button" className="bottom-navigation__item" onClick={onProfile} aria-label="Abrir perfil de usuario" title="Perfil de usuario"><IconUserCircle size={21} /></button>
    </nav>
  );
}

function QuickActionMenu({ step, category, onCategory, onAction }) {
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const [permissionSource, setPermissionSource] = useState("");
  useEffect(() => {
    if (step !== "sources") setPermissionSource("");
  }, [step]);
  const handleSource = (source) => {
    setPermissionSource(source);
  };
  const allowSource = () => {
    const source = permissionSource;
    const input = source === "camera" ? cameraInputRef.current : uploadInputRef.current;
    setPermissionSource("");
    if (input) {
      input.value = "";
      input.click();
    }
  };
  const handleFile = (event, source) => {
    const file = event.target.files?.[0];
    if (file) onAction({ category, source, file });
    event.target.value = "";
  };

  if (!step) return null;
  return (
    <div className={`bottom-navigation__quick-menu bottom-navigation__quick-menu--${step}${permissionSource ? " bottom-navigation__quick-menu--permission" : ""}`} role={permissionSource ? "dialog" : "menu"} aria-modal={permissionSource ? "true" : undefined} aria-labelledby={permissionSource ? "quick-permission-title" : undefined} aria-label={permissionSource ? undefined : step === "categories" ? "Seleccionar tipo de registro" : "Seleccionar origen del archivo"}>
      {step === "categories" ? (
        <div className="bottom-navigation__quick-options bottom-navigation__quick-options--categories">
          <button type="button" role="menuitem" className="bottom-navigation__quick-option bottom-navigation__quick-option--billing" onClick={() => onCategory("billing")}><IconFileInvoice size={21} /><span>Facturación</span></button>
          <button type="button" role="menuitem" className="bottom-navigation__quick-option bottom-navigation__quick-option--fuel" onClick={() => onCategory("consumption")}><IconGasStation size={21} /><span>Consumo</span></button>
        </div>
      ) : permissionSource ? (
        <div className="bottom-navigation__permission" aria-live="polite">
          <span className="bottom-navigation__permission-icon">{permissionSource === "camera" ? <IconCamera size={22} /> : <IconUpload size={22} />}</span>
          <strong id="quick-permission-title">¿Permites el acceso a {permissionSource === "camera" ? "la cámara" : "tus fotos y archivos"}?</strong>
          <p>{permissionSource === "camera" ? "Necesitamos la cámara para tomar una foto desde la aplicación." : "Necesitamos acceder al álbum para que puedas elegir una foto o un archivo."}</p>
          <div className="bottom-navigation__permission-actions">
            <button type="button" className="secondary-button" onClick={() => setPermissionSource("")}>Cancelar</button>
            <button type="button" className="primary-button" onClick={allowSource}>Permitir</button>
          </div>
        </div>
      ) : (
        <div className="bottom-navigation__quick-options bottom-navigation__quick-options--sources">
          <button type="button" role="menuitem" className="bottom-navigation__quick-option" onClick={() => handleSource("camera")}><IconCamera size={19} /><span>Cámara</span></button>
          <button type="button" role="menuitem" className="bottom-navigation__quick-option" onClick={() => handleSource("upload")}><IconUpload size={19} /><span>Subir archivo</span></button>
        </div>
      )}
      <input ref={cameraInputRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => handleFile(event, "camera")} />
      <input ref={uploadInputRef} className="sr-only" type="file" accept="image/*,.pdf" onChange={(event) => handleFile(event, "upload")} />
    </div>
  );
}

export function App() {
  const [activeNav, setActiveNav] = useState(initialAppNav);
  const [selectedPlate, setSelectedPlate] = useState("5043 MLC");
  const [maintenancePlate, setMaintenancePlate] = useState("5043 MLC");
  const [selectedDrivers, setSelectedDrivers] = useState({
    "5754 MJV": "Carlos",
    "5750 MJV": "Tirso",
    "5043 MLC": "Mauricio",
    "0344 LCP": "Ana García",
    "9401 LTG": "Sergio Ruiz",
  });
  const [filter, setFilter] = useState("Todos");
  const [query, setQuery] = useState("");
  const [openShift, setOpenShift] = useState("jbv-t2");
  const [inspectorTab, setInspectorTab] = useState(() => navFromHash() === "Gasolina" ? "Gasolina" : "Turnos");
  const [inspectorOpen, setInspectorOpen] = useState(() => window.innerWidth > 820 && navFromHash() !== "Gasolina");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);
  const [photoInvoices, setPhotoInvoices] = useState(loadPhotoInvoices);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [topbarMenuOpen, setTopbarMenuOpen] = useState(false);
  const [automationEnabled, setAutomationEnabled] = useState({ whatsapp: true, email: true, openai: true });
  const [openFaq, setOpenFaq] = useState(0);
  const [settings, setSettings] = useState({ company: "SOBRE RUEDAS", email: "flota@sobreruedas.es", serviceWarning: "5000", lowConfidence: "94" });
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(isStandaloneApp);
  const [homeReportTab, setHomeReportTab] = useState("General");
  const [homeChartMetric, setHomeChartMetric] = useState("summary");
  const [quickMenuStep, setQuickMenuStep] = useState("");
  const [quickMenuCategory, setQuickMenuCategory] = useState("");
  const toastTimer = useRef();

  useEffect(() => {
    const onBottomNavigationClick = (event) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(".bottom-navigation__add")) {
        setQuickMenuStep((current) => current ? "" : "categories");
        setQuickMenuCategory("");
        return;
      }
      if (quickMenuStep && !event.target.closest(".bottom-navigation__quick-menu")) setQuickMenuStep("");
    };
    document.addEventListener("click", onBottomNavigationClick);
    return () => document.removeEventListener("click", onBottomNavigationClick);
  }, [quickMenuStep]);

  useEffect(() => {
    const handleHash = () => {
      const nextNav = navFromHash();
      setActiveNav(nextNav);
      setTopbarMenuOpen(false);
      if (nextNav === "Gasolina") {
        setInspectorTab("Gasolina");
        setInspectorOpen(false);
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setModal(null);
        setNotificationsOpen(false);
        setTopbarMenuOpen(false);
        setQuickMenuStep("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!topbarMenuOpen || !(event.target instanceof Element)) return;
      if (!event.target.closest(".topbar-management-menu, .topbar-menu-button")) setTopbarMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [topbarMenuOpen]);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const onInstallAvailable = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };
    const onDisplayModeChange = (event) => setIsStandalone(event.matches || Boolean(window.navigator.standalone));

    window.addEventListener("beforeinstallprompt", onInstallAvailable);
    window.addEventListener("appinstalled", onInstalled);
    displayMode.addEventListener("change", onDisplayModeChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallAvailable);
      window.removeEventListener("appinstalled", onInstalled);
      displayMode.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const invoices = useMemo(() => [...photoInvoices, ...invoiceSeed], [photoInvoices]);
  const vehicles = useMemo(() => vehiclesSeed.map((vehicle) => {
    const recordedMaintenance = photoInvoices
      .filter((invoice) => invoice.plate === vehicle.plate)
      .map((invoice) => ({
        date: invoice.date,
        dateIso: invoice.dateIso,
        km: Number(invoice.km) || vehicle.odometer,
        concept: invoice.concept,
        amount: Number(invoice.amount) || 0,
        invoiceId: invoice.id,
      }));
    return { ...vehicle, maintenance: [...recordedMaintenance, ...vehicle.maintenance] };
  }).sort((a, b) => vehicleOrder.indexOf(a.plate) - vehicleOrder.indexOf(b.plate)), [photoInvoices]);

  useEffect(() => {
    window.localStorage.setItem(photoInvoiceStorageKey, JSON.stringify(photoInvoices));
  }, [photoInvoices]);

  const selected = vehicles.find((vehicle) => vehicle.plate === selectedPlate) ?? vehicles[0];
  const selectedDriver = selectedDrivers[selected.plate] ?? selected.drivers[0];
  const selectedActivity = getDriverDay(selected, selectedDriver);
  const showInspector = activeNav === "Vehículos" && inspectorOpen;
  const detailHeaderTitle = activeNav === "Mantenimiento"
    ? "Mantenimiento"
    : activeNav === "Informes" && homeReportTab === "Facturación"
      ? "Facturación"
      : activeNav === "Informes" && homeReportTab === "Repostaje"
        ? "Combustible"
        : activeNav === "Informes" && homeReportTab === "General" && homeChartMetric === "net"
          ? "Neto"
          : "";
  const compactDetailHeader = Boolean(detailHeaderTitle);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return vehicles.filter((vehicle) => {
      const searchable = `${vehicle.plate} ${vehicle.model} ${vehicle.drivers.join(" ")} ${vehicle.maintenance.map((item) => item.concept).join(" ")}`.toLocaleLowerCase("es");
      return (!normalized || searchable.includes(normalized)) && (filter === "Todos" || vehicle.use === filter);
    });
  }, [filter, query, vehicles]);

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  };

  const savePhotoInvoice = (invoice) => {
    setPhotoInvoices((current) => [invoice, ...current.filter((item) => item.id !== invoice.id)]);
  };

  const installApplication = async () => {
    if (isStandalone) {
      notify("SOBRE RUEDAS ya está abierta como aplicación");
      return;
    }
    if (!installPrompt) {
      notify("Chrome habilitará la instalación cuando termine de comprobar la aplicación");
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    notify(choice.outcome === "accepted" ? "Instalación iniciada" : "Instalación cancelada");
  };

  const navigate = (item) => {
    setActiveNav(item.label);
    setNotificationsOpen(false);
    setTopbarMenuOpen(false);
    if (window.location.hash !== `#/${item.slug}`) window.location.hash = `/${item.slug}`;
  };

  const openGeneral = () => {
    setHomeReportTab("General");
    setHomeChartMetric("summary");
    navigate(navItems[0]);
  };

  const navigateFleetSubItem = (item) => {
    if (item.label === "Gasolina") {
      setInspectorTab("Gasolina");
      setInspectorOpen(window.innerWidth > 820);
      navigate(navItems[1]);
      return;
    }
    navigate(item);
  };

  const selectVehicle = (vehicle) => {
    const driver = selectedDrivers[vehicle.plate] ?? vehicle.drivers[0];
    const activity = getDriverDay(vehicle, driver);
    setSelectedPlate(vehicle.plate);
    setOpenShift(activity.id ?? "");
    setInspectorOpen(true);
  };

  const selectDriver = (vehicle, driver) => {
    const activity = getDriverDay(vehicle, driver);
    setSelectedDrivers((current) => ({ ...current, [vehicle.plate]: driver }));
    setSelectedPlate(vehicle.plate);
    setOpenShift(activity.id ?? "");
    if (activeNav !== "Gasolina") setInspectorTab("Turnos");
    setInspectorOpen(true);
  };

  const openWorkshop = (vehicle) => {
    setMaintenancePlate(vehicle.plate);
    navigateFleetSubItem(fleetSubItems[0]);
    window.setTimeout(() => document.getElementById("taller-vehiculo")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const openVehicleFromModule = (plate, tab = "Turnos") => {
    setSelectedPlate(plate);
    setInspectorTab(tab);
    setInspectorOpen(true);
    navigate(navItems[1]);
  };

  return (
    <div className={`app-shell ${showInspector ? "app-shell--inspector" : ""}${activeNav === "Informes" && homeReportTab === "General" ? " app-shell--dashboard" : ""}`}>
      <main className="workspace">
          <header className={`${["Informes", "Gasolina", "Vehículos", "Conductores"].includes(activeNav) ? "topbar topbar--reports" : "topbar"}${compactDetailHeader ? " topbar--detail" : ""}`}>
          <div className="topbar-title">
            <button className="workspace-home-button" onClick={openGeneral} aria-label="Abrir SOBRE RUEDAS" title="SOBRE RUEDAS · Resumen general"><picture aria-hidden="true"><source media="(max-width: 520px)" srcSet="/icons/sobre-ruedas-192.png?v=20260805" /><img src="/brand/sobre-ruedas-logo.png" alt="" /></picture></button>
            <div><span>{compactDetailHeader ? detailHeaderTitle : activeNav === "Informes" ? "SOBRE RUEDAS" : activeNav === "Conductores" ? "CONDUCTORES" : activeNav}</span>{!compactDetailHeader && <small>{activeNav === "Informes" ? "Resumen general de la flota" : activeNav === "Gasolina" ? "Control de combustible" : activeNav === "Vehículos" ? "Vehículos, facturación y consumo" : activeNav === "Conductores" ? "Facturación y consumo por conductor" : "Gestión centralizada de vehículos"}</small>}</div>
          </div>
          {!compactDetailHeader && <div className="topbar-actions">
            {!isStandalone && <button className="install-app-button" onClick={installApplication} aria-label="Instalar SOBRE RUEDAS como aplicación" title="Instalar aplicación"><IconDownload size={17} /><span>Instalar app</span></button>}
            <span className="date"><IconCalendar size={18} />28 jul 2026</span>
            <button type="button" className={`topbar-route-button topbar-route-button--facturas${activeNav === "Facturas" ? " topbar-route-button--active" : ""}`} onClick={() => navigate(navItems[3])} aria-label="Abrir Facturas" aria-current={activeNav === "Facturas" ? "page" : undefined} title="Facturas"><IconFileInvoice size={14} /><span>Facturas</span><i>3</i></button>
            <button className="bell-button" aria-label="Notificaciones" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setTopbarMenuOpen(false); }}><IconBell size={17} /><i>2</i></button>
            <button className="topbar-menu-button" aria-label="Abrir accesos de gestión" aria-expanded={topbarMenuOpen} aria-controls="topbar-management-menu" onClick={() => { setTopbarMenuOpen((value) => !value); setNotificationsOpen(false); }} title="Accesos de gestión"><IconMenu2 size={18} /></button>
            <button className="profile" onClick={() => notify("Perfil de Ana García")}><span className="avatar">AG</span><span><strong>Ana García</strong><small>Gestora de flota</small></span><IconChevronDown size={17} /></button>
          </div>}
          {!compactDetailHeader && topbarMenuOpen && (
            <aside id="topbar-management-menu" className="topbar-management-menu" aria-label="Accesos de gestión">
              {!isStandalone && <button className="topbar-management-menu__item" onClick={installApplication}><IconDownload size={18} /><span>Instalar app</span></button>}
              <div className="topbar-management-menu__meta"><IconCalendar size={18} /><span>28 jul 2026</span></div>
              <button className="topbar-management-menu__item" onClick={() => notify("Perfil de Ana García")}><span className="avatar">AG</span><span><strong>Ana García</strong><small>Gestora de flota</small></span><IconChevronDown className="topbar-management-menu__chevron" size={17} /></button>
              <div className="topbar-management-menu__divider" />
              {topbarItems.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.label;
                return <button className={active ? "topbar-management-menu__item topbar-management-menu__item--active" : "topbar-management-menu__item"} key={item.label} onClick={() => navigate(item)} aria-current={active ? "page" : undefined}><Icon size={18} /><span>{item.label}</span></button>;
              })}
            </aside>
          )}
          {!compactDetailHeader && notificationsOpen && (
            <aside className="notification-popover" aria-label="Notificaciones recientes">
              <header><strong>Notificaciones</strong><button className="icon-button" onClick={() => setNotificationsOpen(false)} aria-label="Cerrar notificaciones"><IconX size={18} /></button></header>
              <button onClick={() => openVehicleFromModule("5043 MLC")}><IconAlertTriangle size={18} /><span><strong>Revisión próxima</strong><small>Toyota Corolla · 4.265 km restantes</small></span></button>
              <button onClick={() => navigate(navItems[2])}><IconGauge size={18} /><span><strong>2 lecturas por revisar</strong><small>Confianza inferior al umbral configurado</small></span></button>
            </aside>
          )}
        </header>

        <div className={`page-scroll${activeNav === "Informes" && homeReportTab === "General" ? " page-scroll--dashboard" : ""}`}>
          {activeNav === "Vehículos" && <FuelView key="vehiculos" mode="vehicles" vehicles={vehicles} selected={selected} onSelectVehicle={selectVehicle} onNavigate={navigate} setModal={setModal} filtered={filtered} filter={filter} query={query} selectedDrivers={selectedDrivers} setFilter={setFilter} setQuery={setQuery} selectVehicle={selectVehicle} selectDriver={selectDriver} openWorkshop={openWorkshop} />}
          {activeNav === "Conductores" && <DriversView vehicles={vehicles} setModal={setModal} />}
          {activeNav === "Informes" && <FuelView key="informes" initialTab="General" reportTab={homeReportTab} onReportTabChange={setHomeReportTab} chartMetric={homeChartMetric} onChartMetricChange={setHomeChartMetric} vehicles={vehicles} selected={selected} onSelectVehicle={(vehicle) => setSelectedPlate(vehicle.plate)} onNavigate={navigate} setModal={setModal} />}
          {activeNav === "Gasolina" && <FuelView key="gasolina" initialTab="Repostaje" vehicles={vehicles} selected={selected} onSelectVehicle={(vehicle) => setSelectedPlate(vehicle.plate)} onNavigate={navigate} setModal={setModal} />}
          {activeNav === "Lecturas" && <ReadingsView setModal={setModal} />}
          {activeNav === "Facturas" && <InvoicesView invoices={invoices} setModal={setModal} />}
          {activeNav === "Mantenimiento" && <MaintenanceView initialPlate={maintenancePlate} invoices={invoices} setModal={setModal} vehicles={vehicles} />}
          {activeNav === "Automatizaciones" && <AutomationsView enabled={automationEnabled} setEnabled={setAutomationEnabled} notify={notify} />}
          {activeNav === "Ajustes" && <SettingsView settings={settings} setSettings={setSettings} notify={notify} />}
          {activeNav === "Ayuda" && <HelpView openFaq={openFaq} setOpenFaq={setOpenFaq} setModal={setModal} />}
        </div>
      </main>

      {showInspector && (
        <VehicleInspector
          selected={selected}
          selectedDriver={selectedDriver}
          selectedActivity={selectedActivity}
          invoices={invoices}
          inspectorTab={inspectorTab}
          setInspectorTab={setInspectorTab}
          setInspectorOpen={setInspectorOpen}
          setModal={setModal}
          selectDriver={selectDriver}
          openShift={openShift}
          setOpenShift={setOpenShift}
          notify={notify}
        />
      )}

      <BottomNavigation homeActive={activeNav === "Informes" && homeReportTab === "General"} onHome={openGeneral} onProfile={() => notify("Perfil de Ana García")} />
      <QuickActionMenu
        step={quickMenuStep}
        category={quickMenuCategory}
        onCategory={(category) => { setQuickMenuCategory(category); setQuickMenuStep("sources"); }}
        onAction={({ category, source, file }) => { setQuickMenuStep(""); notify(`${source === "camera" ? "Cámara" : "Archivo"} listo para ${category === "billing" ? "facturación" : "consumo"}${file ? ` · ${file.name}` : ""}`); }}
      />
      {modal && <AppModalV2 modal={modal} onClose={() => setModal(null)} notify={notify} onSaveInvoice={savePhotoInvoice} vehicles={vehicles} />}
      {toast && <div className="toast" role="status"><IconCircleCheck size={19} />{toast}</div>}
    </div>
  );
}

function FleetView({ filtered, filter, query, selected, selectedDrivers, setFilter, setQuery, selectVehicle, selectDriver, openWorkshop, setModal, compact = false }) {
  return (
    <section className={compact ? "vehicle-workspace-fleet" : "module-page fleet-page"}>
      {!compact && <PageIntro
        eyebrow="Flota"
        title="Vehículos"
        description="Kilómetros, facturación, combustible y mantenimiento en una única vista."
        action={<button className="primary-button" onClick={() => setModal({ type: "reading" })}><IconPlus size={18} />Registrar lectura</button>}
      />}
      {!compact && <div className="metric-cards">
        <MetricCard icon={IconBriefcase} label="Vehículos profesionales" value="3" detail="6 turnos recibidos hoy" />
        <MetricCard icon={IconGasStation} label="Repostaje de hoy" value="177,31 €" detail="6 conductores profesionales" />
        <MetricCard icon={IconTools} label="Próxima revisión" value="4.160 km" detail="Peugeot 2008 · 6 ago" tone="amber" />
      </div>}
      <section className={`content-card fleet-card${compact ? " vehicle-workspace-fleet-card report-section-card" : ""}`}>
        {compact && <header className="vehicle-workspace-section-heading vehicle-workspace-section-heading--fleet"><div><span>Operativa</span><h2>Vehículos y actividad diaria</h2><p>Conductores, facturación, kilómetros, repostaje y taller en una sola tabla.</p></div><button type="button" className="secondary-button" onClick={() => setModal({ type: "reading" })}><IconPlus size={16} />Registrar lectura</button></header>}
        <header className="fleet-toolbar" aria-label="Filtros de vehículos">
          <label className="search"><IconSearch size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar matrícula, conductor o trabajo" /></label>
          <div className="filters">
            {["Todos", "Profesional", "Particular"].map((name) => <button key={name} className={filter === name ? "filter-button filter-button--active" : "filter-button"} onClick={() => setFilter(name)}>{name}</button>)}
          </div>
        </header>
        <div className="table-scroll">
          <table className="fleet-table">
            <caption className="sr-only">Estado operativo de los cinco vehículos</caption>
            <thead><tr><th>Matrícula</th><th>Conductores</th><th>Facturación</th><th>Km hoy</th><th>Repostaje</th><th>Km totales</th><th>Km para revisión</th><th>Taller</th></tr></thead>
            <tbody>
              {filtered.map((vehicle) => {
                const driver = selectedDrivers[vehicle.plate] ?? vehicle.drivers[0];
                const day = getDriverDay(vehicle, driver);
                const remaining = vehicle.nextServiceKm - vehicle.odometer;
                const latestMaintenance = vehicle.maintenance[0];
                return (
                  <tr className={selected.plate === vehicle.plate ? "is-selected" : ""} key={vehicle.plate} onClick={() => selectVehicle(vehicle)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") selectVehicle(vehicle); }}>
                    <td className="plate"><strong>{vehicle.plate}</strong><small>{vehicle.model}</small></td>
                    <td>
                      {vehicle.use === "Profesional" ? (
                        <div className="driver-selector" aria-label={`Conductores de ${vehicle.plate}`}>
                          {vehicle.drivers.map((name) => <button className={driver === name ? "driver-chip driver-chip--active" : "driver-chip"} key={name} onClick={(event) => { event.stopPropagation(); selectDriver(vehicle, name); }}>{name}</button>)}
                        </div>
                      ) : <span className="no-driver-associated">Sin conductor asociado</span>}
                    </td>
                    <td className="billing-cell"><strong>{formatCurrency(day.revenue)} hoy</strong><small>Mes {formatCurrency(day.monthRevenue)} · {day.monthTrips} viajes</small><small>Efectivo {formatCurrency(day.cash)}</small></td>
                    <td><strong>{formatKm(day.km)}</strong><small>{vehicle.use === "Profesional" ? driver.split(" ")[0] : "Uso particular"}</small></td>
                    <td><strong>{formatCurrency(day.cost)}</strong><small>{day.liters ? `${day.liters.toLocaleString("es-ES")} L` : "Sin repostaje"}</small></td>
                    <td><strong>{formatKm(vehicle.odometer)}</strong><small>Actualizado hoy</small></td>
                    <td><span className={`service-countdown ${remaining <= 4500 ? "service-countdown--urgent" : ""}`}><strong>{formatKm(remaining)}</strong><small>{vehicle.serviceDate}</small></span></td>
                    <td><button className="workshop-cell" onClick={(event) => { event.stopPropagation(); openWorkshop(vehicle); }}><strong>{formatCurrency(latestMaintenance.amount)}</strong><small>{latestMaintenance.concept}</small></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="empty-state"><IconSearch size={25} /><strong>Sin resultados</strong><span>Prueba otra matrícula, conductor o trabajo.</span></div>}
        <footer className="table-footer"><span>5 vehículos · 6 conductores profesionales</span><span>Selecciona un conductor para ver su actividad diaria</span></footer>
      </section>
    </section>
  );
}

function WheelPickerMenu({ options, value, onChange, ariaLabel, className = "" }) {
  const menuRef = useRef(null);
  const settleTimerRef = useRef(null);
  const frameRef = useRef(null);
  const ignoreScrollRef = useRef(false);
  const selectedIndex = Math.max(0, options.findIndex((option) => String(option.value) === String(value)));
  const middleOffset = options.length;
  const loopedOptions = useMemo(() => [0, 1, 2].flatMap((copy) => options.map((option, index) => ({ ...option, loopIndex: copy * options.length + index }))), [options]);
  const [activeLoopIndex, setActiveLoopIndex] = useState(middleOffset + selectedIndex);

  const getButtons = () => Array.from(menuRef.current?.querySelectorAll("button[data-wheel-index]") ?? []);
  const getNearestLoopIndex = () => {
    const menu = menuRef.current;
    const buttons = getButtons();
    if (!menu || !buttons.length) return middleOffset + selectedIndex;
    const viewportCenter = menu.scrollTop + menu.clientHeight / 2;
    return Number(buttons.reduce((nearest, button) => {
      const buttonCenter = button.offsetTop + button.offsetHeight / 2;
      const nearestCenter = nearest.offsetTop + nearest.offsetHeight / 2;
      return Math.abs(buttonCenter - viewportCenter) < Math.abs(nearestCenter - viewportCenter) ? button : nearest;
    }, buttons[0]).dataset.wheelIndex);
  };
  const getLoopHeight = () => {
    const buttons = getButtons();
    const first = buttons[0];
    const middle = buttons[options.length];
    if (!first || !middle) return 0;
    return middle.offsetTop - first.offsetTop;
  };
  const centerOption = (loopIndex, behavior = "auto") => {
    const menu = menuRef.current;
    const button = menu?.querySelector(`button[data-wheel-index="${loopIndex}"]`);
    if (!menu || !button) return;
    if (behavior === "auto") ignoreScrollRef.current = true;
    const targetScroll = button.offsetTop - (menu.clientHeight - button.offsetHeight) / 2;
    menu.scrollTo({ top: Math.max(0, targetScroll), behavior });
  };
  const commitLoopIndex = (loopIndex) => {
    const normalizedIndex = ((loopIndex % options.length) + options.length) % options.length;
    setActiveLoopIndex(middleOffset + normalizedIndex);
    onChange(options[normalizedIndex].value);
  };
  const handleScroll = () => {
    const menu = menuRef.current;
    if (!menu || !options.length || ignoreScrollRef.current) return;
    const loopHeight = getLoopHeight();
    if (loopHeight > 0) {
      if (menu.scrollTop < loopHeight * 0.55) menu.scrollTop += loopHeight;
      else if (menu.scrollTop > loopHeight * 2.45) menu.scrollTop -= loopHeight;
    }
    const nearest = getNearestLoopIndex();
    setActiveLoopIndex(nearest);
    window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => commitLoopIndex(getNearestLoopIndex()), 120);
  };
  const handleKeyDown = (event) => {
    if (!options.length || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    ignoreScrollRef.current = false;
    const current = getNearestLoopIndex();
    const direction = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
    const next = event.key === "Home" ? middleOffset : event.key === "End" ? middleOffset + options.length - 1 : current + direction;
    const normalizedIndex = ((next % options.length) + options.length) % options.length;
    const centeredLoopIndex = middleOffset + normalizedIndex;
    setActiveLoopIndex(centeredLoopIndex);
    centerOption(centeredLoopIndex, "smooth");
    window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => commitLoopIndex(centeredLoopIndex), 180);
  };

  useEffect(() => {
    frameRef.current = window.requestAnimationFrame(() => {
      setActiveLoopIndex(middleOffset + selectedIndex);
      centerOption(middleOffset + selectedIndex);
    });
    return () => {
      window.cancelAnimationFrame(frameRef.current);
      window.clearTimeout(settleTimerRef.current);
    };
  }, [middleOffset, selectedIndex, options.length]);

  return (
    <div className={`report-period-menu report-period-menu--wheel ${className}`} role="listbox" aria-label={ariaLabel}>
      <div className="report-wheel-list" ref={menuRef} onScroll={handleScroll} onPointerDown={() => { ignoreScrollRef.current = false; }} onWheel={() => { ignoreScrollRef.current = false; }} onTouchStart={() => { ignoreScrollRef.current = false; }} onKeyDown={handleKeyDown}>
        {loopedOptions.map((option) => (
          <button
            type="button"
            role="option"
            aria-selected={activeLoopIndex === option.loopIndex}
            tabIndex={activeLoopIndex === option.loopIndex ? 0 : -1}
            data-wheel-index={option.loopIndex}
            className={activeLoopIndex === option.loopIndex ? "selected" : ""}
            onClick={() => commitLoopIndex(option.loopIndex)}
            key={`${option.loopIndex}-${option.value}`}
          >
            {option.label}
            {activeLoopIndex === option.loopIndex && <IconCheck size={12} />}
          </button>
        ))}
      </div>
      <span className="report-wheel-focus" aria-hidden="true" />
    </div>
  );
}

function ChartMetricMenu({ selectedMetrics, onToggleMetric, onSelectSummary }) {
  const summarySelected = selectedMetrics.length === 0;
  return (
    <div className="report-period-menu report-chart-metric-menu report-chart-metric-menu--checklist" role="listbox" aria-label="Seleccionar información del gráfico">
      <button type="button" role="option" aria-selected={summarySelected} className={`report-chart-metric-menu__summary${summarySelected ? " selected" : ""}`} onClick={onSelectSummary}>
        <span>Resumen</span>
      </button>
      {selectableChartMetrics.map((option) => {
        const selected = selectedMetrics.includes(option.value);
        return (
          <button type="button" role="option" aria-selected={selected} className={`report-chart-metric-menu__option report-chart-metric-menu__option--${option.value}${selected ? " selected" : ""}`} onClick={() => onToggleMetric(option.value)} key={option.value}>
            <span>{option.label}</span>
            <span className="report-metric-check" aria-hidden="true">{selected && <IconCheck size={10} stroke={2.5} />}</span>
          </button>
        );
      })}
    </div>
  );
}

function FuelView({ vehicles, selected, onSelectVehicle, onNavigate, setModal, initialTab = "General", reportTab: controlledReportTab, onReportTabChange, chartMetric: controlledChartMetric, onChartMetricChange, mode = "reports", filtered, filter, query, selectedDrivers, setFilter, setQuery, selectVehicle, selectDriver, openWorkshop }) {
  const [internalReportTab, setInternalReportTab] = useState(initialTab);
  const reportTab = controlledReportTab ?? internalReportTab;
  const setReportTab = onReportTabChange ?? setInternalReportTab;
  const [internalChartMetric, setInternalChartMetric] = useState("summary");
  const chartMetric = controlledChartMetric ?? internalChartMetric;
  const setChartMetric = onChartMetricChange ?? setInternalChartMetric;
  const [selectedChartMetrics, setSelectedChartMetrics] = useState(() => chartMetric === "summary" ? [] : [chartMetric]);
  const pendingChartMetricsRef = useRef(null);
  const [reportMonth, setReportMonth] = useState(6);
  const [reportYear, setReportYear] = useState(2026);
  const [periodMenu, setPeriodMenu] = useState("");
  const [selectedChartBar, setSelectedChartBar] = useState("");
  const [billingDriverKey, setBillingDriverKey] = useState("");
  const [billingVehiclePlate, setBillingVehiclePlate] = useState("");
  useEffect(() => {
    setSelectedChartBar("");
  }, [chartMetric, reportMonth, reportYear]);
  useEffect(() => {
    if (chartMetric === "summary") {
      if (pendingChartMetricsRef.current) {
        setSelectedChartMetrics(pendingChartMetricsRef.current);
        pendingChartMetricsRef.current = null;
      } else if (selectedChartMetrics.length === 1) {
        setSelectedChartMetrics([]);
      }
    } else if (allChartMetricValues.includes(chartMetric)) {
      pendingChartMetricsRef.current = null;
      setSelectedChartMetrics([chartMetric]);
    }
  }, [chartMetric]);
  useEffect(() => {
    if (!periodMenu) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setPeriodMenu(""); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [periodMenu]);
  useEffect(() => {
    if (!periodMenu) return undefined;
    const closeOnPointerDown = (event) => {
      if (!event.target.closest(".report-chart-metric-dropdown, .report-period-dropdown, .fuel-period-dropdown")) setPeriodMenu("");
    };
    document.addEventListener("pointerdown", closeOnPointerDown);
    return () => document.removeEventListener("pointerdown", closeOnPointerDown);
  }, [periodMenu]);
  useEffect(() => {
    if (!billingDriverKey) return undefined;
    const animationFrame = window.requestAnimationFrame(() => {
      document.getElementById("driver-billing-calendar")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [billingDriverKey]);
  const periodFactor = getReportPeriodFactor(reportMonth, reportYear);
  const selectedPeriodLabel = `${reportMonths[reportMonth]} ${reportYear}`;
  const vehicleStats = vehicles.map((vehicle) => {
    const entries = (vehicle.monthlyFuel ?? []).map((entry) => ({
      ...entry,
      date: entry.date.replace(fuelPeriodSuffixPattern, `${reportMonthTokens[reportMonth]} ${reportYear}`),
      liters: Number(((entry.liters ?? 0) * periodFactor).toFixed(2)),
      cost: Number(((entry.cost ?? 0) * periodFactor).toFixed(2)),
    }));
    return {
      vehicle,
      entries,
      liters: entries.reduce((sum, entry) => sum + (entry.liters ?? 0), 0),
      cost: entries.reduce((sum, entry) => sum + (entry.cost ?? 0), 0),
      refuels: entries.length,
    };
  });
  const totals = vehicleStats.reduce((summary, item) => ({
    liters: summary.liters + item.liters,
    cost: summary.cost + item.cost,
    refuels: summary.refuels + item.refuels,
  }), { liters: 0, cost: 0, refuels: 0 });
  const totalDistance = 7524;
  const periodDays = new Date(reportYear, reportMonth + 1, 0).getDate();
  const billingRows = vehicles
    .filter((vehicle) => vehicle.use === "Profesional")
    .flatMap((vehicle, vehicleIndex) => vehicle.drivers.map((driver, driverIndex) => {
      const activity = getDriverDay(vehicle, driver);
      return {
        key: `${vehicle.plate}-${driver}`,
        driver,
        plate: vehicle.plate,
        model: vehicle.model,
        trips: Math.round(activity.monthTrips * periodFactor),
        revenue: Math.round(activity.monthRevenue * periodFactor * (1 + ((vehicleIndex + driverIndex) % 3 - 1) * 0.018)),
      };
    }));
  const billingChartData = billingRows.map((row) => ({
    label: row.driver,
    detail: row.plate,
    value: row.revenue,
  }));
  const fuelChartData = vehicleStats.map(({ vehicle, cost }, index) => ({
    label: vehicle.plate,
    detail: vehicle.model,
    value: Number((cost * (1 + (index - 2) * 0.012)).toFixed(2)),
  }));
  const maintenanceChartData = vehicles.map((vehicle) => ({
    label: vehicle.plate,
    detail: vehicle.model,
    value: getMaintenanceAmountForPeriod(vehicle, reportMonth, reportYear),
  }));
  const netChartData = vehicles.map((vehicle, index) => {
    const revenue = vehicle.use === "Profesional"
      ? vehicle.drivers.reduce((sum, driver) => sum + getDriverDay(vehicle, driver).monthRevenue, 0) * periodFactor
      : 0;
    const baseExpenses = vehicleExpenseAmounts[vehicle.plate] ?? expenseCategories.map(() => 0);
    const expenses = baseExpenses.reduce((sum, amount, expenseIndex) => {
      if (expenseIndex === 2) return sum + fuelChartData[index].value;
      if (expenseIndex === 3) return sum + maintenanceChartData[index].value;
      return sum + amount * periodFactor;
    }, 0);
    return { label: vehicle.plate, detail: vehicle.model, value: Number((revenue - expenses).toFixed(2)) };
  });
  const periodTotals = {
    billing: billingChartData.reduce((sum, item) => sum + item.value, 0),
    maintenance: maintenanceChartData.reduce((sum, item) => sum + item.value, 0),
    fuel: fuelChartData.reduce((sum, item) => sum + item.value, 0),
    net: netChartData.reduce((sum, item) => sum + item.value, 0),
  };
  const summaryChartData = vehicles.map((vehicle, index) => ({
    label: vehicle.plate,
    detail: vehicle.model,
    billing: billingChartData.filter((item) => item.detail === vehicle.plate).reduce((sum, item) => sum + item.value, 0),
    maintenance: maintenanceChartData[index].value,
    fuel: fuelChartData[index].value,
    net: netChartData[index].value,
  }));
  const summaryMetricLabels = {
    billing: "Facturación",
    maintenance: "Mantenimiento",
    fuel: "Combustible",
    net: "Neto",
  };
  const chartOptions = {
    summary: { title: "RESUMEN GENERAL POR COCHE", description: "", color: "#079ea7", data: summaryChartData },
    billing: { title: "FACTURACIÓN POR CONDUCTOR", description: "", color: BILLING_COLOR, data: billingChartData },
    maintenance: { title: "MANTENIMIENTO POR COCHE", description: "", color: MAINTENANCE_COLOR, data: maintenanceChartData },
    fuel: { title: "COMBUSTIBLE POR COCHE", description: "", color: "#df4538", data: fuelChartData },
    net: { title: "BENEFICIO NETO POR COCHE", description: "", color: "#28923c", data: netChartData },
  };
  const activeChart = chartOptions[chartMetric];
  const visibleChartMetrics = selectedChartMetrics.length > 0 ? selectedChartMetrics : allChartMetricValues;
  const chartIconBackground = visibleChartMetrics.length === 1
    ? chartMetricColors[visibleChartMetrics[0]]
    : `conic-gradient(from 45deg, ${visibleChartMetrics.map((metric, index) => `${chartMetricColors[metric]} ${index * 100 / visibleChartMetrics.length}% ${(index + 1) * 100 / visibleChartMetrics.length}%`).join(", ")})`;
  const selectedFuelStats = vehicleStats.find(({ vehicle }) => vehicle.plate === selected.plate) ?? vehicleStats[0];
  const selectedBillingDriver = billingRows.find((row) => row.key === billingDriverKey) ?? null;
  const selectedBillingVehicle = vehicles.find((vehicle) => vehicle.plate === billingVehiclePlate) ?? null;
  const selectedBillingVehicleRows = billingRows.filter((row) => row.plate === billingVehiclePlate);
  const hasChartData = chartMetric === "summary"
    ? visibleChartMetrics.some((metric) => activeChart.data.some((item) => item[metric] !== 0))
    : activeChart.data.some((item) => item.value !== 0);
  const selectChartBar = (entry) => {
    const label = entry?.payload?.label ?? entry?.label;
    if (label) setSelectedChartBar(label);
  };
  const selectChartMetrics = (nextMetrics) => {
    const normalized = allChartMetricValues.filter((metric) => nextMetrics.includes(metric));
    if (!normalized.length) {
      pendingChartMetricsRef.current = null;
      setSelectedChartMetrics([]);
      if (chartMetric !== "summary") setChartMetric("summary");
      return;
    }
    setSelectedChartMetrics(normalized);
    if (normalized.length === 1) {
      pendingChartMetricsRef.current = null;
      setChartMetric(normalized[0]);
    } else if (chartMetric !== "summary") {
      pendingChartMetricsRef.current = normalized;
      setChartMetric("summary");
    } else {
      pendingChartMetricsRef.current = null;
    }
  };
  const chartMetricTriggerLabel = selectedChartMetrics.length === 0
    ? "Resumen"
    : selectedChartMetrics.length === 1
      ? chartMetricOptions.find((option) => option.value === selectedChartMetrics[0])?.label
      : `${selectedChartMetrics.length} seleccionados`;

  useEffect(() => {
    if (!periodMenu) return;
    const menu = document.querySelector(".report-period-menu--wheel");
    const selectedOption = menu?.querySelector("button.selected");
    if (!menu || !selectedOption || menu.querySelector(".report-wheel-list")) return;
    const scrollContainer = menu.querySelector(".report-wheel-list") ?? menu;
    const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
    const targetScroll = selectedOption.offsetTop - (scrollContainer.clientHeight - selectedOption.offsetHeight) / 2;
    scrollContainer.scrollTop = Math.max(0, Math.min(maxScroll, targetScroll));
  }, [periodMenu]);

  if (mode === "vehicles") {
    return (
      <section className="fuel-reports-page vehicle-workspace-page">
        <div className="fuel-report-canvas">
          <FuelVehicleOverview mode="vehicles" stats={vehicleStats} billingRows={billingRows} selected={selected} onSelectVehicle={onSelectVehicle} month={reportMonth} year={reportYear} menuOpen={periodMenu === "fuel-month"} onToggleMonth={() => setPeriodMenu((current) => current === "fuel-month" ? "" : "fuel-month")} onSelectMonth={(month) => { setReportMonth(month); setPeriodMenu(""); }} onCloseMenu={() => setPeriodMenu("")} />
          <FuelLedgerDetail selected={selected} entries={selectedFuelStats.entries} periodLabel={selectedPeriodLabel} onOpenInvoice={(item) => setModal({ type: "invoice", item })} />
          <FleetView compact filtered={filtered} filter={filter} query={query} selected={selected} selectedDrivers={selectedDrivers} setFilter={setFilter} setQuery={setQuery} selectVehicle={selectVehicle} selectDriver={selectDriver} openWorkshop={openWorkshop} setModal={setModal} />
          <section className="vehicle-workspace-billing report-billing-stack" aria-labelledby="vehicle-workspace-billing-title">
            <header className="vehicle-workspace-section-heading">
              <div><span>Facturación</span><h2 id="vehicle-workspace-billing-title">Facturación mensual por conductor</h2><p>Ingresos, viajes y calendario diario integrados en Vehículos.</p></div>
              <strong>{formatCurrency(periodTotals.billing)}</strong>
            </header>
            <FuelIncomeReport
              rows={billingRows}
              total={periodTotals.billing}
              month={reportMonth}
              year={reportYear}
              periodMenu={periodMenu}
              selectedDriverKey={billingDriverKey}
              selectedVehiclePlate={billingVehiclePlate}
              onSelectDriver={setBillingDriverKey}
              onSelectVehicle={(plate) => setBillingVehiclePlate((current) => current === plate ? "" : plate)}
              onTogglePeriodMenu={setPeriodMenu}
              onSelectMonth={(month) => { setReportMonth(month); setPeriodMenu(""); }}
              onSelectYear={(year) => { setReportYear(year); setPeriodMenu(""); }}
            />
            {selectedBillingVehicle ? <VehicleBillingSummary vehicle={selectedBillingVehicle} rows={selectedBillingVehicleRows} month={reportMonth} year={reportYear} /> : null}
            {selectedBillingDriver ? <DriverBillingCalendar row={selectedBillingDriver} month={reportMonth} year={reportYear} onClose={() => setBillingDriverKey("")} /> : null}

          </section>
        </div>
      </section>
    );
  }

  return (
    <section className="fuel-reports-page">
      <div className="fuel-report-canvas">
        {reportTab === "General" && (
          <>
            <div className="report-general-grid">
              <div className="report-stat-grid">
                <ReportFleetSummaryCard billing={formatCurrency(periodTotals.billing)} fuel={formatCurrency(periodTotals.fuel)} onClick={() => onNavigate(conductorNavItem)} />
                <ReportStatCard wide icon={IconTool} label="Mantenimiento" value={formatCurrency(periodTotals.maintenance)} daily={formatCurrency(periodTotals.maintenance / periodDays)} perKm={formatCurrency(periodTotals.maintenance / totalDistance)} tone="orange" active={false} actionLabel="Abrir Mantenimiento" onClick={() => onNavigate(fleetSubItems[0])} />
                <ReportStatCard wide icon={IconCurrencyEuro} label="Neto" value={formatCurrency(periodTotals.net)} daily={formatCurrency(periodTotals.net / periodDays)} perKm={formatCurrency(periodTotals.net / totalDistance)} tone="green" active={chartMetric === "net"} onClick={() => setChartMetric("net")} />
              </div>
              <section className="report-chart-card">
                <header className="report-chart-card__top">
                  <div><span className={`report-chart-icon report-chart-icon--${chartMetric}`} style={{ background: chartIconBackground }}><IconChartBar size={18} /></span><span><strong className={chartMetric === "summary" ? "report-chart-title report-chart-title--summary" : "report-chart-title"}>{activeChart.title}</strong></span></div>
                  <div className="report-chart-filters" role="group" aria-label="Filtros del gráfico">
                    <div className="report-chart-metric-dropdown">
                      <button type="button" className="report-summary-button report-chart-metric-trigger" aria-haspopup="listbox" aria-expanded={periodMenu === "chart-metric"} onClick={() => setPeriodMenu((current) => current === "chart-metric" ? "" : "chart-metric")}><IconChartBar size={14} /><span>{chartMetricTriggerLabel}</span><IconChevronDown size={13} /></button>
                      {periodMenu === "chart-metric" && <ChartMetricMenu selectedMetrics={selectedChartMetrics} onSelectSummary={() => { selectChartMetrics([]); setPeriodMenu(""); }} onToggleMetric={(metric) => selectChartMetrics(selectedChartMetrics.includes(metric) ? selectedChartMetrics.filter((candidate) => candidate !== metric) : [...selectedChartMetrics, metric])} />}
                    </div>
                    <div className="report-period-dropdown">
                      <span>Mes</span>
                      <button type="button" className="report-period-trigger" aria-haspopup="listbox" aria-expanded={periodMenu === "month"} onClick={() => setPeriodMenu((current) => current === "month" ? "" : "month")}><span>{reportMonths[reportMonth]}</span><IconChevronDown size={13} /></button>
                      {periodMenu === "month" && <WheelPickerMenu options={reportMonths.map((label, index) => ({ value: index, label }))} value={reportMonth} onChange={(value) => { setReportMonth(value); setPeriodMenu(""); }} ariaLabel="Seleccionar mes" className="report-period-menu--months" />}
                    </div>
                    <div className="report-period-dropdown">
                      <span>Año</span>
                      <button type="button" className="report-period-trigger report-period-trigger--year" aria-haspopup="listbox" aria-expanded={periodMenu === "year"} onClick={() => setPeriodMenu((current) => current === "year" ? "" : "year")}><span>{reportYear}</span><IconChevronDown size={13} /></button>
                      {periodMenu === "year" && <WheelPickerMenu options={reportYears.map((year) => ({ value: year, label: String(year) }))} value={reportYear} onChange={(value) => { setReportYear(value); setPeriodMenu(""); }} ariaLabel="Seleccionar año" className="report-period-menu--years" />}
                    </div>
                  </div>
                </header>
                <div className="report-chart report-chart--summary">
                  {hasChartData ? <>
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeChart.data} margin={{ top: 12, right: 0, left: 0, bottom: 4 }} barCategoryGap="16%" onClick={(state) => { if (state?.activeLabel) setSelectedChartBar(state.activeLabel); }}>
                      {selectedChartBar && <ReferenceArea x1={selectedChartBar} x2={selectedChartBar} fill="#edf0ee" fillOpacity={0.9} stroke="none" ifOverflow="extendDomain" zIndex={-20} />}
                      <CartesianGrid stroke="#e9efed" vertical={false} />
                      <XAxis dataKey="label" interval={0} tick={{ fontSize: 8, fontWeight: chartMetric === "billing" ? 400 : 700, fill: "#75817d" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 8, fill: "#87918d" }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={false} wrapperStyle={{ pointerEvents: "none", outline: "none" }} formatter={(value, name) => [formatCurrency(Number(value)), chartMetric === "summary" ? summaryMetricLabels[name] : activeChart.title]} labelFormatter={(label, payload) => payload?.[0]?.payload?.detail ? `${label} · ${payload[0].payload.detail}` : label} contentStyle={{ borderRadius: 10, borderColor: "#dce5e1", fontSize: 10 }} />
                      {(chartMetric === "net" || (chartMetric === "summary" && visibleChartMetrics.includes("net"))) && <ReferenceLine y={0} stroke="#aab5b1" />}
                      {chartMetric === "summary" ? <>
                        {visibleChartMetrics.includes("billing") && <Bar dataKey="billing" name="billing" stackId="vehicle-summary" fill={BILLING_COLOR} maxBarSize={82} minPointSize={2} isAnimationActive={false} activeBar={false} onClick={selectChartBar} />}
                        {visibleChartMetrics.includes("maintenance") && <Bar dataKey="maintenance" name="maintenance" stackId="vehicle-summary" fill={MAINTENANCE_COLOR} maxBarSize={82} minPointSize={2} isAnimationActive={false} activeBar={false} onClick={selectChartBar} />}
                        {visibleChartMetrics.includes("fuel") && <Bar dataKey="fuel" name="fuel" stackId="vehicle-summary" fill="#df4538" maxBarSize={82} minPointSize={2} isAnimationActive={false} activeBar={false} onClick={selectChartBar} />}
                        {visibleChartMetrics.includes("net") && <Bar dataKey="net" name="net" stackId="vehicle-summary" fill="#28923c" radius={[5, 5, 0, 0]} maxBarSize={82} minPointSize={2} isAnimationActive={false} activeBar={false} onClick={selectChartBar} />}
                      </> : <Bar dataKey="value" name={activeChart.title} fill={activeChart.color} radius={[5, 5, 0, 0]} maxBarSize={76} isAnimationActive={false} activeBar={false} onClick={selectChartBar}>
                        {activeChart.data.map((entry) => <Cell key={`${chartMetric}-${entry.label}`} fill={chartMetric === "net" && entry.value < 0 ? "#df4538" : activeChart.color} />)}
                      </Bar>}
                    </BarChart>
                    </ResponsiveContainer>
                    {chartMetric === "summary" ? <div className="report-chart-legend" aria-label="Leyenda del resumen general">
                      {visibleChartMetrics.includes("billing") && <span><i className="report-chart-legend__swatch report-chart-legend__swatch--billing" />Facturación</span>}
                      {visibleChartMetrics.includes("maintenance") && <span><i className="report-chart-legend__swatch report-chart-legend__swatch--maintenance" />Mantenimiento</span>}
                      {visibleChartMetrics.includes("fuel") && <span><i className="report-chart-legend__swatch report-chart-legend__swatch--fuel" />Combustible</span>}
                      {visibleChartMetrics.includes("net") && <span><i className="report-chart-legend__swatch report-chart-legend__swatch--net" />Neto</span>}
                    </div> : <div className="report-chart-legend report-chart-legend--placeholder" aria-hidden="true" />}
                  </> : <><div className="report-chart-empty"><IconChartBar size={24} /><strong>Sin datos en este periodo</strong><span>No hay movimientos de {activeChart.title.toLocaleLowerCase("es")} en {selectedPeriodLabel.toLocaleLowerCase("es")}.</span></div><div className="report-chart-legend report-chart-legend--placeholder" aria-hidden="true" /></>}
                </div>
              </section>
            </div>
          </>
        )}

        {reportTab === "Repostaje" && (
          <>
            <FuelVehicleOverview stats={vehicleStats} selected={selected} onSelectVehicle={onSelectVehicle} month={reportMonth} year={reportYear} menuOpen={periodMenu === "fuel-month"} onToggleMonth={() => setPeriodMenu((current) => current === "fuel-month" ? "" : "fuel-month")} onSelectMonth={(month) => { setReportMonth(month); setPeriodMenu(""); }} onCloseMenu={() => setPeriodMenu("")} />
            <FuelLedgerDetail selected={selected} entries={selectedFuelStats.entries} periodLabel={selectedPeriodLabel} onOpenInvoice={(item) => setModal({ type: "invoice", item })} />
          </>
        )}

        {reportTab === "Gasto" && <FuelExpenseReport stats={vehicleStats} total={totals.cost} />}
        {reportTab === "Facturación" && <div className="report-billing-stack">
          <FuelIncomeReport
            rows={billingRows}
            total={periodTotals.billing}
            month={reportMonth}
            year={reportYear}
            periodMenu={periodMenu}
            selectedDriverKey={billingDriverKey}
            selectedVehiclePlate={billingVehiclePlate}
            onSelectDriver={setBillingDriverKey}
            onSelectVehicle={(plate) => setBillingVehiclePlate((current) => current === plate ? "" : plate)}
            onTogglePeriodMenu={setPeriodMenu}
            onSelectMonth={(month) => { setReportMonth(month); setPeriodMenu(""); }}
            onSelectYear={(year) => { setReportYear(year); setPeriodMenu(""); }}
          />
          {selectedBillingVehicle ? <VehicleBillingSummary vehicle={selectedBillingVehicle} rows={selectedBillingVehicleRows} month={reportMonth} year={reportYear} /> : null}
          {selectedBillingDriver ? <DriverBillingCalendar row={selectedBillingDriver} month={reportMonth} year={reportYear} onClose={() => setBillingDriverKey("")} /> : null}
          <FuelDriversReport vehicles={vehicles} selectedDriverKey={billingDriverKey} onSelectDriver={setBillingDriverKey} />
        </div>}
      </div>
    </section>
  );
}

function ReportFleetSummaryCard({ billing, fuel, onClick }) {
  return (
    <button type="button" className="report-stat-card report-stat-card--wide report-stat-card--drivers" onClick={onClick} aria-label="Abrir Conductores, Facturación y Consumo">
      <span className="report-stat-card__header">
        <span className="report-stat-card__icon"><IconUsers size={18} /></span>
        <strong>CONDUCTORES</strong>
      </span>
      <span className="report-stat-card__inline-metrics">
        <span><small>Facturación</small><strong>{billing}</strong></span>
        <span><small>Consumo</small><strong>{fuel}</strong></span>
      </span>
    </button>
  );
}

function ReportStatCard({ wide = false, icon: Icon, label, value, daily, perKm, tone, active, actionLabel, onClick }) {
  return (
    <button type="button" className={`report-stat-card report-stat-card--${tone}${wide ? " report-stat-card--wide" : ""}${active ? " report-stat-card--active" : ""}`} onClick={onClick} aria-label={actionLabel ?? `Mostrar gráfico de ${label}`} aria-pressed={active}>
      <span className="report-stat-card__header"><span className="report-stat-card__icon"><Icon size={18} /></span><strong>{wide ? label.toLocaleUpperCase("es") : label}</strong></span>
      {wide ? <span className="report-stat-card__inline-metrics">
        <span><small>Total</small><strong>{value}</strong></span>
        <span><small>Por día</small><strong>{daily}</strong></span>
        <span><small>Por km</small><strong>{perKm}</strong></span>
      </span> : <>
        <small>Total</small>
        <strong className="report-stat-value">{value}</strong>
        <span className="report-stat-card__footer"><span><small>Por día</small><strong>{daily}</strong></span><span><small>Por km</small><strong>{perKm}</strong></span></span>
      </>}
    </button>
  );
}

function FuelVehicleOverview({ stats, billingRows = [], selected, onSelectVehicle, month, year, menuOpen, onToggleMonth, onSelectMonth, onCloseMenu, mode = "fuel" }) {
  const unified = mode === "vehicles";
  const periodLabel = `${reportMonths[month]} ${year}`;
  return (
    <section className="content-card fuel-overview report-section-card">
      <header className="card-header">
        <div><h2>{unified ? "Vehículos" : "Consumo mensual por vehículo"}</h2><p>{unified ? "Flota, facturación y consumo mensual reunidos en una sola vista." : "Selecciona un coche para consultar sus datos."}</p></div>
        <div className="report-period-dropdown fuel-period-dropdown" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) onCloseMenu(); }}>
          <span>Mes</span>
          <button type="button" className="report-period-trigger fuel-period-trigger" aria-haspopup="listbox" aria-expanded={menuOpen} onClick={onToggleMonth}><IconCalendar size={14} /><span>{reportMonths[month]}</span><IconChevronDown size={13} /></button>
          {menuOpen && <div className="report-period-menu report-period-menu--months report-period-menu--wheel" role="listbox" aria-label={`Seleccionar mes de ${unified ? "Vehículos" : "Combustible"}`}>{reportMonths.map((monthLabel, index) => <button type="button" role="option" aria-selected={month === index} className={month === index ? "selected" : ""} onClick={() => onSelectMonth(index)} key={monthLabel}>{monthLabel}{month === index && <IconCheck size={12} />}</button>)}</div>}
          <small>{periodLabel}</small>
        </div>
      </header>
      <nav className="fuel-vehicle-banners" aria-label={unified ? `Vehículos de la flota en ${periodLabel.toLocaleLowerCase("es")}` : `Vehículos con consumo de ${periodLabel.toLocaleLowerCase("es")}`}>
        {stats.map(({ vehicle, liters, cost, refuels }, index) => {
          const active = selected.plate === vehicle.plate;
          const brand = getVehicleBrand(vehicle);
          const monthlyBilling = billingRows.filter((row) => row.plate === vehicle.plate).reduce((sum, row) => sum + row.revenue, 0);
          const serviceRemaining = vehicle.nextServiceKm - vehicle.odometer;
          return (
            <div className={`fuel-vehicle-entry${active ? " fuel-vehicle-entry--active" : ""}`} key={vehicle.plate}>
              <button className={`fuel-vehicle-banner${unified ? " fuel-vehicle-banner--unified" : ""} ${active ? "active" : ""}`} onClick={() => onSelectVehicle(vehicle)} aria-pressed={active} aria-label={`${unified ? "Ver detalle de" : "Ver repostajes de"} ${vehicle.plate}, ${vehicle.model}`}>
              <span className="fuel-vehicle-number">{index + 1}</span>
              <span className={`vehicle-brand-mark vehicle-brand-mark--${brand.toLocaleLowerCase("es")}`}><img src={vehicleBrandLogos[brand]} alt={`Logotipo de ${brand}`} /></span>
              <span className="fuel-vehicle-identity"><small>{brand}</small><strong>{vehicle.plate}</strong><span>{vehicle.model}</span></span>
              <span className="fuel-vehicle-type"><UseBadge value={vehicle.use} /></span>
              {unified ? <span className="fuel-vehicle-summary">
                <span><small>Facturación mensual</small><strong>{formatCurrency(monthlyBilling)}</strong><span>{vehicle.use === "Profesional" ? "2 conductores" : "Sin actividad comercial"}</span></span>
                <span><small>Km totales</small><strong>{formatKm(vehicle.odometer)}</strong><span>{formatKm(serviceRemaining)} para revisión</span></span>
                <span><small>Consumo · {reportMonths[month]}</small><strong>{liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</strong><span>{formatCurrency(cost)} · {refuels} repostajes</span></span>
              </span> : <span className="fuel-vehicle-consumption"><small>Consumo · {reportMonths[month]}</small><strong>{liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</strong><span>{formatCurrency(cost)} · {refuels} repostajes</span></span>}
              <IconChevronRight className="fuel-vehicle-chevron" size={21} />
              </button>
              {unified && active && vehicle.use === "Profesional" && <div className="fuel-vehicle-driver-row" aria-label={`Conductores de ${vehicle.plate}`}><small>Conductores</small>{vehicle.drivers.map((driver) => <span className="fuel-vehicle-driver-chip" key={driver}>{driver}</span>)}</div>}
            </div>
          );
        })}
        {unified && <div className="fuel-vehicle-banners__divider" aria-hidden="true" />}
      </nav>
    </section>
  );
}

function FuelLedgerDetail({ selected, entries, periodLabel, onOpenInvoice }) {
  const selectedEntries = [...(entries ?? [])].sort((a, b) => getFuelEntryDateValue(b) - getFuelEntryDateValue(a));
  const selectedLiters = selectedEntries.reduce((sum, entry) => sum + (entry.liters ?? 0), 0);
  const selectedCost = selectedEntries.reduce((sum, entry) => sum + (entry.cost ?? 0), 0);
  const selectedBrand = getVehicleBrand(selected);
  return (
    <section className="content-card fuel-detail report-section-card">
      <header className="fuel-detail__header">
        <div className="fuel-detail__identity"><span className={`vehicle-brand-mark vehicle-brand-mark--${selectedBrand.toLocaleLowerCase("es")}`}><img src={vehicleBrandLogos[selectedBrand]} alt={`Logotipo de ${selectedBrand}`} /></span><span><small>Vehículo seleccionado</small><strong>{selected.plate}</strong><small>{selected.model}</small></span></div>
        <div className="fuel-detail__totals"><span><small>Consumo mensual</small><strong>{selectedLiters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</strong></span><span><small>Gasto mensual</small><strong>{formatCurrency(selectedCost)}</strong></span></div>
      </header>
      {selected.fuelSchedule?.length > 0 ? (
        <div className="fuel-page-schedule" aria-label={`Horarios de los conductores de ${selected.plate}`}><span className="fuel-page-schedule__label"><IconClock size={16} /><strong>Asignación por horario</strong></span>{selected.fuelSchedule.map((shift) => <span className="fuel-page-shift" key={shift.label}><strong>{shift.driver}</strong><small>{shift.label}</small></span>)}</div>
      ) : (
        <div className="fuel-page-schedule fuel-page-schedule--manual"><span className="fuel-page-schedule__label"><IconUsers size={16} /><strong>Asignación manual</strong></span><small>Los conductores particulares se indican en cada registro.</small></div>
      )}
      <div className="fuel-ledger-period"><span><strong>Repostajes de {periodLabel}</strong><small>Ordenados del más reciente al más antiguo</small></span><strong>{selectedEntries.length} registros</strong></div>
      <div className="fuel-page-table-wrap">
        <table className="fuel-page-table">
          <caption className="sr-only">Repostajes diarios de {periodLabel.toLocaleLowerCase("es")} para {selected.plate}</caption>
          <thead><tr><th scope="col">Fecha</th><th scope="col">Hora</th><th scope="col">Conductor</th><th scope="col">Importe</th><th scope="col">Precio/Litro</th><th scope="col">Factura</th></tr></thead>
          <tbody>{selectedEntries.map((entry, index) => {
            const assignment = getFuelAssignment(selected, entry);
            const pricePerLiter = entry.liters ? entry.cost / entry.liters : 0;
            const invoice = {
              id: `PLG-${selected.plate.replace(/\s/g, "")}-${String(index + 1).padStart(2, "0")}`,
              provider: "Plenergy",
              date: entry.date,
              plate: selected.plate,
              driver: assignment.driver,
              concept: `Repostaje de ${entry.liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L`,
              liters: entry.liters,
              pricePerLiter,
              amount: entry.cost,
              source: "Cuenta Plenergy",
              status: "Descargada",
            };
            return <tr key={`${entry.date}-${entry.time}`}><td><strong>{entry.date.replace(/\s+\d{4}$/, "")}</strong></td><td><strong>{entry.time}</strong></td><td><span className="fuel-driver"><IconUsers size={14} /><strong>{assignment.driver}</strong></span></td><td><strong>{formatCurrency(entry.cost)}</strong></td><td>{formatCurrency(pricePerLiter)}</td><td><button type="button" className="fuel-invoice-button" onClick={() => onOpenInvoice(invoice)} aria-label={`Ver factura Plenergy de ${selected.plate} del ${entry.date} a las ${entry.time}`}><IconFileInvoice size={14} />Ver factura</button></td></tr>;
          })}</tbody>
        </table>
      </div>
      <footer className="fuel-detail__footer"><IconSparkles size={15} /><span>El conductor se determina automáticamente por la hora. Las facturas quedan archivadas desde la cuenta de la aplicación Plenergy.</span></footer>
    </section>
  );
}

function FuelExpenseReport({ stats, total }) {
  return (
    <section className="content-card report-table-card">
      <header className="card-header"><div><h2>Gasto de combustible</h2><p>Acumulado mensual de los cinco vehículos.</p></div><strong className="report-header-total">{formatCurrency(total)}</strong></header>
      <div className="table-scroll"><table className="module-table report-table"><thead><tr><th>Vehículo</th><th>Repostajes</th><th>Litros</th><th>Coste medio</th><th>Gasto mensual</th></tr></thead><tbody>{stats.map(({ vehicle, refuels, liters, cost }) => <tr key={vehicle.plate}><td><strong>{vehicle.plate}</strong><small>{vehicle.model}</small></td><td>{refuels}</td><td>{liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</td><td>{formatCurrency(refuels ? cost / refuels : 0)}</td><td><strong>{formatCurrency(cost)}</strong></td></tr>)}</tbody></table></div>
    </section>
  );
}

function FuelIncomeReport({ rows, total, month, year, periodMenu, selectedDriverKey, selectedVehiclePlate, onSelectDriver, onSelectVehicle, onTogglePeriodMenu, onSelectMonth, onSelectYear }) {
  return (
    <section className="content-card report-table-card">
      <header className="card-header billing-report-header">
        <div className="billing-report-heading"><h2>Facturación</h2></div>
        <div className="billing-report-header__actions">
          <div className="report-chart-filters billing-period-filters" role="group" aria-label="Periodo de Facturación">
            <div className="report-period-dropdown" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) onTogglePeriodMenu(""); }}>
              <span>Mes</span>
              <button type="button" className="report-period-trigger" aria-haspopup="listbox" aria-expanded={periodMenu === "billing-month"} onClick={() => onTogglePeriodMenu(periodMenu === "billing-month" ? "" : "billing-month")}><span>{reportMonths[month]}</span><IconChevronDown size={13} /></button>
              {periodMenu === "billing-month" ? <div className="report-period-menu report-period-menu--months report-period-menu--wheel" role="listbox" aria-label="Seleccionar mes de Facturación">{reportMonths.map((monthLabel, index) => <button type="button" role="option" aria-selected={month === index} className={month === index ? "selected" : ""} onClick={() => onSelectMonth(index)} key={monthLabel}>{monthLabel}{month === index ? <IconCheck size={12} /> : null}</button>)}</div> : null}
            </div>
            <div className="report-period-dropdown" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) onTogglePeriodMenu(""); }}>
              <span>Año</span>
              <button type="button" className="report-period-trigger report-period-trigger--year" aria-haspopup="listbox" aria-expanded={periodMenu === "billing-year"} onClick={() => onTogglePeriodMenu(periodMenu === "billing-year" ? "" : "billing-year")}><span>{year}</span><IconChevronDown size={13} /></button>
              {periodMenu === "billing-year" ? <div className="report-period-menu report-period-menu--years report-period-menu--wheel" role="listbox" aria-label="Seleccionar año de Facturación">{reportYears.map((yearOption) => <button type="button" role="option" aria-selected={year === yearOption} className={year === yearOption ? "selected" : ""} onClick={() => onSelectYear(yearOption)} key={yearOption}>{yearOption}{year === yearOption ? <IconCheck size={12} /> : null}</button>)}</div> : null}
            </div>
          </div>
          <strong className="report-header-total report-header-total--green">{formatCurrency(total)}</strong>
        </div>
      </header>
      <div className="table-scroll report-income-table-wrap">
        <table className="module-table report-table report-income-table">
          <caption className="sr-only">Ingresos mensuales, viajes y vehículo asignado por conductor</caption>
          <colgroup><col className="report-income-table__driver" /><col className="report-income-table__vehicle" /><col className="report-income-table__trips" /><col className="report-income-table__revenue" /></colgroup>
          <thead><tr><th scope="col">Conductor</th><th scope="col">Vehículo</th><th scope="col">Viajes</th><th scope="col">Ingreso mensual</th></tr></thead>
          <tbody>{rows.map((row) => <tr className={`${selectedDriverKey === row.key ? "report-income-row--selected " : ""}${selectedVehiclePlate === row.plate ? "report-income-row--vehicle-selected" : ""}`} key={row.key}><td><button type="button" className="report-income-driver-button" onClick={() => onSelectDriver(row.key)} aria-expanded={selectedDriverKey === row.key} aria-controls="driver-billing-calendar"><span>{row.driver}</span><small>Ver calendario</small></button></td><td><button type="button" className="report-income-vehicle-button" onClick={() => onSelectVehicle(row.plate)} aria-expanded={selectedVehiclePlate === row.plate} aria-controls="vehicle-billing-summary" aria-label={`Ver facturación conjunta de ${row.plate}`}><strong>{row.plate}</strong><small>{row.model}</small></button></td><td><strong>{row.trips}</strong></td><td><strong>{formatCurrency(row.revenue)}</strong></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

function VehicleBillingSummary({ vehicle, rows, month, year }) {
  const total = rows.reduce((sum, row) => sum + row.revenue, 0);
  return (
    <section className="content-card vehicle-billing-summary" id="vehicle-billing-summary" aria-labelledby="vehicle-billing-summary-title">
      <header className="vehicle-billing-summary__header">
        <div><span className="vehicle-billing-summary__label"><IconCar size={15} />Facturación conjunta</span><h3 id="vehicle-billing-summary-title">{vehicle.plate}</h3><small>{vehicle.model} · {reportMonths[month]} {year}</small></div>
        <strong>{formatCurrency(total)}</strong>
      </header>
      <div className="vehicle-billing-summary__drivers">
        {rows.map((row) => <div key={row.key}><span><strong>{row.driver}</strong><small>{row.trips} viajes</small></span><strong>{formatCurrency(row.revenue)}</strong></div>)}
      </div>
    </section>
  );
}

function DriverBillingCalendar({ row, month, year, onClose }) {
  const billingDays = getDriverBillingDays(row.driver, row.plate, month, year, row.revenue);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = (new Date(year, month, 1).getDay() + 6) % 7;
  const calendarCells = [
    ...Array.from({ length: leadingDays }, (_, index) => ({ key: `leading-${index}`, empty: true })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1 })),
  ];

  return (
    <section className="content-card driver-billing-calendar" id="driver-billing-calendar" aria-labelledby="driver-billing-calendar-title">
      <header className="driver-billing-calendar__header">
        <div className="driver-billing-calendar__identity">
          <span className="avatar report-driver-avatar">{row.driver.slice(0, 2).toUpperCase()}</span>
          <span><strong id="driver-billing-calendar-title">{row.driver}</strong><small>{row.plate} · {row.model}</small></span>
        </div>
        <div className="driver-billing-calendar__summary"><span><small>{reportMonths[month]} {year}</small><strong>{formatCurrency(row.revenue)}</strong></span><button type="button" onClick={onClose} aria-label={`Cerrar calendario de ${row.driver}`}><IconX size={17} /></button></div>
      </header>
      <div className="driver-billing-calendar__weekdays" aria-hidden="true">{calendarWeekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}</div>
      <div className="driver-billing-calendar__grid" role="grid" aria-label={`Facturación diaria de ${row.driver} en ${reportMonths[month]} de ${year}`}>
        {calendarCells.map((cell) => cell.empty
          ? <span className="driver-billing-day driver-billing-day--empty" aria-hidden="true" key={cell.key} />
          : <div className={billingDays.has(cell.day) ? "driver-billing-day driver-billing-day--active" : "driver-billing-day"} role="gridcell" aria-label={billingDays.has(cell.day) ? `${cell.day} de ${reportMonths[month]}: ${formatCurrency(billingDays.get(cell.day))}` : `${cell.day} de ${reportMonths[month]}: sin facturación`} key={cell.key}><span>{cell.day}</span>{billingDays.has(cell.day) ? <strong>{formatCurrency(billingDays.get(cell.day))}</strong> : <small>—</small>}</div>)}
      </div>
      <footer className="driver-billing-calendar__footer"><span><strong>{billingDays.size}</strong> días con facturación</span><span>Total del mes <strong>{formatCurrency(row.revenue)}</strong></span></footer>
    </section>
  );
}

function FuelDriversReport({ vehicles, selectedDriverKey, onSelectDriver }) {
  const professional = vehicles.filter((vehicle) => vehicle.use === "Profesional");
  return (
    <section className="report-drivers-grid" aria-label="Conductores y turnos profesionales">
      {professional.map((vehicle) => <article className="report-driver-vehicle" key={vehicle.plate}><header><span><IconCar size={18} /></span><div><strong>{vehicle.plate}</strong><small>{vehicle.model}</small></div></header><div>{vehicle.fuelSchedule.map((shift) => {
        const driverKey = `${vehicle.plate}-${shift.driver}`;
        return <button type="button" className={selectedDriverKey === driverKey ? "report-driver-shift report-driver-shift--selected" : "report-driver-shift"} onClick={() => onSelectDriver(driverKey)} aria-expanded={selectedDriverKey === driverKey} aria-controls="driver-billing-calendar" key={shift.label}><span className="avatar report-driver-avatar">{shift.driver.slice(0, 2).toUpperCase()}</span><span><strong>{shift.driver}</strong><small>{shift.label}</small></span><IconClock size={16} /></button>;
      })}</div></article>)}
    </section>
  );
}

function DriversView({ vehicles, setModal }) {
  const [reportMonth, setReportMonth] = useState(6);
  const [reportYear, setReportYear] = useState(2026);
  const [selectedDriverKey, setSelectedDriverKey] = useState("");
  const [selectedDay, setSelectedDay] = useState(null);
  const [calendarSwipeOffset, setCalendarSwipeOffset] = useState(0);
  const [calendarSwipeTransition, setCalendarSwipeTransition] = useState(false);
  const driverGridRef = useRef(null);
  const calendarRef = useRef(null);
  const calendarSurfaceRef = useRef(null);
  const touchStartX = useRef(null);
  const calendarSwipeWidth = useRef(0);
  const swipeResetTimer = useRef(null);
  const professionalVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.use === "Profesional"), [vehicles]);
  const periodFactor = getReportPeriodFactor(reportMonth, reportYear);
  const billingRows = useMemo(() => professionalVehicles.flatMap((vehicle, vehicleIndex) => vehicle.drivers.map((driver, driverIndex) => {
    const activity = getDriverDay(vehicle, driver);
    return {
      key: `${vehicle.plate}-${driver}`,
      driver,
      plate: vehicle.plate,
      model: vehicle.model,
      trips: Math.round(activity.monthTrips * periodFactor),
      revenue: Math.round(activity.monthRevenue * periodFactor * (1 + ((vehicleIndex + driverIndex) % 3 - 1) * 0.018)),
    };
  })), [professionalVehicles, periodFactor]);
  const fuelSummaries = useMemo(() => professionalVehicles.map((vehicle) => {
    const entries = (vehicle.monthlyFuel ?? []).map((entry) => ({
      ...entry,
      liters: Number(((entry.liters ?? 0) * periodFactor).toFixed(2)),
      cost: Number(((entry.cost ?? 0) * periodFactor).toFixed(2)),
    }));
    return {
      vehicle,
      liters: entries.reduce((sum, entry) => sum + entry.liters, 0),
      cost: entries.reduce((sum, entry) => sum + entry.cost, 0),
      refuels: entries.length,
    };
  }), [professionalVehicles, periodFactor]);
  const driverRows = useMemo(() => billingRows.map((row) => {
    const vehicle = professionalVehicles.find((candidate) => candidate.plate === row.plate);
    const fuelEntries = getDriverFuelEntriesForPeriod(vehicle, row.driver, reportMonth, reportYear);
    return {
      ...row,
      vehicle,
      fuelEntries,
      fuelLiters: fuelEntries.reduce((sum, entry) => sum + entry.liters, 0),
      fuelCost: fuelEntries.reduce((sum, entry) => sum + entry.cost, 0),
    };
  }), [billingRows, professionalVehicles, reportMonth, reportYear]);
  const selectedDriver = driverRows.find((row) => row.key === selectedDriverKey) ?? null;
  const calendarRows = useMemo(() => selectedDriver ? getDriverCalendarRows(selectedDriver.vehicle, selectedDriver, reportMonth, reportYear) : [], [selectedDriver, reportMonth, reportYear]);
  const selectedDayDetail = calendarRows.find((row) => row.day === selectedDay) ?? null;
  const calendarPeriods = useMemo(() => {
    if (!selectedDriver) return [];
    return [-1, 0, 1].map((delta) => {
      const date = new Date(reportYear, reportMonth + delta, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      const rows = getDriverCalendarRows(selectedDriver.vehicle, selectedDriver, month, year);
      const leadingDays = (new Date(year, month, 1).getDay() + 6) % 7;
      return {
        key: `${year}-${month}`,
        delta,
        month,
        year,
        cells: [...Array.from({ length: leadingDays }, (_, index) => ({ key: `leading-${year}-${month}-${index}`, empty: true })), ...rows.map((row) => ({ ...row, key: `day-${year}-${month}-${row.day}` }))],
      };
    });
  }, [selectedDriver, reportMonth, reportYear]);
  const totalBilling = billingRows.reduce((sum, row) => sum + row.revenue, 0);
  const totalFuel = fuelSummaries.reduce((sum, summary) => sum + summary.cost, 0);

  useEffect(() => {
    if (!selectedDriver) {
      setSelectedDay(null);
      return;
    }
    setSelectedDay((current) => current && calendarRows.some((row) => row.day === current)
      ? current
      : calendarRows.find((row) => row.active)?.day ?? 1);
  }, [selectedDriver?.key, reportMonth, reportYear]);

  useEffect(() => {
    if (!selectedDriverKey) return undefined;
    const frame = window.requestAnimationFrame(() => calendarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [selectedDriverKey]);

  useEffect(() => () => {
    if (swipeResetTimer.current) window.clearTimeout(swipeResetTimer.current);
  }, []);

  const selectDriver = (row) => {
    setSelectedDriverKey(row.key);
    const nextCalendarRows = getDriverCalendarRows(row.vehicle, row, reportMonth, reportYear);
    setSelectedDay(nextCalendarRows.find((calendarRow) => calendarRow.active)?.day ?? 1);
  };
  const shiftMonth = (delta) => {
    const next = new Date(reportYear, reportMonth + delta, 1);
    setReportMonth(next.getMonth());
    setReportYear(next.getFullYear());
    setSelectedDay(null);
  };
  const getCalendarSwipeWidth = () => {
    const width = calendarSurfaceRef.current?.clientWidth ?? 360;
    calendarSwipeWidth.current = width;
    return width;
  };
  const beginCalendarSwipe = (clientX) => {
    touchStartX.current = clientX ?? null;
    getCalendarSwipeWidth();
    setCalendarSwipeTransition(false);
    setCalendarSwipeOffset(0);
  };
  const moveCalendarSwipe = (clientX) => {
    if (touchStartX.current === null) return;
    const delta = (clientX ?? touchStartX.current) - touchStartX.current;
    const width = calendarSwipeWidth.current || 360;
    setCalendarSwipeOffset(Math.max(-width, Math.min(width, delta)));
  };
  const endCalendarSwipe = (clientX) => {
    if (touchStartX.current === null) return;
    const delta = (clientX ?? touchStartX.current) - touchStartX.current;
    const width = calendarSwipeWidth.current || 360;
    touchStartX.current = null;
    if (swipeResetTimer.current) window.clearTimeout(swipeResetTimer.current);
    if (Math.abs(delta) >= Math.min(80, Math.max(46, width * .14))) {
      setCalendarSwipeTransition(true);
      setCalendarSwipeOffset(delta < 0 ? -width : width);
      swipeResetTimer.current = window.setTimeout(() => {
        shiftMonth(delta < 0 ? 1 : -1);
        setCalendarSwipeOffset(0);
        setCalendarSwipeTransition(false);
      }, 220);
      return;
    }
    setCalendarSwipeTransition(true);
    setCalendarSwipeOffset(0);
  };
  const onCalendarPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    beginCalendarSwipe(event.clientX);
  };
  const onCalendarPointerMove = (event) => moveCalendarSwipe(event.clientX);
  const onCalendarPointerUp = (event) => endCalendarSwipe(event.clientX);
  const onCalendarPointerCancel = () => {
    touchStartX.current = null;
    setCalendarSwipeTransition(true);
    setCalendarSwipeOffset(0);
  };
  const scrollToDrivers = () => driverGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const openFuelInvoice = (entry, index) => {
    const pricePerLiter = entry.liters ? entry.cost / entry.liters : 0;
    setModal({
      type: "invoice",
      item: {
        id: `PLG-${selectedDriver.plate.replace(/\s/g, "")}-${selectedDriver.driver.replace(/\s/g, "")}-${index + 1}`,
        provider: "Plenergy",
        date: entry.date,
        plate: selectedDriver.plate,
        driver: selectedDriver.driver,
        concept: `Repostaje de ${entry.liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L`,
        liters: entry.liters,
        pricePerLiter,
        amount: entry.cost,
        source: "Cuenta Plenergy",
        status: "Descargada",
      },
    });
  };
  const renderCalendarPage = (period) => (
    <div className="drivers-calendar-page" key={period.key}>
      {period.delta !== 0 && <div className="drivers-calendar-page__period">{reportMonths[period.month]} {period.year}</div>}
      <div className="drivers-calendar-legend"><span><i className="drivers-calendar-legend__swatch drivers-calendar-legend__swatch--billing" />Facturación</span><span><i className="drivers-calendar-legend__swatch drivers-calendar-legend__swatch--fuel" />Repostaje</span><small>Desliza para cambiar de mes</small></div>
      <div className="drivers-calendar-weekdays" aria-hidden="true">{calendarWeekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}</div>
      <div className="drivers-calendar-grid" role="grid" aria-label={`Facturación y consumo de ${selectedDriver.driver} en ${reportMonths[period.month]} de ${period.year}`}>
        {period.cells.map((cell) => cell.empty
          ? <span className="drivers-calendar-day drivers-calendar-day--empty" aria-hidden="true" key={cell.key} />
          : <button type="button" className={`drivers-calendar-day${cell.billing > 0 ? " drivers-calendar-day--billing" : ""}${cell.fuelCost > 0 ? " drivers-calendar-day--fuel" : ""}${period.delta === 0 && selectedDay === cell.day ? " drivers-calendar-day--selected" : ""}`} role="gridcell" tabIndex={period.delta === 0 ? 0 : -1} onClick={() => period.delta === 0 && setSelectedDay(cell.day)} aria-label={`${cell.day} de ${reportMonths[period.month]}: ${formatCurrency(cell.billing)} de facturación y ${formatCurrency(cell.fuelCost)} de repostaje`} key={cell.key}><span>{cell.day}</span><span className="drivers-calendar-day__values">{cell.billing > 0 && <small className="drivers-calendar-day__billing">{formatShortCurrency(cell.billing)}</small>}{cell.fuelCost > 0 && <small className="drivers-calendar-day__fuel">-{formatShortCurrency(cell.fuelCost)}</small>}</span></button>)}
      </div>
    </div>
  );

  return (
    <section className={`module-page drivers-page${selectedDriver ? " drivers-page--calendar-open" : ""}`}>
      <div className="drivers-summary-grid">
        <button type="button" className="drivers-summary-card drivers-summary-card--billing" onClick={scrollToDrivers}>
          <header><span className="drivers-summary-card__icon"><IconFileInvoice size={16} /></span><span><strong>Facturación</strong><small>{reportMonths[reportMonth]} {reportYear} · 3 coches</small></span><strong className="drivers-summary-card__total">{formatCurrency(totalBilling)}</strong></header>
          <div>{professionalVehicles.map((vehicle) => { const total = billingRows.filter((row) => row.plate === vehicle.plate).reduce((sum, row) => sum + row.revenue, 0); return <span key={vehicle.plate}><small className="drivers-summary-card__vehicle-plate">{vehicle.plate}</small><strong className="drivers-summary-card__vehicle-total">{formatCurrency(total)}</strong></span>; })}</div>
        </button>
        <button type="button" className="drivers-summary-card drivers-summary-card--fuel" onClick={scrollToDrivers}>
          <header><span className="drivers-summary-card__icon"><IconGasStation size={16} /></span><span><strong>Consumo</strong><small>{reportMonths[reportMonth]} {reportYear} · 3 coches</small></span><strong className="drivers-summary-card__total">{formatCurrency(totalFuel)}</strong></header>
          <div>{fuelSummaries.map((summary) => <span key={summary.vehicle.plate}><small className="drivers-summary-card__vehicle-plate">{summary.vehicle.plate}</small><strong className="drivers-summary-card__vehicle-total">{formatCurrency(summary.cost)}</strong></span>)}</div>
        </button>
      </div>

      <div ref={driverGridRef} className="drivers-list" aria-label="Seis conductores profesionales">
        {driverRows.map((row) => <button type="button" className={selectedDriverKey === row.key ? "driver-list-card driver-list-card--active" : "driver-list-card"} key={row.key} onClick={() => selectDriver(row)} aria-pressed={selectedDriverKey === row.key} aria-label={`Ver calendario de ${row.driver}`}>
          <span className="driver-list-card__identity"><strong>{row.driver}</strong><small><strong className="driver-list-card__plate">{row.plate}</strong></small></span>
          <span className="driver-list-card__metric driver-list-card__metric--billing" aria-label={`Facturación ${formatCurrency(row.revenue)}`}><strong>{formatCurrency(row.revenue)}</strong></span>
          <span className="driver-list-card__metric driver-list-card__metric--fuel" aria-label={`Consumo ${formatCurrency(row.fuelCost)}`}><strong>{formatCurrency(row.fuelCost)}</strong></span>
        </button>)}
      </div>

      {selectedDriver && <section ref={calendarRef} className="drivers-calendar-card" aria-labelledby="drivers-calendar-title">
        <header className="drivers-calendar-card__header">
          <button type="button" className="drivers-calendar-nav" onClick={() => shiftMonth(-1)} aria-label="Mes anterior"><IconChevronLeft size={18} /></button>
          <div><strong id="drivers-calendar-title">{selectedDriver.driver}</strong><small>{reportMonths[reportMonth]} {reportYear}</small></div>
          <div className="drivers-calendar-card__actions"><button type="button" className="drivers-calendar-nav" onClick={() => shiftMonth(1)} aria-label="Mes siguiente"><IconChevronRight size={18} /></button><button type="button" className="icon-button" onClick={() => setSelectedDriverKey("")} aria-label={`Cerrar calendario de ${selectedDriver.driver}`}><IconX size={17} /></button></div>
        </header>
        <div ref={calendarSurfaceRef} className="drivers-calendar-surface" onPointerDown={onCalendarPointerDown} onPointerMove={onCalendarPointerMove} onPointerUp={onCalendarPointerUp} onPointerCancel={onCalendarPointerCancel}>
          <div className="drivers-calendar-track" style={{ transform: `translate3d(calc(-33.333333% + ${calendarSwipeOffset}px), 0, 0)`, transition: calendarSwipeTransition ? "transform 220ms cubic-bezier(.22,.75,.3,1)" : "none" }}>
            {calendarPeriods.map(renderCalendarPage)}
          </div>
        </div>
      </section>}

      {selectedDriver && selectedDayDetail && <section className="driver-day-detail" aria-label={`Detalle de ${selectedDriver.driver}`}>
        <div className="driver-day-detail__columns">
          <article className="driver-day-panel driver-day-panel--billing"><header><IconFileInvoice size={17} /><strong>Facturación</strong></header><div className="driver-day-panel__metrics"><span><small>Ingreso del día</small><strong>{formatCurrency(selectedDayDetail.billing)}</strong></span><span><small>Viajes</small><strong>{selectedDayDetail.trips}</strong></span><span><small>Km diarios</small><strong>{formatKm(selectedDayDetail.km)}</strong></span><span><small>Km totales</small><strong>{formatKm(selectedDayDetail.totalKm)}</strong></span></div></article>
          <article className="driver-day-panel driver-day-panel--fuel"><header><IconGasStation size={17} /><strong>Repostaje</strong></header><div className="driver-day-panel__metrics"><span><small>Consumo diario</small><strong>{selectedDayDetail.fuelLiters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</strong></span><span><small>Importe</small><strong>{formatCurrency(selectedDayDetail.fuelCost)}</strong></span><span><small>Repostajes</small><strong>{selectedDayDetail.fuelEntries.length}</strong></span></div><div className="driver-day-fuel-list">{selectedDayDetail.fuelEntries.length > 0 ? selectedDayDetail.fuelEntries.map((entry, index) => <div key={`${entry.date}-${entry.time}`}><span><strong>{entry.time}</strong><small>{entry.liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L · {formatCurrency(entry.cost)}</small></span><button type="button" className="fuel-invoice-button drivers-day-invoice-button" onClick={() => openFuelInvoice(entry, index)}><IconFileInvoice size={13} />Factura</button></div>) : <small>Sin repostaje registrado este día.</small>}</div></article>
        </div>
      </section>}
    </section>
  );
}

function ReadingsView({ setModal }) {
  const [readingFilter, setReadingFilter] = useState("Todas");
  const visible = readingSeed.filter((reading) => readingFilter === "Todas" || reading.status === readingFilter);
  return (
    <section className="module-page">
      <PageIntro eyebrow="WhatsApp + IA" title="Lecturas de kilometraje" description="Revisa la extracción automática antes de incorporarla al historial del vehículo." action={<button className="primary-button" onClick={() => setModal({ type: "reading" })}><IconUpload size={18} />Nueva lectura</button>} />
      <div className="metric-cards">
        <MetricCard icon={IconBrandWhatsapp} label="Recibidas hoy" value="8" detail="Última a las 22:08" />
        <MetricCard icon={IconAlertTriangle} label="Por revisar" value="2" detail="Confianza inferior al 95%" tone="amber" />
        <MetricCard icon={IconSparkles} label="Precisión media" value="97,1%" detail="Extracción automática" />
      </div>
      <section className="content-card">
        <header className="card-header"><div><h2>Bandeja de lecturas</h2><p>Imágenes recibidas por WhatsApp y procesadas automáticamente.</p></div><div className="segmented">{["Todas", "Revisar", "Validada"].map((name) => <button className={readingFilter === name ? "active" : ""} key={name} onClick={() => setReadingFilter(name)}>{name}</button>)}</div></header>
        <div className="table-scroll">
          <table className="module-table">
            <thead><tr><th>Lectura</th><th>Conductor</th><th>Vehículo</th><th>Odómetro total</th><th>Km diarios</th><th>Confianza IA</th><th>Estado</th><th /></tr></thead>
            <tbody>{visible.map((reading) => <tr key={reading.id}><td><strong>{reading.id}</strong><small>{reading.time}</small></td><td>{reading.driver}</td><td><strong>{reading.plate}</strong></td><td>{formatKm(reading.total)}</td><td>{formatKm(reading.daily)}</td><td><span className="confidence"><i style={{ width: `${reading.confidence}%` }} />{reading.confidence}%</span></td><td><StatusBadge status={reading.status} /></td><td><button className="table-action" onClick={() => setModal({ type: "reading-review", item: reading })}>Revisar<IconChevronRight size={16} /></button></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function InvoicesView({ invoices, setModal }) {
  const total = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  return (
    <section className="module-page">
      <PageIntro eyebrow="Correo del taller" title="Facturas" description="Facturas recibidas, conceptos extraídos y asociación automática con cada vehículo." action={<button className="primary-button" onClick={() => setModal({ type: "invoice-upload" })}><IconUpload size={18} />Subir factura</button>} />
      <div className="metric-cards">
        <MetricCard icon={IconCurrencyEuro} label="Gasto registrado" value={formatCurrency(total)} detail={`${invoices.length} facturas este periodo`} />
        <MetricCard icon={IconMail} label="Recibidas por correo" value="4" detail="80% del total" />
        <MetricCard icon={IconAlertTriangle} label="Requieren revisión" value="2" detail="Una sin vehículo asociado" tone="amber" />
      </div>
      <section className="content-card">
        <header className="card-header"><div><h2>Facturas recientes</h2><p>Ordenadas por fecha de recepción.</p></div><button className="secondary-button"><IconRefresh size={17} />Actualizar correo</button></header>
        <div className="table-scroll">
          <table className="module-table">
            <thead><tr><th>Factura</th><th>Taller</th><th>Vehículo</th><th>Concepto</th><th>Origen</th><th>Importe</th><th>Estado</th><th /></tr></thead>
            <tbody>{invoices.map((invoice) => <tr key={invoice.id}><td><strong>{invoice.id}</strong><small>{invoice.date}</small></td><td>{invoice.provider}</td><td><strong>{invoice.plate}</strong></td><td>{invoice.concept}</td><td><span className="source-label">{invoice.source === "Correo" ? <IconMail size={15} /> : invoice.source === "Foto" ? <IconCamera size={15} /> : <IconUpload size={15} />}{invoice.source}</span></td><td><strong>{formatCurrency(invoice.amount)}</strong></td><td><StatusBadge status={invoice.status} /></td><td><button className="table-action" onClick={() => setModal({ type: "invoice", item: invoice })}>Ver factura<IconChevronRight size={16} /></button></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function LegacyMaintenanceView({ initialPlate, setModal, vehicles }) {
  const [workshopPlate, setWorkshopPlate] = useState(initialPlate);
  const schedule = vehicles;
  const nextServiceVehicle = [...vehicles].sort((a, b) => (a.nextServiceKm - a.odometer) - (b.nextServiceKm - b.odometer))[0];
  const workshopVehicle = vehicles.find((vehicle) => vehicle.plate === workshopPlate) ?? vehicles[0];
  const julyMaintenance = vehicles.flatMap((vehicle) => vehicle.maintenance).filter((item) => item.dateIso?.startsWith("2026-07") || item.date.toLocaleLowerCase("es").includes("jul 2026"));
  const julyTotal = julyMaintenance.reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    setWorkshopPlate(initialPlate);
  }, [initialPlate]);

  const showWorkshop = (plate) => {
    setWorkshopPlate(plate);
    window.setTimeout(() => document.getElementById("taller-vehiculo")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  };

  return (
    <section className="module-page">
      <PageIntro eyebrow="Plan preventivo" title="Mantenimiento y taller" description="Prioriza revisiones, consulta el historial completo y crea facturas desde una fotografía." action={<button className="primary-button" onClick={() => showWorkshop(nextServiceVehicle.plate)}><IconCalendar size={18} />Abrir próxima revisión</button>} />
      <div className="maintenance-layout">
        <section className="content-card schedule-card">
          <header className="card-header"><div><h2>Vehículos</h2><p>Profesionales primero y particulares después.</p></div></header>
          <div className="schedule-list">{schedule.map((vehicle, index) => {
            const remaining = vehicle.nextServiceKm - vehicle.odometer;
            return <button key={vehicle.plate} className="schedule-row" onClick={() => showWorkshop(vehicle.plate)}><span className={`schedule-index ${remaining <= 5000 ? "urgent" : ""}`}>{index + 1}</span><span><strong>{vehicle.plate}</strong><small>{vehicle.model}</small></span><span><strong>{formatKm(remaining)}</strong><small>{vehicle.serviceDate}</small></span><IconChevronRight size={18} /></button>;
          })}</div>
        </section>
        <aside className="content-card maintenance-summary">
          <span className="metric-card__icon"><IconTools size={22} /></span>
          <h2>Resumen de julio</h2>
          <strong>{formatCurrency(julyTotal)}</strong>
          <p>{julyMaintenance.length} intervenciones registradas, incluidas las facturas creadas desde una fotografía.</p>
          <div><span>Preventivo</span><strong>68%</strong></div><div><span>Correctivo</span><strong>32%</strong></div>
        </aside>
      </div>
      <section className="content-card workshop-module" id="taller-vehiculo">
        <header className="card-header"><div><h2>Taller por vehículo</h2><p>Selecciona un coche para consultar intervenciones, conceptos e importes.</p></div><button className="primary-button" onClick={() => setModal({ type: "invoice-upload", plate: workshopVehicle.plate })}><IconCamera size={17} />Factura desde foto</button></header>
        <div className="workshop-module__layout">
          <nav className="workshop-vehicle-list" aria-label="Vehículos con historial de taller">
            {vehicles.map((vehicle) => {
              const latest = vehicle.maintenance[0];
              return <button className={vehicle.plate === workshopVehicle.plate ? "active" : ""} key={vehicle.plate} onClick={() => setWorkshopPlate(vehicle.plate)} aria-current={vehicle.plate === workshopVehicle.plate ? "true" : undefined}><span><strong>{vehicle.plate}</strong><small>{vehicle.model}</small></span><span><strong>{formatCurrency(latest.amount)}</strong><small>{latest.concept}</small></span><IconChevronRight size={17} /></button>;
            })}
          </nav>
          <WorkshopHistory vehicle={workshopVehicle} />
        </div>
      </section>
      <section className="content-card">
        <header className="card-header"><div><h2>Últimas intervenciones</h2><p>Consulta rápida de fecha, kilometraje, concepto e importe.</p></div></header>
        <div className="table-scroll"><table className="module-table"><thead><tr><th>Vehículo</th><th>Fecha</th><th>Kilometraje</th><th>Concepto</th><th>Importe</th><th /></tr></thead><tbody>{vehicles.map((vehicle) => {
          const item = vehicle.maintenance[0];
          return <tr key={vehicle.plate}><td><strong>{vehicle.plate}</strong><small>{vehicle.model}</small></td><td>{item.date}</td><td>{formatKm(item.km)}</td><td>{item.concept}</td><td><strong>{formatCurrency(item.amount)}</strong></td><td><button className="table-action" onClick={() => showWorkshop(vehicle.plate)}>Historial<IconChevronRight size={16} /></button></td></tr>;
        })}</tbody></table></div>
      </section>
    </section>
  );
}

function MaintenanceView({ initialPlate, invoices, setModal, vehicles }) {
  const [workshopPlate, setWorkshopPlate] = useState(initialPlate);
  const [openMaintenanceKey, setOpenMaintenanceKey] = useState("");
  const [openConceptKey, setOpenConceptKey] = useState("");
  const workshopVehicle = vehicles.find((vehicle) => vehicle.plate === workshopPlate) ?? vehicles[0];
  const selectedBrand = getVehicleBrand(workshopVehicle);
  const sortedMaintenance = [...workshopVehicle.maintenance].sort((a, b) => getMaintenanceDateValue(b) - getMaintenanceDateValue(a));
  const maintenanceRecords = sortedMaintenance.map((item) => {
    const invoice = getMaintenanceInvoice(item, workshopVehicle, invoices);
    const details = invoice?.items?.length ? invoice.items : [{ concept: item.concept, amount: item.amount }];
    return { item, invoice, details };
  });
  const total = sortedMaintenance.reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    setWorkshopPlate(initialPlate);
  }, [initialPlate]);

  useEffect(() => {
    const first = [...workshopVehicle.maintenance].sort((a, b) => getMaintenanceDateValue(b) - getMaintenanceDateValue(a))[0];
    setOpenMaintenanceKey(first ? `${first.date}-${first.concept}-${first.km}` : "");
    setOpenConceptKey("");
  }, [workshopVehicle.plate]);

  useEffect(() => {
    if (!openConceptKey) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setOpenConceptKey(""); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [openConceptKey]);

  const selectWorkshopVehicle = (plate) => {
    setWorkshopPlate(plate);
    window.setTimeout(() => document.getElementById("historial-mantenimiento")?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 40);
  };

  return (
    <section className="module-page">
      <nav className="maintenance-vehicle-banners" aria-label="Vehículos de la flota">
        {vehicles.map((vehicle, index) => {
          const brand = getVehicleBrand(vehicle);
          const latest = [...vehicle.maintenance].sort((a, b) => getMaintenanceDateValue(b) - getMaintenanceDateValue(a))[0];
          const remaining = vehicle.nextServiceKm - vehicle.odometer;
          const isActive = vehicle.plate === workshopVehicle.plate;
          return (
            <button className={`maintenance-vehicle-banner ${isActive ? "active" : ""}`} key={vehicle.plate} onClick={() => selectWorkshopVehicle(vehicle.plate)} aria-label={`Abrir historial de ${vehicle.plate}, ${vehicle.model}`} aria-current={isActive ? "true" : undefined}>
              <span className="maintenance-vehicle-number">{index + 1}</span>
              <span className={`vehicle-brand-mark vehicle-brand-mark--${brand.toLocaleLowerCase("es")}`}><img src={vehicleBrandLogos[brand]} alt={`Logotipo de ${brand}`} /></span>
              <span className="maintenance-vehicle-identity"><small>{brand}</small><strong>{vehicle.plate}</strong><span>{vehicle.model}</span></span>
              <span className="maintenance-vehicle-type"><StatusBadge status={vehicle.use} /></span>
              <span className="maintenance-vehicle-latest"><small>Última actuación</small><strong>{latest ? formatMaintenanceDate(latest) : "Sin registros"}</strong><span>{latest?.concept ?? "—"}</span></span>
              <span className="maintenance-vehicle-service"><small>Próxima revisión</small><strong>{formatKm(remaining)}</strong><span>{vehicle.serviceDate}</span></span>
              <IconChevronRight className="maintenance-vehicle-chevron" size={21} />
            </button>
          );
        })}
      </nav>
      <div className="maintenance-vehicle-divider" aria-hidden="true" />
      <section className="content-card maintenance-history-panel" id="historial-mantenimiento">
        <header className="maintenance-history-header">
          <div className="maintenance-history-vehicle">
            <span className={`vehicle-brand-mark vehicle-brand-mark--${selectedBrand.toLocaleLowerCase("es")}`}><img src={vehicleBrandLogos[selectedBrand]} alt="" /></span>
            <span><h2>{workshopVehicle.plate}</h2></span>
          </div>
          <div className="maintenance-history-total"><small>{sortedMaintenance.length} intervenciones</small><strong>{formatCurrency(total)}</strong></div>
        </header>
        <div className="maintenance-timeline" aria-label={`Historial de mantenimiento de ${workshopVehicle.plate}`}>
          <header className="maintenance-timeline-heading">
            <span><span className="maintenance-timeline-heading__icon"><IconTools size={14} /></span><strong>INTERVENCIONES REALIZADAS</strong></span>
          </header>
          {maintenanceRecords.map(({ item, invoice, details }) => {
            const key = `${item.date}-${item.concept}-${item.km}`;
            const isOpen = openMaintenanceKey === key;
            const detailId = `detail-${workshopVehicle.plate.replace(/\s/g, "")}-${item.km}`;
            return (
              <article className={`maintenance-event ${isOpen ? "is-open" : ""} ${invoice ? "has-invoice" : "without-invoice"}`} key={key}>
                <button className="maintenance-event-date" onClick={() => setOpenMaintenanceKey(isOpen ? "" : key)} aria-expanded={isOpen} aria-controls={detailId}>
                  <IconCalendar size={18} /><span><strong>{formatMaintenanceDate(item)}</strong><small>{formatKm(item.km)}</small></span><IconChevronDown className="maintenance-event-toggle" size={18} />
                </button>
                <div className="maintenance-event-summary"><small>Trabajo realizado</small><strong>{item.concept}</strong><span className="maintenance-event-summary__amount">{formatCurrency(item.amount)}</span></div>
                <div className="maintenance-event-invoice">
                  {invoice ? <button onClick={() => setModal({ type: "invoice", item: invoice })} aria-label={`Abrir factura ${invoice.id}`}><IconFileInvoice size={18} /><span><strong>Abrir factura</strong><small>{invoice.id}</small></span></button> : <span className="maintenance-invoice-unavailable"><IconFileInvoice size={18} /><span><strong>Sin factura</strong><small>No proporcionada</small></span></span>}
                </div>
                {isOpen && <div className="maintenance-event-detail" id={detailId}>
                  <header><strong>Trabajos realizados</strong><small>{invoice?.provider ?? "Registro de mantenimiento"}</small></header>
                  <div>{details.map((detail, index) => {
                    const conceptKey = `${key}-${index}`;
                    const conceptMatchId = `coincidencias-${workshopVehicle.plate.replace(/\s/g, "")}-${item.km}-${index}`;
                    const isConceptOpen = openConceptKey === conceptKey;
                    const normalizedConcept = normalizeText(detail.concept).trim();
                    const matches = maintenanceRecords.flatMap((record) => record.details
                      .filter((candidate) => normalizeText(candidate.concept).trim() === normalizedConcept)
                      .map((candidate) => ({
                        date: formatMaintenanceDate(record.item),
                        km: record.item.km,
                        concept: candidate.concept,
                        amount: Number(candidate.amount),
                      })));
                    return <div className={`maintenance-work-item ${isConceptOpen ? "is-open" : ""}`} key={`${detail.concept}-${index}`}>
                      <button type="button" className="maintenance-work-item__trigger" onClick={() => setOpenConceptKey(isConceptOpen ? "" : conceptKey)} aria-expanded={isConceptOpen} aria-controls={conceptMatchId} aria-label={`Ver todas las coincidencias de ${detail.concept}`}>
                        <span><IconCheck size={15} />{detail.concept}</span><span><strong>{formatCurrency(Number(detail.amount))}</strong><IconChevronDown size={16} /></span>
                      </button>
                      {isConceptOpen && <div className="maintenance-concept-matches" id={conceptMatchId}>
                        <header><strong>Coincidencias de «{detail.concept}»</strong><small>{matches.length} {matches.length === 1 ? "registro" : "registros"}</small></header>
                        <div role="table" aria-label={`Coincidencias de ${detail.concept}`}>
                          <div role="row" className="maintenance-concept-matches__head"><span role="columnheader">Fecha</span><span role="columnheader">Kilometraje</span><span role="columnheader">Concepto</span><span role="columnheader">Importe</span></div>
                          {matches.map((match, matchIndex) => <div role="row" key={`${match.date}-${match.km}-${matchIndex}`}><span role="cell"><strong>{match.date}</strong></span><span role="cell">{formatKm(match.km)}</span><span role="cell">{match.concept}</span><span role="cell"><strong>{formatCurrency(match.amount)}</strong></span></div>)}
                        </div>
                      </div>}
                    </div>;
                  })}</div>
                </div>}
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function AutomationsView({ enabled, setEnabled, notify }) {
  const automations = [
    { id: "whatsapp", icon: IconBrandWhatsapp, title: "Lecturas de WhatsApp", description: "Recibe imágenes, identifica vehículo y conductor y extrae el odómetro.", metric: "8 procesadas hoy", tone: "whatsapp" },
    { id: "email", icon: IconMail, title: "Facturas por correo", description: "Lee adjuntos, extrae concepto e importe y propone el vehículo asociado.", metric: "4 recibidas hoy", tone: "mail" },
    { id: "openai", icon: IconSparkles, title: "Validación con OpenAI", description: "Contrasta los datos extraídos y deriva a revisión los casos de baja confianza.", metric: "97,1% confianza", tone: "ai" },
  ];
  return (
    <section className="module-page">
      <PageIntro eyebrow="Flujos conectados" title="Automatizaciones" description="Controla cómo entra la información y qué ocurre cuando necesita revisión humana." action={<button className="primary-button" onClick={() => notify("Ejecución de prueba completada correctamente")}><IconRefresh size={18} />Probar flujos</button>} />
      <div className="automation-grid">{automations.map((automation) => {
        const Icon = automation.icon;
        return <article className="automation-card" key={automation.id}><header><span className={`automation-icon automation-icon--${automation.tone}`}><Icon size={22} /></span><label className="switch"><input type="checkbox" checked={enabled[automation.id]} onChange={() => setEnabled((current) => ({ ...current, [automation.id]: !current[automation.id] }))} /><span /></label></header><h2>{automation.title}</h2><p>{automation.description}</p><footer><StatusBadge status={enabled[automation.id] ? "Activo" : "Pausado"} /><small>{automation.metric}</small></footer></article>;
      })}</div>
      <section className="content-card activity-card">
        <header className="card-header"><div><h2>Actividad reciente</h2><p>Últimas ejecuciones automáticas.</p></div></header>
        <div className="activity-timeline">
          <div><span><IconBrandWhatsapp size={17} /></span><p><strong>Lectura procesada · 5754 MJV</strong><small>Fernando · Confianza IA 98%</small></p><time>04:08</time></div>
          <div><span><IconMail size={17} /></span><p><strong>Factura asociada · 5043 MLC</strong><small>FAC-2026-1874 · Aceite y filtros</small></p><time>20:42</time></div>
          <div><span><IconAlertTriangle size={17} /></span><p><strong>Lectura enviada a revisión</strong><small>David García · Confianza IA 92%</small></p><time>19:05</time></div>
        </div>
      </section>
    </section>
  );
}

function SettingsView({ settings, setSettings, notify }) {
  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  return (
    <section className="module-page settings-page">
      <PageIntro eyebrow="Configuración" title="Ajustes" description="Define los datos generales, umbrales de aviso y criterios de revisión automática." />
      <div className="settings-grid">
        <section className="content-card settings-card"><header><IconBuildingStore size={20} /><div><h2>Organización</h2><p>Datos visibles en informes y comunicaciones.</p></div></header><div className="settings-brand-preview"><img src="/brand/sobre-ruedas-logo.png" alt="Logotipo de SOBRE RUEDAS" /><span><strong>Logotipo de empresa</strong><small>Identidad visual activa en la aplicación</small></span></div><label>Nombre de la flota<input value={settings.company} onChange={(event) => update("company", event.target.value)} /></label><label>Correo de gestión<input type="email" value={settings.email} onChange={(event) => update("email", event.target.value)} /></label></section>
        <section className="content-card settings-card"><header><IconAlertTriangle size={20} /><div><h2>Alertas</h2><p>Cuándo debe intervenir el gestor.</p></div></header><label>Avisar antes de la revisión<div className="input-suffix"><input type="number" value={settings.serviceWarning} onChange={(event) => update("serviceWarning", event.target.value)} /><span>km</span></div></label><label>Revisar si la confianza baja de<div className="input-suffix"><input type="number" value={settings.lowConfidence} onChange={(event) => update("lowConfidence", event.target.value)} /><span>%</span></div></label></section>
        <section className="content-card settings-card"><header><IconShieldCheck size={20} /><div><h2>Seguridad</h2><p>Acceso y trazabilidad de cambios.</p></div></header><div className="settings-row"><span><strong>Registro de auditoría</strong><small>Conservar cambios durante 12 meses</small></span><StatusBadge status="Activo" /></div><div className="settings-row"><span><strong>Doble validación</strong><small>Para importes superiores a 1.000 €</small></span><StatusBadge status="Activo" /></div></section>
      </div>
      <UberIntegrationCard notify={notify} />
      <footer className="settings-actions"><button className="secondary-button" onClick={() => notify("Cambios descartados")}>Descartar</button><button className="primary-button" onClick={() => notify("Ajustes guardados")}><IconCheck size={18} />Guardar ajustes</button></footer>
    </section>
  );
}

function UberIntegrationCard({ notify }) {
  const [status, setStatus] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/uber/diagnostics", { headers: { Accept: "application/json" } });
      const payload = await response.json();
      setDiagnostics(payload);
      if (!response.ok) notify(payload.message || "No se pudo analizar el acceso de Uber");
    } catch (error) {
      setDiagnostics({ connected: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/uber/status", { headers: { Accept: "application/json" } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudo consultar Uber");
      setStatus(payload);
      if (payload.hasSession) await runDiagnostics();
    } catch (error) {
      setStatus({ configured: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/uber/disconnect", { method: "POST", headers: { Accept: "application/json" } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudo desconectar Uber");
      setDiagnostics(null);
      await refreshStatus();
      notify(payload.message || "Cuenta de Uber desconectada");
    } catch (error) {
      notify(error.message || "No se pudo desconectar la cuenta de Uber");
      setLoading(false);
    }
  };

  useEffect(() => { refreshStatus(); }, []);

  const configured = status?.configured;
  const connected = status?.hasSession || diagnostics?.connected;
  return (
    <section className="content-card settings-card settings-card--uber">
      <header><IconBrandUber size={20} /><div><h2>Uber Developer</h2><p>Conecta la cuenta de los conductores y analiza viajes, pagos y perfil desde el servidor.</p></div></header>
      <div className="uber-connection-status"><IconKey size={16} /><span><strong>{configured ? "Credenciales protegidas configuradas" : "Falta configurar las credenciales"}</strong><small>UBER_CLIENT_ID, UBER_CLIENT_SECRET y UBER_REDIRECT_URI se guardan solo en Vercel.</small></span><StatusBadge status={connected ? "Conectado" : configured ? "Listo" : "Pendiente"} /></div>
      <div className="uber-scope-list"><span>Permisos previstos</span><strong>partner.accounts · partner.payments · partner.trips</strong></div>
      {diagnostics?.access && <div className="uber-diagnostics" aria-live="polite"><strong>Diagnóstico de acceso</strong>{diagnostics.access.map((item) => <div key={item.id}><span>{item.label}<small>{item.scope}</small></span><StatusBadge status={item.ok ? "Disponible" : `HTTP ${item.status}`} /></div>)}</div>}
      {diagnostics?.message && <p className="uber-inline-message">{diagnostics.message}</p>}
      <footer className="uber-card-actions"><button className="secondary-button" type="button" onClick={refreshStatus} disabled={loading}><IconRefresh size={16} />Actualizar</button>{configured && !connected && <button className="primary-button" type="button" onClick={() => { window.location.assign("/api/uber/authorize"); }}><IconBrandUber size={16} />Conectar Uber</button>}{connected && <><button className="secondary-button" type="button" onClick={disconnect} disabled={loading}><IconX size={16} />Desconectar</button><button className="primary-button" type="button" onClick={runDiagnostics} disabled={loading}><IconSearch size={16} />Analizar acceso</button></>}</footer>
      <a className="uber-privacy-link" href="/privacidad" target="_blank" rel="noreferrer">Ver política de privacidad de SOBRE RUEDAS</a>
      <small className="uber-security-note">Nunca pegues aquí el secreto: el navegador no lo recibe y el repositorio no lo almacena.</small>
    </section>
  );
}

function HelpView({ openFaq, setOpenFaq, setModal }) {
  const faqs = [
    ["¿Cómo llega una lectura desde WhatsApp?", "El conductor envía la imagen al número de empresa. La automatización identifica matrícula y conductor, extrae kilómetros y marca los casos dudosos para revisión."],
    ["¿Cómo se asocia una factura a un vehículo?", "SOBRE RUEDAS lee el adjunto del correo, detecta matrícula, taller, concepto e importe y propone una asociación antes de incorporarla al historial."],
    ["¿Puedo corregir un dato extraído?", "Sí. Desde Lecturas o Facturas puedes abrir la revisión, corregir cualquier campo y validar el registro conservando la trazabilidad."],
  ];
  return (
    <section className="module-page help-page">
      <PageIntro eyebrow="Centro de ayuda" title="¿En qué podemos ayudarte?" description="Guías rápidas para gestionar lecturas, facturas y revisiones." action={<button className="primary-button" onClick={() => setModal({ type: "support" })}><IconMessageCircle size={18} />Contactar soporte</button>} />
      <div className="help-grid">
        <section className="content-card faq-card"><header className="card-header"><div><h2>Preguntas frecuentes</h2><p>Respuestas sobre los flujos principales.</p></div></header>{faqs.map(([question, answer], index) => <article key={question}><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span>{question}</span>{openFaq === index ? <IconChevronUp size={19} /> : <IconChevronDown size={19} />}</button>{openFaq === index && <p>{answer}</p>}</article>)}</section>
        <aside className="content-card support-card"><span><IconHelpCircle size={25} /></span><h2>Soporte SOBRE RUEDAS</h2><p>Si una lectura, factura o mantenimiento no cuadra, revisamos el caso contigo.</p><div><IconClock size={18} /><span><strong>Lunes a viernes</strong><small>09:00–18:00</small></span></div><div><IconMail size={18} /><span><strong>soporte@sobreruedas.es</strong><small>Respuesta en menos de 4 horas</small></span></div><button className="secondary-button" onClick={() => setModal({ type: "support" })}>Abrir consulta</button></aside>
      </div>
    </section>
  );
}

function VehicleInspector({ selected, selectedDriver, selectedActivity, invoices, inspectorTab, setInspectorTab, setInspectorOpen, setModal, selectDriver, openShift, setOpenShift, notify }) {
  const remaining = selected.nextServiceKm - selected.odometer;
  return (
    <aside className="inspector" aria-label={`Detalle de ${selected.plate}`}>
      <header className="inspector-header"><div><span className="inspector-eyebrow">Vehículo seleccionado</span><strong>{selected.plate}</strong><small>{selected.model}</small><UseBadge value={selected.use} /></div><button className="icon-button" aria-label="Cerrar detalle" onClick={() => setInspectorOpen(false)}><IconX size={21} /></button></header>
      {selected.use === "Profesional" ? (
        <div className="inspector-driver-picker"><span>Conductor</span><div>{selected.drivers.map((driver) => <button className={selectedDriver === driver ? "driver-pill driver-pill--active" : "driver-pill"} key={driver} onClick={() => selectDriver(selected, driver)}>{driver}</button>)}</div></div>
      ) : <div className="inspector-no-driver"><IconHome size={18} /><span>Sin conductor asociado</span></div>}
      <div className="inspector-tabs" role="tablist" aria-label="Información del vehículo">
        <button role="tab" aria-selected={inspectorTab === "Turnos"} className={inspectorTab === "Turnos" ? "active" : ""} onClick={() => setInspectorTab("Turnos")}>Actividad</button>
        <button role="tab" aria-selected={inspectorTab === "Mantenimiento"} className={inspectorTab === "Mantenimiento" ? "active" : ""} onClick={() => setInspectorTab("Mantenimiento")}>Mantenimiento</button>
        <button role="tab" aria-selected={inspectorTab === "Gasolina"} className={inspectorTab === "Gasolina" ? "active" : ""} onClick={() => setInspectorTab("Gasolina")}>Gasolina</button>
        <button role="tab" aria-selected={inspectorTab === "Gastos"} className={inspectorTab === "Gastos" ? "active" : ""} onClick={() => setInspectorTab("Gastos")}>Gastos</button>
      </div>
      <div className="inspector-scroll">
        {inspectorTab === "Turnos" && (
          <>
            <section className="driver-summary">
              <header><span><IconClock size={17} /><strong>{selected.use === "Profesional" ? selectedDriver : "Uso particular"}</strong></span><small>Hoy · {selectedActivity.time}</small></header>
              <div className="driver-metrics"><div><span>Km hoy</span><strong>{formatKm(selectedActivity.km)}</strong></div><div><span>Repostaje</span><strong>{formatCurrency(selectedActivity.cost)}</strong></div><div><span>Facturación</span><strong>{formatCurrency(selectedActivity.revenue)}</strong></div></div>
              <div className="billing-summary"><span>Acumulado mensual</span><strong>{formatCurrency(selectedActivity.monthRevenue)}</strong><small>{selectedActivity.monthTrips} viajes · Efectivo hoy {formatCurrency(selectedActivity.cash)}</small></div>
            </section>
            {selected.plate === "5043 MLC" && selected.use === "Profesional" && <figure className="odometer-proof"><img src="/assets/odometer-210735.jpg" alt={`Odómetro de ${selected.plate} con ${selected.odometer} kilómetros`} /><figcaption><IconBrandWhatsapp size={17} /><span><strong>Imagen recibida por WhatsApp</strong><small>Hoy · {selectedActivity.sentAt ?? "19:02"} · Confianza IA {selectedActivity.confidence ?? 98}%</small></span></figcaption></figure>}
            {selected.use === "Profesional" ? (
              <section className="shifts-section"><header><div><h2>Parte del conductor</h2><p>Datos del turno seleccionado</p></div><StatusBadge status="Recibido" /></header>{selected.shifts.filter((shift) => shift.driver === selectedDriver).map((shift) => {
                const expanded = openShift === shift.id;
                const consumption = (shift.liters / shift.km) * 100;
                return <article className={`shift-card ${shift.alert ? "shift-card--alert" : ""}`} key={shift.id}><button className="shift-toggle" onClick={() => setOpenShift(expanded ? "" : shift.id)} aria-expanded={expanded}><span className="shift-icon"><IconClock size={17} /></span><span><strong>{shift.label}</strong><small>{shift.time}</small></span><span><strong>{shift.km} km</strong><small>{formatCurrency(shift.cost)}</small></span>{expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}</button>{expanded && <div className="shift-detail"><div className="shift-metrics"><div><span>Km inicio</span><strong>{formatKm(shift.start)}</strong></div><div><span>Total acumulado</span><strong>{formatKm(shift.end)}</strong></div><div><span>Litros</span><strong>{shift.liters.toLocaleString("es-ES")} L</strong></div><div><span>Consumo</span><strong>{consumption.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L/100</strong></div></div>{shift.alert && <div className="inline-alert"><IconAlertTriangle size={16} /><span><strong>Consumo superior al habitual</strong>Revisar antes de validar.</span></div>}<button className="secondary-button full-button" onClick={() => notify(`Turno de ${shift.driver} validado`)}><IconCheck size={17} />Validar turno</button></div>}</article>;
              })}</section>
            ) : <section className="domestic-note"><IconHome size={21} /><span><strong>Uso particular</strong>Registro diario individual sin parte de turno obligatorio.</span></section>}
          </>
        )}
        {inspectorTab === "Mantenimiento" && <VehicleMaintenanceLedger vehicle={selected} invoices={invoices} onOpenInvoice={(invoice) => setModal({ type: "invoice", item: invoice })} />}
        {inspectorTab === "Gasolina" && <VehicleFuelLedger vehicle={selected} />}
        {inspectorTab === "Gastos" && <VehicleExpenses vehicle={selected} />}
        <section className="next-service"><span className={remaining <= 4500 ? "urgent" : ""}><IconTools size={18} /><strong>{formatKm(remaining)} restantes</strong></span><p>{selected.serviceDate} · objetivo {formatKm(selected.nextServiceKm)}</p></section>
      </div>
    </aside>
  );
}

function VehicleMaintenanceLedger({ vehicle, invoices, onOpenInvoice }) {
  const rows = maintenanceConceptRows.map((category) => {
    const maintenance = vehicle.maintenance.find((item) => matchesMaintenanceConcept(item.concept, category.matches));
    const invoiceMatches = (item) =>
      item.plate === vehicle.plate &&
      (matchesMaintenanceConcept(item.concept, category.matches) || item.items?.some((line) => matchesMaintenanceConcept(line.concept, category.matches)));
    const invoice = invoices.find((item) => invoiceMatches(item) && (!maintenance || item.date === maintenance.date))
      ?? invoices.find(invoiceMatches);
    const invoiceLine = invoice?.items?.find((line) => matchesMaintenanceConcept(line.concept, category.matches));
    return {
      ...category,
      maintenance,
      invoice,
      date: maintenance?.date ?? invoice?.date,
      amount: invoiceLine?.amount ?? maintenance?.amount ?? invoice?.amount,
    };
  });
  const registered = rows.filter((row) => row.date || row.invoice).length;

  return (
    <section className="inspector-ledger inspector-maintenance-ledger">
      <header className="inspector-ledger-heading">
        <span><IconTools size={18} /><strong>Mantenimiento por concepto</strong></span>
        <small>{registered} de {rows.length} registrados</small>
      </header>
      <div className="inspector-ledger-summary">
        <span>Historial de {vehicle.plate}</span>
        <strong>{vehicle.maintenance.length} intervenciones</strong>
        <small>Último registro por cada concepto</small>
      </div>
      <div className="inspector-ledger-scroll">
        <table className="inspector-ledger-table">
          <caption className="sr-only">Mantenimiento de {vehicle.plate} organizado por concepto, fecha y factura</caption>
          <thead><tr><th>Concepto</th><th>Fecha</th><th>Factura</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className={!row.date && !row.invoice ? "is-empty" : ""}>
                <td><strong>{row.label}</strong>{row.maintenance && normalizeText(row.maintenance.concept) !== normalizeText(row.label) && <small>{row.maintenance.concept}</small>}</td>
                <td>{row.date ? <><strong>{row.date}</strong>{row.maintenance?.km && <small>{formatKm(row.maintenance.km)}</small>}</> : <span>—</span>}</td>
                <td>{row.invoice ? <><button className="invoice-link-button" onClick={() => onOpenInvoice(row.invoice)} aria-label={`Ver factura ${row.invoice.id} de ${row.label}`}><IconFileInvoice size={14} />Ver</button><small>{row.amount != null ? formatCurrency(Number(row.amount)) : row.invoice.id}</small></> : <span>—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="inspector-ledger-note">Selecciona «Ver» para consultar el documento y su desglose.</p>
    </section>
  );
}

function VehicleFuelLedger({ vehicle }) {
  const entries = vehicle.monthlyFuel ?? [];
  const totalLiters = entries.reduce((sum, entry) => sum + (entry.liters ?? 0), 0);
  const totalCost = entries.reduce((sum, entry) => sum + (entry.cost ?? 0), 0);
  const averagePrice = totalLiters > 0 ? totalCost / totalLiters : 0;

  return (
    <section className="inspector-ledger fuel-ledger">
      <header className="inspector-ledger-heading">
        <span><IconGasStation size={18} /><strong>Gasolina</strong></span>
        <small>Julio 2026</small>
      </header>
      {vehicle.fuelSchedule?.length > 0 && (
        <div className="fuel-schedule-strip" aria-label={`Turnos de combustible de ${vehicle.plate}`}>
          {vehicle.fuelSchedule.map((shift) => <span key={shift.label}><strong>{shift.driver}</strong><small>{shift.label}</small></span>)}
        </div>
      )}
      <div className="fuel-ledger-summary">
        <div><span>Consumo mensual</span><strong>{totalLiters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</strong></div>
        <div><span>Gasto mensual</span><strong>{formatCurrency(totalCost)}</strong></div>
      </div>
      <div className="fuel-ledger-meta"><span><strong>{entries.length}</strong> repostajes</span><span>Media <strong>{formatCurrency(averagePrice)}/L</strong></span></div>
      <div className="fuel-daily-heading"><strong>Repostajes diarios</strong><small>Asignados automáticamente según la hora</small></div>
      <div className="inspector-ledger-scroll">
        <table className="inspector-ledger-table fuel-ledger-table">
          <caption className="sr-only">Repostajes de julio de 2026 para {vehicle.plate}, asignados por horario a cada conductor</caption>
          <thead><tr><th>Fecha y hora</th><th>Conductor</th><th>Litros</th><th>Importe</th></tr></thead>
          <tbody>
            {entries.map((entry) => {
              const assignment = getFuelAssignment(vehicle, entry);
              return (
              <tr key={`${entry.date}-${entry.time}`}>
                <td><strong>{entry.date.replace(" 2026", "")}</strong><small>{entry.time}</small></td>
                <td><strong>{assignment.driver}</strong><small>{assignment.label}</small></td>
                <td><strong>{entry.liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</strong></td>
                <td><strong>{formatCurrency(entry.cost)}</strong></td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
      <p className="inspector-ledger-note">El conductor se determina por la hora del repostaje y el turno configurado para este coche.</p>
    </section>
  );
}

function WorkshopHistory({ vehicle, onCreateInvoice }) {
  const counts = vehicle.maintenance.reduce((result, item) => ({ ...result, [item.concept]: (result[item.concept] ?? 0) + 1 }), {});
  const total = vehicle.maintenance.reduce((sum, item) => sum + item.amount, 0);
  return (
    <section className="workshop-history">
      <header><span><IconHistory size={18} /><strong>Historial de taller</strong></span><small>{vehicle.maintenance.length} intervenciones</small></header>
      <div className="workshop-total"><span>Importe registrado</span><strong>{formatCurrency(total)}</strong></div>
      {onCreateInvoice && <button className="secondary-button workshop-invoice-button" onClick={onCreateInvoice}><IconCamera size={17} />Crear factura desde una foto</button>}
      <div className="maintenance-table" role="table" aria-label={`Historial de taller de ${vehicle.plate}`}>
        {vehicle.maintenance.map((item) => <div className="maintenance-row" role="row" key={`${item.date}-${item.concept}`}><span><strong>{item.date}</strong><small>{formatKm(item.km)}</small></span><span><strong>{item.concept}</strong>{counts[item.concept] > 1 && <small className="repeat-mark">{counts[item.concept]} veces</small>}</span><strong>{formatCurrency(item.amount)}</strong></div>)}
      </div>
    </section>
  );
}

function VehicleExpenses({ vehicle }) {
  const amounts = [...(vehicleExpenseAmounts[vehicle.plate] ?? expenseCategories.map(() => 0))];
  amounts[3] = vehicle.maintenance
    .filter((item) => item.dateIso?.startsWith("2026-07") || item.date.toLocaleLowerCase("es").includes("jul 2026"))
    .reduce((sum, item) => sum + item.amount, 0);
  const expenses = expenseCategories.map((category, index) => ({ ...category, amount: amounts[index] ?? 0 }));
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const operating = expenses.filter((expense) => ["Gasolina", "Taller", "Comisiones conductor", "Limpieza coche", "Varios"].includes(expense.label)).reduce((sum, expense) => sum + expense.amount, 0);
  const fixed = total - operating;
  const driverRevenue = vehicle.drivers.map((driver) => ({ driver, amount: getDriverDay(vehicle, driver).monthRevenue ?? 0 }));
  const totalRevenue = driverRevenue.reduce((sum, entry) => sum + entry.amount, 0);
  const profitMargin = totalRevenue - total;
  const marginPercent = totalRevenue > 0 ? (profitMargin / totalRevenue) * 100 : 0;

  return (
    <section className="vehicle-expenses">
      <header>
        <div><span><IconCurrencyEuro size={18} /><strong>Gastos del vehículo</strong></span><small>Julio 2026</small></div>
      </header>
      <div className="vehicle-margin-summary">
        <div><span>Facturación conjunta</span><strong>{formatCurrency(totalRevenue)}</strong><small>Dos conductores</small></div>
        <i>−</i>
        <div><span>Gastos del coche</span><strong>{formatCurrency(total)}</strong><small>Todos los conceptos</small></div>
        <i>=</i>
        <div className={profitMargin >= 0 ? "positive" : "negative"}><span>Margen de beneficio</span><strong>{formatCurrency(profitMargin)}</strong><small>{totalRevenue > 0 ? `${marginPercent.toLocaleString("es-ES", { maximumFractionDigits: 1 })}% sobre facturación` : "Sin facturación asignada"}</small></div>
      </div>
      <div className="driver-revenue-summary">
        <header><span>Facturación mensual por conductor</span><strong>{formatCurrency(totalRevenue)}</strong></header>
        {driverRevenue.map((entry) => <div key={entry.driver}><span>{entry.driver}</span><strong>{formatCurrency(entry.amount)}</strong></div>)}
      </div>
      <div className="expense-breakdown"><div><span>Fijos y fiscales</span><strong>{formatCurrency(fixed)}</strong></div><div><span>Operativos</span><strong>{formatCurrency(operating)}</strong></div></div>
      <div className="expense-table" role="table" aria-label={`Gastos de ${vehicle.plate} en julio de 2026`}>
        <div className="expense-row expense-row--header" role="row"><span>Categoría</span><span>Periodo</span><span>Importe</span></div>
        {expenses.map((expense) => <div className="expense-row" role="row" key={expense.label}><span role="cell"><strong>{expense.label}</strong></span><span role="cell"><small>{expense.amount === 0 ? "No aplica" : expense.cadence}</small></span><strong role="cell" className={expense.amount === 0 ? "expense-zero" : ""}>{formatCurrency(expense.amount)}</strong></div>)}
      </div>
      <p className="expense-note">Importes asociados únicamente a {vehicle.plate}. Los trimestrales y anuales muestran el pago registrado en el periodo.</p>
    </section>
  );
}

function AppModalV2({ modal, onClose, notify, onSaveInvoice, vehicles }) {
  const item = modal.item;
  const isReading = modal.type === "reading-review";
  const isInvoice = modal.type === "invoice";
  const isFuelInvoice = isInvoice && item?.source === "Cuenta Plenergy";
  const isPhotoInvoice = modal.type === "invoice-upload";
  const titles = { reading: "Registrar una lectura", "reading-review": "Revisar lectura", "invoice-upload": "Crear factura desde una foto", invoice: "Detalle de factura", support: "Contactar con soporte" };
  const complete = (message) => { notify(message); onClose(); };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`modal ${isPhotoInvoice ? "modal--invoice-photo" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header><div><span>Acción rápida</span><h2 id="modal-title">{isFuelInvoice ? "Factura Plenergy" : titles[modal.type]}</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar ventana"><IconX size={21} /></button></header>
        {isReading && <><div className="review-banner"><IconSparkles size={21} /><span><strong>Extracción completada</strong><small>Confianza IA {item.confidence}% · Revisa antes de validar</small></span></div><div className="form-grid"><label>Vehículo<input defaultValue={item.plate} /></label><label>Conductor<input defaultValue={item.driver} /></label><label>Odómetro total<input defaultValue={item.total} /></label><label>Kilómetros diarios<input defaultValue={item.daily} /></label></div></>}
        {isInvoice && <><div className="invoice-preview"><IconFileInvoice size={30} /><span><strong>{item.id}</strong><small>{item.provider} · {item.date}</small></span><strong>{formatCurrency(item.amount)}</strong></div><dl><div><dt>Vehículo</dt><dd>{item.plate}</dd></div>{item.driver && <div><dt>Conductor</dt><dd>{item.driver}</dd></div>}{item.km && <div><dt>Kilometraje</dt><dd>{formatKm(item.km)}</dd></div>}{item.liters && <div><dt>Litros</dt><dd>{item.liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</dd></div>}{item.pricePerLiter && <div><dt>Precio/litro</dt><dd>{formatCurrency(item.pricePerLiter)}</dd></div>}<div><dt>Concepto</dt><dd>{item.concept}</dd></div><div><dt>Origen</dt><dd>{item.source}</dd></div><div><dt>Estado</dt><dd><StatusBadge status={item.status} /></dd></div></dl>{item.items?.length > 0 && <InvoiceLinesTable date={item.date} items={item.items} />}</>}
        {modal.type === "reading" && <div className="upload-zone"><IconBrandWhatsapp size={30} /><strong>Añadir lectura manual</strong><p>Selecciona una imagen del odómetro o introduce los datos manualmente.</p><button className="secondary-button"><IconUpload size={17} />Seleccionar imagen</button></div>}
        {isPhotoInvoice && <InvoicePhotoWorkflow initialPlate={modal.plate} vehicles={vehicles} onCancel={onClose} onSave={(invoice) => { onSaveInvoice(invoice); complete("Factura guardada; Mantenimiento y Gastos se han actualizado"); }} />}
        {modal.type === "support" && <div className="support-form"><label>Asunto<input placeholder="Describe brevemente el problema" /></label><label>Mensaje<textarea placeholder="Cuéntanos qué necesitas revisar" rows={5} /></label></div>}
        {!isPhotoInvoice && <footer><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={() => complete(isReading ? "Lectura validada correctamente" : isFuelInvoice ? "Factura Plenergy archivada" : isInvoice ? "Factura revisada" : modal.type === "support" ? "Consulta enviada a soporte" : "Archivo preparado para procesar")}><IconCheck size={18} />{isReading ? "Validar lectura" : isFuelInvoice ? "Cerrar factura" : isInvoice ? "Marcar revisada" : modal.type === "support" ? "Enviar consulta" : "Continuar"}</button></footer>}
      </section>
    </div>
  );
}

function InvoiceLinesTable({ date, items }) {
  return (
    <section className="invoice-lines-detail">
      <header><div><h3>Conceptos de la factura</h3><p>Desglose detectado en el documento.</p></div><strong>{formatCurrency(items.reduce((sum, line) => sum + Number(line.amount), 0))}</strong></header>
      <div className="invoice-lines-scroll">
        <table>
          <caption className="sr-only">Conceptos y precios de la factura</caption>
          <thead><tr><th>Fecha</th><th>Concepto</th><th>Precio</th></tr></thead>
          <tbody>{items.map((line, index) => <tr key={`${line.concept}-${index}`}><td>{date}</td><td>{line.concept}</td><td><strong>{formatCurrency(Number(line.amount))}</strong></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

function InvoicePhotoWorkflow({ initialPlate, vehicles, onCancel, onSave }) {
  const [stage, setStage] = useState("upload");
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [date, setDate] = useState("2026-07-28");
  const [provider, setProvider] = useState("Taller AutoRápido S.L.");
  const [plate, setPlate] = useState(initialPlate ?? vehicles[0].plate);
  const [odometer, setOdometer] = useState(() => vehicles.find((vehicle) => vehicle.plate === (initialPlate ?? vehicles[0].plate))?.odometer ?? 0);
  const [lines, setLines] = useState([
    { id: "photo-line-1", concept: "Aceite motor 5W30", amount: 79.9 },
    { id: "photo-line-2", concept: "Filtro de aceite", amount: 18.5 },
    { id: "photo-line-3", concept: "Mano de obra", amount: 52 },
  ]);

  const total = lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const valid = provider.trim() && plate && lines.length > 0 && lines.every((line) => line.concept.trim() && Number(line.amount) >= 0);

  const preparePhoto = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setPreview(String(reader.result));
      setStage("review");
    });
    reader.readAsDataURL(file);
  };

  const updateLine = (id, field, value) => {
    setLines((current) => current.map((line) => line.id === id ? { ...line, [field]: field === "amount" ? Number(value) : value } : line));
  };

  const save = () => {
    const concepts = lines.map((line) => line.concept.trim());
    const compactConcept = concepts.length > 2 ? `${concepts.slice(0, 2).join(", ")} +${concepts.length - 2}` : concepts.join(", ");
    const displayDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`)).replace(".", "");
    onSave({
      id: `FAC-${date.slice(0, 4)}-${String(Date.now()).slice(-4)}`,
      date: displayDate,
      provider: provider.trim(),
      plate,
      km: Number(odometer),
      dateIso: date,
      concept: compactConcept,
      amount: total,
      source: "Foto",
      status: "Revisar",
      items: lines.map(({ concept, amount }) => ({ concept: concept.trim(), amount: Number(amount) })),
    });
  };

  if (stage === "upload") {
    return (
      <div className="invoice-photo-upload">
        <div className="upload-zone">
          <span className="upload-zone__icon"><IconCamera size={29} /></span>
          <strong>Fotografía la factura del taller</strong>
          <p>La imagen se procesará para detectar la fecha, el vehículo y cada concepto con su precio. Podrás corregirlo todo antes de guardarlo.</p>
          <div className="photo-actions">
            <label className="primary-button" htmlFor="invoice-camera"><IconCamera size={18} />Hacer una foto</label>
            <input id="invoice-camera" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => preparePhoto(event.target.files?.[0])} />
            <label className="secondary-button" htmlFor="invoice-gallery"><IconUpload size={17} />Elegir imagen</label>
            <input id="invoice-gallery" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => preparePhoto(event.target.files?.[0])} />
          </div>
          <button className="text-button" onClick={() => { setFileName("factura_taller_28-07-2026.jpg"); setStage("review"); }}>Probar con una factura de ejemplo</button>
        </div>
        <div className="invoice-workflow-actions"><button className="secondary-button" onClick={onCancel}>Cancelar</button></div>
      </div>
    );
  }

  return (
    <div className="invoice-photo-review">
      <div className="photo-review-layout">
        <aside className="photo-preview">
          {preview ? <img src={preview} alt="Fotografía de la factura seleccionada" /> : <span className="photo-preview__placeholder"><IconFileInvoice size={34} /><strong>Factura de ejemplo</strong></span>}
          <div><IconCamera size={17} /><span><strong>{fileName}</strong><small>Imagen preparada para revisión</small></span></div>
          <button className="text-button" onClick={() => setStage("upload")}>Cambiar fotografía</button>
        </aside>

        <section className="invoice-extraction">
          <div className="review-banner"><IconSparkles size={21} /><span><strong>Extracción completada</strong><small>Confianza IA 96% · Revisa los datos antes de guardar</small></span></div>
          <div className="invoice-meta-grid">
            <label>Fecha de factura<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
            <label>Vehículo<select value={plate} onChange={(event) => { const nextPlate = event.target.value; setPlate(nextPlate); setOdometer(vehicles.find((vehicle) => vehicle.plate === nextPlate)?.odometer ?? 0); }}>{vehicles.map((vehicle) => <option key={vehicle.plate} value={vehicle.plate}>{vehicle.plate} · {vehicle.model}</option>)}</select></label>
            <label>Kilometraje del vehículo<input type="number" min="0" step="1" value={odometer} onChange={(event) => setOdometer(event.target.value)} /></label>
            <label className="invoice-provider-field">Taller<input value={provider} onChange={(event) => setProvider(event.target.value)} /></label>
          </div>

          <div className="extracted-lines-header"><div><h3>Conceptos detectados</h3><p>Edita, elimina o añade líneas.</p></div><button className="secondary-button compact-button" onClick={() => setLines((current) => [...current, { id: `photo-line-${Date.now()}`, concept: "", amount: 0 }])}><IconPlus size={16} />Añadir concepto</button></div>
          <div className="invoice-lines-scroll">
            <table className="editable-invoice-table">
              <caption className="sr-only">Conceptos y precios extraídos de la fotografía</caption>
              <thead><tr><th>Fecha</th><th>Concepto</th><th>Precio</th><th><span className="sr-only">Eliminar</span></th></tr></thead>
              <tbody>{lines.map((line) => <tr key={line.id}><td><time dateTime={date}>{new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${date}T12:00:00`))}</time></td><td><input aria-label={`Concepto ${line.id}`} value={line.concept} onChange={(event) => updateLine(line.id, "concept", event.target.value)} /></td><td><label className="price-input"><input aria-label={`Precio de ${line.concept || "nuevo concepto"}`} type="number" min="0" step="0.01" value={line.amount} onChange={(event) => updateLine(line.id, "amount", event.target.value)} /><span>€</span></label></td><td><button className="icon-button delete-line-button" onClick={() => setLines((current) => current.filter((candidate) => candidate.id !== line.id))} aria-label={`Eliminar ${line.concept || "concepto"}`}><IconTrash size={17} /></button></td></tr>)}</tbody>
              <tfoot><tr><td colSpan={2}>Total factura</td><td colSpan={2}><strong>{formatCurrency(total)}</strong></td></tr></tfoot>
            </table>
          </div>
        </section>
      </div>
      <div className="invoice-workflow-actions"><button className="secondary-button" onClick={onCancel}>Cancelar</button><button className="primary-button" disabled={!valid} onClick={save}><IconCheck size={18} />Guardar factura</button></div>
    </div>
  );
}

function AppModal({ modal, onClose, notify }) {
  const item = modal.item;
  const isReading = modal.type === "reading-review";
  const isInvoice = modal.type === "invoice";
  const titles = { reading: "Registrar una lectura", "reading-review": "Revisar lectura", "invoice-upload": "Subir factura", invoice: "Detalle de factura", support: "Contactar con soporte" };
  const complete = (message) => { notify(message); onClose(); };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header><div><span>Acción rápida</span><h2 id="modal-title">{titles[modal.type]}</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar ventana"><IconX size={21} /></button></header>
        {isReading && <><div className="review-banner"><IconSparkles size={21} /><span><strong>Extracción completada</strong><small>Confianza IA {item.confidence}% · Revisa antes de validar</small></span></div><div className="form-grid"><label>Vehículo<input defaultValue={item.plate} /></label><label>Conductor<input defaultValue={item.driver} /></label><label>Odómetro total<input defaultValue={item.total} /></label><label>Kilómetros diarios<input defaultValue={item.daily} /></label></div></>}
        {isInvoice && <><div className="invoice-preview"><IconFileInvoice size={30} /><span><strong>{item.id}</strong><small>{item.provider} · {item.date}</small></span><strong>{formatCurrency(item.amount)}</strong></div><dl><div><dt>Vehículo</dt><dd>{item.plate}</dd></div><div><dt>Concepto</dt><dd>{item.concept}</dd></div><div><dt>Origen</dt><dd>{item.source}</dd></div><div><dt>Estado</dt><dd><StatusBadge status={item.status} /></dd></div></dl></>}
        {modal.type === "reading" && <div className="upload-zone"><IconBrandWhatsapp size={30} /><strong>Añadir lectura manual</strong><p>Selecciona una imagen del odómetro o introduce los datos manualmente.</p><button className="secondary-button"><IconUpload size={17} />Seleccionar imagen</button></div>}
        {modal.type === "invoice-upload" && <div className="upload-zone"><IconFileInvoice size={30} /><strong>Subir factura del taller</strong><p>Formatos PDF, JPG o PNG. SOBRE RUEDAS propondrá vehículo, concepto e importe.</p><button className="secondary-button"><IconUpload size={17} />Seleccionar archivo</button></div>}
        {modal.type === "support" && <div className="support-form"><label>Asunto<input placeholder="Describe brevemente el problema" /></label><label>Mensaje<textarea placeholder="Cuéntanos qué necesitas revisar" rows={5} /></label></div>}
        <footer><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={() => complete(isReading ? "Lectura validada correctamente" : isInvoice ? "Factura revisada" : modal.type === "support" ? "Consulta enviada a soporte" : "Archivo preparado para procesar")}><IconCheck size={18} />{isReading ? "Validar lectura" : isInvoice ? "Marcar revisada" : modal.type === "support" ? "Enviar consulta" : "Continuar"}</button></footer>
      </section>
    </div>
  );
}
