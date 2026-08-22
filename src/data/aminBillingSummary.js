// Resumen estructurado extraído de los documentos facilitados en D:/Amin.
// Solo se publica el total mensual y su origen; los documentos originales no forman parte del bundle.
export const aminBillingDocumentSummary = [
  { period: "2024-11", amount: 7646.10, sourceFile: "2024/FACTURACION NOVIEMBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-12", amount: 9087.11, sourceFile: "2024/FACTURACION DICIEMBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-01", amount: 5123.86, sourceFile: "2025/FACTURACION ENERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-02", amount: 6240.88, sourceFile: "2025/FACTURACION FEBRERO.docx", extractedLabel: "TOTAL FACTURADO MES" },
  { period: "2025-03", amount: 7533.83, sourceFile: "2025/FACTURACION MARZO.docx", extractedLabel: "TOTAL FACTURADO MES" },
  { period: "2025-04", amount: 7196.51, sourceFile: "2025/FACTURACION ABRIL.docx", extractedLabel: "TOTAL FACTURADO MES" },
  { period: "2025-05", amount: 8198.26, sourceFile: "2025/FACTURACION MAYO.docx", extractedLabel: "TOTAL FACTURADO MES" },
  { period: "2025-06", amount: 8173.08, sourceFile: "2025/FACTURACION JUNIO.docx", extractedLabel: "TOTAL FACTURADO MES" },
  { period: "2025-07", amount: 4146.34, sourceFile: "2025/FACTURACION JULIO.docx", extractedLabel: "TOTAL FACTURADO MES" },
  { period: "2025-08", amount: 8174.89, sourceFile: "2025/FACTURACION AGOSTO.docx", extractedLabel: "TOTAL FACTURADO MES" },
  { period: "2025-09", amount: 5027.05, sourceFile: "2025/FACTURACION SEPTIEMBRE.docx", extractedLabel: "TOTAL FACTURADO MES" },
  { period: "2025-10", amount: 7718.73, sourceFile: "2025/FACTURACION OCTUBRE.docx", extractedLabel: "TOTAL FACTURADO MES" },
  { period: "2025-11", amount: 7069.78, sourceFile: "2025/FACTURACION NOVIEMBRE.docx", extractedLabel: "TOTAL FACTURADO MES" },
  { period: "2025-12", amount: 10082.70, sourceFile: "2025/FACTURACION DICIEMBRE.docx", extractedLabel: "TOTAL FACTURADO MES", note: "El documento escribe 10,082,7; se normaliza a 10.082,70 €." },
  { period: "2026-01", amount: 8161.09, sourceFile: "2026/FACTURACION ENERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2026-02", amount: 8114.77, sourceFile: "2026/FACTURACION FEBRERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2026-03", amount: 8057.27, sourceFile: "2026/FACTURACION MARZO.docx", extractedLabel: "TOTAL MES" },
  { period: "2026-04", amount: 6854.74, sourceFile: "2026/FACTURACION ABRIL.docx", extractedLabel: "TOTAL MES" },
  { period: "2026-05", amount: 10002.29, sourceFile: "2026/FACTURACION MAYO.docx", extractedLabel: "TOTAL MES" },
  { period: "2026-06", amount: 9115.85, sourceFile: "2026/FACTURACION JUNIO.docx", extractedLabel: "TOTAL MES" },
  { period: "2026-07", amount: 4464.02, sourceFile: "2026/FACTURACION JULIO.docx", extractedLabel: "TOTAL MES" },
];

export const aminBillingByPeriod = Object.freeze(Object.fromEntries(
  aminBillingDocumentSummary.map((record) => [record.period, record]),
));

export const getAminBillingForPeriod = (year, monthIndex) => {
  const period = `${year}-${String(Number(monthIndex) + 1).padStart(2, "0")}`;
  return aminBillingByPeriod[period]?.amount ?? 0;
};
