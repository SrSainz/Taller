# Talleria

Talleria is a visual fleet-maintenance prototype for supervising vehicle mileage, workshop invoices, and the automations that connect both.

## Current prototype

- Fleet ledger with vehicle, driver, mileage, maintenance, cost, and status data.
- Search and operational filters.
- Selectable rows with a detailed vehicle inspector.
- Simulated WhatsApp odometer reading with total and daily kilometres.
- Linked workshop invoice and upcoming maintenance information.
- Working confirmation, navigation, filter, and feedback states.
- Responsive desktop and mobile layouts.

This first version is intentionally front-end only. WhatsApp, email ingestion, OpenAI image extraction, authentication, persistence, and real invoice matching are represented with realistic mock data.

## Open-source references

The product framing was informed by:

- [Fleetbase](https://github.com/fleetbase/fleetbase) for modular fleet operations and extensible API-driven workflows.
- [clientst0r](https://github.com/agit8or1/clientst0r) for mileage, maintenance alerts, service costs, receipt scanning, and AI-assisted extraction.
- [auToDo](https://github.com/autodo-app/autodo) for mileage-based maintenance reminders.
- [expense.fyi](https://github.com/gokulkrishh/expense.fyi) for a modern Next.js-style expense and invoice experience designed for Vercel.

No source code was copied from those projects. Their workflows and information models were used as product references.

## Suggested next architecture

1. Persist vehicles, drivers, odometer readings, invoices, and maintenance events in Postgres.
2. Receive WhatsApp media through a supported WhatsApp Business provider webhook.
3. Send images to the OpenAI API using structured outputs for total kilometres, daily kilometres, plate, confidence, and validation flags.
4. Receive workshop invoices through an inbound email provider, store originals securely, and extract structured invoice fields.
5. Match readings and invoices to vehicles, keep a complete audit trail, and send low-confidence cases to the review queue shown in this prototype.

## Local development

```bash
pnpm install
pnpm run dev
```

Production build:

```bash
pnpm run build
```
