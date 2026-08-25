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

## Iteracion actual: Administración, opción 2 — Administración Color

- Source visual truth: `C:/Users/aiday/OneDrive/Escritorio/app david/.codex-remote-attachments/019fd3ce-9cc5-7010-89a4-15da8da4d73a/feb38903-db1c-4697-8280-ee073621eb9a/1-Photo-1.jpg`; selected state is the center composition, “Opción 2 — Administración Color”.
- Implementation: `src/App.jsx` and `src/styles.css`.
- Browser evidence: `design-qa-admin-option2-mobile.png` at 402 × 720 px, with the Administration route rendered in the compact mobile layout.
- The admin header now uses the pale shield treatment and light action buttons; the body adds the three summary metrics, administrator card, VEHÍCULOS heading, color-coded vehicle cards, and purple CREAR NUEVO ACCESO card.
- Existing behavior remains intact: vehicle cards still open their driver management panels, the administrator card still opens profile settings, the create card still opens the account form, and the top-left shield returns to the main application.
- Interaction check: opening and closing the first vehicle accordion succeeded; the panel rendered its assigned-driver state without console errors.

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
- Colors and tokens: charcoal/navy shell, green positive values and action, pale green selected card, blue and red secondary card tones, and pale icon containers match the visual direction.
- Image and icon fidelity: generated Corolla sedan assets are used for the three vehicle views, while Tabler icons remain used for the expense concepts; no screenshot is used as a static UI substitute.
- Findings: no actionable P0, P1 or P2 mismatch remains in the reviewed states. The reference's illustrative car photographs are represented by dedicated transparent project assets with matching plate tones.
- Primary interactions tested: open NETO, open/close each vehicle detail, scroll the expense list, expand Gasolina and verify both driver breakdown rows, return to all vehicles.
- Console check: no browser console errors observed during the reviewed states.

final result: passed

## Iteracion actual: vehiculos Corolla sedan en NETO

- Source visual truth: `C:/Users/aiday/OneDrive/Escritorio/app david/.codex-remote-attachments/019fd3ce-9cc5-7010-89a4-15da8da4d73a/ac1a1557-d72a-48ec-8771-864aa6ba0930/1-Photo-1.jpg`.
- Implementation: `src/App.jsx`, `src/styles.css` and `public/net-vehicles/`.
- Browser evidence: `design-qa-net-corolla-collapsed.png` (1280 x 720 px), NETO open on the General dashboard.
- The Toyota symbol is replaced by three Corolla sedan images mapped to the professional vehicles: green 5043 MLC with a front three-quarter view, blue 5750 MJV with a lateral view, and red 5754 MJV with a rear three-quarter view.
- Each image uses the same visual tone as its plate badge, is transparent and remains an interactive card asset rather than a flattened screenshot.
- The expanded detail, all expense concepts, nested driver breakdowns, manual expense form and modal close action remain functional after the image change.
- Console check: no browser console errors observed; no actionable P0, P1 or P2 mismatch remains.

final result: passed

## Iteracion actual: Corolla 5754 MJV en rojo

- Implementation: `src/App.jsx`, `src/styles.css` and `public/net-vehicles/toyota-corolla-red.png`.
- The third professional vehicle now uses the same red visual treatment for the Corolla sedan, the plate badge, the card tint and the expand affordance; the green and blue vehicle cards remain unchanged.
- The asset preserves the existing rear three-quarter viewpoint and transparent background, so the change is limited to the requested color treatment.
- Browser evidence: `design-qa-net-red.png`, with the NETO carousel open and all three vehicle cards visible.
- The expanded expense detail remains reachable from the red card and no console errors were observed.

final result: passed

## Iteracion actual: cabecera global de NETO

- Implementation: `src/App.jsx` and `src/styles.css`.
- Browser evidence: `design-qa-net-header.png` (1280 x 720 px), NETO open from the General dashboard.
- The global black bar remains the only title surface: the red SOBRE RUEDAS wheel and `NETO` in uppercase are centered above the modal.
- The duplicate `NETO` label and menu icon were removed from the modal header; the period total and close control remain available.
- Verified the modal has no internal heading, the global title is exactly `NETO`, and no console errors were observed.

final result: passed

## Iteración actual: barra de objetivos de facturación

## Evidencia

