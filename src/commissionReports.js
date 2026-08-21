const ALEX_COMMISSION_RATE = 0.32;
const ALEX_FIRST_BONUS_THRESHOLD = 5000;
const ALEX_FIRST_BONUS = 250;
const ALEX_INCREMENT_THRESHOLDS = [5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000];
const money = (value) => Number((Math.max(0, Number(value) || 0)).toFixed(2));
const signedMoney = (value) => Number((Number(value) || 0).toFixed(2));

export const alexCommissionThresholds = [ALEX_FIRST_BONUS_THRESHOLD, ...ALEX_INCREMENT_THRESHOLDS];

export const isAlex = (name = "") => String(name).trim().toLocaleLowerCase("es") === "alex";

export const calculateAlexCommission = ({ billing = 0, tips = 0, tolls = 0, payroll = 0 } = {}) => {
  const monthlyBilling = money(billing);
  const commissionBase = money(monthlyBilling * ALEX_COMMISSION_RATE);
  const thresholdBonus = monthlyBilling > ALEX_FIRST_BONUS_THRESHOLD
    ? ALEX_FIRST_BONUS + (ALEX_INCREMENT_THRESHOLDS.filter((threshold) => monthlyBilling > threshold).length * 50)
    : 0;
  const commission = money(commissionBase + thresholdBonus);
  const totalBenefitMonth = money(commission + tips + tolls);
  const totalToCollect = signedMoney(totalBenefitMonth - payroll);
  return {
    monthlyBilling,
    commissionRate: ALEX_COMMISSION_RATE,
    commissionBase,
    thresholdBonus,
    commission,
    tips: money(tips),
    tolls: money(tolls),
    totalBenefitMonth,
    payroll: money(payroll),
    totalToCollect,
  };
};

const ascii = (value = "") => String(value)
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .replace(/[€]/g, "EUR")
  .replace(/[^\x20-\x7E]/g, "")
  .trim();

const pdfEscape = (value = "") => ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
const pdfMoney = (value) => `${signedMoney(value).toFixed(2).replace(".", ",")} EUR`;

const textCommand = (font, size, x, y, value, color = "0.08 0.13 0.18") => `${color} rg BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(value)}) Tj ET`;
const ruleCommand = (x, y, width, color = "0.82 0.87 0.89") => `${color} RG 0.8 w ${x} ${y} m ${x + width} ${y} l S`;
const boxCommand = (x, y, width, height, fill = "0.94 0.97 0.96") => `q ${fill} rg ${x} ${y} ${width} ${height} re f Q`;

const buildPdfBytes = (content) => {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let document = "%PDF-1.4\n%\xFF\xFF\xFF\xFF\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(document).length);
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = new TextEncoder().encode(document).length;
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { document += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(document);
};

export const buildAlexCommissionReportPdf = ({ driverName = "Alex", vehiclePlate = "", year, monthIndex, calculation } = {}) => {
  const monthLabel = new Intl.DateTimeFormat("es-ES", { month: "long" }).format(new Date(year, monthIndex, 1));
  const report = calculation ?? calculateAlexCommission();
  const content = [
    boxCommand(0, 0, 595, 842, "0.06 0.14 0.19"),
    textCommand("F2", 25, 40, 778, "SOBRE RUEDAS", "1 1 1"),
    textCommand("F1", 12, 42, 752, "INFORME MENSUAL DE COMISION", "0.68 0.92 0.76"),
    textCommand("F2", 17, 42, 708, `${driverName} · ${vehiclePlate}`, "1 1 1"),
    textCommand("F1", 12, 42, 684, `${monthLabel.toLocaleUpperCase("es")} ${year}`, "0.82 0.88 0.91"),
    boxCommand(36, 570, 523, 84, "0.10 0.23 0.28"),
    textCommand("F1", 11, 55, 625, "FACTURACION MENSUAL", "0.72 0.83 0.88"),
    textCommand("F2", 24, 55, 592, pdfMoney(report.monthlyBilling), "1 1 1"),
    textCommand("F1", 11, 330, 625, "TIPO DE COMISION", "0.72 0.83 0.88"),
    textCommand("F2", 24, 330, 592, "32%", "0.47 0.92 0.63"),
    boxCommand(0, 0, 595, 555, "1 1 1"),
    textCommand("F2", 15, 42, 530, "CALCULO", "0.10 0.52 0.41"),
    ruleCommand(42, 516, 511),
    textCommand("F1", 12, 55, 484, "Base 32%", "0.14 0.20 0.24"),
    textCommand("F2", 13, 430, 484, pdfMoney(report.commissionBase), "0.14 0.20 0.24"),
    textCommand("F1", 12, 55, 451, "Complementos por tramos", "0.14 0.20 0.24"),
    textCommand("F2", 13, 430, 451, pdfMoney(report.thresholdBonus), "0.14 0.20 0.24"),
    textCommand("F1", 11, 72, 423, "+ 250 EUR si supera 5.000 EUR; + 50 EUR por cada tramo de 500 EUR superado", "0.37 0.44 0.47"),
    textCommand("F1", 12, 55, 384, "Comision calculada", "0.14 0.20 0.24"),
    textCommand("F2", 15, 430, 384, pdfMoney(report.commission), "0.14 0.20 0.24"),
    ruleCommand(42, 360, 511),
    textCommand("F1", 12, 55, 328, "Propinas del mes", "0.14 0.20 0.24"),
    textCommand("F2", 13, 430, 328, pdfMoney(report.tips), "0.14 0.20 0.24"),
    textCommand("F1", 12, 55, 296, "Peajes del mes", "0.14 0.20 0.24"),
    textCommand("F2", 13, 430, 296, pdfMoney(report.tolls), "0.14 0.20 0.24"),
    boxCommand(42, 210, 511, 60, "0.86 0.95 0.89"),
    textCommand("F2", 13, 58, 245, "TOTAL BENEFICIO MES", "0.06 0.23 0.14"),
    textCommand("F2", 18, 405, 241, pdfMoney(report.totalBenefitMonth), "0.06 0.23 0.14"),
    textCommand("F1", 12, 55, 168, "Nomina", "0.14 0.20 0.24"),
    textCommand("F2", 13, 430, 168, pdfMoney(report.payroll), "0.14 0.20 0.24"),
    boxCommand(42, 73, 511, 63, "0.08 0.48 0.35"),
    textCommand("F2", 13, 58, 111, "TOTAL A COBRAR", "1 1 1"),
    textCommand("F2", 19, 405, 106, pdfMoney(report.totalToCollect), "1 1 1"),
    textCommand("F1", 8, 42, 20, "SOBRE RUEDAS · INFORME GENERADO PARA ADMINISTRACION", "0.42 0.50 0.53"),
  ].join("\n");
  return new Blob([buildPdfBytes(content)], { type: "application/pdf" });
};

export const buildCommissionReportFileName = ({ driverName = "Alex", year, monthIndex } = {}) => {
  const month = String(monthIndex + 1).padStart(2, "0");
  const safeName = ascii(driverName).replace(/\s+/g, "-").toLowerCase() || "conductor";
  return `comision-${safeName}-${year}-${month}.pdf`;
};
