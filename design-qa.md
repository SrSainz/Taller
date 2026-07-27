# Design QA

## Comparison target

- Source visual truth: `design-reference.png` (selected Product Design option 2).
- Browser-rendered implementation: `implementation-998-final.png`.
- Side-by-side evidence: `design-comparison-final.png`.
- Mobile evidence: `implementation-mobile.png`.
- State: fleet ledger, vehicle `9102 JBV` selected, detail tab open.

## Viewport and normalization

- Source pixels: 1487 × 1058.
- Source normalized for comparison: 998 × 711.
- Implementation pixels: 998 × 711.
- CSS viewport: 998 × 711.
- Device scale factor: 1.
- Mobile check: 390 × 844 CSS px.

## Full-view comparison evidence

The final side-by-side comparison preserves the source composition: solid green navigation rail, compact top bar, three-part summary, search and filter row, dense vehicle ledger, selected pale-green row, and fixed right-side inspector. The table and inspector maintain the same relative hierarchy and visible record count as the source.

## Focused region comparison evidence

- Typography: Inter reproduces the neutral B2B character, hierarchy, weights, compact labels, and tabular data density.
- Spacing and layout rhythm: the compact breakpoint was normalized to the source aspect ratio; the summary, toolbar, rows, footer, and inspector now align without page overflow.
- Colors and tokens: near-white canvas, deep petrol green, selected mint tint, amber maintenance state, red missing-reading state, and fine gray dividers match the visual target.
- Image quality: the generated odometer asset is sharp, correctly cropped, and shows the intended `210735 km` and `0.0` values without placeholder treatment.
- Copy and content: visible Spanish navigation, metrics, table columns, vehicle records, actions, invoice data, and maintenance data match the accepted concept. No new above-the-fold product copy was introduced.
- Icons: the implementation uses one coherent Tabler outline family, including the WhatsApp brand icon, rather than handcrafted symbols.

## Comparison history

### Pass 1 — blocked

- P2: The initial compact render used taller summary, toolbar, header, and row spacing, which reduced the visible table density and hid the footer.
- P2: The sidebar used a subtle gradient and the WhatsApp source used a text-based approximation instead of the icon language shown in the source.
- Fixes: reduced compact vertical metrics, restored twelve visible vehicle rows and footer, changed the sidebar to a solid green token, and replaced the approximation with the Tabler WhatsApp icon.
- Post-fix evidence: `implementation-998-final.png` and `design-comparison-final.png`.

### Pass 2 — passed

- No actionable P0, P1, or P2 mismatches remain.
- The desktop body measures 998 × 711 with no overflow.
- The 390 × 844 mobile layout has no horizontal page overflow; the fleet ledger remains horizontally scrollable within its own region.

## Functional verification

- Selected vehicle detail renders from table state.
- `Confirmar` updates the reading state and shows a success message.
- `Sin lectura` filters the fleet from twelve visible records to two matching records.
- Search, all three filters, table row selection, detail tabs, invoice actions, and navigation controls are interactive.
- Browser console errors checked: none.

## Follow-up polish

- P3: At very narrow desktop widths, some small table labels necessarily render more compactly than the 1440-wide source.

final result: passed
