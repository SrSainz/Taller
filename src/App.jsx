import { useMemo, useState } from "react";
import {
  IconBell,
  IconBrandWhatsapp,
  IconBriefcase,
  IconCalendar,
  IconCar,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconCurrencyEuro,
  IconFileInvoice,
  IconGauge,
  IconGasStation,
  IconHelpCircle,
  IconHistory,
  IconHome,
  IconMenu2,
  IconSearch,
  IconSettings,
  IconTools,
  IconUsers,
  IconX,
} from "@tabler/icons-react";

const navItems = [
  { label: "Flota", icon: IconCar },
  { label: "Lecturas", icon: IconGauge },
  { label: "Facturas", icon: IconFileInvoice },
  { label: "Mantenimiento", icon: IconTools },
  { label: "Automatizaciones", icon: IconSettings },
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
      { id: "kxd-t2", label: "Turno de tarde", driver: "Elena Torres", time: "14:10–22:04", start: 128310, end: 128460, km: 150, liters: 18.4, cost: 31.28, sentAt: "22:08", confidence: 98 },
      { id: "kxd-t1", label: "Turno de mañana", driver: "Luis Martínez", time: "06:03–14:01", start: 128142, end: 128310, km: 168, liters: 20.1, cost: 34.17, sentAt: "14:05", confidence: 99 },
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
      { id: "lpt-t2", label: "Turno de tarde", driver: "Marta Sánchez", time: "14:02–21:46", start: 142842, end: 142980, km: 138, liters: 16.8, cost: 28.56, sentAt: "21:51", confidence: 97 },
      { id: "lpt-t1", label: "Turno de mañana", driver: "Carlos Pérez", time: "06:08–13:55", start: 142704, end: 142842, km: 138, liters: 17.4, cost: 29.58, sentAt: "14:00", confidence: 99 },
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
      { id: "jbv-t2", label: "Turno de tarde", driver: "Laura Gómez", time: "14:06–21:58", start: 210614, end: 210735, km: 121, liters: 19.2, cost: 32.64, sentAt: "22:03", confidence: 96, alert: true },
      { id: "jbv-t1", label: "Turno de mañana", driver: "Javier Ruiz", time: "06:11–13:57", start: 210494, end: 210614, km: 120, liters: 12.4, cost: 21.08, sentAt: "14:02", confidence: 98 },
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
      { driver: "Ana García", km: 21, liters: 0, cost: 0, time: "08:12–13:20" },
      { driver: "David García", km: 13, liters: 25.1, cost: 42.67, time: "17:40–19:05" },
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
      { driver: "Sergio Ruiz", km: 11, liters: 0, cost: 0, time: "09:05–12:16" },
      { driver: "María Ruiz", km: 7, liters: 18.3, cost: 30.92, time: "18:10–19:02" },
    ],
    shifts: [],
    maintenance: [
      { date: "28 may 2026", km: 72110, concept: "Aceite y filtros", amount: 198.6 },
      { date: "4 feb 2026", km: 66390, concept: "Batería", amount: 164.9 },
      { date: "20 oct 2025", km: 59800, concept: "Aceite y filtros", amount: 192.3 },
    ],
  },
];

