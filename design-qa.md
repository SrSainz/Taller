# Design QA: barra inferior y tarjetas KPI

- Source visual truth: `C:/Users/aiday/OneDrive/Escritorio/IMG_2642.jpeg` (224x431 px, supplied mobile reference).
- Implementation screenshot: `C:/Users/aiday/OneDrive/Escritorio/app david/design-qa-bottom-nav-mobile.png` (390x843 px capture at a 390x844 CSS viewport, device scale factor 1.25).
- Additional responsive evidence: `C:/Users/aiday/OneDrive/Escritorio/app david/design-qa-bottom-nav-desktop.png` (1280x720 px capture at a 1280x720 CSS viewport).
- State: `#/informes`, General dashboard, July 2026, bottom navigation visible.
- Normalization: the source is a cropped phone reference with a device frame and markup; comparison was focused on the bottom-navigation region. The implementation capture is app content only. No resampling was applied.

## Findings

No actionable P0, P1, or P2 findings remain.

The lower navigation preserves the reference anatomy: three evenly separated icon controls, a centered raised plus control, and a persistent bottom bar. The requested dark charcoal bar replaces the white source bar intentionally; the red and green markup and the crossed-out source content are omitted as requested. The Conductores and Neto cards now use subtle blue and green tone-matched gradient fills with their existing icon and border colors.

## Open Questions

The reference does not define behavior for the plus control. It remains a visible button without a new workflow, while the home control returns to SOBRE RUEDAS > General and the profile control uses the existing profile feedback.

## Implementation Checklist

- [x] Fixed dark bottom bar is visible across application routes.
- [x] Home icon navigates to `#/informes` and resets General view.
- [x] Center plus uses the raised cream treatment from the reference anatomy.
- [x] User profile icon is present on the right.
- [x] Conductores and Neto use tone-matched gradient fills.
- [x] Mobile and desktop layouts reserve space so content is not hidden behind the bar.
- [x] Mobile Conductores calendar remains above the new bar without overlap.

## Comparison History

- Initial comparison: the bottom bar covered the lower part of the mobile chart because the dashboard workspace still consumed the full viewport. Fixed by reserving the bottom-navigation height on the dashboard workspace.
- Post-fix comparison: the chart ends above the bar, all three bottom controls remain visible, and the mobile Conductores detail remains above the bar. No P0/P1/P2 issue remained.

## Required Fidelity Surfaces

- Fonts and typography: existing Inter hierarchy is preserved; bottom controls use compact icon-only sizing consistent with the source.
- Spacing and layout rhythm: the fixed bar spans the viewport, evenly separates the three controls, and centers the raised plus without obscuring content.
- Colors and visual tokens: charcoal navigation, cream plus, blue Conductores fill, and green Neto fill map to the requested palette.
- Image quality and asset fidelity: the supplied reference markup is intentionally not reproduced; existing SOBRE RUEDAS logo and Tabler icon assets remain sharp.
- Copy and content: only the three requested icon controls were added; the home and profile controls retain accessible labels.

## Interaction Checks

- Selected the home control from Mantenimiento and confirmed navigation to `#/informes` with `SOBRE RUEDAS` title.
- Selected the profile control and confirmed the existing profile feedback appears above the bottom bar.
- Opened a Conductores calendar and confirmed both daily panels remain above the bar without scrolling.

final result: passed
