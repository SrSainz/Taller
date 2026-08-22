// Resumen estructurado extraído de los documentos facilitados en D:/Fernando.
// Solo se publica el total mensual y su origen; los documentos originales no forman parte del bundle.
// Cuando el documento separa Uber y Bolt, amount conserva el total combinado de facturación del mes.
export const fernandoBillingDocumentSummary = [
  { period: "2023-09", amount: 5515.66, sourceFile: "2023/FACTURACION SEPTIEMBRE.docx", extractedLabel: "FACTURACION UBER" },
  { period: "2023-10", amount: 5155.42, sourceFile: "2023/FACTURACION OCTUBRE.docx", extractedLabel: "FACTURACION UBER" },
  { period: "2023-11", amount: 5106.28, sourceFile: "2023/FACTURACION NOVIEMBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2023-12", amount: 4738.57, sourceFile: "2023/FACTURACION DICIEMBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-01", amount: 5151.88, sourceFile: "2024/FACTURACION ENERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-02", amount: 4862.05, sourceFile: "2024/FACTURACION FEBRERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-03", amount: 5030.77, sourceFile: "2024/FACTURACION MARZO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-04", amount: 5374.26, sourceFile: "2024/FACTURACION ABRIL.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-05", amount: 5429.20, sourceFile: "2024/FACTURACION MAYO.docx", extractedLabel: "TOTAL MES (Uber + Bolt)" },
  { period: "2024-06", amount: 5615.53, sourceFile: "2024/FACTURACION JUNIO.docx", extractedLabel: "TOTAL MES (Uber + Bolt)" },
  { period: "2024-07", amount: 5945.77, sourceFile: "2024/FACTURACION JULIO.docx", extractedLabel: "TOTAL MES (Uber + Bolt)" },
  { period: "2024-08", amount: 2441.02, sourceFile: "2024/FACTURACION AGOSTO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-09", amount: 5415.83, sourceFile: "2024/FACTURACION SEPTIEMBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-10", amount: 5653.89, sourceFile: "2024/FACTURACION OCTUBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-11", amount: 5770.93, sourceFile: "2024/FACTURACION NOVIEMBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-12", amount: 5496.39, sourceFile: "2024/FACTURACION DICIEMBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-01", amount: 5087.48, sourceFile: "2025/FACTURACION ENERO.docx", extractedLabel: "TOTAL (Uber + Bolt)" },
  { period: "2025-02", amount: 5026.82, sourceFile: "2025/FACTURACION FEBRERO.docx", extractedLabel: "TOTAL UBER" },
  { period: "2025-03", amount: 5520.82, sourceFile: "2025/FACTURACION MARZO.docx", extractedLabel: "TOTAL UBER" },
  { period: "2025-04", amount: 5502.90, sourceFile: "2025/FACTURACION ABRIL.docx", extractedLabel: "TOTAL UBER" },
  { period: "2025-05", amount: 5232.94, sourceFile: "2025/FACTURACION MAYO.docx", extractedLabel: "TOTAL UBER" },
  { period: "2025-06", amount: 6040.91, sourceFile: "2025/FACTURACION JUNIO.docx", extractedLabel: "TOTAL UBER" },
  { period: "2025-07", amount: 5632.90, sourceFile: "2025/FACTURACION JULIO.docx", extractedLabel: "TOTAL UBER" },
  { period: "2025-08", amount: 2792.54, sourceFile: "2025/FACTURACION AGOSTO.docx", extractedLabel: "TOTAL UBER" },
  { period: "2025-09", amount: 6132.73, sourceFile: "2025/FACTURACION SEPTIEMBRE.docx", extractedLabel: "TOTAL UBER" },
  { period: "2025-10", amount: 5606.62, sourceFile: "2025/FACTURACION OCTUBRE.docx", extractedLabel: "TOTAL UBER" },
  { period: "2025-11", amount: 6009.06, sourceFile: "2025/FACTURACION NOVIEMBRE.docx", extractedLabel: "TOTAL UBER" },
  { period: "2025-12", amount: 6005.82, sourceFile: "2025/FACTURACION DICIEMBRE.docx", extractedLabel: "TOTAL UBER" },
  { period: "2026-01", amount: 5769.22, sourceFile: "2026/FACTURACION ENERO.docx", extractedLabel: "TOTAL" },
  { period: "2026-02", amount: 5075.52, sourceFile: "2026/FACTURACION FEBRERO.docx", extractedLabel: "TOTAL" },
  { period: "2026-03", amount: 5501.85, sourceFile: "2026/FACTURACION MARZO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-04", amount: 5526.14, sourceFile: "2026/FACTURACION ABRIL.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-05", amount: 6292.04, sourceFile: "2026/FACTURACION MAYO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-06", amount: 6043.74, sourceFile: "2026/FACTURACION JUNIO.docx", extractedLabel: "TOTAL FACTURACION" },
  { period: "2026-07", amount: 5842.29, sourceFile: "2026/FACTURACION JULIO.docx", extractedLabel: "TOTAL FACTURACION" },
];

export const fernandoBillingByPeriod = Object.freeze(Object.fromEntries(
  fernandoBillingDocumentSummary.map((record) => [record.period, record]),
));

export const getFernandoBillingForPeriod = (year, monthIndex) => {
  const period = `${year}-${String(Number(monthIndex) + 1).padStart(2, "0")}`;
  return fernandoBillingByPeriod[period]?.amount ?? 0;
};
