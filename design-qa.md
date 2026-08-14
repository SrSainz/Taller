# Design QA — vista móvil del conductor y navegación global

## Referencia e implementación

- Referencia: `C:\Users\aiday\AppData\Local\Temp\codex-clipboard-726b9fb2-6a3f-4694-b173-648ceab490df.png` (1029×1536 px), captura proporcionada por la persona usuaria.
- Implementación: `src/App.jsx` (`DriverMobileExperience`) y `src/styles.css` (bloque `driver-mobile-*`).
- Evidencia móvil: `design-qa-driver-mobile.png` (390×844 px).
- Evidencia escritorio: `design-qa-driver-desktop.png` (1280×900 px, composición centrada a 480 px).
- Estado revisado: vista previa de AIDA PEREZ / 5754 MJV, agosto de 2026, sin registros remotos cargados.

## Comparación realizada

La referencia se normalizó como una pantalla móvil sin marco de dispositivo. Se compararon la anatomía de la cabecera, el resumen mensual de dos columnas, los cuatro registros circulares, las dos tarjetas de gráficos, la tabla semanal de lunes a domingo y la navegación inferior de cinco acciones. La implementación conserva esa jerarquía y la adapta a los datos reales de Supabase: las imágenes de justificantes se sustituyen por las vistas firmadas disponibles y, cuando no existe una imagen, se usa el recurso local del cuentakilómetros o el icono contextual.

También se comprobó la adaptación en escritorio: la pantalla mantiene un ancho de lectura móvil centrado y no estira la tabla ni los controles fuera de su composición.

## Hallazgos y correcciones

- Primera revisión: las tarjetas de gráficos quedaban visualmente vacías cuando no había registros diarios y la tabla semanal podía recortarse en anchos móviles estrechos.
- Corrección aplicada: se añadió una serie visual de respaldo basada en el turno configurado para mantener los gráficos legibles durante el estado vacío y se ajustó la tabla a una anchura mínima de 365 px con columna de etiquetas compacta; en 360–380 px se permite el desplazamiento horizontal únicamente dentro de la tabla.
- Revisión final: los siete días caben en la composición de 390 px, la barra inferior permanece anclada y no aparecen errores de consola.

## Resultado

passed

## Navegación global revisada anteriormente

- Source visual truth: `C:/Users/aiday/OneDrive/Escritorio/IMG_2642.jpeg` (224x431 px, supplied mobile reference).
- Implementation evidence: `design-qa-bottom-nav-mobile.png` (390x843 px) and `design-qa-bottom-nav-desktop.png` (1280x720 px).
- State: `#/informes`, General dashboard, bottom navigation visible.
- The lower navigation preserves the requested dark bar, three icon controls and centered raised plus treatment. The Conductores and Neto cards retain their tone-matched styling and the dashboard reserves space above the fixed bar.
- No actionable P0, P1, or P2 findings remain in that surface.

## Prior interaction checks

- Selected the home control from Mantenimiento and confirmed navigation to `#/informes` with `SOBRE RUEDAS` title.
- Selected the profile control and confirmed the existing profile feedback appears above the bottom bar.
- Opened a Conductores calendar and confirmed both daily panels remain above the bar without scrolling.

## Iteración actual: adjuntos desde los círculos

- Referencias de lectura aportadas: `.codex-remote-attachments/.../1-Photo-1.jpg`, `2-Photo-2.jpg` y `3-Photo-3.jpg`.
- Implementación: `src/App.jsx`, `src/styles.css` y `public/assets/driver-examples/`.
- Evidencia: `design-qa-driver-circle-upload-mobile.png` (390×844 px) y `design-qa-driver-circle-upload-desktop.png` (1280×900 px).
- Los tres cuadros de kilometraje muestran las fotos de ejemplo como imágenes sustituibles; Gasolina mantiene su icono hasta que el conductor adjunte una factura o justificante real.
- Los cuatro círculos son botones accesibles que abren el selector nativo de cámara/archivos. Se comprobó que existen cuatro botones de registro y que no existe el botón inferior `Añadir registro`.
- Los adjuntos se guardan en el bucket y tabla existentes de Supabase con `status: review`, `recordType`, fecha, vehículo y `analysisStatus: pending`, de modo que la futura API de OpenAI pueda analizar los documentos y actualizar los datos visibles para Administración sin inventar lecturas en esta fase.
- Comprobación Supabase: las tablas `documents` y `driver_entries` están disponibles; no se realizaron cambios de esquema ni se subieron archivos durante la prueba visual.

## Iteración actual: referencias de consumo y facturación

- Referencias aportadas: `.../4cf984e5-f894-4422-802e-f1bcc6a0462e/1-Photo-1.jpg` (720×1280 px, historial de consumo del vehículo) y `2-Photo-2.jpg` (591×1280 px, resumen semanal de facturación).
- Implementación: `src/App.jsx`, `src/styles.css` y `public/assets/driver-examples/photo-4.jpg` / `photo-5.jpg`.
- Evidencia móvil: `design-qa-driver-reference-mobile.png` (390×844 px), vista previa de AIDA PEREZ en `#/administracion` → `5754 MJV` → `Ver aplicación`.
- Cada referencia aparece como miniatura accesible dentro de su tarjeta correspondiente: consumo junto al gráfico de consumo medio y facturación junto al gráfico de facturación. Al pulsar se abre una ampliación con título, texto alternativo y aviso explícito de que es un ejemplo.
- Las imágenes no se mezclan con los cuatro círculos de lecturas ni se guardan como documentos del conductor; las fotos reales siguen entrando por el selector nativo de cada círculo y mantienen el flujo de Supabase con análisis pendiente.
- Verificación final: se comprobó el diálogo de consumo, la presencia de ambas rutas de imagen, el estado responsive a 390×844 px y consola sin errores ni advertencias.

