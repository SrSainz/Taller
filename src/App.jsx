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
  IconFileInvoice,
  IconGauge,
  IconGasStation,
  IconHelpCircle,
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
    kmToday: 318,
    fuelToday: 38.5,
    status: "Al día",
    serviceDate: "12 ago 2026",
    serviceKm: "134.000 km",
    shifts: [
      { id: "kxd-t2", label: "Turno de tarde", driver: "Elena Torres", time: "14:10–22:04", start: 128310, end: 128460, km: 150, liters: 18.4, cost: 31.28, sentAt: "22:08", confidence: 98 },
      { id: "kxd-t1", label: "Turno de mañana", driver: "Luis Martínez", time: "06:03–14:01", start: 128142, end: 128310, km: 168, liters: 20.1, cost: 34.17, sentAt: "14:05", confidence: 99 },
    ],
  },
  {
    plate: "5678 LPT",
    model: "Mercedes Sprinter",
    use: "Profesional",
    drivers: ["Carlos Pérez", "Marta Sánchez"],
    odometer: 142980,
    kmToday: 276,
    fuelToday: 34.2,
    status: "Al día",
    serviceDate: "18 ago 2026",
    serviceKm: "150.000 km",
    shifts: [
      { id: "lpt-t2", label: "Turno de tarde", driver: "Marta Sánchez", time: "14:02–21:46", start: 142842, end: 142980, km: 138, liters: 16.8, cost: 28.56, sentAt: "21:51", confidence: 97 },
      { id: "lpt-t1", label: "Turno de mañana", driver: "Carlos Pérez", time: "06:08–13:55", start: 142704, end: 142842, km: 138, liters: 17.4, cost: 29.58, sentAt: "14:00", confidence: 99 },
    ],
  },
  {
    plate: "9102 JBV",
    model: "Renault Master",
    use: "Profesional",
    drivers: ["Javier Ruiz", "Laura Gómez"],
    odometer: 210735,
    kmToday: 241,
    fuelToday: 31.6,
    status: "Consumo alto",
    serviceDate: "2 ago 2026",
    serviceKm: "215.000 km",
    shifts: [
      { id: "jbv-t2", label: "Turno de tarde", driver: "Laura Gómez", time: "14:06–21:58", start: 210614, end: 210735, km: 121, liters: 19.2, cost: 32.64, sentAt: "22:03", confidence: 96, alert: true },
      { id: "jbv-t1", label: "Turno de mañana", driver: "Javier Ruiz", time: "06:11–13:57", start: 210494, end: 210614, km: 120, liters: 12.4, cost: 21.08, sentAt: "14:02", confidence: 98 },
    ],
  },
  {
    plate: "3456 HTR",
    model: "Peugeot 3008",
    use: "Doméstico",
    drivers: ["Ana García", "David García"],
    odometer: 98215,
    kmToday: 34,
    fuelToday: 0,
    status: "Al día",
    serviceDate: "22 ago 2026",
    serviceKm: "105.000 km",
    shifts: [],
  },
  {
    plate: "7890 GYL",
    model: "Toyota Corolla",
    use: "Doméstico",
    drivers: ["Sergio Ruiz", "María Ruiz"],
    odometer: 75840,
    kmToday: 18,
    fuelToday: 0,
    status: "Próxima revisión",
    serviceDate: "6 ago 2026",
    serviceKm: "80.000 km",
    shifts: [],
  },
];

const formatKm = (value) => `${new Intl.NumberFormat("es-ES").format(value)} km`;
const formatFuel = (value) => value ? `${value.toLocaleString("es-ES")} L` : "—";
const formatCurrency = (value) => `${value.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`;

function Status({ value }) {
  const kind = value === "Al día" ? "ok" : "warning";
  return <span className={`status status--${kind}`}><i />{value}</span>;
}

function UseBadge({ value }) {
  const Icon = value === "Profesional" ? IconBriefcase : IconHome;
  return <span className={`use-badge use-badge--${value.toLowerCase()}`}><Icon size={13} />{value}</span>;
}

