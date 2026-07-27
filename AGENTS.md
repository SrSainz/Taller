# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Product decisions

- The selected visual target is option 2 from the 27 July 2026 ideation set: a dense fleet ledger with a right-side vehicle inspector.
- The operating fleet has exactly five vehicles: three professional and two domestic.
- Every vehicle has two assigned drivers.
- Professional vehicles receive two WhatsApp shift reports per day. Each report records driver, start and accumulated odometer, kilometres driven, fuel litres, cost, timestamp, extraction confidence, and any consumption anomaly.
- Domestic vehicles do not require per-shift reporting; either assigned driver can submit a shared odometer reading.
- Vehicle detail defaults to a collapsible shift ledger so the manager can audit each daily turn without leaving the fleet screen.
- The main ledger omits separate Vehicle and Status columns. The model remains visible below the plate, while Status is replaced by a numeric remaining-kilometres countdown to the next service.
- Driver names are interactive selectors. Selecting either driver must update that row and the inspector with the driver's kilometres and fuel spend in euros for the day.
- The main ledger has no Uso column. Facturación appears immediately after Conductores.
- Driver selection must update daily billing, monthly accumulated billing, monthly accumulated trips, and the portion collected in cash today. Domestic drivers display zero billing and zero trips unless they are later assigned commercial activity.
- The ledger includes a Taller column with the latest maintenance amount and concept. Selecting it opens a dated workshop history table and marks repeated concepts for quick comparison.
- The first release is a functional front-end prototype with realistic local data; WhatsApp, email, OpenAI extraction, authentication, and persistence remain simulated.
- The product name is Talleria and the primary interface language is Spanish.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
