// Resumen estructurado de documentos de facturación históricos facilitados en
// carpetas del escritorio. Solo se publica el total mensual y el origen; los
// DOCX originales no forman parte del bundle.
//
// Estas fuentes son históricas y separadas: no crean perfiles ni registros
// diarios de los conductores actuales. Cuando una matrícula no aparece en la
// carpeta o en el documento, se conserva como pendiente de asociar y no se
// suma a un coche por suposición.

const summaryByPeriod = (records) => Object.freeze(Object.fromEntries(records.map((record) => [record.period, record])));

const daniel = [
  { period: "2025-01", amount: 6400.66, sourceFile: "DANIEL 2025 5043MLC/FACTURACION ENERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-02", amount: 6400.66, sourceFile: "DANIEL 2025 5043MLC/FACTURACION FEBRERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-03", amount: 5132.38, sourceFile: "DANIEL 2025 5043MLC/FACTURACION MARZO.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-04", amount: 6015.63, sourceFile: "DANIEL 2025 5043MLC/FACTURACION ABRIL.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-05", amount: 6006.92, sourceFile: "DANIEL 2025 5043MLC/FACTURACION MAYO.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-06", amount: 6548.99, sourceFile: "DANIEL 2025 5043MLC/FACTURACION JUNIO.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-07", amount: 3134.12, sourceFile: "DANIEL 2025 5043MLC/FACTURACION JULIO.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-08", amount: 5403.51, sourceFile: "DANIEL 2025 5043MLC/FACTURACION AGOSTO.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-09", amount: 5521.97, sourceFile: "DANIEL 2025 5043MLC/FACTURACION SEPTIEMBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-10", amount: 5562.55, sourceFile: "DANIEL 2025 5043MLC/FACTURACION OCTUBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-11", amount: 6019.43, sourceFile: "DANIEL 2025 5043MLC/FACTURACION NOVIEMBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-12", amount: 5501.47, sourceFile: "DANIEL 2025 5043MLC/FACTURACION DICIEMBRE.docx", extractedLabel: "TOTAL MES" },
];

const carlosGonzalez = [
  { period: "2024-01", amount: 5123.05, sourceFile: "CARLOS gonzalez calzon 2024/FACTURACION ENERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-02", amount: 5021.74, sourceFile: "CARLOS gonzalez calzon 2024/FACTURACION FEBRERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-03", amount: 4908.15, sourceFile: "CARLOS gonzalez calzon 2024/FACTURACION MARZO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-05", amount: 5224.88, sourceFile: "CARLOS gonzalez calzon 2024/FACTURACION MAYO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-06", amount: 5001.83, sourceFile: "CARLOS gonzalez calzon 2024/FACTURACION JUNIO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-08", amount: 5187.09, sourceFile: "CARLOS gonzalez calzon 2024/FACTURACION AGOSTO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-09", amount: 5003.56, sourceFile: "CARLOS gonzalez calzon 2024/FACTURACION SEPTIEMBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-10", amount: 6006.83, sourceFile: "CARLOS gonzalez calzon 2024/FACTURACION OCTUBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-11", amount: 4259.93, sourceFile: "CARLOS gonzalez calzon 2024/FACTURACION DICIEMBRE.docx", extractedLabel: "TOTAL UBER", note: "La cabecera impresa del documento indica noviembre de 2024; el mismo archivo aparece duplicado en la carpeta 2025." },
  { period: "2025-02", amount: 5016.96, sourceFile: "Carlos Conzalez Calzon 2025 5754MJV/FACTURACION FEBRERO.docx", extractedLabel: "TOTAL UBER" },
  { period: "2025-03", amount: 5492.02, sourceFile: "Carlos Conzalez Calzon 2025 5754MJV/FACTURACION MARZO.docx", extractedLabel: "FACTURACIÓN", note: "Se conserva la facturación antes de sumar propinas." },
  { period: "2025-04", amount: 5013.24, sourceFile: "Carlos Conzalez Calzon 2025 5754MJV/FACTURACION ABRIL.docx", extractedLabel: "TOTAL" },
  { period: "2025-05", amount: 4834.76, sourceFile: "Carlos Conzalez Calzon 2025 5754MJV/FACTURACION MAYO.docx", extractedLabel: "TOTAL", note: "Se conserva la facturación del mes antes del ajuste de 166,24 € indicado en el documento." },
  { period: "2025-06", amount: 5028.10, sourceFile: "Carlos Conzalez Calzon 2025 5754MJV/FACTURACION JUNIO.docx", extractedLabel: "TOTAL", note: "Importe final del total 5.194,00 € menos el ajuste de 166,24 € indicado en el documento." },
  { period: "2025-07", amount: 5008.85, sourceFile: "Carlos Conzalez Calzon 2025 5754MJV/FACTURACION JULIO.docx", extractedLabel: "TOTAL" },
  { period: "2025-08", amount: 1308.57, sourceFile: "Carlos Conzalez Calzon 2025 5754MJV/FACTURACION AGOSTO.docx", extractedLabel: "TOTAL" },
  { period: "2025-09", amount: 5006.61, sourceFile: "Carlos Conzalez Calzon 2025 5754MJV/FACTURACION SEPTIEMBRE.docx", extractedLabel: "TOTAL" },
  { period: "2025-10", amount: 4712.46, sourceFile: "Carlos Conzalez Calzon 2025 5754MJV/FACTURACION OCTUBRE.docx", extractedLabel: "TOTAL" },
  { period: "2025-11", amount: 5012.83, sourceFile: "Carlos Conzalez Calzon 2025 5754MJV/FACTURACION NOVIEMBRE.docx", extractedLabel: "TOTAL" },
  { period: "2025-12", amount: 5002.79, sourceFile: "Carlos Conzalez Calzon 2025 5754MJV/FACTURACION DICIEMBRE.docx", extractedLabel: "TOTAL" },
  { period: "2026-01", amount: 5007.51, sourceFile: "Nueva carpeta/dic 26 Carlos Gonzalez Calzon.docx", extractedLabel: "TOTAL", note: "La cabecera impresa indica enero de 2026 aunque el nombre del archivo contiene dic 26; se prioriza la fecha impresa." },
];

