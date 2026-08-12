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

final result: passed
