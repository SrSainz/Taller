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
    plate: "1234 KXD",
    model: "Ford Transit",
    use: "Profesional",
    drivers: ["Luis Martínez", "Elena Torres"],
    odometer: 128460,
    nextServiceKm: 134000,
    serviceDate: "12 ago 2026",
    shifts: [
      { id: "kxd-t2", label: "Turno de tarde", driver: "Elena Torres", time: "14:10–22:04", start: 128310, end: 128460, km: 150, liters: 18.4, cost: 31.28, revenue: 418.2, cash: 76, monthRevenue: 7954.3, monthTrips: 136, sentAt: "22:08", confidence: 98 },
      { id: "kxd-t1", label: "Turno de mañana", driver: "Luis Martínez", time: "06:03–14:01", start: 128142, end: 128310, km: 168, liters: 20.1, cost: 34.17, revenue: 462.8, cash: 128.5, monthRevenue: 8240.5, monthTrips: 142, sentAt: "14:05", confidence: 99 },
    ],
    maintenance: [
      { date: "18 jul 2026", km: 127820, concept: "Aceite y filtros", amount: 286.4 },
      { date: "3 abr 2026", km: 121220, concept: "Pastillas de freno", amount: 342.8 },
      { date: "9 ene 2026", km: 116050, concept: "Aceite y filtros", amount: 274.2 },
    ],
  },
  {
    plate: "5678 LPT",
    model: "Mercedes Sprinter",
    use: "Profesional",
    drivers: ["Carlos Pérez", "Marta Sánchez"],
    odometer: 142980,
    nextServiceKm: 150000,
    serviceDate: "18 ago 2026",
    shifts: [
      { id: "lpt-t2", label: "Turno de tarde", driver: "Marta Sánchez", time: "14:02–21:46", start: 142842, end: 142980, km: 138, liters: 16.8, cost: 28.56, revenue: 435.2, cash: 110, monthRevenue: 8126.4, monthTrips: 139, sentAt: "21:51", confidence: 97 },
      { id: "lpt-t1", label: "Turno de mañana", driver: "Carlos Pérez", time: "06:08–13:55", start: 142704, end: 142842, km: 138, liters: 17.4, cost: 29.58, revenue: 390.5, cash: 90, monthRevenue: 7318.8, monthTrips: 128, sentAt: "14:00", confidence: 99 },
    ],
    maintenance: [
      { date: "5 jul 2026", km: 140410, concept: "Neumáticos delanteros", amount: 498 },
      { date: "21 mar 2026", km: 132900, concept: "Aceite y filtros", amount: 318.6 },
      { date: "8 dic 2025", km: 124480, concept: "Neumáticos delanteros", amount: 472 },
    ],
  },
  {
    plate: "9102 JBV",
    model: "Renault Master",
    use: "Profesional",
    drivers: ["Javier Ruiz", "Laura Gómez"],
    odometer: 210735,
    nextServiceKm: 215000,
    serviceDate: "2 ago 2026",
    shifts: [
      { id: "jbv-t2", label: "Turno de tarde", driver: "Laura Gómez", time: "14:06–21:58", start: 210614, end: 210735, km: 121, liters: 19.2, cost: 32.64, revenue: 402.75, cash: 122, monthRevenue: 7542.9, monthTrips: 130, sentAt: "22:03", confidence: 96, alert: true },
      { id: "jbv-t1", label: "Turno de mañana", driver: "Javier Ruiz", time: "06:11–13:57", start: 210494, end: 210614, km: 120, liters: 12.4, cost: 21.08, revenue: 376.4, cash: 84.5, monthRevenue: 6984.25, monthTrips: 121, sentAt: "14:02", confidence: 98 },
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
    plate: "9102 JBV",
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
  { id: "FAC-2026-1842", date: "18 jul 2026", provider: "Mecánica Norte", plate: "1234 KXD", concept: "Aceite y filtros", amount: 286.4, source: "Correo", status: "Asociada" },
  { id: "FAC-2026-1798", date: "5 jul 2026", provider: "Neumáticos Central", plate: "5678 LPT", concept: "Neumáticos delanteros", amount: 498, source: "Correo", status: "Revisar" },
  { id: "FAC-2026-1761", date: "12 jun 2026", provider: "Peugeot Service", plate: "3456 HTR", concept: "Aceite y filtros", amount: 224.8, source: "Manual", status: "Asociada" },
  { id: "FAC-2026-1684", date: "28 may 2026", provider: "Toyota Madrid", plate: "7890 GYL", concept: "Aceite y filtros", amount: 198.6, source: "Correo", status: "Pendiente" },
];

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
  "1234 KXD": [780, 450, 1280.42, 286.4, 390, 1650, 824.05, 1860, 85, 870, 95, 120],
  "5678 LPT": [895, 450, 1136.28, 498, 390, 1650, 812.64, 1740, 92, 940, 110, 164.8],
  "9102 JBV": [820, 450, 1054.72, 312.5, 390, 1650, 754.29, 1695, 78, 905, 98, 98.5],
  "3456 HTR": [420, 0, 185.34, 224.8, 0, 0, 0, 0, 0, 540, 40, 60],
  "7890 GYL": [0, 310, 142.18, 198.6, 0, 0, 0, 0, 0, 495, 35, 44.9],
};