const emilioRosado = [
  { period: "2024-11", amount: 4486.93, sourceFile: "EMILIO ROSADO LACASA 2024-2025/FACTURACION NOVIEMBRE 2024 5750MJV.docx", extractedLabel: "TOTAL" },
  { period: "2024-12", amount: 5624.55, sourceFile: "EMILIO ROSADO LACASA 2024-2025/FACTURACION DICIEMBRE 2024 5750MJV.docx", extractedLabel: "TOTAL" },
  { period: "2025-01", amount: 4801.70, sourceFile: "EMILIO ROSADO LACASA 2024-2025/FACTURACION ENERO 2025 5750MJV.docx", extractedLabel: "TOTAL MES", note: "La cabecera impresa indica enero de 2024; se usa enero de 2025 por el nombre del documento y la carpeta del periodo." },
  { period: "2025-03", amount: 4892.51, sourceFile: "EMILIO ROSADO LACASA 2024-2025/FACTURACION MARZO 2025 5750MJV.docx", extractedLabel: "FACTURACIÓN BOLT" },
  { period: "2025-04", amount: 4804.96, sourceFile: "EMILIO ROSADO LACASA 2024-2025/FACTURACION ABRIL 2025 5750MJV.docx", extractedLabel: "FACTURACIÓN BOLT", note: "El archivo de febrero de 2025 es idéntico a este documento de abril y no se suma dos veces." },
];

const alejandroGomez = [
  { period: "2026-02", amount: 5503.75, sourceFile: "Nueva carpeta/Febrero 26 Alejandro.docx", extractedLabel: "TOTAL" },
  { period: "2026-03", amount: 5191.76, sourceFile: "Nueva carpeta/Marzo 26 Alejandro.docx", extractedLabel: "TOTAL" },
  { period: "2026-04", amount: 5366.44, sourceFile: "Nueva carpeta/Abril 26  Alejandro.docx", extractedLabel: "TOTAL" },
  { period: "2026-05", amount: 5520.89, sourceFile: "Nueva carpeta/Mayo 26 Alejandro.docx", extractedLabel: "TOTAL" },
];

const carlosMartinez = [
  { period: "2026-07", amount: 4521.03, sourceFile: "Nueva carpeta/Julio 26 Carlos Martinez Escobar.docx", extractedLabel: "TOTAL MES" },
];

export const additionalHistoricalBillingSources = Object.freeze([
  { key: "daniel", label: "Daniel López de la Fuente", vehiclePlate: "5043 MLC", historicalOnly: true, summary: summaryByPeriod(daniel) },
  { key: "carlos-gonzalez", label: "Carlos González Calzón", vehiclePlate: "5754 MJV", historicalOnly: true, summary: summaryByPeriod(carlosGonzalez) },
  { key: "emilio", label: "Emilio Rosado Lacasa", vehiclePlate: "5750 MJV", historicalOnly: true, summary: summaryByPeriod(emilioRosado) },
  { key: "alejandro", label: "Alejandro Gómez Castillo", vehiclePlate: "", historicalOnly: true, summary: summaryByPeriod(alejandroGomez) },
  { key: "carlos-martinez", label: "Carlos Alberto Martínez Escobar", vehiclePlate: "", historicalOnly: true, summary: summaryByPeriod(carlosMartinez) },
]);
