import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconAlertTriangle,
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
  IconMail,
  IconMessageCircle,
  IconPlus,
  IconRefresh,
  IconRobot,
  IconSearch,
  IconSettings,
  IconShieldCheck,
  IconSparkles,
  IconTools,
  IconTrash,
  IconUpload,
  IconUsers,
  IconWheel,
  IconX,
} from "@tabler/icons-react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const navItems = [
  { label: "Informes", slug: "informes", icon: IconChartBar },
  { label: "Flota", slug: "flota", icon: IconCar },
  { label: "Lecturas", slug: "lecturas", icon: IconGauge, badge: 2 },
  { label: "Facturas", slug: "facturas", icon: IconFileInvoice, badge: 3 },
  { label: "Automatizaciones", slug: "automatizaciones", icon: IconRobot },
];

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
const reportYears = [2025, 2026];
const reportSeasonality = [0.82, 0.87, 0.94, 0.91, 0.98, 1.03, 1, 0.96, 1.05, 1.02, 0.93, 0.79];
const getReportPeriodFactor = (month, year) => reportSeasonality[month] * (year === 2026 ? 1 : 0.9);
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
const normalizeText = (value = "") => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");
const maintenanceMonths = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };
const getVehicleBrand = (vehicle) => vehicle.model.split(" ")[0];
const getMaintenanceDateValue = (item) => {
  if (item.dateIso) return Date.parse(item.dateIso);
  const [day, month, year] = normalizeText(item.date).split(/\s+/);
  return Date.UTC(Number(year), maintenanceMonths[month] ?? 0, Number(day));
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

const navFromHash = () => {
  const slug = window.location.hash.replace(/^#\/?/, "");
  return [...navItems, ...fleetSubItems, ...utilityItems].find((item) => item.slug === slug)?.label ?? "Informes";
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
  const [automationEnabled, setAutomationEnabled] = useState({ whatsapp: true, email: true, openai: true });
  const [openFaq, setOpenFaq] = useState(0);
  const [settings, setSettings] = useState({ company: "SOBRE RUEDAS", email: "flota@sobreruedas.es", serviceWarning: "5000", lowConfidence: "94" });
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(isStandaloneApp);
  const toastTimer = useRef();

  useEffect(() => {
    const handleHash = () => {
      const nextNav = navFromHash();
      setActiveNav(nextNav);
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
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
  const showInspector = activeNav === "Flota" && inspectorOpen;

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
    if (window.location.hash !== `#/${item.slug}`) window.location.hash = `/${item.slug}`;
  };

  const navigateFleetSubItem = (item) => {
    if (item.label === "Gasolina") {
      setInspectorTab("Gasolina");
      setInspectorOpen(false);
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
    <div className={`app-shell ${showInspector ? "app-shell--inspector" : ""}`}>
      <main className="workspace">
        <header className={["Informes", "Gasolina"].includes(activeNav) ? "topbar topbar--reports" : "topbar"}>
          <div className="topbar-title">
            <button className="workspace-home-button" onClick={() => navigate(navItems[0])} aria-label="Volver a SOBRE RUEDAS" title="SOBRE RUEDAS"><IconWheel size={23} stroke={1.8} /></button>
            <div><span>{activeNav === "Informes" ? "SOBRE RUEDAS" : activeNav}</span><small>{activeNav === "Informes" ? "Resumen general de la flota" : activeNav === "Gasolina" ? "Control de combustible" : "Gestión centralizada de vehículos"}</small></div>
          </div>
          <div className="topbar-actions">
            {!isStandalone && <button className="install-app-button" onClick={installApplication} aria-label="Instalar SOBRE RUEDAS como aplicación" title="Instalar aplicación"><IconDownload size={17} /><span>Instalar app</span></button>}
            <span className="date"><IconCalendar size={18} />28 jul 2026</span>
            <div className="topbar-shortcuts" aria-label="Accesos de gestión">
              {topbarItems.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.label;
                return <button className={active ? "topbar-route-button topbar-route-button--active" : "topbar-route-button"} key={item.label} onClick={() => navigate(item)} aria-label={item.label} aria-current={active ? "page" : undefined} title={item.label}><Icon size={17} /><span>{item.label}</span></button>;
              })}
            </div>
            <button className="bell-button" aria-label="Notificaciones" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((value) => !value)}><IconBell size={20} /><i>2</i></button>
            <button className="profile" onClick={() => notify("Perfil de Ana García")}><span className="avatar">AG</span><span><strong>Ana García</strong><small>Gestora de flota</small></span><IconChevronDown size={17} /></button>
          </div>
          {notificationsOpen && (
            <aside className="notification-popover" aria-label="Notificaciones recientes">
              <header><strong>Notificaciones</strong><button className="icon-button" onClick={() => setNotificationsOpen(false)} aria-label="Cerrar notificaciones"><IconX size={18} /></button></header>
              <button onClick={() => openVehicleFromModule("5043 MLC")}><IconAlertTriangle size={18} /><span><strong>Revisión próxima</strong><small>Toyota Corolla · 4.265 km restantes</small></span></button>
              <button onClick={() => navigate(navItems[2])}><IconGauge size={18} /><span><strong>2 lecturas por revisar</strong><small>Confianza inferior al umbral configurado</small></span></button>
            </aside>
          )}
        </header>

        <div className="page-scroll">
          {activeNav === "Flota" && (
            <FleetView
              filtered={filtered}
              filter={filter}
              query={query}
              selected={selected}
              selectedDrivers={selectedDrivers}
              setFilter={setFilter}
              setQuery={setQuery}
              selectVehicle={selectVehicle}
              selectDriver={selectDriver}
              openWorkshop={openWorkshop}
              setModal={setModal}
            />
          )}
          {activeNav === "Informes" && <FuelView key="informes" initialTab="General" vehicles={vehicles} selected={selected} onSelectVehicle={(vehicle) => setSelectedPlate(vehicle.plate)} onNavigate={navigate} />}
          {activeNav === "Gasolina" && <FuelView key="gasolina" initialTab="Repostaje" vehicles={vehicles} selected={selected} onSelectVehicle={(vehicle) => setSelectedPlate(vehicle.plate)} onNavigate={navigate} />}
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

      {modal && <AppModalV2 modal={modal} onClose={() => setModal(null)} notify={notify} onSaveInvoice={savePhotoInvoice} vehicles={vehicles} />}
      {toast && <div className="toast" role="status"><IconCircleCheck size={19} />{toast}</div>}
    </div>
  );
}

function FleetView({ filtered, filter, query, selected, selectedDrivers, setFilter, setQuery, selectVehicle, selectDriver, openWorkshop, setModal }) {
  return (
    <section className="module-page fleet-page">
      <PageIntro
        eyebrow="Flota"
        title="Vehículos"
        description="Kilómetros, facturación, combustible y mantenimiento en una única vista."
        action={<button className="primary-button" onClick={() => setModal({ type: "reading" })}><IconPlus size={18} />Registrar lectura</button>}
      />
      <div className="metric-cards">
        <MetricCard icon={IconBriefcase} label="Vehículos profesionales" value="3" detail="6 turnos recibidos hoy" />
        <MetricCard icon={IconGasStation} label="Repostaje de hoy" value="177,31 €" detail="6 conductores profesionales" />
        <MetricCard icon={IconTools} label="Próxima revisión" value="4.160 km" detail="Peugeot 2008 · 6 ago" tone="amber" />
      </div>
      <section className="content-card fleet-card">
        <header className="fleet-toolbar" aria-label="Filtros de vehículos">
          <label className="search"><IconSearch size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar matrícula, conductor o trabajo" /></label>
          <div className="filters">
            {["Todos", "Profesional", "Particular"].map((name) => <button key={name} className={filter === name ? "filter-button filter-button--active" : "filter-button"} onClick={() => setFilter(name)}>{name}</button>)}
          </div>
        </header>
        <div className="table-scroll">
          <table className="fleet-table">
            <caption className="sr-only">Estado operativo de los cinco vehículos</caption>
            <thead><tr><th>Matrícula</th><th>Conductores</th><th>Facturación</th><th>Km hoy</th><th>Repostaje</th><th>Km acumulados</th><th>Km para revisión</th><th>Taller</th></tr></thead>
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

function FuelView({ vehicles, selected, onSelectVehicle, onNavigate, initialTab = "General" }) {
  const [reportTab, setReportTab] = useState(initialTab);
  const [chartMetric, setChartMetric] = useState("summary");
  const [reportMonth, setReportMonth] = useState(6);
  const [reportYear, setReportYear] = useState(2026);
  const [periodMenu, setPeriodMenu] = useState("");
  const tabs = ["General", "Repostaje", "Gasto", "Ingreso", "Conductores"];
  useEffect(() => {
    if (!periodMenu) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setPeriodMenu(""); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [periodMenu]);
  const vehicleStats = vehicles.map((vehicle) => {
    const entries = vehicle.monthlyFuel ?? [];
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
  const totalIncome = vehicles.flatMap((vehicle) => vehicle.shifts).reduce((sum, shift) => sum + (shift.monthRevenue ?? 0), 0);
  const totalDistance = 7524;
  const periodFactor = getReportPeriodFactor(reportMonth, reportYear);
  const periodDays = new Date(reportYear, reportMonth + 1, 0).getDate();
  const billingChartData = vehicles
    .filter((vehicle) => vehicle.use === "Profesional")
    .flatMap((vehicle, vehicleIndex) => vehicle.drivers.map((driver, driverIndex) => ({
      label: driver,
      detail: vehicle.plate,
      value: Math.round(getDriverDay(vehicle, driver).monthRevenue * periodFactor * (1 + ((vehicleIndex + driverIndex) % 3 - 1) * 0.018)),
    })));
  const fuelChartData = vehicleStats.map(({ vehicle, cost }, index) => ({
    label: vehicle.plate,
    detail: vehicle.model,
    value: Number((cost * periodFactor * (1 + (index - 2) * 0.012)).toFixed(2)),
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
  const summaryChartData = [
    { label: "Facturación", detail: "Ingresos de conductores", value: periodTotals.billing, color: "#1976c9" },
    { label: "Mantenimiento", detail: "Actuaciones de taller", value: periodTotals.maintenance, color: "#607d89" },
    { label: "Combustible", detail: "Repostajes de la flota", value: periodTotals.fuel, color: "#df4538" },
    { label: "Neto", detail: "Beneficio de la flota", value: periodTotals.net, color: "#28923c" },
  ];
  const chartOptions = {
    summary: { title: "Resumen general", description: "Las cuatro áreas de la flota reunidas en una sola gráfica.", color: "#079ea7", data: summaryChartData },
    billing: { title: "Facturación por conductor", description: "Ingresos mensuales de los seis conductores profesionales.", color: "#1976c9", data: billingChartData },
    maintenance: { title: "Mantenimiento por coche", description: "Importe de las actuaciones registradas en cada vehículo.", color: "#607d89", data: maintenanceChartData },
    fuel: { title: "Combustible por coche", description: "Gasto mensual de combustible de los cinco vehículos.", color: "#df4538", data: fuelChartData },
    net: { title: "Beneficio neto por coche", description: "Facturación menos todos los gastos asignados a cada vehículo.", color: "#28923c", data: netChartData },
  };
  const activeChart = chartOptions[chartMetric];
  const selectedPeriodLabel = `${reportMonths[reportMonth]} ${reportYear}`;
  const periodEntries = Math.round((totals.refuels + 8) * periodFactor);
  const hasChartData = activeChart.data.some((item) => item.value !== 0);

  return (
    <section className="fuel-reports-page">
      <nav className="fuel-report-tabs" aria-label="Secciones de informes" role="tablist">
        {tabs.map((tab) => <button key={tab} role="tab" aria-selected={reportTab === tab} className={reportTab === tab ? "active" : ""} onClick={() => setReportTab(tab)}>{tab}</button>)}
      </nav>
      <div className="fuel-report-canvas">
        <button className="report-period" onClick={() => setReportTab("General")}><span>{selectedPeriodLabel} · {periodEntries} entradas operativas</span><IconCalendar size={17} /></button>

        {reportTab === "General" && (
          <>
            <nav className="report-quick-actions" aria-label="Accesos de SOBRE RUEDAS">
              <button onClick={() => onNavigate(navItems[1])}><IconCar size={18} /><span>Vehículos</span></button>
              <button onClick={() => onNavigate(navItems[2])}><IconGauge size={18} /><span>Lecturas</span><i>2</i></button>
              <button onClick={() => onNavigate(navItems[3])}><IconFileInvoice size={18} /><span>Facturas</span><i>3</i></button>
              <button onClick={() => onNavigate(fleetSubItems[0])}><IconTools size={18} /><span>Mantenimiento</span></button>
              <button onClick={() => setReportTab("Repostaje")}><IconGasStation size={18} /><span>Combustible</span></button>
            </nav>
            <div className="report-general-grid">
              <div className="report-stat-grid">
                <ReportStatCard icon={IconFileInvoice} label="Facturación" value={formatCurrency(periodTotals.billing)} daily={formatCurrency(periodTotals.billing / periodDays)} perKm={formatCurrency(periodTotals.billing / totalDistance)} tone="blue" active={chartMetric === "billing"} onClick={() => setChartMetric("billing")} />
                <ReportStatCard icon={IconTools} label="Mantenimiento" value={formatCurrency(periodTotals.maintenance)} daily={formatCurrency(periodTotals.maintenance / periodDays)} perKm={formatCurrency(periodTotals.maintenance / totalDistance)} tone="slate" active={chartMetric === "maintenance"} onClick={() => setChartMetric("maintenance")} />
                <ReportStatCard icon={IconGasStation} label="Combustible" value={formatCurrency(periodTotals.fuel)} daily={formatCurrency(periodTotals.fuel / periodDays)} perKm={formatCurrency(periodTotals.fuel / totalDistance)} tone="red" active={chartMetric === "fuel"} onClick={() => setChartMetric("fuel")} />
                <ReportStatCard icon={IconCurrencyEuro} label="Neto" value={formatCurrency(periodTotals.net)} daily={formatCurrency(periodTotals.net / periodDays)} perKm={formatCurrency(periodTotals.net / totalDistance)} tone="green" active={chartMetric === "net"} onClick={() => setChartMetric("net")} />
              </div>
              <section className="report-chart-card">
                <header className="report-chart-card__top">
                  <div><span className={`report-chart-icon report-chart-icon--${chartMetric}`}><IconChartBar size={18} /></span><span><strong>{activeChart.title}</strong><small>{activeChart.description}</small></span></div>
                  <div className="report-chart-filters" aria-label="Periodo del gráfico">
                    <button type="button" className={chartMetric === "summary" ? "report-summary-button report-summary-button--active" : "report-summary-button"} onClick={() => setChartMetric("summary")} aria-pressed={chartMetric === "summary"}><IconChartBar size={14} />Resumen</button>
                    <div className="report-period-dropdown" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPeriodMenu(""); }}>
                      <span>Mes</span>
                      <button type="button" className="report-period-trigger" aria-haspopup="listbox" aria-expanded={periodMenu === "month"} onClick={() => setPeriodMenu((current) => current === "month" ? "" : "month")}><span>{reportMonths[reportMonth]}</span><IconChevronDown size={13} /></button>
                      {periodMenu === "month" && <div className="report-period-menu report-period-menu--months" role="listbox" aria-label="Seleccionar mes">{reportMonths.map((month, index) => <button type="button" role="option" aria-selected={reportMonth === index} className={reportMonth === index ? "selected" : ""} onClick={() => { setReportMonth(index); setPeriodMenu(""); }} key={month}>{month}{reportMonth === index && <IconCheck size={12} />}</button>)}</div>}
                    </div>
                    <div className="report-period-dropdown" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPeriodMenu(""); }}>
                      <span>Año</span>
                      <button type="button" className="report-period-trigger report-period-trigger--year" aria-haspopup="listbox" aria-expanded={periodMenu === "year"} onClick={() => setPeriodMenu((current) => current === "year" ? "" : "year")}><span>{reportYear}</span><IconChevronDown size={13} /></button>
                      {periodMenu === "year" && <div className="report-period-menu report-period-menu--years" role="listbox" aria-label="Seleccionar año">{reportYears.map((year) => <button type="button" role="option" aria-selected={reportYear === year} className={reportYear === year ? "selected" : ""} onClick={() => { setReportYear(year); setPeriodMenu(""); }} key={year}>{year}{reportYear === year && <IconCheck size={12} />}</button>)}</div>}
                    </div>
                  </div>
                </header>
                <div className="report-chart">
                  {hasChartData ? <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeChart.data} margin={{ top: 12, right: 6, left: 2, bottom: 4 }}>
                      <CartesianGrid stroke="#e9efed" vertical={false} />
                      <XAxis dataKey="label" interval={0} tick={{ fontSize: 8, fill: "#75817d" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 8, fill: "#87918d" }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), activeChart.title]} labelFormatter={(label, payload) => payload?.[0]?.payload?.detail ? `${label} · ${payload[0].payload.detail}` : label} contentStyle={{ borderRadius: 10, borderColor: "#dce5e1", fontSize: 10 }} />
                      {chartMetric === "net" && <ReferenceLine y={0} stroke="#aab5b1" />}
                      <Bar dataKey="value" name={activeChart.title} fill={activeChart.color} radius={[5, 5, 0, 0]} maxBarSize={52} isAnimationActive={false}>
                        {activeChart.data.map((entry) => <Cell key={`${chartMetric}-${entry.label}`} fill={entry.color ?? (chartMetric === "net" && entry.value < 0 ? "#df4538" : activeChart.color)} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer> : <div className="report-chart-empty"><IconChartBar size={24} /><strong>Sin datos en este periodo</strong><span>No hay movimientos de {activeChart.title.toLocaleLowerCase("es")} en {selectedPeriodLabel.toLocaleLowerCase("es")}.</span></div>}
                </div>
              </section>
            </div>
            <FuelVehicleOverview stats={vehicleStats} selected={selected} onSelectVehicle={onSelectVehicle} />
          </>
        )}

        {reportTab === "Repostaje" && (
          <>
            <FuelVehicleOverview stats={vehicleStats} selected={selected} onSelectVehicle={onSelectVehicle} />
            <FuelLedgerDetail selected={selected} />
          </>
        )}

        {reportTab === "Gasto" && <FuelExpenseReport stats={vehicleStats} total={totals.cost} />}
        {reportTab === "Ingreso" && <FuelIncomeReport vehicles={vehicles} total={totalIncome} />}
        {reportTab === "Conductores" && <FuelDriversReport vehicles={vehicles} />}
      </div>
    </section>
  );
}

function ReportStatCard({ icon: Icon, label, value, daily, perKm, tone, active, onClick }) {
  return (
    <button type="button" className={`report-stat-card report-stat-card--${tone}${active ? " report-stat-card--active" : ""}`} onClick={onClick} aria-label={`Mostrar gráfico de ${label}`} aria-pressed={active}>
      <span className="report-stat-card__header"><span><Icon size={18} /></span><strong>{label}</strong></span>
      <small>Total</small>
      <strong className="report-stat-value">{value}</strong>
      <span className="report-stat-card__footer"><span><small>Por día</small><strong>{daily}</strong></span><span><small>Por km</small><strong>{perKm}</strong></span></span>
    </button>
  );
}

function FuelVehicleOverview({ stats, selected, onSelectVehicle }) {
  return (
    <section className="content-card fuel-overview report-section-card">
      <header className="card-header">
        <div><h2>Consumo mensual por vehículo</h2><p>Selecciona un coche para consultar sus datos.</p></div>
        <span className="month-chip"><IconCalendar size={15} />Julio 2026</span>
      </header>
      <div className="fuel-vehicle-grid" aria-label="Vehículos con consumo de julio de 2026">
        {stats.map(({ vehicle, liters, cost, refuels }) => {
          const active = selected.plate === vehicle.plate;
          return (
            <button className={active ? "fuel-vehicle-card fuel-vehicle-card--active" : "fuel-vehicle-card"} key={vehicle.plate} onClick={() => onSelectVehicle(vehicle)} aria-pressed={active}>
              <span className="fuel-vehicle-card__heading"><span><strong>{vehicle.plate}</strong><small>{vehicle.model}</small></span><UseBadge value={vehicle.use} /></span>
              <span className="fuel-vehicle-card__totals"><span><small>Consumo</small><strong>{liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</strong></span><span><small>Gasto</small><strong>{formatCurrency(cost)}</strong></span></span>
              <span className="fuel-vehicle-card__footer"><small>{refuels} repostajes</small><IconChevronRight size={16} /></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FuelLedgerDetail({ selected }) {
  const selectedEntries = selected.monthlyFuel ?? [];
  const selectedLiters = selectedEntries.reduce((sum, entry) => sum + (entry.liters ?? 0), 0);
  const selectedCost = selectedEntries.reduce((sum, entry) => sum + (entry.cost ?? 0), 0);
  return (
    <section className="content-card fuel-detail report-section-card">
      <header className="fuel-detail__header">
        <div className="fuel-detail__identity"><span className="fuel-detail__icon"><IconGasStation size={20} /></span><span><small>Vehículo seleccionado</small><strong>{selected.plate}</strong><small>{selected.model}</small></span></div>
        <div className="fuel-detail__totals"><span><small>Consumo mensual</small><strong>{selectedLiters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</strong></span><span><small>Gasto mensual</small><strong>{formatCurrency(selectedCost)}</strong></span></div>
      </header>
      {selected.fuelSchedule?.length > 0 ? (
        <div className="fuel-page-schedule" aria-label={`Horarios de los conductores de ${selected.plate}`}><span className="fuel-page-schedule__label"><IconClock size={16} /><strong>Asignación por horario</strong></span>{selected.fuelSchedule.map((shift) => <span className="fuel-page-shift" key={shift.label}><strong>{shift.driver}</strong><small>{shift.label}</small></span>)}</div>
      ) : (
        <div className="fuel-page-schedule fuel-page-schedule--manual"><span className="fuel-page-schedule__label"><IconUsers size={16} /><strong>Asignación manual</strong></span><small>Los conductores particulares se indican en cada registro.</small></div>
      )}
      <div className="fuel-page-table-wrap">
        <table className="fuel-page-table">
          <caption className="sr-only">Repostajes diarios de julio de 2026 para {selected.plate}</caption>
          <thead><tr><th>Fecha</th><th>Hora</th><th>Conductor</th><th>Turno asignado</th><th>Litros</th><th>Precio/L</th><th>Importe</th></tr></thead>
          <tbody>{selectedEntries.map((entry) => {
            const assignment = getFuelAssignment(selected, entry);
            const pricePerLiter = entry.liters ? entry.cost / entry.liters : 0;
            return <tr key={`${entry.date}-${entry.time}`}><td><strong>{entry.date.replace(" 2026", "")}</strong></td><td><strong>{entry.time}</strong></td><td><span className="fuel-driver"><IconUsers size={14} /><strong>{assignment.driver}</strong></span></td><td><span className="fuel-shift-badge">{assignment.label}</span></td><td><strong>{entry.liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</strong></td><td>{formatCurrency(pricePerLiter)}</td><td><strong>{formatCurrency(entry.cost)}</strong></td></tr>;
          })}</tbody>
        </table>
      </div>
      <footer className="fuel-detail__footer"><IconSparkles size={15} /><span>El conductor se determina automáticamente por la hora del repostaje y los turnos configurados para este coche.</span></footer>
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

function FuelIncomeReport({ vehicles, total }) {
  const rows = vehicles.flatMap((vehicle) => vehicle.shifts.map((shift) => ({ ...shift, plate: vehicle.plate, model: vehicle.model })));
  return (
    <section className="content-card report-table-card">
      <header className="card-header"><div><h2>Ingresos por conductor</h2><p>Facturación mensual y viajes de los conductores profesionales.</p></div><strong className="report-header-total report-header-total--green">{formatCurrency(total)}</strong></header>
      <div className="table-scroll"><table className="module-table report-table"><thead><tr><th>Conductor</th><th>Vehículo</th><th>Turno</th><th>Viajes</th><th>Ingreso mensual</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.plate}-${row.driver}`}><td><strong>{row.driver}</strong></td><td><strong>{row.plate}</strong><small>{row.model}</small></td><td>{row.time}</td><td>{row.monthTrips}</td><td><strong>{formatCurrency(row.monthRevenue)}</strong></td></tr>)}</tbody></table></div>
    </section>
  );
}

function FuelDriversReport({ vehicles }) {
  const professional = vehicles.filter((vehicle) => vehicle.use === "Profesional");
  return (
    <section className="report-drivers-grid" aria-label="Conductores y turnos profesionales">
      {professional.map((vehicle) => <article className="report-driver-vehicle" key={vehicle.plate}><header><span><IconCar size={18} /></span><div><strong>{vehicle.plate}</strong><small>{vehicle.model}</small></div></header><div>{vehicle.fuelSchedule.map((shift) => <span className="report-driver-shift" key={shift.label}><span className="avatar report-driver-avatar">{shift.driver.slice(0, 2).toUpperCase()}</span><span><strong>{shift.driver}</strong><small>{shift.label}</small></span><IconClock size={16} /></span>)}</div></article>)}
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
  const workshopVehicle = vehicles.find((vehicle) => vehicle.plate === workshopPlate) ?? vehicles[0];
  const selectedBrand = getVehicleBrand(workshopVehicle);
  const sortedMaintenance = [...workshopVehicle.maintenance].sort((a, b) => getMaintenanceDateValue(b) - getMaintenanceDateValue(a));
  const total = sortedMaintenance.reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    setWorkshopPlate(initialPlate);
  }, [initialPlate]);

  useEffect(() => {
    const first = [...workshopVehicle.maintenance].sort((a, b) => getMaintenanceDateValue(b) - getMaintenanceDateValue(a))[0];
    setOpenMaintenanceKey(first ? `${first.date}-${first.concept}-${first.km}` : "");
  }, [workshopVehicle.plate]);

  const selectWorkshopVehicle = (plate) => {
    setWorkshopPlate(plate);
    window.setTimeout(() => document.getElementById("historial-mantenimiento")?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 40);
  };

  return (
    <section className="module-page">
      <PageIntro eyebrow="Plan preventivo" title="Mantenimiento" description="Selecciona un coche para consultar sus revisiones, abrir el detalle de cada fecha o ver la factura del taller." action={<button className="primary-button" onClick={() => setModal({ type: "invoice-upload", plate: workshopVehicle.plate })}><IconCamera size={17} />Factura desde foto</button>} />
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
      <section className="content-card maintenance-history-panel" id="historial-mantenimiento">
        <header className="maintenance-history-header">
          <div className="maintenance-history-vehicle">
            <span className={`vehicle-brand-mark vehicle-brand-mark--${selectedBrand.toLocaleLowerCase("es")}`}><img src={vehicleBrandLogos[selectedBrand]} alt="" /></span>
            <span><small>Historial seleccionado</small><h2>{workshopVehicle.plate}</h2><p>{workshopVehicle.model} · {workshopVehicle.use}</p></span>
          </div>
          <div className="maintenance-history-total"><small>{sortedMaintenance.length} intervenciones</small><strong>{formatCurrency(total)}</strong></div>
        </header>
        <div className="maintenance-timeline" aria-label={`Historial de mantenimiento de ${workshopVehicle.plate}`}>
          {sortedMaintenance.map((item) => {
            const key = `${item.date}-${item.concept}-${item.km}`;
            const isOpen = openMaintenanceKey === key;
            const invoice = getMaintenanceInvoice(item, workshopVehicle, invoices);
            const details = invoice?.items?.length ? invoice.items : [{ concept: item.concept, amount: item.amount }];
            const detailId = `detail-${workshopVehicle.plate.replace(/\s/g, "")}-${item.km}`;
            return (
              <article className={`maintenance-event ${isOpen ? "is-open" : ""}`} key={key}>
                <button className="maintenance-event-date" onClick={() => setOpenMaintenanceKey(isOpen ? "" : key)} aria-expanded={isOpen} aria-controls={detailId}>
                  <IconCalendar size={18} /><span><strong>{formatMaintenanceDate(item)}</strong><small>{formatKm(item.km)}</small></span><IconChevronDown className="maintenance-event-toggle" size={18} />
                </button>
                <div className="maintenance-event-summary"><small>Actuación</small><strong>{item.concept}</strong><span>{formatCurrency(item.amount)}</span></div>
                <div className="maintenance-event-invoice">
                  {invoice ? <button onClick={() => setModal({ type: "invoice", item: invoice })} aria-label={`Abrir factura ${invoice.id}`}><IconFileInvoice size={18} /><span><strong>Abrir factura</strong><small>{invoice.id}</small></span></button> : <span className="maintenance-invoice-unavailable"><IconFileInvoice size={18} /><span><strong>Sin factura</strong><small>No proporcionada</small></span></span>}
                </div>
                {isOpen && <div className="maintenance-event-detail" id={detailId}>
                  <header><strong>Trabajos realizados</strong><small>{invoice?.provider ?? "Registro de mantenimiento"}</small></header>
                  <div>{details.map((detail, index) => <span key={`${detail.concept}-${index}`}><span><IconCheck size={15} />{detail.concept}</span><strong>{formatCurrency(Number(detail.amount))}</strong></span>)}</div>
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
        <section className="content-card settings-card"><header><IconBuildingStore size={20} /><div><h2>Organización</h2><p>Datos visibles en informes y comunicaciones.</p></div></header><label>Nombre de la flota<input value={settings.company} onChange={(event) => update("company", event.target.value)} /></label><label>Correo de gestión<input type="email" value={settings.email} onChange={(event) => update("email", event.target.value)} /></label></section>
        <section className="content-card settings-card"><header><IconAlertTriangle size={20} /><div><h2>Alertas</h2><p>Cuándo debe intervenir el gestor.</p></div></header><label>Avisar antes de la revisión<div className="input-suffix"><input type="number" value={settings.serviceWarning} onChange={(event) => update("serviceWarning", event.target.value)} /><span>km</span></div></label><label>Revisar si la confianza baja de<div className="input-suffix"><input type="number" value={settings.lowConfidence} onChange={(event) => update("lowConfidence", event.target.value)} /><span>%</span></div></label></section>
        <section className="content-card settings-card"><header><IconShieldCheck size={20} /><div><h2>Seguridad</h2><p>Acceso y trazabilidad de cambios.</p></div></header><div className="settings-row"><span><strong>Registro de auditoría</strong><small>Conservar cambios durante 12 meses</small></span><StatusBadge status="Activo" /></div><div className="settings-row"><span><strong>Doble validación</strong><small>Para importes superiores a 1.000 €</small></span><StatusBadge status="Activo" /></div></section>
      </div>
      <footer className="settings-actions"><button className="secondary-button" onClick={() => notify("Cambios descartados")}>Descartar</button><button className="primary-button" onClick={() => notify("Ajustes guardados")}><IconCheck size={18} />Guardar ajustes</button></footer>
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
  const isPhotoInvoice = modal.type === "invoice-upload";
  const titles = { reading: "Registrar una lectura", "reading-review": "Revisar lectura", "invoice-upload": "Crear factura desde una foto", invoice: "Detalle de factura", support: "Contactar con soporte" };
  const complete = (message) => { notify(message); onClose(); };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`modal ${isPhotoInvoice ? "modal--invoice-photo" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header><div><span>Acción rápida</span><h2 id="modal-title">{titles[modal.type]}</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar ventana"><IconX size={21} /></button></header>
        {isReading && <><div className="review-banner"><IconSparkles size={21} /><span><strong>Extracción completada</strong><small>Confianza IA {item.confidence}% · Revisa antes de validar</small></span></div><div className="form-grid"><label>Vehículo<input defaultValue={item.plate} /></label><label>Conductor<input defaultValue={item.driver} /></label><label>Odómetro total<input defaultValue={item.total} /></label><label>Kilómetros diarios<input defaultValue={item.daily} /></label></div></>}
        {isInvoice && <><div className="invoice-preview"><IconFileInvoice size={30} /><span><strong>{item.id}</strong><small>{item.provider} · {item.date}</small></span><strong>{formatCurrency(item.amount)}</strong></div><dl><div><dt>Vehículo</dt><dd>{item.plate}</dd></div>{item.km && <div><dt>Kilometraje</dt><dd>{formatKm(item.km)}</dd></div>}<div><dt>Concepto</dt><dd>{item.concept}</dd></div><div><dt>Origen</dt><dd>{item.source}</dd></div><div><dt>Estado</dt><dd><StatusBadge status={item.status} /></dd></div></dl>{item.items?.length > 0 && <InvoiceLinesTable date={item.date} items={item.items} />}</>}
        {modal.type === "reading" && <div className="upload-zone"><IconBrandWhatsapp size={30} /><strong>Añadir lectura manual</strong><p>Selecciona una imagen del odómetro o introduce los datos manualmente.</p><button className="secondary-button"><IconUpload size={17} />Seleccionar imagen</button></div>}
        {isPhotoInvoice && <InvoicePhotoWorkflow initialPlate={modal.plate} vehicles={vehicles} onCancel={onClose} onSave={(invoice) => { onSaveInvoice(invoice); complete("Factura guardada; Mantenimiento y Gastos se han actualizado"); }} />}
        {modal.type === "support" && <div className="support-form"><label>Asunto<input placeholder="Describe brevemente el problema" /></label><label>Mensaje<textarea placeholder="Cuéntanos qué necesitas revisar" rows={5} /></label></div>}
        {!isPhotoInvoice && <footer><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={() => complete(isReading ? "Lectura validada correctamente" : isInvoice ? "Factura revisada" : modal.type === "support" ? "Consulta enviada a soporte" : "Archivo preparado para procesar")}><IconCheck size={18} />{isReading ? "Validar lectura" : isInvoice ? "Marcar revisada" : modal.type === "support" ? "Enviar consulta" : "Continuar"}</button></footer>}
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