const readingSeed = [
  { id: "LEC-4381", time: "Hoy · 22:08", driver: "Elena Torres", plate: "1234 KXD", total: 128460, daily: 150, confidence: 98, status: "Validada" },
  { id: "LEC-4380", time: "Hoy · 22:03", driver: "Laura Gómez", plate: "9102 JBV", total: 210735, daily: 121, confidence: 96, status: "Revisar" },
  { id: "LEC-4379", time: "Hoy · 21:51", driver: "Marta Sánchez", plate: "5678 LPT", total: 142980, daily: 138, confidence: 97, status: "Validada" },
  { id: "LEC-4378", time: "Hoy · 19:05", driver: "David García", plate: "3456 HTR", total: 98215, daily: 13, confidence: 92, status: "Revisar" },
  { id: "LEC-4377", time: "Hoy · 14:05", driver: "Luis Martínez", plate: "1234 KXD", total: 128310, daily: 168, confidence: 99, status: "Validada" },
  { id: "LEC-4376", time: "Hoy · 14:02", driver: "Javier Ruiz", plate: "9102 JBV", total: 210614, daily: 120, confidence: 98, status: "Validada" },
];

const formatKm = (value) => `${new Intl.NumberFormat("es-ES").format(value)} km`;
const formatCurrency = (value) => `${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const getDriverDay = (vehicle, driver) =>
  vehicle.shifts.find((shift) => shift.driver === driver) ??
  vehicle.daily?.find((entry) => entry.driver === driver) ??
  { driver, km: 0, liters: 0, cost: 0, revenue: 0, cash: 0, monthRevenue: 0, monthTrips: 0, time: "Sin actividad" };

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
  const [selectedPlate, setSelectedPlate] = useState("9102 JBV");
  const [maintenancePlate, setMaintenancePlate] = useState("9102 JBV");
  const [selectedDrivers, setSelectedDrivers] = useState({
    "1234 KXD": "Luis Martínez",
    "5678 LPT": "Carlos Pérez",
    "9102 JBV": "Laura Gómez",
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
  const [invoices, setInvoices] = useState(invoiceSeed);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [automationEnabled, setAutomationEnabled] = useState({ whatsapp: true, email: true, openai: true });
  const [openFaq, setOpenFaq] = useState(0);
  const [settings, setSettings] = useState({ company: "Talleria Flota", email: "flota@talleria.es", serviceWarning: "5000", lowConfidence: "94" });
  const toastTimer = useRef();

  useEffect(() => {
    const handleHash = () => setActiveNav(navFromHash());
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setModal(null);
        setNotificationsOpen(false);
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const selected = vehiclesSeed.find((vehicle) => vehicle.plate === selectedPlate) ?? vehiclesSeed[0];
  const selectedDriver = selectedDrivers[selected.plate] ?? selected.drivers[0];
  const selectedActivity = getDriverDay(selected, selectedDriver);
  const showInspector = activeNav === "Flota" && inspectorOpen;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return vehiclesSeed.filter((vehicle) => {
      const searchable = `${vehicle.plate} ${vehicle.model} ${vehicle.drivers.join(" ")} ${vehicle.maintenance.map((item) => item.concept).join(" ")}`.toLocaleLowerCase("es");
      return (!normalized || searchable.includes(normalized)) && (filter === "Todos" || vehicle.use === filter);
    });
  }, [filter, query]);

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  };

  const savePhotoInvoice = (invoice) => {
    setInvoices((current) => [invoice, ...current]);
  };

  const navigate = (item) => {
    setActiveNav(item.label);
    setSidebarOpen(false);
    setNotificationsOpen(false);
    if (window.location.hash !== `#/${item.slug}`) window.location.hash = `/${item.slug}`;
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
    setInspectorTab("Turnos");
    setInspectorOpen(true);
  };

  const openWorkshop = (vehicle) => {
    setMaintenancePlate(vehicle.plate);
    navigate(navItems[3]);
    window.setTimeout(() => document.getElementById("taller-vehiculo")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const openVehicleFromModule = (plate, tab = "Turnos") => {
    setSelectedPlate(plate);
    setInspectorTab(tab);
    setInspectorOpen(true);
    navigate(navItems[0]);
  };

  return (
    <div className={`app-shell ${showInspector ? "app-shell--inspector" : ""}`}>
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="brand"><span>T</span><strong>Talleria</strong></div>
        <nav aria-label="Navegación principal">
          <span className="nav-group-label">Operación</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.label;
            return (
              <button className={active ? "nav-item nav-item--active" : "nav-item"} key={item.label} onClick={() => navigate(item)} aria-current={active ? "page" : undefined}>
                <Icon size={20} stroke={1.8} /><span>{item.label}</span>{item.badge && <i>{item.badge}</i>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          {utilityItems.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.label;
            return <button className={active ? "nav-item nav-item--active" : "nav-item"} key={item.label} onClick={() => navigate(item)} aria-current={active ? "page" : undefined}><Icon size={20} /><span>{item.label}</span></button>;
          })}
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <button className="icon-button menu-button" onClick={() => setSidebarOpen((value) => !value)} aria-label="Abrir menú"><IconMenu2 size={23} /></button>
            <IconMenu2 className="desktop-menu" size={22} stroke={1.8} />
            <div><span>{activeNav}</span><small>Gestión centralizada de vehículos</small></div>
          </div>
          <div className="topbar-actions">
            <span className="date"><IconCalendar size={18} />28 jul 2026</span>
            <button className="bell-button" aria-label="Notificaciones" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((value) => !value)}><IconBell size={20} /><i>2</i></button>
            <button className="profile" onClick={() => notify("Perfil de Ana García")}><span className="avatar">AG</span><span><strong>Ana García</strong><small>Gestora de flota</small></span><IconChevronDown size={17} /></button>
          </div>
          {notificationsOpen && (
            <aside className="notification-popover" aria-label="Notificaciones recientes">
              <header><strong>Notificaciones</strong><button className="icon-button" onClick={() => setNotificationsOpen(false)} aria-label="Cerrar notificaciones"><IconX size={18} /></button></header>
              <button onClick={() => openVehicleFromModule("9102 JBV")}><IconAlertTriangle size={18} /><span><strong>Revisión próxima</strong><small>Renault Master · 4.265 km restantes</small></span></button>
              <button onClick={() => navigate(navItems[1])}><IconGauge size={18} /><span><strong>2 lecturas por revisar</strong><small>Confianza inferior al umbral configurado</small></span></button>
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
          {activeNav === "Lecturas" && <ReadingsView setModal={setModal} />}
          {activeNav === "Facturas" && <InvoicesView invoices={invoices} setModal={setModal} />}
          {activeNav === "Mantenimiento" && <MaintenanceView initialPlate={maintenancePlate} setModal={setModal} />}
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
          inspectorTab={inspectorTab}
          setInspectorTab={setInspectorTab}
          setInspectorOpen={setInspectorOpen}
          selectDriver={selectDriver}
          openShift={openShift}
          setOpenShift={setOpenShift}
          notify={notify}
        />
      )}

      {modal && <AppModalV2 modal={modal} onClose={() => setModal(null)} notify={notify} onSaveInvoice={savePhotoInvoice} />}
      {toast && <div className="toast" role="status"><IconCircleCheck size={19} />{toast}</div>}
      {sidebarOpen && <button className="backdrop" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}

function FleetView({ filtered, filter, query, selected, selectedDrivers, setFilter, setQuery, selectVehicle, selectDriver, openWorkshop, setModal }) {
  return (
    <section className="module-page fleet-page">
      <PageIntro
        eyebrow="Vista operativa"
        title="Control de flota"
        description="Kilómetros, facturación, combustible y mantenimiento en una única vista."
        action={<button className="primary-button" onClick={() => setModal({ type: "reading" })}><IconPlus size={18} />Registrar lectura</button>}
      />
      <div className="metric-cards">
        <MetricCard icon={IconBriefcase} label="Vehículos profesionales" value="3" detail="6 turnos recibidos hoy" />
        <MetricCard icon={IconGasStation} label="Repostaje de hoy" value="188,66 €" detail="10 conductores registrados" />
        <MetricCard icon={IconTools} label="Próxima revisión" value="4.160 km" detail="Toyota Corolla · 6 ago" tone="amber" />
      </div>
      <section className="content-card fleet-card">
        <header className="fleet-toolbar" aria-label="Filtros de vehículos">
          <label className="search"><IconSearch size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar matrícula, conductor o trabajo" /></label>
          <div className="filters">
            {["Todos", "Profesional", "Doméstico"].map((name) => <button key={name} className={filter === name ? "filter-button filter-button--active" : "filter-button"} onClick={() => setFilter(name)}>{name}</button>)}
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
                      <div className="driver-selector" aria-label={`Conductores de ${vehicle.plate}`}>
                        {vehicle.drivers.map((name) => <button className={driver === name ? "driver-chip driver-chip--active" : "driver-chip"} key={name} onClick={(event) => { event.stopPropagation(); selectDriver(vehicle, name); }}>{name}</button>)}
                      </div>
                    </td>
                    <td className="billing-cell"><strong>{formatCurrency(day.revenue)} hoy</strong><small>Mes {formatCurrency(day.monthRevenue)} · {day.monthTrips} viajes</small><small>Efectivo {formatCurrency(day.cash)}</small></td>
                    <td><strong>{formatKm(day.km)}</strong><small>{driver.split(" ")[0]}</small></td>
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
        <footer className="table-footer"><span>5 vehículos · 10 conductores</span><span>Selecciona un conductor para ver su actividad diaria</span></footer>
      </section>
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

function MaintenanceView({ initialPlate, setModal }) {
  const [workshopPlate, setWorkshopPlate] = useState(initialPlate);
  const workshopButtonRefs = useRef({});
  const schedule = [...vehiclesSeed].sort((a, b) => (a.nextServiceKm - a.odometer) - (b.nextServiceKm - b.odometer));
  const workshopVehicle = vehiclesSeed.find((vehicle) => vehicle.plate === workshopPlate) ?? vehiclesSeed[0];

  useEffect(() => {
    setWorkshopPlate(initialPlate);
  }, [initialPlate]);

  useEffect(() => {
    const activeButton = workshopButtonRefs.current[workshopPlate];
    const list = activeButton?.parentElement;
    if (activeButton && list && window.innerWidth <= 820) {
      list.scrollTo({ left: activeButton.offsetLeft - (list.clientWidth - activeButton.clientWidth) / 2, behavior: "smooth" });
    }
  }, [workshopPlate]);

  const showWorkshop = (plate) => {
    setWorkshopPlate(plate);
    window.setTimeout(() => document.getElementById("taller-vehiculo")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  };

  return (
    <section className="module-page">
      <PageIntro eyebrow="Plan preventivo" title="Mantenimiento y taller" description="Prioriza revisiones, consulta el historial completo y crea facturas desde una fotografía." action={<button className="primary-button" onClick={() => showWorkshop(schedule[0].plate)}><IconCalendar size={18} />Abrir próxima revisión</button>} />
      <div className="maintenance-layout">
        <section className="content-card schedule-card">
          <header className="card-header"><div><h2>Próximas revisiones</h2><p>Ordenadas por kilometraje restante.</p></div></header>
          <div className="schedule-list">{schedule.map((vehicle, index) => {
            const remaining = vehicle.nextServiceKm - vehicle.odometer;
            return <button key={vehicle.plate} className="schedule-row" onClick={() => showWorkshop(vehicle.plate)}><span className={`schedule-index ${index < 2 ? "urgent" : ""}`}>{index + 1}</span><span><strong>{vehicle.plate}</strong><small>{vehicle.model}</small></span><span><strong>{formatKm(remaining)}</strong><small>{vehicle.serviceDate}</small></span><IconChevronRight size={18} /></button>;
          })}</div>
        </section>
        <aside className="content-card maintenance-summary">
          <span className="metric-card__icon"><IconTools size={22} /></span>
          <h2>Resumen de julio</h2>
          <strong>{formatCurrency(1321.3)}</strong>
          <p>4 intervenciones realizadas, un 8% menos que el mes anterior.</p>
          <div><span>Preventivo</span><strong>68%</strong></div><div><span>Correctivo</span><strong>32%</strong></div>
        </aside>
      </div>
      <section className="content-card workshop-module" id="taller-vehiculo">
        <header className="card-header"><div><h2>Taller por vehículo</h2><p>Selecciona un coche para consultar intervenciones, conceptos e importes.</p></div><button className="primary-button" onClick={() => setModal({ type: "invoice-upload", plate: workshopVehicle.plate })}><IconCamera size={17} />Factura desde foto</button></header>
        <div className="workshop-module__layout">
          <nav className="workshop-vehicle-list" aria-label="Vehículos con historial de taller">
            {vehiclesSeed.map((vehicle) => {
              const latest = vehicle.maintenance[0];
              return <button ref={(node) => { workshopButtonRefs.current[vehicle.plate] = node; }} className={vehicle.plate === workshopVehicle.plate ? "active" : ""} key={vehicle.plate} onClick={() => setWorkshopPlate(vehicle.plate)} aria-current={vehicle.plate === workshopVehicle.plate ? "true" : undefined}><span><strong>{vehicle.plate}</strong><small>{vehicle.model}</small></span><span><strong>{formatCurrency(latest.amount)}</strong><small>{latest.concept}</small></span><IconChevronRight size={17} /></button>;
            })}
          </nav>
          <WorkshopHistory vehicle={workshopVehicle} />
        </div>
      </section>
      <section className="content-card">
        <header className="card-header"><div><h2>Últimas intervenciones</h2><p>Consulta rápida de fecha, kilometraje, concepto e importe.</p></div></header>
        <div className="table-scroll"><table className="module-table"><thead><tr><th>Vehículo</th><th>Fecha</th><th>Kilometraje</th><th>Concepto</th><th>Importe</th><th /></tr></thead><tbody>{vehiclesSeed.map((vehicle) => {
          const item = vehicle.maintenance[0];
          return <tr key={vehicle.plate}><td><strong>{vehicle.plate}</strong><small>{vehicle.model}</small></td><td>{item.date}</td><td>{formatKm(item.km)}</td><td>{item.concept}</td><td><strong>{formatCurrency(item.amount)}</strong></td><td><button className="table-action" onClick={() => showWorkshop(vehicle.plate)}>Historial<IconChevronRight size={16} /></button></td></tr>;
        })}</tbody></table></div>
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
          <div><span><IconBrandWhatsapp size={17} /></span><p><strong>Lectura procesada · 1234 KXD</strong><small>Elena Torres · Confianza IA 98%</small></p><time>22:08</time></div>
          <div><span><IconMail size={17} /></span><p><strong>Factura asociada · 9102 JBV</strong><small>FAC-2026-1874 · Aceite y filtros</small></p><time>20:42</time></div>
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
    ["¿Cómo se asocia una factura a un vehículo?", "Talleria lee el adjunto del correo, detecta matrícula, taller, concepto e importe y propone una asociación antes de incorporarla al historial."],
    ["¿Puedo corregir un dato extraído?", "Sí. Desde Lecturas o Facturas puedes abrir la revisión, corregir cualquier campo y validar el registro conservando la trazabilidad."],
  ];
  return (
    <section className="module-page help-page">
      <PageIntro eyebrow="Centro de ayuda" title="¿En qué podemos ayudarte?" description="Guías rápidas para gestionar lecturas, facturas y revisiones." action={<button className="primary-button" onClick={() => setModal({ type: "support" })}><IconMessageCircle size={18} />Contactar soporte</button>} />
      <div className="help-grid">
        <section className="content-card faq-card"><header className="card-header"><div><h2>Preguntas frecuentes</h2><p>Respuestas sobre los flujos principales.</p></div></header>{faqs.map(([question, answer], index) => <article key={question}><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span>{question}</span>{openFaq === index ? <IconChevronUp size={19} /> : <IconChevronDown size={19} />}</button>{openFaq === index && <p>{answer}</p>}</article>)}</section>
        <aside className="content-card support-card"><span><IconHelpCircle size={25} /></span><h2>Soporte Talleria</h2><p>Si una lectura, factura o mantenimiento no cuadra, revisamos el caso contigo.</p><div><IconClock size={18} /><span><strong>Lunes a viernes</strong><small>09:00–18:00</small></span></div><div><IconMail size={18} /><span><strong>soporte@talleria.es</strong><small>Respuesta en menos de 4 horas</small></span></div><button className="secondary-button" onClick={() => setModal({ type: "support" })}>Abrir consulta</button></aside>
      </div>
    </section>
  );
}

function VehicleInspector({ selected, selectedDriver, selectedActivity, inspectorTab, setInspectorTab, setInspectorOpen, selectDriver, openShift, setOpenShift, notify }) {
  const remaining = selected.nextServiceKm - selected.odometer;
  return (
    <aside className="inspector" aria-label={`Detalle de ${selected.plate}`}>
      <header className="inspector-header"><div><span className="inspector-eyebrow">Vehículo seleccionado</span><strong>{selected.plate}</strong><small>{selected.model}</small><UseBadge value={selected.use} /></div><button className="icon-button" aria-label="Cerrar detalle" onClick={() => setInspectorOpen(false)}><IconX size={21} /></button></header>
      <div className="inspector-driver-picker"><span>Conductor</span><div>{selected.drivers.map((driver) => <button className={selectedDriver === driver ? "driver-pill driver-pill--active" : "driver-pill"} key={driver} onClick={() => selectDriver(selected, driver)}>{driver}</button>)}</div></div>
      <div className="inspector-tabs"><button className={inspectorTab === "Turnos" ? "active" : ""} onClick={() => setInspectorTab("Turnos")}>Actividad</button><button className={inspectorTab === "Gastos" ? "active" : ""} onClick={() => setInspectorTab("Gastos")}>Gastos</button></div>
      <div className="inspector-scroll">
        {inspectorTab === "Turnos" ? (
          <>
            <section className="driver-summary">
              <header><span><IconClock size={17} /><strong>{selectedDriver}</strong></span><small>Hoy · {selectedActivity.time}</small></header>
              <div className="driver-metrics"><div><span>Km hoy</span><strong>{formatKm(selectedActivity.km)}</strong></div><div><span>Repostaje</span><strong>{formatCurrency(selectedActivity.cost)}</strong></div><div><span>Facturación</span><strong>{formatCurrency(selectedActivity.revenue)}</strong></div></div>
              <div className="billing-summary"><span>Acumulado mensual</span><strong>{formatCurrency(selectedActivity.monthRevenue)}</strong><small>{selectedActivity.monthTrips} viajes · Efectivo hoy {formatCurrency(selectedActivity.cash)}</small></div>
            </section>
            {selected.plate === "9102 JBV" && selected.use === "Profesional" && <figure className="odometer-proof"><img src="/assets/odometer-210735.jpg" alt={`Odómetro de ${selected.plate} con ${selected.odometer} kilómetros`} /><figcaption><IconBrandWhatsapp size={17} /><span><strong>Imagen recibida por WhatsApp</strong><small>Hoy · {selectedActivity.sentAt ?? "14:02"} · Confianza IA {selectedActivity.confidence ?? 98}%</small></span></figcaption></figure>}
            {selected.use === "Profesional" ? (
              <section className="shifts-section"><header><div><h2>Parte del conductor</h2><p>Datos del turno seleccionado</p></div><StatusBadge status="Recibido" /></header>{selected.shifts.filter((shift) => shift.driver === selectedDriver).map((shift) => {
                const expanded = openShift === shift.id;
                const consumption = (shift.liters / shift.km) * 100;
                return <article className={`shift-card ${shift.alert ? "shift-card--alert" : ""}`} key={shift.id}><button className="shift-toggle" onClick={() => setOpenShift(expanded ? "" : shift.id)} aria-expanded={expanded}><span className="shift-icon"><IconClock size={17} /></span><span><strong>{shift.label}</strong><small>{shift.time}</small></span><span><strong>{shift.km} km</strong><small>{formatCurrency(shift.cost)}</small></span>{expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}</button>{expanded && <div className="shift-detail"><div className="shift-metrics"><div><span>Km inicio</span><strong>{formatKm(shift.start)}</strong></div><div><span>Total acumulado</span><strong>{formatKm(shift.end)}</strong></div><div><span>Litros</span><strong>{shift.liters.toLocaleString("es-ES")} L</strong></div><div><span>Consumo</span><strong>{consumption.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L/100</strong></div></div>{shift.alert && <div className="inline-alert"><IconAlertTriangle size={16} /><span><strong>Consumo superior al habitual</strong>Revisar antes de validar.</span></div>}<button className="secondary-button full-button" onClick={() => notify(`Turno de ${shift.driver} validado`)}><IconCheck size={17} />Validar turno</button></div>}</article>;
              })}</section>
            ) : <section className="domestic-note"><IconHome size={21} /><span><strong>Uso doméstico</strong>Registro diario individual sin parte de turno obligatorio.</span></section>}
          </>
        ) : <VehicleExpenses vehicle={selected} />}
        <section className="next-service"><span className={remaining <= 4500 ? "urgent" : ""}><IconTools size={18} /><strong>{formatKm(remaining)} restantes</strong></span><p>{selected.serviceDate} · objetivo {formatKm(selected.nextServiceKm)}</p></section>
      </div>
    </aside>
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
  const amounts = vehicleExpenseAmounts[vehicle.plate] ?? expenseCategories.map(() => 0);
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

function AppModalV2({ modal, onClose, notify, onSaveInvoice }) {
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
        {isInvoice && <><div className="invoice-preview"><IconFileInvoice size={30} /><span><strong>{item.id}</strong><small>{item.provider} · {item.date}</small></span><strong>{formatCurrency(item.amount)}</strong></div><dl><div><dt>Vehículo</dt><dd>{item.plate}</dd></div><div><dt>Concepto</dt><dd>{item.concept}</dd></div><div><dt>Origen</dt><dd>{item.source}</dd></div><div><dt>Estado</dt><dd><StatusBadge status={item.status} /></dd></div></dl>{item.items?.length > 0 && <InvoiceLinesTable date={item.date} items={item.items} />}</>}
        {modal.type === "reading" && <div className="upload-zone"><IconBrandWhatsapp size={30} /><strong>Añadir lectura manual</strong><p>Selecciona una imagen del odómetro o introduce los datos manualmente.</p><button className="secondary-button"><IconUpload size={17} />Seleccionar imagen</button></div>}
        {isPhotoInvoice && <InvoicePhotoWorkflow initialPlate={modal.plate} onCancel={onClose} onSave={(invoice) => { onSaveInvoice(invoice); complete("Factura creada y añadida al listado"); }} />}
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

function InvoicePhotoWorkflow({ initialPlate, onCancel, onSave }) {
  const [stage, setStage] = useState("upload");
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [date, setDate] = useState("2026-07-28");
  const [provider, setProvider] = useState("Taller AutoRápido S.L.");
  const [plate, setPlate] = useState(initialPlate ?? vehiclesSeed[0].plate);
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
            <label>Vehículo<select value={plate} onChange={(event) => setPlate(event.target.value)}>{vehiclesSeed.map((vehicle) => <option key={vehicle.plate} value={vehicle.plate}>{vehicle.plate} · {vehicle.model}</option>)}</select></label>
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