export function App() {
  const [activeNav, setActiveNav] = useState("Flota");
  const [selectedPlate, setSelectedPlate] = useState("9102 JBV");
  const [filter, setFilter] = useState("Todos");
  const [query, setQuery] = useState("");
  const [openShift, setOpenShift] = useState("jbv-t2");
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selected = vehiclesSeed.find((vehicle) => vehicle.plate === selectedPlate) ?? vehiclesSeed[0];
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return vehiclesSeed.filter((vehicle) => {
      const searchable = `${vehicle.plate} ${vehicle.model} ${vehicle.drivers.join(" ")}`.toLocaleLowerCase("es");
      return (!normalized || searchable.includes(normalized)) && (filter === "Todos" || vehicle.use === filter);
    });
  }, [filter, query]);

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(window.__talleriaToast);
    window.__talleriaToast = window.setTimeout(() => setToast(""), 2600);
  };

  const selectVehicle = (vehicle) => {
    setSelectedPlate(vehicle.plate);
    setOpenShift(vehicle.shifts[0]?.id ?? "");
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
            <IconMenu2 className="desktop-menu" size={22} stroke={1.8} />
            <span>{activeNav}</span>
          </div>
          <div className="topbar-actions">
            <span className="date"><IconCalendar size={18} />27 jul 2026</span>
            <span className="top-divider" />
            <button className="bell-button" aria-label="Notificaciones" onClick={() => notify("Tienes 2 avisos pendientes")}><IconBell size={20} /><i>2</i></button>
            <div className="profile"><span className="avatar">AG</span><span><strong>Ana García</strong><small>Gestora de flota</small></span><IconChevronDown size={17} /></div>
          </div>
        </header>

        <div className="dashboard">
          <section className="summary" aria-label="Resumen de flota">
            <div><span>Vehículos profesionales</span><strong>3</strong><small>6 turnos hoy</small></div>
            <div><span>Uso doméstico</span><strong>2</strong><small>2 conductores/coche</small></div>
            <div><span>Combustible · hoy</span><strong>104,3 L</strong><small>177,31 €</small></div>
          </section>

          <section className="toolbar" aria-label="Filtros de vehículos">
            <label className="search"><IconSearch size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar matrícula o conductor" /></label>
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
                  <th>Vehículo</th>
                  <th>Uso</th>
                  <th>Conductores</th>
                  <th>Km acumulados</th>
                  <th>Km hoy</th>
                  <th>Combustible</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vehicle) => (
                  <tr
                    className={selected.plate === vehicle.plate ? "is-selected" : ""}
                    key={vehicle.plate}
                    onClick={() => selectVehicle(vehicle)}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") selectVehicle(vehicle);
                    }}
                  >
                    <td className="plate">{vehicle.plate}</td>
                    <td><strong>{vehicle.model}</strong><small>{vehicle.shifts.length ? `${vehicle.shifts.length} turnos recibidos` : "Uso particular"}</small></td>
                    <td><UseBadge value={vehicle.use} /></td>
                    <td><strong>{vehicle.drivers[0]}</strong><small>{vehicle.drivers[1]}</small></td>
                    <td><strong>{formatKm(vehicle.odometer)}</strong><small>Actualizado hoy</small></td>
                    <td className="today-km">{formatKm(vehicle.kmToday)}</td>
                    <td><strong>{formatFuel(vehicle.fuelToday)}</strong><small>{vehicle.fuelToday ? "Acumulado del día" : "Sin repostaje"}</small></td>
                    <td><Status value={vehicle.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="empty-state">No hay vehículos que coincidan con la búsqueda.</div>}
            <footer className="table-footer"><span>5 vehículos · 10 conductores</span><span>Datos actualizados por WhatsApp</span></footer>
          </section>
        </div>
      </section>

      <aside className="inspector" aria-label={`Detalle de ${selected.plate}`}>
        <header className="inspector-header">
          <div><strong>{selected.plate}</strong><span>{selected.model}</span><UseBadge value={selected.use} /></div>
          <button className="icon-button" aria-label="Cerrar detalle" onClick={() => notify("Selecciona otro vehículo para cambiar el detalle")}><IconX size={21} /></button>
        </header>
        <div className="inspector-drivers"><IconUsers size={17} /><span><strong>{selected.drivers.join(" · ")}</strong><small>Conductores asignados</small></span></div>
        <div className="inspector-tabs"><button className="active">Turnos</button><button onClick={() => notify("Ficha del vehículo preparada")}>Vehículo</button></div>

        {selected.use === "Profesional" ? (
          <section className="shifts-section">
            <div className="shifts-heading"><div><h2>Turnos de hoy</h2><p>2 de 2 recibidos · 27 jul 2026</p></div><span className="complete-mark"><IconCheck size={14} />Completo</span></div>
            <div className="shift-list">
              {selected.shifts.map((shift) => {
                const expanded = openShift === shift.id;
                const consumption = (shift.liters / shift.km) * 100;
                return (
                  <article className={`shift-card ${shift.alert ? "shift-card--alert" : ""}`} key={shift.id}>
                    <button className="shift-toggle" onClick={() => setOpenShift(expanded ? "" : shift.id)} aria-expanded={expanded}>
                      <span className="shift-icon"><IconClock size={17} /></span>
                      <span className="shift-title"><strong>{shift.label}</strong><small>{shift.driver} · {shift.time}</small></span>
                      <span className="shift-km"><strong>{shift.km} km</strong><small>{shift.liters.toLocaleString("es-ES")} L</small></span>
                      {expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                    </button>
                    {expanded && (
                      <div className="shift-detail">
                        <div className="metric-grid">
                          <div><span>Km inicio</span><strong>{formatKm(shift.start)}</strong></div>
                          <div><span>Total acumulado</span><strong>{formatKm(shift.end)}</strong></div>
                          <div><span>Km del turno</span><strong>{formatKm(shift.km)}</strong></div>
                          <div><span>Combustible</span><strong>{shift.liters.toLocaleString("es-ES")} L</strong></div>
                          <div><span>Consumo medio</span><strong>{consumption.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L/100</strong></div>
                          <div><span>Coste</span><strong>{formatCurrency(shift.cost)}</strong></div>
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
          <section className="domestic-empty">
            <span className="domestic-icon"><IconHome size={24} /></span>
            <h2>Vehículo de uso doméstico</h2>
            <p>No requiere partes por turno. El kilometraje acumulado se actualiza cuando cualquiera de los dos conductores envía una lectura.</p>
            <div><span>Última lectura</span><strong>{formatKm(selected.odometer)}</strong><small>Hoy · 18:42</small></div>
            <button className="secondary-button" onClick={() => notify("Solicitud de lectura preparada para WhatsApp")}><IconBrandWhatsapp size={17} />Solicitar lectura</button>
          </section>
        )}

        <section className="next-service">
          <h2><IconTools size={18} />Próxima revisión</h2>
          <strong>{selected.serviceDate} · {selected.serviceKm}</strong>
          <span>Seguimiento automático por fecha y kilometraje.</span>
        </section>
      </aside>

      {toast && <div className="toast" role="status"><IconCheck size={18} />{toast}</div>}
      {sidebarOpen && <button className="backdrop" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
