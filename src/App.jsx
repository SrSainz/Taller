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
  IconMenu2,
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
  IconX,
} from "@tabler/icons-react";

const navItems = [
  { label: "Flota", slug: "flota", icon: IconCar },
  { label: "Lecturas", slug: "lecturas", icon: IconGauge, badge: 2 },
  { label: "Facturas", slug: "facturas", icon: IconFileInvoice, badge: 3 },
  { label: "Mantenimiento", slug: "mantenimiento", icon: IconTools },
  { label: "Automatizaciones", slug: "automatizaciones", icon: IconRobot },
];

const utilityItems = [
  { label: "Ajustes", slug: "ajustes", icon: IconSettings },
  { label: "Ayuda", slug: "ayuda", icon: IconHelpCircle },
];

const vehiclesSeed = [
  {
    plate: "5754 MJV",
    model: "Ford Transit",
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
    model: "Mercedes Sprinter",
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
    model: "Renault Master",
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
    plate: "3456 HTR",
    model: "Peugeot 3008",
    use: "Doméstico",
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
    plate: "7890 GYL",
    model: "Toyota Corolla",
    use: "Doméstico",
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
  { id: "FAC-2026-1761", date: "12 jun 2026", provider: "Peugeot Service", plate: "3456 HTR", concept: "Aceite y filtros", amount: 224.8, source: "Manual", status: "Asociada" },
  { id: "FAC-2026-1684", date: "28 may 2026", provider: "Toyota Madrid", plate: "7890 GYL", concept: "Aceite y filtros", amount: 198.6, source: "Correo", status: "Pendiente" },
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

const loadPhotoInvoices = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(photoInvoiceStorageKey) ?? "[]");
    return Array.isArray(stored)
      ? stored.filter((invoice) => invoice?.id && invoice?.plate && Array.isArray(invoice?.items))
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
  "3456 HTR": [420, 0, 185.34, 224.8, 0, 0, 0, 0, 0, 540, 40, 60],
  "7890 GYL": [0, 310, 142.18, 198.6, 0, 0, 0, 0, 0, 495, 35, 44.9],
};

const readingSeed = [
  { id: "LEC-4381", time: "Hoy · 04:08", driver: "Fernando", plate: "5754 MJV", total: 128460, daily: 150, confidence: 98, status: "Validada" },
  { id: "LEC-4380", time: "Hoy · 07:03", driver: "Amin", plate: "5043 MLC", total: 210735, daily: 121, confidence: 96, status: "Revisar" },
  { id: "LEC-4379", time: "Hoy · 06:05", driver: "Alex", plate: "5750 MJV", total: 142980, daily: 138, confidence: 97, status: "Validada" },
  { id: "LEC-4378", time: "Hoy · 19:05", driver: "David García", plate: "3456 HTR", total: 98215, daily: 13, confidence: 92, status: "Revisar" },
  { id: "LEC-4377", time: "Hoy · 16:05", driver: "Carlos", plate: "5754 MJV", total: 128310, daily: 168, confidence: 99, status: "Validada" },
  { id: "LEC-4376", time: "Hoy · 19:02", driver: "Mauricio", plate: "5043 MLC", total: 210614, daily: 120, confidence: 98, status: "Validada" },
];

const formatKm = (value) => `${new Intl.NumberFormat("es-ES").format(value)} km`;
const formatCurrency = (value) => `${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const normalizeText = (value = "") => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");
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
  return [...navItems, ...utilityItems].find((item) => item.slug === slug)?.label ?? "Flota";
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
  const [activeNav, setActiveNav] = useState(navFromHash);
  const [selectedPlate, setSelectedPlate] = useState("5043 MLC");
  const [maintenancePlate, setMaintenancePlate] = useState("5043 MLC");
  const [selectedDrivers, setSelectedDrivers] = useState({
    "5754 MJV": "Carlos",
    "5750 MJV": "Tirso",
    "5043 MLC": "Mauricio",
    "3456 HTR": "Ana García",
    "7890 GYL": "Sergio Ruiz",
  });
  const [filter, setFilter] = useState("Todos");
  const [query, setQuery] = useState("");
  const [openShift, setOpenShift] = useState("jbv-t2");
  const [inspectorTab, setInspectorTab] = useState("Turnos");
  const [inspectorOpen, setInspectorOpen] = useState(() => window.innerWidth > 820);
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [photoInvoices, setPhotoInvoices] = useState(loadPhotoInvoices);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [automationEnabled, setAutomationEnabled] = useState({ whatsapp: true, email: true, openai: true });
  const [openFaq, setOpenFaq] = useState(0);
  const [settings, setSettings] = useState({ company: "Talleria Flota", email: "flota@talleria.es", serviceWarning: "5000", lowConfidence: "94" });
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(() => window.matchMedia("(display-mode: standalone)").matches || Boolean(window.navigator.standalone));
  const toastTimer = useRef();

  useEf…15666 tokens truncated…tem = modal.item;
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
        {modal.type === "invoice-upload" && <div className="upload-zone"><IconFileInvoice size={30} /><strong>Subir factura del taller</strong><p>Formatos PDF, JPG o PNG. Talleria propondrá vehículo, concepto e importe.</p><button className="secondary-button"><IconUpload size={17} />Seleccionar archivo</button></div>}
        {modal.type === "support" && <div className="support-form"><label>Asunto<input placeholder="Describe brevemente el problema" /></label><label>Mensaje<textarea placeholder="Cuéntanos qué necesitas revisar" rows={5} /></label></div>}
        <footer><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={() => complete(isReading ? "Lectura validada correctamente" : isInvoice ? "Factura revisada" : modal.type === "support" ? "Consulta enviada a soporte" : "Archivo preparado para procesar")}><IconCheck size={18} />{isReading ? "Validar lectura" : isInvoice ? "Marcar revisada" : modal.type === "support" ? "Enviar consulta" : "Continuar"}</button></footer>
      </section>
    </div>
  );
}
