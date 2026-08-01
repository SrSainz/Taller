# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Product decisions

- The selected visual target is option 2 from the 27 July 2026 ideation set: a dense fleet ledger with a right-side vehicle inspector.
- The operating fleet has exactly five vehicles: three professional and two particular.
- Every vehicle has two assigned drivers; the fleet has ten unique drivers.
- Professional vehicles receive two WhatsApp shift reports per day. Each report records driver, start and accumulated odometer, kilometres driven, fuel litres, cost, timestamp, extraction confidence, and any consumption anomaly.
- Particular vehicles do not require per-shift reporting; either assigned driver can submit a shared odometer reading.
- Vehicle detail defaults to a collapsible shift ledger so the manager can audit each daily turn without leaving the fleet screen.
- The main ledger omits separate Vehicle and Status columns. The model remains visible below the plate, while Status is replaced by a numeric remaining-kilometres countdown to the next service.
- Driver names are interactive selectors. Selecting either driver must update that row and the inspector with the driver's kilometres and fuel spend in euros for the day.
- The main ledger has no Uso column. Facturación appears immediately after Conductores.
- Driver selection must update daily billing, monthly accumulated billing, monthly accumulated trips, and the portion collected in cash today. Particular drivers display zero billing and zero trips unless they are later assigned commercial activity.
- The ledger includes a Taller column with the latest maintenance amount and concept. Selecting it navigates to the selected vehicle's dated workshop history inside Mantenimiento.
- The first release is a functional front-end prototype with realistic local data; WhatsApp, email, OpenAI extraction, authentication, and persistence remain simulated.
- The web client is an installable PWA. Production must ship a linked manifest, 192px and 512px install icons, maskable icons, `display: standalone`, a root-scoped service worker, and an in-app install action when the browser exposes the install prompt.
- The product name is SOBRE RUEDAS and the primary interface language is Spanish. Its persistent home control and installable PWA icon use a tyre/wheel mark instead of a letter.
- Every destination is a real application window. Flota, Lecturas, Facturas, Mantenimiento, Automatizaciones, Ajustes, and Ayuda must change the route hash, title, content, and active navigation state, but they are entered only from SOBRE RUEDAS controls.
- There is no sidebar or hamburger menu. SOBRE RUEDAS > General is the sole navigation hub. Its quick-action row opens Vehículos, Lecturas, Facturas, Mantenimiento, and Combustible; the persistent tyre-logo button always returns to General.
- Product hierarchy follows the selected dense-ledger direction with stronger readable type, elevated KPI cards, a persistent operational table, and an optional right-side inspector. On mobile, the inspector opens only after a vehicle is selected.
- Core review actions use accessible dialogs, visible focus states, semantic tables, named controls, and Escape-to-close behavior.
- Taller is integrated into Mantenimiento and is reached from the General quick actions. It offers a vehicle selector, full history, repeated concepts, and a photo-to-invoice action that preselects the current vehicle.
- Facturas created from a workshop photo are kept locally between reloads and immediately update Facturas, the selected vehicle's maintenance history, its July workshop expense, and its calculated profit margin.
- The vehicle inspector contains Actividad, Mantenimiento, Gasolina, and Gastos. Mantenimiento uses a compact Excel-like grid with one row for each agreed maintenance concept, the latest date, and a control to view the associated invoice document. Gasolina lists each driver's daily litres and fuel spend for the selected vehicle.
- Gasolina is a full fleet page, not only an inspector tab. It shows the current month's accumulated litres and spend for all five vehicles, followed by the selected vehicle's dated refuelling ledger. Professional refuellings are assigned automatically to a driver from the recorded time and the vehicle's configured shift schedule.
- The Gasolina workspace uses the selected mobile reports visual language: a teal Informes header, five compact tabs, a date-range control, rounded 2x2 KPI cards, and a monthly stacked chart. Its tabs are General, Repostaje, Gasto, Ingreso, and Conductores; Conductores replaces Servicio.
- The dashboard formerly called Informes is the default "SOBRE RUEDAS" home view for the root URL and installed PWA. It opens on General and shows SOBRE RUEDAS in the top bar. Gasolina opens the same reports workspace on Repostaje.
- Every root launch is normalized to `#/informes`. A standalone PWA launch always resets to SOBRE RUEDAS > General even when the previous session closed on another route; direct non-standalone deep links remain available.
- Automatizaciones, Ajustes, and Ayuda are persistent top-bar shortcuts immediately to the left of the notification bell, with labels on wide screens and icons on compact screens.
- The SOBRE RUEDAS home dashboard has exactly four financial KPI cards: Facturación in blue, Mantenimiento in grey, Combustible in red, and Neto in green. Their totals must represent monthly driver billing, workshop spend, recorded fuel spend, and billing minus all vehicle expenses respectively.
- All four KPI cards are actionable: Facturación opens Ingreso, Mantenimiento opens its workspace, Combustible opens Repostaje, and Neto opens Gasto.
- The phrase "Control de flota" is not used in the interface. The Flota workspace is headed simply "Vehículos".
- Vehicle order is fixed everywhere: 1) 5043 MLC, professional, Toyota Corolla; 2) 5750 MJV, professional, Toyota Corolla; 3) 5754 MJV, professional, Toyota Corolla; 4) 0344 LCP, particular, Lexus IS 300h; 5) 9401 LTG, particular, Peugeot 2008.
- Professional schedules are 5043 MLC (Mauricio 07:00–19:00, Amin 19:00–07:00), 5750 MJV (Tirso 06:00–18:00, Alex 18:00–06:00), and 5754 MJV (Carlos 04:00–16:00, Fernando 16:00–04:00).
- The maintenance concept grid contains Aceite y filtro, Filtro habitáculo, Filtro de aire, Neumáticos, Pastillas de freno, Discos de freno, Transmisión, Bomba de agua, Bujías, Aceite de caja de cambios, Limpiaparabrisas, Fundas de asientos, and Varios.
- Mantenimiento opens with five stacked horizontal vehicle banners in fixed fleet order. Each banner shows the real Toyota, Lexus, or Peugeot brand mark before the plate and model. Selecting a banner reveals that vehicle's interventions ordered newest-first with dates formatted YYYY/MM/DD. The date control independently expands the work performed, while a separate invoice control opens the workshop invoice when one is available.
- Gastos shows vehicle-specific amounts for leasing coche, préstamo licencia, gasolina, taller, seguridad social, nómina, comisiones conductor, impuestos trimestrales, IVA intracomunitario, seguro, limpieza coche, and varios.
- Gastos calculates each vehicle's monthly profit margin as the combined monthly billing of its two drivers minus every expense assigned to that vehicle. The UI shows both driver subtotals, total billing, total expenses, absolute margin, and margin percentage.
- The particular Lexus 0344 LCP and Peugeot 9401 LTG do not display driver names or driver selectors in Flota or in the vehicle inspector; both are presented as vehicles without an associated driver.
- The SOBRE RUEDAS General screen uses its four KPI cards as chart selectors. Facturación charts monthly revenue by professional driver, Mantenimiento charts workshop spend by vehicle, Combustible charts fuel spend by vehicle, and Neto charts profit by vehicle. A shared month and year selector updates the active chart and KPI totals.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
