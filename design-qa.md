# Design QA — five-vehicle shift model

- Source visual truth: `C:\Users\aiday\OneDrive\Escritorio\app david\design-reference.png`
- Browser-rendered implementation: `C:\Users\aiday\OneDrive\Escritorio\app david\implementation-shifts-1280-final.png`
- Combined comparison evidence: `C:\Users\aiday\OneDrive\Escritorio\app david\design-comparison-shifts.png`
- Compact browser evidence: `C:\Users\aiday\OneDrive\Escritorio\app david\implementation-shifts-762-full.png`
- Desktop viewport: 1280 × 720 CSS px, device pixel ratio 1.25.
- Desktop screenshot: 1280 × 720 px.
- Compact viewport observed in the in-app browser: 762 × 642 CSS px, device pixel ratio 1.25.
- State: fleet view, Renault Master selected, afternoon professional shift expanded, consumption warning visible.

## Findings

No actionable P0, P1, or P2 findings remain.

- Typography: Inter family, weights, compact hierarchy, truncation, and small-data typography preserve the selected dense ledger direction. Labels remain legible at desktop and compact widths.
- Spacing and layout: the original three-region composition is preserved at desktop—navigation, fleet ledger, and right inspector. The shorter five-row ledger is intentional and reflects the real fleet size. At compact width, the table scrolls horizontally and the inspector follows as a full-width section.
- Colors and tokens: dark green navigation, white work surface, pale-green selection, amber attention state, and neutral borders match the source visual system.
- Image quality: the new shift-ledger state does not require photographic evidence in the collapsed overview. All visible icons use the same Tabler outline family; no placeholder raster or custom SVG substitute is present.
- Copy and content: labels now consistently describe professional/domestic use, two drivers per vehicle, daily shifts, accumulated mileage, fuel, cost, WhatsApp receipt, and AI confidence.
- Interaction and accessibility: row selection, all three filters, professional shift expansion, validation feedback, domestic empty state, keyboard row activation, focus indication, and semantic expanded state were checked.

## Focused region evidence

The right-side inspector was reviewed at native screenshot scale in the combined image. The expanded shift shows all required values without overlap: kilometres at start, total accumulated, kilometres in the shift, litres, average consumption, cost, WhatsApp timestamp, AI confidence, and validation action.

## Comparison history

### Iteration 1

- Earlier P2: at 1280 px, dense table padding caused full number plates and long status labels to truncate.
- Fix: added a 1181–1350 px layout tier, reduced table padding and type slightly, redistributed shell columns, and shortened the anomaly status to “Consumo alto”.
- Post-fix evidence: `implementation-shifts-1280-final.png`; all five number plates fit, the selected row remains clear, and the right inspector retains its full expanded content.

## Browser checks

- Professional filter returns exactly 3 vehicles.
- Domestic filter returns exactly 2 vehicles.
- Selecting Ford Transit updates the inspector and resets the open turn.
- Expanding the morning shift shows 128.142 km start, 128.310 km total, 168 km driven, 20,1 L, 12 L/100 km, and 34,17 €.
- Selecting Peugeot 3008 shows the domestic shared-reading state and 98.215 km latest reading.
- Console warnings/errors checked: none.
- Production build checked successfully.

## Follow-up polish

- P3: add real WhatsApp image thumbnails once ingestion exists, but only when each thumbnail can be associated with its actual shift rather than reused as decoration.

final result: passed
