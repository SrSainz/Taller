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

## Iteración actual: Neto oscuro mobile-first con coches iluminados

### Evidencia

- Fuente visual seleccionada: `C:/Users/aiday/.codex/generated_images/01a029d9-f09f-7801-b0eb-a3f1e3233595/exec-63956572-9180-47f2-b51c-642dd79df118.png` (1487 × 1058 px, densidad 1x), modelo oscuro con tres Toyota y trazos rojos.
- Referencia de tratamiento de marca: `C:/Users/aiday/.codex/generated_images/01a029d9-f09f-7801-b0eb-a3f1e3233595/exec-c6485740-293a-4e85-94e4-9e2f0321dff7.png` (1487 × 1058 px, densidad 1x), solo el wordmark «SOBRE RUEDAS» sobre fondo claro.
- Implementación: `src/App.jsx`, `src/styles.css`, `public/brand/sobre-ruedas-logo.png`, `public/neto/neto-road-hero.png`, `public/net-vehicles/` y `public/driver-avatars/`.
- Validación de compilación: `dist/client` contiene el logotipo, los tres vehículos y las seis fotografías reales de conductores.
- Smoke test browser: `http://127.0.0.1:5175/#/informes` carga la pantalla de acceso sin errores; el entorno de validación no proporciona valores públicos reales de Supabase, por lo que no se pudo abrir el modal autenticado de Neto en el navegador.

### Comparación

- La composición de Neto conserva una cabecera compacta, una banda hero oscura con tres vehículos y acentos rojos, y un resumen operativo móvil apilado.
- El wordmark aparece aislado en la cabecera con `SOBRE` blanco, `RUEDAS` rojo y el logotipo real de SOBRE RUEDAS; no se usa la captura generada como fondo de interfaz.
- Las tarjetas conservan el funcionamiento existente: periodo, total, gastos, expansión y cálculos no cambian; ahora muestran el vehículo en una tarjeta apaisada y los dos conductores con sus fotos reales.

### Interacciones verificadas

- Tests automáticos: 33 pasados, 0 fallos.
- Build de producción: Vite y empaquetado de Sites completados correctamente.
- El estado de la revisión visual profunda del modal autenticado queda bloqueado únicamente por la ausencia de credenciales públicas de Supabase en el entorno aislado; no se han introducido credenciales ni datos de prueba.

final result: blocked

## Iteración actual — 2 de septiembre de 2026: Neto a ancho completo según boceto móvil

### Evidencia

- Fuente visual: `C:\Users\aiday\OneDrive\Escritorio\20260902_103603.jpg`.
- Captura autenticada de implementación móvil: `tmp/net-production-mobile-final-v5.png`.
- Captura autenticada de implementación de escritorio: `tmp/net-production-desktop-postdeploy.png`.
- Comparación conjunta revisada: `tmp/net-design-qa-comparison.png`.
- Viewports comprobados: 390 × 844 px (móvil) y 1280 × 900 px (escritorio), estado cerrado de Neto, periodo septiembre de 2026.

### Comparación y resultado

- Las tres fichas profesionales ocupan el ancho completo y se apilan en filas iguales entre el resumen superior y la navegación fija.
- El área izquierda reserva aproximadamente el 10 % menos de proporción que la versión anterior; la matrícula queda encima del vehículo y el coche permanece dentro de su propia fila.
- El área derecha agrupa `NETO`, los dos conductores en vertical, `FACTURACIÓN` y `GASTOS`, conservando las fotos reales de Alex, Tirso, Mauricio, Amin, Andrés y Fernando donde corresponde.
- Se eliminaron los separadores horizontales rojos internos; solo permanecen divisiones neutras y una línea vertical sutil entre el vehículo y la información financiera.
- En escritorio se añadió un encuadre responsive para evitar que el vehículo invada la fila siguiente; en móvil se conservan las tres filas completas sin scroll vertical del modal.
- Se verificó la interacción: al tocar una ficha se abre el detalle existente con gastos editables y `VER LOS 3 COCHES` devuelve a la vista resumida.

