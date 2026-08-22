// Resumen estructurado extraído de los documentos facilitados en D:/ALEX.
// Solo se publica el total mensual y su origen; los documentos originales no forman parte del bundle.
export const alexBillingDocumentSummary = [
  { period: "2024-01", amount: 3655.22, sourceFile: "2024/FACTURACION ENERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-02", amount: 5161.08, sourceFile: "2024/FACTURACION FEBRERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-03", amount: 6464.12, sourceFile: "2024/FACTURACION MARZO.docx", extractedLabel: "TOTAL (UBER + BOLT)", note: "El documento separa Uber 2.542,12 € y Bolt 3.922,00 €." },
  { period: "2024-04", amount: 6472.93, sourceFile: "2024/FACTURACION ABRIL.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-05", amount: 6700.54, sourceFile: "2024/FACTURACION MAYO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-06", amount: 7371.53, sourceFile: "2024/FACTURACION JUNIO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-07", amount: 6591.86, sourceFile: "2024/FACTURACION JULIO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-08", amount: 3706.88, sourceFile: "2024/FACTURACION AGOSTO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-09", amount: 3398.08, sourceFile: "2024/FACTURACION SEPTIEMBRE 2024.docx", extractedLabel: "TOTAL MES", note: "Se usa el total del mes del propio documento; una operación posterior repite el importe de agosto." },
  { period: "2024-10", amount: 6402.27, sourceFile: "2024/FACTURACION OCTUBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-11", amount: 6888, sourceFile: "2024/FACTURACION NOVIEMBRE.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2024-12", amount: 8063.2, sourceFile: "2024/FACTURACION DICIEMBRE.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2025-01", amount: 6135.03, sourceFile: "2025/FACTURACION ENERO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2025-02", amount: 5604.46, sourceFile: "2025/FACTURACION FEBRERO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2025-03", amount: 5032.91, sourceFile: "2025/FACTURACION MARZO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2025-04", amount: 6522.52, sourceFile: "2025/FACTURACION ABRIL.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2025-05", amount: 5104.4, sourceFile: "2025/FACTURACION MAYO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2025-06", amount: 7297.83, sourceFile: "2025/FACTURACION JUNIO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2025-07", amount: 5012.18, sourceFile: "2025/FACTURACION JULIO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2025-08", amount: 4054.1, sourceFile: "2025/FACTURACION AGOSTO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2025-09", amount: 7782.35, sourceFile: "2025/FACTURACION SEPTIEMBRE.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2025-10", amount: 7185.74, sourceFile: "2025/FACTURACION OCTUBRE.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2025-11", amount: 7565.6, sourceFile: "2025/FACTURACION NOVIEMBRE.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2025-12", amount: 8053.09, sourceFile: "2025/FACTURACION DICIEMBRE.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-01", amount: 7026.46, sourceFile: "2026/FACTURACION ENERO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-02", amount: 5242.18, sourceFile: "2026/FACTURACION FEBRERO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-03", amount: 6633.39, sourceFile: "2026/FACTURACION MARZO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-04", amount: 5055.63, sourceFile: "2026/FACTURACION ABRIL.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-05", amount: 7273.1, sourceFile: "2026/FACTURACION MAYO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-06", amount: 7006.97, sourceFile: "2026/FACTURACION JUNIO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-07", amount: 4461.2, sourceFile: "2026/FACTURACION JULIO.docx", extractedLabel: "TOTAL FACTURACION", note: "La cabecera interna dice JUNIO 2026; se asigna a julio por carpeta y nombre del archivo." },
];

export const alexBillingByPeriod = Object.freeze(Object.fromEntries(
  alexBillingDocumentSummary.map((record) => [record.period, record]),
));

export const getAlexBillingForPeriod = (year, monthIndex) => {
  const period = `${year}-${String(Number(monthIndex) + 1).padStart(2, "0")}`;
  return alexBillingByPeriod[period]?.amount ?? 0;
};