- Fuente visual: `C:/Users/aiday/AppData/Local/Temp/codex-clipboard-4b77bc49-751c-4e2f-997d-920a6ac059fa.png` (1024 × 655 px, densidad 1x).
- Implementación final por debajo del objetivo: `tmp/driver-billing-goal-final-below-100.png` (1280 × 720 px, densidad 1x).
- Implementación final superando el objetivo: `tmp/driver-billing-goal-final-over-100.png` (1280 × 720 px, densidad 1x).
- URL verificada: `https://talleria-flota.vercel.app/`.
- Estado: Administración → coche 5043 MLC → Alex → Ver aplicación; julio de 2026 (4.461,20 €, 64 %) y septiembre de 2025 (7.782,35 €, 111 %).
- La imagen fuente es una referencia ilustrativa de patrón, no una captura de la pantalla completa; la comparación se centra en la barra, los hitos circulares y el indicador porcentual.

## Comparación

### Vista completa

La referencia combina una barra horizontal azul con estados circulares y un indicador de avance. La implementación conserva ese lenguaje en un bloque compacto de la cabecera del conductor, junto a Facturación y antes de Propinas, sin alterar el resto de la pantalla operativa.

### Región enfocada

- La barra usa una escala visual de 0 a 9.000 €.
- Los hitos circulares aparecen en 5.000, 5.500, 6.000, 6.500, 7.000, 7.500, 8.000, 8.500 y 9.000.
- El objetivo se identifica como 7.000 € y el porcentaje se calcula sobre ese valor: julio muestra 64 % y septiembre 111 %.
- El relleno visual se limita a la escala de 9.000 € para conservar proporción; el porcentaje no se limita y comunica los valores superiores al objetivo.

## Superficies de fidelidad

- Tipografía: mantiene Inter y la jerarquía compacta existente de la vista del conductor; el porcentaje tiene peso alto y contraste azul/verde.
- Espaciado y ritmo: el bloque añade solo la cabecera del objetivo y una fila de hitos, conservando la altura compacta de la cabecera.
- Color y tokens: conserva el azul de Facturación, el naranja del objetivo de 7.000 € y el verde de estado conseguido.
- Imágenes y assets: no se necesitaban imágenes adicionales; los controles continúan usando los iconos existentes del producto.
- Copy y contenido: los nueve hitos y el objetivo se muestran con formato español y el porcentaje indica «del objetivo».

## Historial de comparación

1. Primera pasada: la barra y el porcentaje eran correctos, pero las etiquetas de 5.000–9.000 quedaban demasiado juntas en el ancho móvil.
2. Corrección: se redujo ligeramente la tipografía de las etiquetas y se ajustó el espaciado de letras dentro del bloque compacto.
3. Pasada final: se verificaron las capturas de julio (64 %) y septiembre (111 %); los hitos son legibles, no hay desbordamiento visible y no aparecen errores de consola.

## Interacciones verificadas

- Selección de año y mes desde los menús de la vista del conductor.
- Actualización del importe, porcentaje, relleno y estados de los hitos al cambiar de periodo.
- Caso por debajo del objetivo y caso superior al 100 %.
- Botón «Pendiente de mantenimiento» conservado junto a Propinas.
- Errores de consola: ninguno.

## Findings

No quedan diferencias accionables P0, P1 o P2 en la región implementada. La composición general de la fuente es ilustrativa y no se replica como pantalla completa porque la solicitud se limita a integrar el patrón en la barra existente.

## Follow-up Polish

La fuente contiene elementos decorativos adicionales que no forman parte de esta barra; no se incorporan para preservar el espacio compacto solicitado.

final result: passed

## Iteración actual: ficha diaria de Conductores

### Evidencia

- Fuente visual: `C:/Users/aiday/AppData/Local/Temp/codex-clipboard-6ef88cfc-638f-4c43-bdad-7bf49b76df85.png` (1537 × 800 px, densidad 1x).
- Implementación publicada: `https://talleria-flota.vercel.app/?release=driver-day-edit-d966d28#/conductores`.
- Capturas browser-rendered verificadas en 1280 × 720 px (escritorio) y 560 × 700 px (móvil), ambas con el conductor Alex y agosto de 2026 seleccionado.

### Comparación