### Checklist

- [x] Comparación visual conjunta fuente + implementación revisada.
- [x] Vista móvil 390 × 844 sin recortes ni desbordamiento vertical.
- [x] Vista escritorio 1280 × 900 sin vehículos invadiendo otras filas.
- [x] Tres coches en filas apaisadas a ancho completo.
- [x] Separadores rojos internos eliminados.
- [x] Funcionalidad de apertura y retorno conservada.

### Verificación técnica

- `pnpm test`: 45/45 pruebas superadas.
- `pnpm run build`: compilación de producción superada.
- Producción publicada en `https://talleria-flota.vercel.app`.

final result: passed

## Iteración actual: wordmark de la barra superior

- Fuente visual: `C:\Users\aiday\AppData\Local\Temp\codex-clipboard-b767efe6-fd3e-4c42-9357-82f7dbc26d14.png` (wordmark «SOBRE RUEDAS» en blanco y rojo).
- Implementación: `src/App.jsx` y `src/styles.css`.
- El texto junto a la rueda del topbar ahora se divide semánticamente en `SOBRE` blanco y `RUEDAS` rojo, con tipografía condensada e inclinada, manteniendo la escala responsive.
- La comprobación visual autenticada queda bloqueada en el entorno local porque las variables públicas de Supabase no están disponibles; la ruta solo muestra la pantalla de acceso. Build y tests sí se completaron correctamente.

final result: blocked

## Iteración actual: Neto gris-rojo-gris con ficha horizontal

### Evidencia

- Fuente visual: `C:\Users\aiday\AppData\Local\Temp\codex-clipboard-23be5c28-cc46-4ebc-9723-b76ae8c7840d.png` (274 × 253 px, densidad 1x), referencia con tres Toyota orientados en la misma dirección, gris–rojo–gris, luces/brillo inferior, matrículas y conductores.
- Implementación: `src/App.jsx` (`NetDetailModal`) y `src/styles.css` (composición final de fichas NETO); se reutiliza la vista lateral real de `public/net-vehicles/toyota-corolla-blue.png`, con tratamiento gris–rojo–gris, fondo de asfalto y brillo de `public/neto/neto-road-hero.png`.
- Implementación screenshot: no capturada; el navegador integrado quedó no disponible durante la comprobación (`Browser is not available`) y la configuración local no permite abrir la ruta autenticada sin las variables públicas de Supabase.
- URL a revisar cuando el acceso esté disponible: `http://localhost:5175/?release=vehicle-owners-1be6e79#/flota` → Neto.
- Estado esperado: resumen de Neto cerrado, tres fichas visibles, cada coche ocupa una fila completa y al pulsar la fila se abre el detalle existente.

### Comparación y superficies de fidelidad

- Layout: las tres fichas pasan a filas apaisadas apiladas; la matrícula queda encima del coche, los conductores quedan en una sola columna y Facturación/Gastos/Neto se agrupan a la derecha.
- Tipografía: las matrículas, nombres e importes usan pesos altos; los importes de la columna financiera se amplían aproximadamente al doble del tamaño anterior y se mantienen contenidos dentro de su columna.
- Color: primer y tercer coche usan tratamiento plateado y el central rojo; se conserva el fondo de asfalto oscuro y el recurso visual de luz inferior.
- Imaginería: las tres filas comparten la misma vista lateral para evitar orientaciones mezcladas; se mantienen las fotos reales de cada conductor mediante `getDriverAvatarPath`.
- Copy: se muestra `FACTURACIÓN`, `GASTOS` y `NETO`; desaparece `Gastos registrados` en la vista resumida.
- Accesibilidad e interacción: cada fila sigue siendo un elemento `role="button"`, navegable con teclado, y conserva la apertura del detalle y de los gastos sin modificar los cálculos.

### Hallazgos y bloqueo

