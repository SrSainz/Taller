// Resumen estructurado extraído de los documentos facilitados en D:/TIRSO.
// Solo se publica el total mensual y su origen; los documentos originales no forman parte del bundle.
export const tirsoBillingDocumentSummary = [
  { period: "2026-01", amount: 4950.61, sourceFile: "2026/FACTURACION ENERO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-02", amount: 5206.73, sourceFile: "2026/FACTURACION FEBRERO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-03", amount: 5510.33, sourceFile: "2026/FACTURACION MARZO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-04", amount: 6005.99, sourceFile: "2026/FACTURACION ABRIL.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-05", amount: 6534.90, sourceFile: "2026/FACTURACION MAYO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-06", amount: 7065.55, sourceFile: "2026/FACTURACION JUNIO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-07", amount: 6551.52, sourceFile: "2026/FACTURACION JULIO.docx", extractedLabel: "TOTAL FACTURACION" },
];

export const tirsoBillingByPeriod = Object.freeze(Object.fromEntries(
  tirsoBillingDocumentSummary.map((record) => [record.period, record]),
));

export const getTirsoBillingForPeriod = (year, monthIndex) => {
  const period = `${year}-${String(Number(monthIndex) + 1).padStart(2, "0")}`;
  return tirsoBillingByPeriod[period]?.amount ?? 0;
};
