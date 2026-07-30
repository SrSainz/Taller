# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Product decisions

- The selected visual target is option 2 from the 27 July 2026 ideation set: a dense fleet ledger with a right-side vehicle inspector.
- The operating fleet has exactly five vehicles: three professional and two domestic.
- Every vehicle has two assigned drivers; the fleet has ten unique drivers.
- Professional vehicles receive two WhatsApp shift reports per day. Each report records driver, start and accumulated odometer, kilometres driven, fuel litres, cost, timestamp, extraction confidence, and any consumption anomaly.
- Domestic vehicles do not require per-shift reporting; either assigned driver can submit a shared odometer reading.
- Vehicle detail defaults to a collapsible shift ledger so the manager can audit each daily turn without leaving the fleet screen.
- The main ledger omits separate Vehicle and Status columns. The model remains visible below the plate, while Status is replaced by a numeric remaining-kilometres countdown to the next service.
- Driver names are interactive selectors. Selecting either driver must update that row and the inspector with the driver's kilometres and fuel spend in euros for the day.
- The main ledger has no Uso column. Facturación appears immediately after Conductores.
- Driver selection must update daily billing, monthly accumulated billing, monthly accumulated trips, and the portion collected in cash today. Domestic drivers display zero billing and zero trips unless they are later assigned commercial activity.
- The ledger includes a Taller column with the latest maintenance amount and concept. Selecting it navigates to the selected vehicle's dated workshop history inside Mantenimiento.
- The first release is a functional front-end prototype with realistic local data; WhatsApp, email, OpenAI extraction, authentication, and persistence remain simulated.
- The web client is an installable PWA. Production must ship a linked manifest, 192px and 512px install icons, maskable icons, `display: standalone`, a root-scoped service worker, and an in-app install action when the browser exposes the install prompt.
- The product name is Talleria and the primary interface language is Spanish.
- Every sidebar destination is a real application window. Flota, Lecturas, Facturas, Mantenimiento, Automatizaciones, Ajustes, and Ayuda must change the route hash, title, content, and active navigation state.
- Flota is an expandable sidebar parent. Mantenimiento and Gasolina are nested beneath it; both keep full workspace routes, with Gasolina using `#/gasolina`. Mantenimiento must not appear as a separate top-level sidebar item.
- Product hierarchy follows the selected dense-ledger direction with stronger readable type, elevated KPI cards, a persistent operational table, and an optional right-side inspector. On mobile, the inspector opens only after a vehicle is selected.
- Core review actions use accessible dialogs, visible focus states, semantic tables, named controls, and Escape-to-close behavior.
- Taller is integrated into Mantenimiento, directly below Facturas in the main navigation. It offers a vehicle selector, full history, repeated concepts, and a photo-to-invoice action that preselects the current vehicle.
- Facturas created from a workshop photo are kept locally between reloads and immediately update Facturas, the selected vehicle's maintenance history, its July workshop expense, and its calculated profit margin.
- The vehicle inspector contains Actividad, Mantenimiento, Gasolina, and Gastos. Mantenimiento uses a compact Excel-like grid with one row for each agreed maintenance concept, the latest date, and a control to view the associated invoice document. Gasolina lists each driver's daily litres and fuel spend for the selected vehicle.
- Gasolina is a full fleet page, not only an inspector tab. It shows the current month's accumulated litres and spend for all five vehicles, followed by the selected vehicle's dated refuelling ledger. Professional refuellings are assigned automatically to a driver from the recorded time and the vehicle's configured shift schedule.
- The three professional vehicles are 5754 MJV (Carlos 04:00–16:00, Fernando 16:00–04:00), 5750 MJV (Tirso 06:00–18:00, Alex 18:00–06:00), and 5043 MLC (Mauricio 07:00–19:00, Amin 19:00–07:00).
- The maintenance concept grid contains Aceite y filtro, Filtro habitáculo, Filtro de aire, Neumáticos, Pastillas de freno, Discos de freno, Transmisión, Bomba de agua, Bujías, Aceite de caja de cambios, Limpiaparabrisas, Fundas de asientos, and Varios.
- Gastos shows vehicle-specific amounts for leasing coche, préstamo licencia, gasolina, taller, seguridad social, nómina, comisiones conductor, impuestos trimestrales, IVA intracomunitario, seguro, limpieza coche, and varios.
- Gastos calculates each vehicle's monthly profit margin as the combined monthly billing of its two drivers minus every expense assigned to that vehicle. The UI shows both driver subtotals, total billing, total expenses, absolute margin, and margin percentage.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