- La comparación pixel a pixel queda bloqueada porque no fue posible capturar la implementación autenticada. No se han inventado resultados visuales ni se ha saltado el inicio de sesión.
- La fuente es una composición raster pequeña; para evitar usarla como captura de interfaz, los coches se representan con assets de vehículo individuales ya presentes en el proyecto y el texto permanece como contenido HTML accesible.

### Checklist de implementación

- [x] Tres filas apaisadas con interacción de apertura conservada.
- [x] Vista lateral común con tratamiento gris–rojo–gris.
- [x] Matrículas sin recuadro, grandes y encima de cada coche.
- [x] Conductores apilados verticalmente con sus fotografías reales.
- [x] Facturación, Gastos y Neto a la derecha con cifras ampliadas.
- [x] Tests automáticos (37/37) y build de producción ejecutados correctamente.
- [ ] Revisión visual autenticada en móvil y escritorio cuando el navegador y Supabase estén disponibles.

final result: blocked

## Iteración actual: Neto oscuro compacto sin recortes

### Evidencia

- Fuente visual seleccionada: `C:\Users\aiday\AppData\Local\Temp\codex-clipboard-23be5c28-cc46-4ebc-9723-b76ae8c7840d.png` (referencia gris–rojo–gris); se mantiene el recurso original del proyecto `public/net-vehicles/toyota-corolla-blue.png` con el fondo de asfalto y brillo de `public/neto/neto-road-hero.png`.
- Implementación: `src/App.jsx` (`NetDetailModal`) y `src/styles.css` (composición final de Neto).
- Captura browser-rendered: no disponible; el navegador integrado no permite abrir la vista autenticada de Neto en este entorno y las variables públicas de Supabase siguen ausentes.
- URL a revisar cuando el acceso esté disponible: `http://localhost:5175/?release=vehicle-owners-1be6e79#/flota` → Neto.

### Comparación

- El Toyota central usa ahora un tratamiento rojo oscuro y los dos laterales un gris oscuro, manteniendo la orientación común, el asfalto y el brillo inferior.
- Cada matrícula aparece inmediatamente encima de su coche y los coches reducen aproximadamente un 15 % su altura visual para dejar aire a la información.
- En cada fila, la columna frontal ordena `NETO`, los dos conductores en vertical, `FACTURACIÓN` y `GASTOS`; la fila se calcula con su propio contenido y el carrusel permite desplazamiento vertical si la altura del dispositivo lo necesita, evitando invadir la siguiente ficha.
- La cabecera superior y el resumen de periodo se compactan para que `NETO TOTAL`, mes y año queden íntegros antes de comenzar las fichas.

### Checklist

- [x] Tono rojo oscuro para el coche central.
- [x] Tonos gris oscuro para los coches laterales.
- [x] Matrícula colocada inmediatamente encima y sin recuadro.
- [x] Coche reducido aproximadamente un 15 %.
- [x] Neto, conductores, facturación y gastos dentro de cada fila.
- [x] Sin elipsis en los importes de las fichas resumidas.
- [x] Cabecera y resumen de periodo compactos.
- [ ] Revisión visual autenticada en móvil y escritorio cuando el navegador y Supabase estén disponibles.

### Hallazgos y bloqueo

- No se pudo completar la comparación visual autenticada porque el navegador integrado está bloqueado para esta sesión y el entorno local no tiene credenciales públicas reales de Supabase. No se afirma un pase visual; el estado queda bloqueado hasta poder comprobar los viewports reales.

final result: blocked

## Iteración actual — 2 de septiembre de 2026: Neto con frontal recortado y ficha financiera ampliada

### Evidencia

