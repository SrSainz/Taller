// Resumen estructurado extraído de los documentos facilitados en D:/mauricio.
// Solo se publica el total mensual y su origen; los documentos originales no forman parte del bundle.
// Cuando el documento separa Uber y Bolt, amount conserva el total mensual documental.
// FACTURACION NOVIEMBRE MAURICIO.docx, guardado en 2025, repite noviembre de 2024 y no se duplica.
export const mauricioBillingDocumentSummary = [
  { period: "2023-10", amount: 6280.29, sourceFile: "2023/FACTURACION OCTUBRE.docx", extractedLabel: "TOTAL FACTURACION (Uber + Bolt)" },
  { period: "2023-11", amount: 5191.74, sourceFile: "2023/FACTURACION NOVIEMBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2023-12", amount: 6317.79, sourceFile: "2023/FACTURACION DICIEMBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-01", amount: 5284.23, sourceFile: "2024/FACTURACION ENERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-02", amount: 6184.74, sourceFile: "2024/FACTURACION FEBRERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-03", amount: 6503.33, sourceFile: "2024/FACTURACION MARZO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-04", amount: 6370.14, sourceFile: "2024/FACTURACION ABRIL.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-05", amount: 7533.40, sourceFile: "2024/FACTURACION MAYO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-06", amount: 8045.77, sourceFile: "2024/FACTURACION JUNIO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-07", amount: 7006.95, sourceFile: "2024/FACTURACION JULIO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-08", amount: 4857.61, sourceFile: "2024/FACTURACION AGOSTO.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-09", amount: 6537.29, sourceFile: "2024/FACTURACION SEPTIEMBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2024-11", amount: 7019.68, sourceFile: "2024/FACTURACION NOVIEMBRE.docx", extractedLabel: "TOTAL MES", note: "El documento repetido FACTURACION NOVIEMBRE MAURICIO.docx no se suma de nuevo." },
  { period: "2024-12", amount: 7514.27, sourceFile: "2024/FACTURACION DICIEMBRE.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-01", amount: 5502.99, sourceFile: "2025/FACTURACION ENERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-02", amount: 6521.36, sourceFile: "2025/FACTURACION FEBRERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-03", amount: 6513.36, sourceFile: "2025/FACTURACION MARZO.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-04", amount: 6087.52, sourceFile: "2025/FACTURACION ABRIL.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-05", amount: 7059.54, sourceFile: "2025/FACTURACION MAYO.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-06", amount: 7525.31, sourceFile: "2025/FACTURACION JUNIO.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-07", amount: 6062.86, sourceFile: "2025/FACTURACION JULIO.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-08", amount: 6045.58, sourceFile: "2025/FACTURACION AGOSTO.docx", extractedLabel: "TOTAL MES" },
  { period: "2025-09", amount: 6547.91, sourceFile: "2025/FACTURACION SEPTIEMBRE.docx", extractedLabel: "TOTAL FACTURACION MES" },
  { period: "2025-10", amount: 5837.81, sourceFile: "2025/FACTURACION OCTUBRE.docx", extractedLabel: "TOTAL FACTURACION MES" },
  { period: "2025-11", amount: 5790.94, sourceFile: "2025/FACTURACION NOVIEMBRE.docx", extractedLabel: "TOTAL FACTURACION MES" },
  { period: "2025-12", amount: 6003.35, sourceFile: "2025/FACTURACION DICIEMBRE.docx", extractedLabel: "TOTAL FACTURACION MES" },
  { period: "2026-01", amount: 6006.28, sourceFile: "2026/FACTURACION ENERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2026-02", amount: 5766.35, sourceFile: "2026/FACTURACION FEBRERO.docx", extractedLabel: "TOTAL MES" },
  { period: "2026-03", amount: 5502.46, sourceFile: "2026/FACTURACION MARZO.docx", extractedLabel: "TOTAL MES" },
  { period: "2026-04", amount: 6523.53, sourceFile: "2026/FACTURACION ABRIL.docx", extractedLabel: "TOTAL MES" },
  { period: "2026-05", amount: 7042.19, sourceFile: "2026/FACTURACION MAYO.docx", extractedLabel: "TOTAL MES" },
  { period: "2026-06", amount: 6514.90, sourceFile: "2026/FACTURACION JUNIO.docx", extractedLabel: "TOTAL MES" },
  { period: "2026-07", amount: 6147.81, sourceFile: "2026/FACTURACION JULIO.docx", extractedLabel: "TOTAL MES" },
];

export const mauricioBillingByPeriod = Object.freeze(Object.fromEntries(
  mauricioBillingDocumentSummary.map((record) => [record.period, record]),
));

export const getMauricioBillingForPeriod = (year, monthIndex) => {
  const period = `${year}-${String(Number(monthIndex) + 1).padStart(2, "0")}`;
  return mauricioBillingByPeriod[period]?.amount ?? 0;
};