const formatKm = (value) => `${new Intl.NumberFormat("es-ES").format(value)} km`;
const formatCurrency = (value) => `${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const getDriverDay = (vehicle, driver) =>
  vehicle.shifts.find((shift) => shift.driver === driver) ??
  vehicle.daily?.find((entry) => entry.driver === driver) ??
  { driver, km: 0, liters: 0, cost: 0, time: "Sin actividad" };

function UseBadge({ value }) {
  const Icon = value === "Profesional" ? IconBriefcase : IconHome;
  return <span className={`use-badge use-badge--${value.toLowerCase()}`}><Icon size={13} />{value}</span>;
}

export function App() {
  const [activeNav, setActiveNav] = useState("Flota");
  const [selectedPlate, setSelectedPlate] = useState("9102 JBV");
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
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selected = vehiclesSeed.find((vehicle) => vehicle.plate === selectedPlate) ?? vehiclesSeed[0];
  const selectedDriver = selectedDrivers[selected.plate] ?? selected.drivers[0];
  const selectedActivity = getDriverDay(selected, selectedDriver);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return vehiclesSeed.filter((vehicle) => {
      const maintenanceText = vehicle.maintenance.map((item) => item.concept).join(" ");
      const searchable = `${vehicle.plate} ${vehicle.model} ${vehicle.drivers.join(" ")} ${maintenanceText}`.toLocaleLowerCase("es");
      return (!normalized || searchable.includes(normalized)) && (filter === "Todos" || vehicle.use === filter);
    });
  }, [filter, query]);

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(window.__talleriaToast);
    window.__talleriaToast = window.setTimeout(() => setToast(""), 2600);
  };

  const selectVehicle = (vehicle) => {
    const driver = selectedDrivers[vehicle.plate] ?? vehicle.drivers[0];
    const activity = getDriverDay(vehicle, driver);
    setSelectedPlate(vehicle.plate);
    setOpenShift(activity.id ?? "");
  };

  const selectDriver = (vehicle, driver) => {
    const activity = getDriverDay(vehicle, driver);
    setSelectedDrivers((current) => ({ ...current, [vehicle.plate]: driver }));
    setSelectedPlate(vehicle.plate);
    setOpenShift(activity.id ?? "");
    setInspectorTab("Turnos");
  };

  const openWorkshop = (vehicle) => {
    setSelectedPlate(vehicle.plate);
    setInspectorTab("Taller");
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="brand">Talleria</div>
        <nav aria-label="Navegación principal">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              className={activeNav === label ? "nav-item nav-item--active" : "nav-item"}
              key={label}
              onClick={() => {
                setActiveNav(label);
                setSidebarOpen(false);
                if (label !== "Flota") notify(`${label}: módulo preparado para la siguiente fase`);
              }}
            >
              <Icon size={20} stroke={1.75} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item"><IconSettings size={20} /><span>Ajustes</span></button>
          <button className="nav-item"><IconHelpCircle size={20} /><span>Ayuda</span></button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <button className="icon-button menu-button" onClick={() => setSidebarOpen((value) => !value)} aria-label="Abrir menú"><IconMenu2 size={23} /></button>
            <IconMenu2 className="desktop-menu" size={22} stroke={1.8} /><span>{activeNav}</span>
          </div>
          <div className="topbar-actions">
            <span className="date"><IconCalendar size={18} />27 jul 2026</span><span className="top-divider" />
            <button className="bell-button" aria-label="Notificaciones" onClick={() => notify("Tienes 2 avisos pendientes")}><IconBell size={20} /><i>2</i></button>
            <div className="profile"><span className="avatar">AG</span><span><strong>Ana García</strong><small>Gestora de flota</small></span><IconChevronDown size={17} /></div>
          </div>
        </header>

        <div className="dashboard">
          <section className="summary" aria-label="Resumen de flota">
            <div><span>Vehículos profesionales</span><strong>3</strong><small>6 turnos hoy</small></div>
            <div className="summary-compact"><span>Repostaje · hoy</span><strong>188,66 €</strong><small>10 conductores</small></div>
            <div><span>Próxima revisión</span><strong>4.160 km</strong><small>Toyota Corolla</small></div>
          </section>

          <section className="toolbar" aria-label="Filtros de vehículos">
            <label className="search"><IconSearch size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar matrícula, conductor o trabajo" /></label>
            <div className="filters">
              {["Todos", "Profesional", "Doméstico"].map((name) => (
                <button key={name} className={filter === name ? "filter-button filter-button--active" : "filter-button"} onClick={() => setFilter(name)}>{name}</button>
              ))}
            </div>
          </section>

          <section className="fleet-table-wrap">
            <table className="fleet-table">
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>Uso</th>
                  <th>Conductores</th>
                  <th>Km hoy</th>
                  <th>Repostaje</th>
                  <th>Km acumulados</th>
                  <th>Km para revisión</th>
                  <th>Taller</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vehicle) => {
                  const driver = selectedDrivers[vehicle.plate] ?? vehicle.drivers[0];
                  const day = getDriverDay(vehicle, driver);
                  const remaining = vehicle.nextServiceKm - vehicle.odometer;
                  const latestMaintenance = vehicle.maintenance[0];
                  return (
                    <tr
                      className={selected.plate === vehicle.plate ? "is-selected" : ""}
                      key={vehicle.plate}
                      onClick={() => selectVehicle(vehicle)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") selectVehicle(vehicle);
                      }}
                    >
                      <td className="plate"><strong>{vehicle.plate}</strong><small>{vehicle.model}</small></td>
                      <td><UseBadge value={vehicle.use} /></td>
                      <td>
                        <div className="driver-selector" aria-label={`Conductores de ${vehicle.plate}`}>
                          {vehicle.drivers.map((name) => (
                            <button
                              className={driver === name ? "driver-chip driver-chip--active" : "driver-chip"}
                              key={name}
                              onClick={(event) => {
                                event.stopPropagation();
                                selectDriver(vehicle, name);
                              }}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="today-km"><strong>{formatKm(day.km)}</strong><small>{driver.split(" ")[0]}</small></td>
                      <td><strong>{formatCurrency(day.cost)}</strong><small>{day.liters ? `${day.liters.toLocaleString("es-ES")} L` : "Sin repostaje"}</small></td>
                      <td><strong>{formatKm(vehicle.odometer)}</strong><small>Actualizado hoy</small></td>
                      <td><span className={`service-countdown ${remaining <= 4500 ? "service-countdown--urgent" : ""}`}><strong>{formatKm(remaining)}</strong><small>{vehicle.serviceDate}</small></span></td>
                      <td>
                        <button
                          className="workshop-cell"
                          onClick={(event) => {
                            event.stopPropagation();
                            openWorkshop(vehicle);
                          }}
                        >
                          <strong>{formatCurrency(latestMaintenance.amount)}</strong>
                          <small>{latestMaintenance.concept}</small>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="empty-state">No hay vehículos que coincidan con la búsqueda.</div>}
            <footer className="table-footer"><span>5 vehículos · 10 conductores</span><span>Selecciona un conductor para ver su actividad diaria</span></footer>
          </section>
        </div>
      </section>

      <aside className="inspector" aria-label={`Detalle de ${selected.plate}`}>
        <header className="inspector-header">
          <div><strong>{selected.plate}</strong><span>{selected.model}</span><UseBadge value={selected.use} /></div>
          <button className="icon-button" aria-label="Cerrar detalle" onClick={() => notify("Selecciona otro vehículo para cambiar el detalle")}><IconX size={21} /></button>
        </header>
        <div className="inspector-drivers inspector-driver-picker">
          <IconUsers size={17} />
          <div>
            {selected.drivers.map((driver) => (
              <button className={selectedDriver === driver ? "driver-pill driver-pill--active" : "driver-pill"} key={driver} onClick={() => selectDriver(selected, driver)}>{driver}</button>
            ))}
          </div>
        </div>
        <div className="inspector-tabs">
          <button className={inspectorTab === "Turnos" ? "active" : ""} onClick={() => setInspectorTab("Turnos")}>Actividad</button>
          <button className={inspectorTab === "Taller" ? "active" : ""} onClick={() => setInspectorTab("Taller")}>Taller</button>
        </div>

        {inspectorTab === "Turnos" ? (
          <>
            <section className="driver-day-summary">
              <div className="driver-day-heading"><span><IconClock size={17} /><strong>{selectedDriver}</strong></span><small>Actividad de hoy · {selectedActivity.time}</small></div>
              <div className="driver-day-metrics">
                <div><span>Kilómetros</span><strong>{formatKm(selectedActivity.km)}</strong></div>
                <div><span>Repostaje</span><strong>{formatCurrency(selectedActivity.cost)}</strong><small>{selectedActivity.liters ? `${selectedActivity.liters.toLocaleString("es-ES")} litros` : "Sin repostaje"}</small></div>
              </div>
            </section>

            {selected.use === "Profesional" ? (
              <section className="shifts-section">
                <div className="shifts-heading"><div><h2>Parte del conductor</h2><p>Recibido por WhatsApp · 27 jul 2026</p></div><span className="complete-mark"><IconCheck size={14} />Recibido</span></div>
                <div className="shift-list">
                  {selected.shifts.filter((shift) => shift.driver === selectedDriver).map((shift) => {
                    const expanded = openShift === shift.id;
                    const consumption = (shift.liters / shift.km) * 100;
                    return (
                      <article className={`shift-card ${shift.alert ? "shift-card--alert" : ""}`} key={shift.id}>
                        <button className="shift-toggle" onClick={() => setOpenShift(expanded ? "" : shift.id)} aria-expanded={expanded}>
                          <span className="shift-icon"><IconClock size={17} /></span>
                          <span className="shift-title"><strong>{shift.label}</strong><small>{shift.time}</small></span>
                          <span className="shift-km"><strong>{shift.km} km</strong><small>{formatCurrency(shift.cost)}</small></span>
                          {expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                        </button>
                        {expanded && (
                          <div className="shift-detail">
                            <div className="metric-grid">
                              <div><span>Km inicio</span><strong>{formatKm(shift.start)}</strong></div>
                              <div><span>Total acumulado</span><strong>{formatKm(shift.end)}</strong></div>
                              <div><span>Km del turno</span><strong>{formatKm(shift.km)}</strong></div>
                              <div><span>Repostaje</span><strong>{formatCurrency(shift.cost)}</strong></div>
                              <div><span>Litros</span><strong>{shift.liters.toLocaleString("es-ES")} L</strong></div>
                              <div><span>Consumo medio</span><strong>{consumption.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L/100</strong></div>
                            </div>
                            {shift.alert && <div className="consumption-alert"><IconGasStation size={16} /><span><strong>Consumo superior al habitual</strong>Revisar antes de cerrar el turno.</span></div>}
                            <div className="whatsapp-proof"><IconBrandWhatsapp size={18} /><span><strong>Lectura recibida por WhatsApp</strong><small>{shift.sentAt} · Confianza IA {shift.confidence}%</small></span><button onClick={() => notify(`Turno de ${shift.driver} validado`)}>Validar</button></div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : (
              <section className="domestic-note"><IconHome size={20} /><span><strong>Uso doméstico</strong>Registro diario individual sin parte de turno obligatorio.</span></section>
            )}
          </>
        ) : (
          <WorkshopHistory vehicle={selected} />
        )}

        <section className="next-service">
          <h2><IconTools size={18} />Próxima revisión</h2>
          <strong>{formatKm(selected.nextServiceKm - selected.odometer)} restantes</strong>
          <span>{selected.serviceDate} · objetivo {formatKm(selected.nextServiceKm)}</span>
        </section>
      </aside>

      {toast && <div className="toast" role="status"><IconCheck size={18} />{toast}</div>}
      {sidebarOpen && <button className="backdrop" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}

function WorkshopHistory({ vehicle }) {
  const counts = vehicle.maintenance.reduce((result, item) => {
    result[item.concept] = (result[item.concept] ?? 0) + 1;
    return result;
  }, {});
  const total = vehicle.maintenance.reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="workshop-history">
      <header>
        <span><IconHistory size={18} /><strong>Historial de taller</strong></span>
        <small>{vehicle.maintenance.length} intervenciones</small>
      </header>
      <div className="workshop-total"><span>Importe registrado</span><strong>{formatCurrency(total)}</strong></div>
      <div className="maintenance-table" role="table" aria-label={`Historial de taller de ${vehicle.plate}`}>
        <div className="maintenance-row maintenance-row--head" role="row">
          <span>Fecha / km</span><span>Concepto</span><span>Importe</span>
        </div>
        {vehicle.maintenance.map((item) => (
          <div className="maintenance-row" role="row" key={`${item.date}-${item.concept}`}>
            <span><strong>{item.date}</strong><small>{formatKm(item.km)}</small></span>
            <span><strong>{item.concept}</strong>{counts[item.concept] > 1 && <small className="repeat-mark">{counts[item.concept]} cambios registrados</small>}</span>
            <strong>{formatCurrency(item.amount)}</strong>
          </div>
        ))}
      </div>
      <p className="history-hint">Los conceptos repetidos quedan marcados para comparar rápidamente cuándo se realizó el mismo mantenimiento.</p>
    </section>
  );
}