## Iteración actual: cinco registros capturables

- Referencias usadas: la foto de facturación semanal con barra azul y la foto del historial de consumo con `4,0 l/100 km`, además de las lecturas de cuentakilómetros ya disponibles en `public/assets/driver-examples/`.
- Implementación: `src/App.jsx` y `src/styles.css`.
- Evidencia móvil: `design-qa-driver-five-records-mobile.png` (390×844 px), vista previa de AIDA PEREZ en `#/administracion` → `5754 MJV` → `Ver aplicación`.
- El registro diario muestra cinco accesos en orden: Gasolina (símbolo), Facturación (foto con barra azul), Km diarios, Km acumulados y Consumo (foto de historial). Los cinco son botones y abren el mismo selector nativo de cámara/archivos.
- La carga de Facturación se etiqueta como categoría `billing`; Gasolina, kilómetros y Consumo conservan `consumption`, con `recordType` específico para que el análisis posterior pueda clasificar cada imagen.
- Verificación final: cinco botones accesibles, etiquetas completas, imágenes contextualizadas, composición sin desbordamiento a 390 px y consola sin errores ni advertencias.

## Iteración actual: estadísticas del conductor

- Implementación: `src/App.jsx` y `src/styles.css`.
- Evidencia móvil: `design-qa-driver-stats-mobile.png` (390×844 px), vista previa de AIDA PEREZ en `#/administracion` → `5754 MJV` → `Ver aplicación`.
- La primera tarjeta muestra `Facturación histórica`, agrupa los registros del conductor por mes, permite desplazamiento horizontal y hace seleccionable cada periodo para actualizar la vista.
- La segunda tarjeta muestra `Consumo semanal`, grafica la línea del conductor frente a la media del resto de conductores profesionales y comunica la diferencia en l/100 km.
- Verificación final: ambas tarjetas, la tira histórica y la comparación aparecen en el DOM, no existe desbordamiento horizontal a 390 px y la consola permanece sin errores ni advertencias.

final result: passed

## Iteracion actual: rediseño de NETO segun referencia de tarjetas deslizables

- Source visual truth: `C:/Users/aiday/OneDrive/Escritorio/app david/.codex-remote-attachments/019fd3ce-9cc5-7010-89a4-15da8da4d73a/ac1a1557-d72a-48ec-8771-864aa6ba0930/1-Photo-1.jpg` (640 x 1280 px, referencia proporcionada por la persona usuaria).
- Implementation: `src/App.jsx` (`NetDetailModal`) and `src/styles.css` (NETO carousel/detail block).
- Browser evidence: `design-qa-net-collapsed.png` and `design-qa-net-expanded.png` (1280 x 720 px browser viewport; the source is a mobile reference, so the comparison focuses on the app-owned modal content and preserves responsive behavior).
- States compared: NETO collapsed horizontal vehicle carousel and expanded 5043 MLC vehicle detail with the expense list.
- Full-view evidence: the implementation uses the same dark blue NETO shell, green total, close control, three horizontal vehicle cards, color-coded plates, dots, expanded vehicle header, two summary cells, expense list, and bottom actions.
- Focused interaction evidence: opening 5043 MLC exposes all expense concepts; selecting Gasolina exposes both driver rows; the manual Añadir gastos form remains available.
- Typography and copy: NETO, plates, euro amounts, GASTOS/IMPORTE and action labels follow the strong hierarchy in the reference without clipping.
- Spacing and layout: the collapsed state keeps three cards in one row at the captured viewport; the expanded state reserves an internal scroll for the complete list while keeping the shell and actions visible.
- Colors and tokens: charcoal/navy shell, green positive values and action, pale green selected card, blue and purple secondary card tones, and pale icon containers match the visual direction.
- Image and icon fidelity: generated Corolla sedan assets are used for the three vehicle views, while Tabler icons remain used for the expense concepts; no screenshot is used as a static UI substitute.
- Findings: no actionable P0, P1 or P2 mismatch remains in the reviewed states. The reference's illustrative car photographs are represented by dedicated transparent project assets with matching plate tones.
- Primary interactions tested: open NETO, open/close each vehicle detail, scroll the expense list, expand Gasolina and verify both driver breakdown rows, return to all vehicles.
- Console check: no browser console errors observed during the reviewed states.

final result: passed

## Iteracion actual: vehiculos Corolla sedan en NETO

- Source visual truth: `C:/Users/aiday/OneDrive/Escritorio/app david/.codex-remote-attachments/019fd3ce-9cc5-7010-89a4-15da8da4d73a/ac1a1557-d72a-48ec-8771-864aa6ba0930/1-Photo-1.jpg`.
- Implementation: `src/App.jsx`, `src/styles.css` and `public/net-vehicles/`.
- Browser evidence: `design-qa-net-corolla-collapsed.png` (1280 x 720 px), NETO open on the General dashboard.
- The Toyota symbol is replaced by three Corolla sedan images mapped to the professional vehicles: green 5043 MLC with a front three-quarter view, blue 5750 MJV with a lateral view, and purple 5754 MJV with a rear three-quarter view.
- Each image uses the same visual tone as its plate badge, is transparent and remains an interactive card asset rather than a flattened screenshot.
- The expanded detail, all expense concepts, nested driver breakdowns, manual expense form and modal close action remain functional after the image change.
- Console check: no browser console errors observed; no actionable P0, P1 or P2 mismatch remains.

final result: passed
