import { useMemo, useState } from "react";
import odometerUrl from "./assets/odometer-210735.jpg";
import {
  IconBell,
  IconBrandWhatsapp,
  IconCalendar,
  IconCar,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconFileInvoice,
  IconGauge,
  IconHelpCircle,
  IconMenu2,
  IconSearch,
  IconSettings,
  IconTools,
  IconX,
} from "@tabler/icons-react";

const navItems = [
  { label: "Flota", icon: IconCar },
  { label: "Lecturas", icon: IconGauge },
  { label: "Facturas", icon: IconFileInvoice },
  { label: "Mantenimiento", icon: IconTools },
  { label: "Automatizaciones", icon: IconSettings },
];

const seedVehicles = [
  { plate: "1234 KXD", model: "Ford Transit", driver: "Luis Martínez", odometer: "128.460 km", date: "27 jul 2026", today: "86 km", source: "whatsapp", serviceDate: "12 ago 2026", serviceKm: "134.000 km", cost: "482,30 €", status: "Al día" },
  { plate: "5678 LPT", model: "Mercedes Sprinter", driver: "Carlos Pérez", odometer: "142.980 km", date: "27 jul 2026", today: "112 km", source: "whatsapp", serviceDate: "18 ago 2026", serviceKm: "150.000 km", cost: "0,00 €", status: "Al día" },
  { plate: "9102 JBV", model: "Renault Master", driver: "Marta Sánchez", odometer: "210.735 km", date: "27 jul 2026", today: "0 km", source: "whatsapp", serviceDate: "2 ago 2026", serviceKm: "215.000 km", cost: "1.284,50 €", status: "Requiere atención", selected: true },
  { plate: "3456 HTR", model: "Peugeot Boxer", driver: "Javier López", odometer: "98.215 km", date: "26 jul 2026", today: "54 km", source: "whatsapp", serviceDate: "22 ago 2026", serviceKm: "105.000 km", cost: "0,00 €", status: "Al día" },
  { plate: "7890 GYL", model: "Iveco Daily", driver: "David Ruiz", odometer: "175.310 km", date: "27 jul 2026", today: "93 km", source: "whatsapp", serviceDate: "28 jul 2026", serviceKm: "176.000 km", cost: "265,40 €", status: "Próxima revisión" },
  { plate: "2468 MNB", model: "Ford Transit", driver: "Álvaro Díaz", odometer: "—", date: "—", today: "—", source: "none", serviceDate: "5 ago 2026", serviceKm: "120.000 km", cost: "0,00 €", status: "Sin lectura" },
  { plate: "1357 KTZ", model: "Mercedes Sprinter", driver: "Diego Fernández", odometer: "62.890 km", date: "25 jul 2026", today: "71 km", source: "whatsapp", serviceDate: "15 ago 2026", serviceKm: "70.000 km", cost: "0,00 €", status: "Al día" },
  { plate: "4680 BVC", model: "Renault Master", driver: "Laura Gómez", odometer: "118.540 km", date: "26 jul 2026", today: "65 km", source: "whatsapp", serviceDate: "9 ago 2026", serviceKm: "125.000 km", cost: "392,10 €", status: "Próxima revisión" },
  { plate: "8024 DPL", model: "Peugeot Boxer", driver: "Raúl Torres", odometer: "205.120 km", date: "27 jul 2026", today: "120 km", source: "whatsapp", serviceDate: "30 ago 2026", serviceKm: "210.000 km", cost: "0,00 €", status: "Al día" },
  { plate: "6931 JNF", model: "Iveco Daily", driver: "Sergio Morales", odometer: "89.450 km", date: "24 jul 2026", today: "0 km", source: "email", serviceDate: "3 ago 2026", serviceKm: "95.000 km", cost: "0,00 €", status: "Requiere atención" },
  { plate: "5743 LQW", model: "Ford Transit", driver: "Borja Navarro", odometer: "153.660 km", date: "27 jul 2026", today: "78 km", source: "whatsapp", serviceDate: "20 ago 2026", serviceKm: "160.000 km", cost: "315,25 €", status: "Al día" },
  { plate: "9182 FZG", model: "Mercedes Sprinter", driver: "Óscar Vega", odometer: "—", date: "—", today: "—", source: "none", serviceDate: "1 ago 2026", serviceKm: "140.000 km", cost: "0,00 €", status: "Sin lectura" },
];

