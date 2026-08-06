# Design QA · SOBRE RUEDAS logo integration

- Source visual truth: `C:/Users/aiday/OneDrive/Escritorio/1785620090319.png`
- Implementation screenshots: `design-qa-logo-desktop.png`, `design-qa-logo-settings.png`, `design-qa-logo-mobile-v2.png`
- Combined comparison evidence: `design-qa-logo-phone-comparison.png`
- Viewports: desktop 1280 × 720 CSS px; mobile 390 × 844 CSS px
- Pixel dimensions: source 1488 × 720; desktop capture 1280 × 720; mobile capture 390 × 844; PWA source icon 1254 × 1254 with 512 × 512 and 192 × 192 derivatives
- Density normalization: browser captures used deviceScaleFactor 1; source and crops were proportionally downsampled with Lanczos for the combined comparison board
- State: SOBRE RUEDAS > General, plus Ajustes > Organización

## Full-view comparison evidence

The desktop and mobile captures show the supplied mark in the persistent home control without changing the existing application hierarchy. The 1280 px desktop view has no horizontal overflow, and the 390 px mobile view keeps the square logo, product name, install action, management shortcuts, and notification control visible. The original horizontal artwork remains visible on desktop and in Ajustes > Organización as the active company identity.

## Focused region comparison evidence

`design-qa-logo-phone-comparison.png` places the supplied source, the installable square icon, the rendered phone top bar, and the complete phone General screen in one comparison image. This focused comparison was required because the source visual is a brand asset rather than a full-screen mockup.

## Required fidelity surfaces

- Fonts and typography: no typography was inferred from the image. Existing Inter hierarchy remains unchanged, and the brand image introduces no rasterized UI copy.
- Spacing and layout rhythm: the top-bar control is 62 × 40 px on desktop and 40 × 40 px on mobile; it fits the existing header without collision or page-level overflow. The organization preview aligns with the card's existing spacing.
- Colors and visual tokens: the supplied red/black/white mark is used directly. The PWA derivative retains the same palette on a red safe-area background.
- Image quality and asset fidelity: the company logo uses the original 1488 × 720 PNG without redraw on desktop. On phone, the top-left button resolves to the exact same 192 × 192 PNG declared as the installable PWA icon. The square PWA image is a dedicated raster adaptation rather than CSS or SVG approximation. All images loaded at their expected intrinsic dimensions.
- Copy and content: accessible names identify “SOBRE RUEDAS” and “Logotipo de SOBRE RUEDAS”; the existing Spanish product copy is unchanged.

## Findings

No actionable P0, P1, or P2 differences remain. The square PWA composition intentionally removes the source's wide black surround so the artwork remains legible and mask-safe at install-icon sizes.

## Comparison history

- Pass 1: verified direct-source rendering in the top bar and organization preview, mobile fit, square icon legibility, route behavior, and image loading. No P0/P1/P2 visual mismatch was found, so no visual repair iteration was required.
- Pass 2: changed the phone home control from the horizontal asset to the exact 192 × 192 install icon, increased the control to 40 × 40 px for small-size legibility, and verified the revised 390 × 844 capture. No P0/P1/P2 issue remains.

## Interaction and runtime checks

- Persistent logo button returned from Ajustes to `#/informes`.
- Ajustes route exposed the company-logo preview with accessible image text.
- Install action remained present in non-standalone mode.
- Phone top-left image resolved to `/icons/sobre-ruedas-192.png`, matching the manifest's install icon.
- Fresh browser session reported no console errors or warnings.

## Follow-up polish

No P3 follow-up is required for this scoped logo integration.

final result: passed