- La fecha desaparece del bloque de Facturación porque ya está representada por el día seleccionado del calendario.
- El calendario gana altura y los tres paneles inferiores se compactan; Repostaje y Kilómetros conservan el espacio horizontal y muestran sus cifras con mayor tamaño.
- Los títulos Facturación, Repostaje y Kilómetros son ahora controles de edición accesibles. El editor muestra `Aceptar` y `Cancelar` y Cancelar devuelve a la misma vista sin cambios.
- Las etiquetas `Editar importe` y `Editar kilometraje` ya no aparecen en los paneles.

### Superficies de fidelidad

- Tipografía: se conserva la familia y jerarquía del módulo; los importes de Repostaje y Kilómetros suben ligeramente de tamaño sin recortar unidades.
- Espaciado y layout: se reduce el alto del detalle diario y se reasigna al calendario, manteniendo las tres tarjetas alineadas en escritorio y apiladas correctamente en móvil.
- Colores: se mantienen los tratamientos azul, rojo y ámbar de Facturación, Repostaje y Kilómetros.
- Imágenes y assets: no se añaden assets; se mantienen los iconos existentes y las fotos/documentos continúan en sus controles de cámara.
- Copy: se eliminan Día, Editar importe y Editar kilometraje de la vista; Aceptar y Cancelar quedan en el editor.

### Interacciones verificadas

- Selección de conductor y día desde el calendario.
- Pulsar Facturación abre el editor; Aceptar y Cancelar aparecen.
- Cancelar cierra el editor y devuelve la ficha diaria.
- Repostaje y Kilómetros exponen sus controles de edición por título.
- Consola del navegador: 0 errores.

### Findings

No quedan diferencias accionables P0, P1 o P2 en la ficha diaria. La diferencia de resolución de las capturas se debe al viewport disponible del navegador de validación; la composición se comprobó en escritorio y móvil.

final result: passed

## Iteración actual: desglose diario de Propinas

### Evidencia

- Fuente visual de referencia: `C:/Users/aiday/AppData/Local/Temp/codex-clipboard-9902e6dc-e0d9-466c-a6f6-35a3a1b79e63.png` (960 × 2079 px originales; la captura adjunta se muestra normalizada a 946 × 2048 px).
- Implementación publicada: `https://talleria-flota.vercel.app/?release=driver-tips-2b9dd93#/administracion`.
- Captura browser-rendered: `tmp/design-qa-driver-tips-daily-mobile.png` (560 × 700 px, CSS 560 × 700 px, densidad 1x), con la vista de Fernando y agosto de 2026.

### Comparación

- El importe acumulado de PROPINAS mantiene la tarjeta existente, pero ahora es un control pulsable y se muestra en mayúsculas, negrita y con mayor tamaño.
- Al abrirlo aparece una superficie compacta de desglose diario dentro del mismo resumen, con fecha, importe y total mensual; se conserva Pendiente de mantenimiento a la derecha.
- Se comprobó un registro real: `sáb, 22 ago · 2,50 €`, con total mensual de `2,50 €`.
- Cuando el periodo solo tiene un resumen mensual importado sin fechas diarias, la interfaz lo comunica sin inventar una fecha.

### Superficies de fidelidad

- Tipografía: PROPINAS usa mayúsculas, peso 900 y tamaño superior; fechas e importes mantienen la jerarquía compacta de la tarjeta.
- Espaciado y layout: el desglose se inserta debajo del importe, ocupa solo el ancho de su columna y no tapa los controles de captura ni la semana.
- Colores y tokens: se conserva el verde de propinas y se usa un fondo verde muy claro para diferenciar el detalle sin romper la paleta azul principal.
- Imágenes y assets: no se añadieron imágenes; se mantiene el icono existente de despliegue/cierre.
- Copy: “PROPINAS”, “DESGLOSE DIARIO” y “Total del mes” son visibles y accesibles.

### Interacciones verificadas

- Pulsar el número de propinas abre el desglose.
- Pulsar la X cierra el desglose.
- Cambiar de mes cierra el detalle y recalcula el acumulado.
- Un mes importado sin fechas muestra el estado informativo correspondiente.
- Errores nuevos en producción: 0.

### Findings

No quedan diferencias accionables P0, P1 o P2 en la región modificada. La fuente visual corresponde al estado cerrado anterior; el panel abierto es el estado nuevo solicitado y se comprobó en móvil.

final result: passed
