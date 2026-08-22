# Design QA — Barra de objetivos de facturación

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