- Fuente visual de verdad: `C:\Users\aiday\OneDrive\Escritorio\20260902_103603.jpg` (4000 × 3000 px JPEG; se giró 90° para presentarla en orientación vertical en la comparación).
- Captura browser-rendered móvil: `tmp/net-production-mobile-final-v6.png` (390 × 844 px, viewport CSS 390 × 844 px, densidad del navegador 1x, resumen cerrado, septiembre de 2026).
- Captura browser-rendered móvil compacta: `tmp/net-production-mobile-360-final.png` (360 × 800 px, viewport CSS 360 × 800 px, densidad del navegador 1x, resumen cerrado, septiembre de 2026).
- Captura browser-rendered de ancho mínimo: `tmp/net-production-mobile-320-collapsed-final-v3.png` (320 × 800 px, viewport CSS 320 × 800 px, densidad del navegador 1x, resumen cerrado, septiembre de 2026).
- Captura browser-rendered de escritorio: `tmp/net-production-desktop-final-v6.png` (1280 × 900 px, viewport CSS 1280 × 900 px, densidad del navegador 1x, resumen cerrado, septiembre de 2026).
- Comparación conjunta revisada: `tmp/net-design-qa-comparison-v2.png` (lienzo 950 × 900 px; boceto ajustado al panel izquierdo e implementación móvil mostrada a escala nativa en el panel derecho).
- Producción validada: `https://talleria-flota.vercel.app/?release=vehicle-owners-1be6e79#/informes` → Neto.

### Comparación y resultado

- Cada ficha profesional conserva su fila apaisada a ancho completo y el coche aparece recortado desde el borde izquierdo hasta aproximadamente media rueda delantera, ocupando cerca de la mitad del ancho visual anterior.
- La matrícula permanece inmediatamente encima del coche; la imagen gris–rojo–gris conserva la orientación común, el brillo inferior y el tratamiento oscuro de la referencia visual.
- El panel financiero se amplía hacia la derecha y muestra con mayor jerarquía `NETO`, los dos conductores en columna con sus fotografías reales, `FACTURACIÓN` y `GASTOS`; no invade la ficha siguiente.
- La altura disponible se calcula hasta la navegación fija: el tercer coche sube y su importe de `GASTOS` queda visible tanto en 390×844 como en 360×800, sin quedar oculto bajo la barra inferior.
- En el ancho mínimo comprobado de 320 px se estrecha únicamente el área visual del coche y se ajustan unos pocos píxeles de tipografía; los importes siguen siendo destacados y caben sin solaparse con las etiquetas.
- No aparecen separadores horizontales rojos dentro de la información; solo se mantiene la división vertical neutra entre el vehículo y la información financiera y una separación sutil entre filas.

### Superficies de fidelidad

- Layout: se conserva la anatomía del boceto — vehículo a la izquierda, matrícula encima e información alineada a la derecha—, dando prioridad al espacio de lectura financiera.
- Tipografía: se amplían el neto, facturación, gastos, nombres e importes de los conductores; las fotos de Alex, Tirso, Mauricio, Amin, Andrés y Fernando se mantienen asociadas a sus fichas.
- Color: se mantiene el fondo de asfalto oscuro, gris oscuro para los coches laterales, rojo oscuro para el coche central y acentos claros de la cabecera.
- Responsividad: las reglas se validan primero en móvil y conservan un encuadre contenido en escritorio, sin desbordamiento ni recorte de texto.

### Interacciones y accesibilidad verificadas

- Pulsar `5043 MLC` abre el detalle existente con la facturación de Alex/Tirso, todos los gastos y los controles de edición; `VER LOS 3 COCHES` permite volver a la vista resumida.
- Las filas siguen siendo elementos interactivos con nombre accesible y la navegación inferior permanece operativa.
- La comprobación `agent-browser errors` no devolvió errores de consola nuevos.
- `pnpm run build`: superado.
- `pnpm test`: 45/45 pruebas superadas.

### Hallazgos y corrección aplicada

- La versión anterior mostraba demasiado ancho del vehículo, reducía la legibilidad de la información y podía dejar el gasto de la tercera ficha demasiado próximo a la navegación fija.
- Se corrigió el recorte de la imagen, se redistribuyó la cuadrícula a favor de la información, se aumentaron los textos y avatares y se limitó la altura del modal al espacio visible antes de la navegación.
- Las capturas móvil y escritorio posteriores a la corrección no muestran recortes de cifras, solapamientos entre fichas ni pérdida de la interacción de detalle.

final result: passed