function WhatsAppMark() {
  return <IconBrandWhatsapp className="source-mark" size={20} stroke={1.8} aria-label="WhatsApp" />;
}

function Status({ value }) {
  const kind =
    value === "Al día" ? "ok" :
    value === "Sin lectura" ? "danger" : "warning";
  return (
    <span className={`status status--${kind}`}>
      <i />
      {value}
    </span>
  );
}

export function App() {
  const [activeNav, setActiveNav] = useState("Flota");
  const [vehicles, setVehicles] = useState(seedVehicles);
  const [selectedPlate, setSelectedPlate] = useState("9102 JBV");
  const [filter, setFilter] = useState("Todos");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return vehicles.filter((vehicle) => {
      const matchesQuery = !normalized || `${vehicle.plate} ${vehicle.model} ${vehicle.driver}`.toLocaleLowerCase("es").includes(normalized);
      const matchesFilter =
        filter === "Todos" ||
        (filter === "Requiere atención" && ["Requiere atención", "Próxima revisión"].includes(vehicle.status)) ||
        (filter === "Sin lectura" && vehicle.status === "Sin lectura");
      return matchesQuery && matchesFilter;
    });
  }, [filter, query, vehicles]);

  const selected = vehicles.find((vehicle) => vehicle.plate === selectedPlate) ?? vehicles[2];

  const notify = (message) => {
    setToast(message);
    window.clearTimeout(window.__talleriaToast);
    window.__talleriaToast = window.setTimeout(() => setToast(""), 2600);
  };

  const confirmReading = () => {
    setVehicles((current) =>
      current.map((vehicle) =>
        vehicle.plate === selected.plate ? { ...vehicle, status: "Al día" } : vehicle,
      ),
    );
    notify(`Lectura de ${selected.plate} confirmada`);
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
              <Icon size={20} stroke={1.75} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item"><IconSettings size={20} stroke={1.75} /><span>Ajustes</span></button>
          <button className="nav-item"><IconHelpCircle size={20} stroke={1.75} /><span>Ayuda</span></button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <button className="icon-button menu-button" onClick={() => setSidebarOpen((value) => !value)} aria-label="Abrir menú">
              <IconMenu2 size={23} />
            </button>
            <IconMenu2 className="desktop-menu" size={22} stroke={1.8} />
            <span>{activeNav}</span>
          </div>
          <div className="topbar-actions">
            <span className="date"><IconCalendar size={18} stroke={1.6} />27 jul 2026</span>
            <span className="top-divider" />
            <button className="bell-button" aria-label="Notificaciones" onClick={() => notify("Tienes 3 avisos pendientes")}>
              <IconBell size={20} stroke={1.7} />
              <i>3</i>
            </button>
            <div className="profile">
              <span className="avatar">AG</span>
              <span><strong>Ana García</strong><small>Gestora de flota</small></span>
              <IconChevronDown size={17} />
            </div>
          </div>
        </header>

        <div className="dashboard">
          <section className="summary" aria-label="Resumen de flota">
            <div><span>Vehículos al día</span><strong>18</strong><small>75%</small></div>
            <div><span>Lecturas pendientes</span><strong className="amber">4</strong><small>17%</small></div>
            <div><span>Coste taller · julio</span><strong>6.842,30 €</strong></div>
          </section>

          <section className="toolbar" aria-label="Filtros de vehículos">
            <label className="search">
              <IconSearch size={19} stroke={1.7} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar matrícula o conductor" />
            </label>
            <div className="filters">
              {["Todos", "Requiere atención", "Sin lectura"].map((name) => (
                <button key={name} className={filter === name ? "filter-button filter-button--active" : "filter-button"} onClick={() => setFilter(name)}>
                  {name}
                  {name === "Todos" && <IconChevronDown size={16} />}
                </button>
              ))}
            </div>
          </section>

          <section className="fleet-table-wrap">
            <table className="fleet-table">
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>Modelo / Conductor</th>
                  <th>Última lectura<br /><small>(odómetro total)</small></th>
                  <th>Km hoy</th>
                  <th>Origen</th>
                  <th>Próxima revisión</th>
                  <th>Coste taller<br /><small>(julio)</small></th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((vehicle) => (
                  <tr
                    className={selected.plate === vehicle.plate ? "is-selected" : ""}
                    key={vehicle.plate}
                    onClick={() => setSelectedPlate(vehicle.plate)}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") setSelectedPlate(vehicle.plate);
                    }}
                  >
                    <td className="plate">{vehicle.plate}</td>
                    <td><strong>{vehicle.model}</strong><small>{vehicle.driver}</small></td>
                    <td><strong>{vehicle.odometer}</strong><small>{vehicle.date}</small></td>
                    <td className="today-km">{vehicle.today}</td>
                    <td>
                      {vehicle.source === "whatsapp" ? <WhatsAppMark /> : vehicle.source === "email" ? <IconFileInvoice size={19} stroke={1.7} /> : "—"}
                    </td>
                    <td className={vehicle.status === "Próxima revisión" ? "service-warning" : ""}><strong>{vehicle.serviceDate}</strong><small>{vehicle.serviceKm}</small></td>
                    <td>{vehicle.cost}</td>
                    <td><Status value={vehicle.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="empty-state">No hay vehículos que coincidan con la búsqueda.</div>}
            <footer className="table-footer">
              <span>Mostrar <button>25 <IconChevronDown size={14} /></button> de 22 vehículos</span>
              <span className="pagination"><button className="current">1</button><button>2</button><button><IconChevronRight size={16} /></button></span>
            </footer>
          </section>
        </div>
      </section>

      <aside className="inspector" aria-label={`Detalle de ${selected.plate}`}>
        <header className="inspector-header">
          <div>
            <strong>{selected.plate}</strong>
            <span>{selected.model}</span>
            <span>{selected.driver}</span>
          </div>
          <button className="icon-button" aria-label="Cerrar detalle" onClick={() => notify("Mantén una fila seleccionada para ver su detalle")}><IconX size={21} /></button>
        </header>
        <div className="inspector-tabs">
          <button className="active">Detalle</button>
          <button onClick={() => notify("Historial disponible en la siguiente versión")}>Historial</button>
        </div>

        <section className="reading">
          <h2><WhatsAppMark /> Última lectura (WhatsApp)</h2>
          <p>27 jul 2026 · 08:31</p>
          <img src={odometerUrl} alt="Fotografía del odómetro con una lectura de 210.735 kilómetros" />
          <div className="reading-values">
            <div><span>Odómetro total</span><strong>{selected.odometer === "—" ? "Sin lectura" : selected.odometer}</strong></div>
            <div><span>Km hoy</span><strong>{selected.today}</strong></div>
          </div>
          <div className="reading-actions">
            <button className="primary-button" onClick={confirmReading}><IconCheck size={17} />Confirmar</button>
            <button className="secondary-button" onClick={() => notify("Lectura abierta para revisión manual")}>Revisar lectura</button>
          </div>
        </section>

        <section className="invoice">
          <button className="section-title" onClick={() => notify("Factura vinculada correctamente")}>
            <span><IconFileInvoice size={18} />Factura asociada</span>
            <IconChevronDown size={17} />
          </button>
          <div className="invoice-card">
            <div><strong>Taller AutoRápido S.L.</strong><strong>1.284,50 €</strong></div>
            <div><span>Factura nº FR-2026-1874</span><span>24 jul 2026</span></div>
            <span className="tag">Mantenimiento y filtros</span>
            <button className="invoice-button" onClick={() => notify("Factura lista para validación")}><IconFileInvoice size={18} />Revisar factura</button>
          </div>
          <button className="link-button" onClick={() => notify("Mostrando las 2 facturas del vehículo")}>Ver todas las facturas (2)<IconChevronRight size={17} /></button>
        </section>

        <section className="next-service">
          <h2><IconTools size={18} />Próxima revisión</h2>
          <strong>{selected.serviceDate} · {selected.serviceKm}</strong>
          <span>Quedan 5.265 km o 6 días</span>
        </section>
      </aside>

      {toast && <div className="toast" role="status"><IconCheck size={18} />{toast}</div>}
      {sidebarOpen && <button className="backdrop" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
