# Design QA — driver activity and workshop history

- Source visual truth: `C:\Users\aiday\OneDrive\Escritorio\app david\design-reference.png`
- Primary implementation screenshot: `C:\Users\aiday\OneDrive\Escritorio\app david\implementation-driver-workshop-1280-final.png`
- Billing-column screenshot: `C:\Users\aiday\OneDrive\Escritorio\app david\implementation-billing-1280.png`
- Workshop-state screenshot: `C:\Users\aiday\OneDrive\Escritorio\app david\implementation-workshop-history-1280.png`
- Combined comparison: `C:\Users\aiday\OneDrive\Escritorio\app david\design-comparison-workshop.png`
- Viewport: 1280 × 720 CSS px.
- Device pixel ratio: 1.25.
- Screenshot dimensions: 1280 × 720 px.
- State: Renault Master selected; Javier Ruiz active; workshop tab open.

## Findings

No actionable P0, P1, or P2 findings remain.

- Typography: Inter, compact weights, number emphasis, and secondary labels preserve the selected dense-ledger hierarchy. Currency and countdown values stay on one line.
- Spacing and layout: the three-region navigation/table/inspector composition remains intact. Removing the separate vehicle and status columns creates enough room for driver selection, review countdown, and workshop data without increasing page height.
- Colors and tokens: selected drivers and rows use the established pale green; urgent service countdowns and repeated maintenance concepts use amber; workshop totals use the established dark green.
- Image quality and icons: the new workflow contains no required raster imagery. All visible UI icons remain from the existing Tabler outline family; no placeholder or handcrafted SVG asset was introduced.
- Copy and content: the ledger now clearly distinguishes daily kilometres, fuel spending in euros, accumulated mileage, remaining service kilometres, latest workshop concept, and workshop history.
- Interaction and accessibility: each driver is a semantic button; the selected driver state is visible in both table and inspector; the workshop cell opens a semantic history table; keyboard row selection and focus outlines remain available.

## Focused comparison evidence

The inspector workshop state was reviewed at native scale. Four maintenance rows fit without collision, amounts align right, dates and mileage remain paired, and both “Aceite y filtros” entries show the same “2 cambios registrados” marker. The table view was separately checked with the Activity tab open to confirm the selected driver’s 120 km and 21,08 € repostaje values.

## Comparison history

### Iteration 1

- Earlier P2: at 1280 px, the 188,66 € summary wrapped across two lines and the Uso badge approached the cell boundary.
- Fix: introduced a compact summary treatment at laptop width and redistributed the eight table tracks to total 100%.
- Post-fix evidence: `implementation-driver-workshop-1280-final.png`; summary values, usage badges, number plates, countdowns, and workshop amounts render without overlap.

## Browser checks

- Clicking Javier Ruiz in the Renault Master row changes the row from 121 km / 32,64 € to 120 km / 21,08 €.
- The same driver change updates daily billing from 402,75 € / 122,00 € cash to 376,40 € / 84,50 € cash.
- The inspector switches to Javier Ruiz and expands his 06:11–13:57 morning part.
- Clicking the Renault Master workshop cell opens the Taller tab.
- Workshop history shows 4 interventions, a total of 2.035,80 €, and two repeated-concept markers.
- Search and professional/domestic filters remain present.
- Console warnings/errors checked: none.
- Production build completed successfully.

## Follow-up polish

- P3: once real invoice ingestion exists, each workshop row can link to its original invoice without changing this comparison-first table layout.

final result: passed
