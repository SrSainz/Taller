import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  IconAlertTriangle,
  IconBrandUber,
  IconBell,
  IconBrandWhatsapp,
  IconBriefcase,
  IconBuildingStore,
  IconCalendar,
  IconCamera,
  IconCar,
  IconChartBar,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCircleCheck,
  IconClock,
  IconCopy,
  IconCurrencyEuro,
  IconDatabase,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconFileInvoice,
  IconGasStation,
  IconGauge,
  IconHelpCircle,
  IconHistory,
  IconHome,
  IconKey,
  IconLink,
  IconMail,
  IconMenu2,
  IconMessageCircle,
  IconPlus,
  IconRefresh,
  IconLogout,
  IconRobot,
  IconSearch,
  IconShare3,
  IconSettings,
  IconShieldCheck,
  IconSparkles,
  IconTool,
  IconTools,
  IconTrash,
  IconUpload,
  IconUserCircle,
  IconUserPlus,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  documentCategoryLabels,
  documentFieldDefinitions,
  documentMaxRequestSize,
  fieldsToRecord,
  formatFileSize,
  getDriverBillingAmounts,
  hasDriverBillingAmount,
  normalizeDriverBillingAnalysisFields,
  normalizeDocumentAnalysis,
  prepareDocumentFile,
  readFileAsDataUrl,
  validateDocumentFile,
} from "./documentAnalysis";
import { confirmDocumentTransactions, createCommissionReportDownloadUrl, createMaintenanceReport, createMaintenanceReportPhotoUrl, deleteDocumentRecord, fetchAllSupabaseRows, getProfile, initialPasswordRecoveryIntent, invokeAdminUsers, isSupabaseConfigured, listCommissionReports, listDriverPeriodFinancials, listMaintenanceReports, roleFromUser, subscribeToAppChanges, supabase, updateMaintenanceReportStatus, uploadCommissionReport, uploadDocumentRecord, upsertDriverPeriodFinancial, validateMaintenancePhotoFile } from "./supabase";
import { enablePushNotifications, getPushNotificationState } from "./pushNotifications";
import { hashDocumentFile, mergeDriverEntries, operationsFromDocument, transactionsToDriverEntries } from "./transactions";
import { buildAlexCommissionReportPdf, buildCommissionReportFileName, calculateDriverCommission, getCommissionThresholdsForBilling, isAlex } from "./commissionReports";
import { funesmotorsportDocuments } from "./data/funesmotorsportSummary";
import { funesmotorsportAssetMap } from "./data/funesmotorsportAssetMap";
import { emailMaintenanceAmountOverrides, emailMaintenanceDocuments, emailMaintenanceTypeOverrides } from "./data/emailMaintenanceSummary";
import { maintenanceCochesDocuments } from "./data/maintenanceCochesSummary";
import { alexBillingByPeriod } from "./data/alexBillingSummary";
import { aminBillingByPeriod } from "./data/aminBillingSummary";
import { fernandoBillingByPeriod } from "./data/fernandoBillingSummary";
import { mauricioBillingByPeriod } from "./data/mauricioBillingSummary";
import { tirsoBillingByPeriod } from "./data/tirsoBillingSummary";
import { additionalHistoricalBillingSources } from "./data/additionalHistoricalBillingSummary";
import { getImportedTipsByPeriod } from "./data/driverTipsSummary";
import { getImportedPayrollForPeriod } from "./data/driverPayrollSummary";
import { gestoriaDocuments, gestoriaImportMeta, gestoriaOwnerByKey, gestoriaSender, getGestoriaDocumentsForPeriod, getGestoriaExpenseForPeriod } from "./data/gestoriaSummary";
import { canonicalizeVehiclePlate, getVehicleDriverNames, getVehicleOwner as getCanonicalVehicleOwner, vehicleDriverNamesByPlate, vehicleOrder, vehicleOwnerByPlate } from "./data/vehicleRegistry";
import { administratorEditableWeeklyRowKeys, driverEditableWeeklyRowKeys } from "./driverWeeklyEditing";
import { getDriverDateKey, resolveDriverUploadDate } from "./driverUploadDate";

const BILLING_COLOR = "#74b9f2";
const MAINTENANCE_COLOR = "#f39c12";
const SUMMARY_CHART_COLOR = "#1976c9";
const INTRACOMMUNITY_VAT_RATE = 0.08;
// Contrato de permisos del calendario semanal: el conductor solo edita lavados y varios.
// La vista de administración conserva la edición de sus cinco filas operativas.
const DRIVER_EDITABLE_WEEKLY_ROWS = new Set(driverEditableWeeklyRowKeys);
const ADMIN_EDITABLE_WEEKLY_ROWS = new Set(administratorEditableWeeklyRowKeys);
const WEEKLY_EDIT_MAX_PRESS_MS = 1000;
const calculateNetDriverCommission = (driverName, billing) => calculateDriverCommission({ driverName, billing }).totalToCollect;
const chartMetricOptions = [
  { value: "summary", label: "Resumen" },
  { value: "billing", label: "Facturación" },
  { value: "maintenance", label: "Mantenimiento" },
  { value: "fuel", label: "Combustible" },
  { value: "net", label: "Neto" },
];

const selectableChartMetrics = chartMetricOptions.filter((option) => option.value !== "summary");
const allChartMetricValues = selectableChartMetrics.map((option) => option.value);
const chartMetricColors = { billing: BILLING_COLOR, maintenance: MAINTENANCE_COLOR, fuel: "#df4538", net: "#28923c" };

const splitChartAxisLabel = (value) => {
  const words = String(value ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return words;
  if (words.length === 2) return words;
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
};

function ChartAxisTick({ x, y, payload, fontSize = 8, fontWeight = 700, fill = "#75817d" }) {
  const lines = splitChartAxisLabel(payload?.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x="0" y="0" dy="9" textAnchor="middle" fill={fill} fontSize={fontSize} fontWeight={fontWeight}>
        {lines.map((line, index) => <tspan x="0" dy={index === 0 ? 0 : fontSize + 2} key={`${line}-${index}`}>{line}</tspan>)}
      </text>
    </g>
  );
}

function ChartBarValueLabel({ x, y, width, height, value, textFill = "#fff" }) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue === 0 || !Number.isFinite(Number(x)) || !Number.isFinite(Number(y)) || !Number.isFinite(Number(width)) || !Number.isFinite(Number(height))) return null;
  const barWidth = Number(width);
  const barHeight = Number(height);
  const centerX = Number(x) + barWidth / 2;
  const centerY = Number(y) + barHeight / 2;
  const vertical = true;
  const fontSize = Math.max(5.8, Math.min(11.5, barWidth * 0.38, barHeight * 0.28));
  const label = formatShortCurrency(numericValue);
  const stroke = textFill === "#fff" ? "rgba(0,0,0,.2)" : "rgba(255,255,255,.72)";
  return (
    <text
      x={centerX}
      y={centerY}
      fill={textFill}
      fontSize={fontSize}
      fontWeight={850}
      textAnchor="middle"
      dominantBaseline="central"
      transform={vertical ? `rotate(-90 ${centerX} ${centerY})` : undefined}
      style={{ paintOrder: "stroke", stroke, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}
    >
      {label}
    </text>
  );
}

const navItems = [
  { label: "Informes", slug: "informes", icon: IconChartBar },
  { label: "Vehículos", slug: "flota", icon: IconCar },
  { label: "Lecturas", slug: "lecturas", icon: IconGauge, badge: 2 },
  { label: "Facturas", slug: "facturas", icon: IconFileInvoice },
  { label: "Automatizaciones", slug: "automatizaciones", icon: IconRobot },
];

const conductorNavItem = { label: "Conductores", slug: "conductores", icon: IconUsers };

const fleetSubItems = [
  { label: "Mantenimiento", slug: "mantenimiento", icon: IconTools },
  { label: "Gasolina", slug: "gasolina", icon: IconGasStation },
];

const utilityItems = [
  { label: "Ajustes", slug: "ajustes", icon: IconSettings },
  { label: "Ayuda", slug: "ayuda", icon: IconHelpCircle },
];

const adminNavItem = { label: "Administraci\u00f3n", slug: "administracion", icon: IconShieldCheck };
const topbarItems = [navItems[4], ...utilityItems];

const vehicleBrandLogos = {
  Toyota: "/brands/toyota.svg",
  Lexus: "/brands/lexus.svg",
  Peugeot: "/brands/peugeot.svg",
};

const driverAvatarPaths = {
  alex: "/driver-avatars/alex.jpg",
  amin: "/driver-avatars/amin.jpg",
  andres: "/driver-avatars/andres.jpeg",
  fernando: "/driver-avatars/fernando.jpg",
  mauricio: "/driver-avatars/mauricio.jpg",
  tirso: "/driver-avatars/tirso.jpeg",
};

const normalizeDriverAvatarKey = (value) => String(value ?? "")
  .trim()
  .toLocaleLowerCase("es")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .split(/\s+/)[0];
const getDriverAvatarPath = (value) => driverAvatarPaths[normalizeDriverAvatarKey(value)] ?? "";
const orderDriverProfilesForVehicle = (vehicle, profiles = []) => {
  const sortedProfiles = [...profiles].sort((left, right) => Number(right.active) - Number(left.active) || left.full_name.localeCompare(right.full_name));
  const orderedProfiles = (vehicle?.drivers ?? [])
    .map((seedDriver) => sortedProfiles.find((driver) => normalizeDriverAvatarKey(driver.full_name) === normalizeDriverAvatarKey(seedDriver)))
    .filter(Boolean);
  const matchedProfiles = new Set(orderedProfiles);
  return [...orderedProfiles, ...sortedProfiles.filter((driver) => !matchedProfiles.has(driver))];
};
const orderAdminDriverCardsForVehicle = (vehicle, profiles = []) => {
  const orderedProfiles = [...profiles];
  if (canonicalizeVehiclePlate(vehicle?.plate) !== "5043 MLC") return orderedProfiles;
  const visualRank = { tirso: 0, alex: 1 };
  return orderedProfiles.sort((left, right) => (visualRank[normalizeDriverAvatarKey(left.full_name)] ?? 2) - (visualRank[normalizeDriverAvatarKey(right.full_name)] ?? 2));
};

const netVehicleImages = {
  "5043 MLC": { src: "/net-vehicles/toyota-corolla-green.png", tone: "green", view: "frontal de tres cuartos" },
  "5750 MJV": { src: "/net-vehicles/toyota-corolla-blue.png", tone: "blue", view: "lateral" },
  "5754 MJV": { src: "/net-vehicles/toyota-corolla-red.png", tone: "red", view: "trasera de tres cuartos" },
};

const vehicleOwnerSeed = vehicleOwnerByPlate;

const vehiclesSeed = [
  {
    plate: "5754 MJV",
    owner: vehicleOwnerSeed["5754 MJV"],
    model: "Toyota Corolla",
    use: "Profesional",
    drivers: getVehicleDriverNames("5754 MJV"),
    odometer: 128460,
    nextServiceKm: 134000,
    serviceDate: "12 ago 2026",
    fuelSchedule: [
      { label: "04:00–16:00", driver: vehicleDriverNamesByPlate["5754 MJV"][0], start: 4, end: 16 },
      { label: "16:00–04:00", driver: vehicleDriverNamesByPlate["5754 MJV"][1], start: 16, end: 4 },
    ],
    monthlyFuel: [
      { date: "28 jul 2026", time: "16:12", liters: 18.4, cost: 31.28 },
      { date: "28 jul 2026", time: "05:55", liters: 20.1, cost: 34.17 },
      { date: "25 jul 2026", time: "16:20", liters: 18.9, cost: 32.13 },
      { date: "25 jul 2026", time: "05:48", liters: 19.8, cost: 33.66 },
      { date: "21 jul 2026", time: "16:06", liters: 18.2, cost: 30.94 },
      { date: "21 jul 2026", time: "05:51", liters: 20.4, cost: 34.68 },
      { date: "17 jul 2026", time: "16:18", liters: 17.8, cost: 30.26 },
      { date: "17 jul 2026", time: "05:44", liters: 20.2, cost: 34.34 },
      { date: "12 jul 2026", time: "16:09", liters: 18.7, cost: 31.79 },
      { date: "12 jul 2026", time: "05:57", liters: 19.6, cost: 33.32 },
    ],
    shifts: [
      { id: "kxd-t2", label: "Turno 16:00–04:00", driver: "Fernando", time: "16:00–04:00", start: 128310, end: 128460, km: 150, liters: 18.4, cost: 31.28, revenue: 418.2, cash: 76, monthRevenue: 7954.3, monthTrips: 136, sentAt: "04:08", confidence: 98 },
      { id: "kxd-t1", label: "Turno 04:00–16:00", driver: "Andrés", time: "04:00–16:00", start: 128142, end: 128310, km: 168, liters: 20.1, cost: 34.17, revenue: 462.8, cash: 128.5, monthRevenue: 8240.5, monthTrips: 142, sentAt: "16:05", confidence: 99 },
    ],
    maintenance: [
      { date: "18 jul 2026", km: 127820, concept: "Aceite y filtros", amount: 286.4 },
      { date: "3 abr 2026", km: 121220, concept: "Pastillas de freno", amount: 342.8 },
      { date: "9 ene 2026", km: 116050, concept: "Aceite y filtros", amount: 274.2 },
    ],
  },
  {
    plate: "5750 MJV",
    owner: vehicleOwnerSeed["5750 MJV"],
    model: "Toyota Corolla",
    use: "Profesional",
    drivers: getVehicleDriverNames("5750 MJV"),
    odometer: 142980,
    nextServiceKm: 150000,
    serviceDate: "18 ago 2026",
    fuelSchedule: [
      { label: "06:00–18:00", driver: vehicleDriverNamesByPlate["5750 MJV"][0], start: 6, end: 18 },
      { label: "18:00–06:00", driver: vehicleDriverNamesByPlate["5750 MJV"][1], start: 18, end: 6 },
    ],
    monthlyFuel: [
      { date: "28 jul 2026", time: "18:14", liters: 16.8, cost: 28.56 },
      { date: "28 jul 2026", time: "06:08", liters: 17.4, cost: 29.58 },
      { date: "24 jul 2026", time: "18:19", liters: 17.1, cost: 29.07 },
      { date: "24 jul 2026", time: "06:11", liters: 18.2, cost: 30.94 },
      { date: "20 jul 2026", time: "18:07", liters: 16.5, cost: 28.05 },
      { date: "20 jul 2026", time: "06:02", liters: 17.9, cost: 30.43 },
      { date: "16 jul 2026", time: "18:21", liters: 16.9, cost: 28.73 },
      { date: "16 jul 2026", time: "06:16", liters: 18.1, cost: 30.77 },
      { date: "11 jul 2026", time: "18:05", liters: 17.3, cost: 29.41 },
      { date: "11 jul 2026", time: "06:13", liters: 17.8, cost: 30.26 },
    ],
    shifts: [
      { id: "lpt-t2", label: "Turno 18:00–06:00", driver: vehicleDriverNamesByPlate["5750 MJV"][1], time: "18:00–06:00", start: 142842, end: 142980, km: 138, liters: 16.8, cost: 28.56, revenue: 435.2, cash: 110, monthRevenue: 8126.4, monthTrips: 139, sentAt: "06:05", confidence: 97 },
      { id: "lpt-t1", label: "Turno 06:00–18:00", driver: vehicleDriverNamesByPlate["5750 MJV"][0], time: "06:00–18:00", start: 142704, end: 142842, km: 138, liters: 17.4, cost: 29.58, revenue: 390.5, cash: 90, monthRevenue: 7318.8, monthTrips: 128, sentAt: "18:04", confidence: 99 },
    ],
    maintenance: [
      { date: "5 jul 2026", km: 140410, concept: "Neumáticos delanteros", amount: 498 },
      { date: "21 mar 2026", km: 132900, concept: "Aceite y filtros", amount: 318.6 },
      { date: "8 dic 2025", km: 124480, concept: "Neumáticos delanteros", amount: 472 },
    ],
  },
  {
    plate: "5043 MLC",
    owner: vehicleOwnerSeed["5043 MLC"],
    model: "Toyota Corolla",
    use: "Profesional",
    drivers: getVehicleDriverNames("5043 MLC"),
    odometer: 210735,
    nextServiceKm: 215000,
    serviceDate: "2 ago 2026",
    fuelSchedule: [
      { label: "07:00–19:00", driver: vehicleDriverNamesByPlate["5043 MLC"][0], start: 7, end: 19 },
      { label: "19:00–07:00", driver: vehicleDriverNamesByPlate["5043 MLC"][1], start: 19, end: 7 },
    ],
    monthlyFuel: [
      { date: "28 jul 2026", time: "19:12", liters: 19.2, cost: 32.64 },
      { date: "28 jul 2026", time: "07:18", liters: 12.4, cost: 21.08 },
      { date: "24 jul 2026", time: "19:09", liters: 18.8, cost: 31.96 },
      { date: "24 jul 2026", time: "07:11", liters: 13.1, cost: 22.27 },
      { date: "20 jul 2026", time: "19:17", liters: 19.5, cost: 33.15 },
      { date: "20 jul 2026", time: "07:06", liters: 12.8, cost: 21.76 },
      { date: "15 jul 2026", time: "19:04", liters: 18.9, cost: 32.13 },
      { date: "15 jul 2026", time: "07:21", liters: 13.4, cost: 22.78 },
      { date: "10 jul 2026", time: "19:15", liters: 19.1, cost: 32.47 },
      { date: "10 jul 2026", time: "07:09", liters: 12.7, cost: 21.59 },
    ],
    shifts: [
      { id: "jbv-t2", label: "Turno 19:00–07:00", driver: vehicleDriverNamesByPlate["5043 MLC"][1], time: "19:00–07:00", start: 210614, end: 210735, km: 121, liters: 19.2, cost: 32.64, revenue: 402.75, cash: 122, monthRevenue: 7542.9, monthTrips: 130, sentAt: "07:03", confidence: 96, alert: true },
      { id: "jbv-t1", label: "Turno 07:00–19:00", driver: vehicleDriverNamesByPlate["5043 MLC"][0], time: "07:00–19:00", start: 210494, end: 210614, km: 120, liters: 12.4, cost: 21.08, revenue: 376.4, cash: 84.5, monthRevenue: 6984.25, monthTrips: 121, sentAt: "19:02", confidence: 98 },
    ],
    maintenance: [
      { date: "24 jul 2026", km: 210120, concept: "Aceite y filtros", amount: 312.5 },
      { date: "10 abr 2026", km: 202440, concept: "Pastillas de freno", amount: 438 },
      { date: "14 ene 2026", km: 194860, concept: "Aceite y filtros", amount: 298.9 },
      { date: "3 oct 2025", km: 187020, concept: "Correa de distribución", amount: 986.4 },
    ],
  },
  {
    plate: "0344 LCP",
    model: "Lexus IS 300h",
    use: "Particular",
    drivers: ["Ana García", "David García"],
    odometer: 98215,
    nextServiceKm: 105000,
    serviceDate: "22 ago 2026",
    daily: [
      { driver: "Ana García", km: 21, liters: 0, cost: 0, revenue: 0, cash: 0, monthRevenue: 0, monthTrips: 0, time: "08:12–13:20" },
      { driver: "David García", km: 13, liters: 25.1, cost: 42.67, revenue: 0, cash: 0, monthRevenue: 0, monthTrips: 0, time: "17:40–19:05" },
    ],
    monthlyFuel: [
      { date: "26 jul 2026", time: "17:42", liters: 25.1, cost: 42.67, driver: "David García" },
      { date: "11 jul 2026", time: "08:20", liters: 23.4, cost: 39.78, driver: "Ana García" },
    ],
    shifts: [],
    maintenance: [
      { date: "12 jun 2026", km: 95310, concept: "Aceite y filtros", amount: 224.8 },
      { date: "16 ene 2026", km: 88240, concept: "Neumáticos traseros", amount: 386 },
      { date: "2 sep 2025", km: 81120, concept: "Aceite y filtros", amount: 216.5 },
    ],
  },
  {
    plate: "9401 LTG",
    model: "Peugeot 2008",
    use: "Particular",
    drivers: ["Sergio Ruiz", "María Ruiz"],
    odometer: 75840,
    nextServiceKm: 80000,
    serviceDate: "6 ago 2026",
    daily: [
      { driver: "Sergio Ruiz", km: 11, liters: 0, cost: 0, revenue: 0, cash: 0, monthRevenue: 0, monthTrips: 0, time: "09:05–12:16" },
      { driver: "María Ruiz", km: 7, liters: 18.3, cost: 30.92, revenue: 0, cash: 0, monthRevenue: 0, monthTrips: 0, time: "18:10–19:02" },
    ],
    monthlyFuel: [
      { date: "23 jul 2026", time: "18:15", liters: 18.3, cost: 30.92, driver: "María Ruiz" },
      { date: "7 jul 2026", time: "09:12", liters: 17.6, cost: 29.74, driver: "Sergio Ruiz" },
    ],
    shifts: [],
    maintenance: [
      { date: "28 may 2026", km: 72110, concept: "Aceite y filtros", amount: 198.6 },
      { date: "4 feb 2026", km: 66390, concept: "Batería", amount: 164.9 },
      { date: "20 oct 2025", km: 59800, concept: "Aceite y filtros", amount: 192.3 },
    ],
  },
];

const invoiceSeed = [
  {
    id: "FAC-2026-1874",
    date: "24 jul 2026",
    provider: "Taller AutoRápido S.L.",
    plate: "5043 MLC",
    concept: "Aceite y filtros",
    amount: 312.5,
    source: "Correo",
    status: "Asociada",
    items: [
      { concept: "Aceite motor 5W30", amount: 96.5 },
      { concept: "Filtro de aceite", amount: 24 },
      { concept: "Filtro de aire", amount: 38 },
      { concept: "Mano de obra", amount: 154 },
    ],
  },
  { id: "FAC-2026-1842", date: "18 jul 2026", provider: "Mecánica Norte", plate: "5754 MJV", concept: "Aceite y filtros", amount: 286.4, source: "Correo", status: "Asociada" },
  { id: "FAC-2026-1798", date: "5 jul 2026", provider: "Neumáticos Central", plate: "5750 MJV", concept: "Neumáticos delanteros", amount: 498, source: "Correo", status: "Revisar" },
  { id: "FAC-2026-1761", date: "12 jun 2026", provider: "Lexus Service", plate: "0344 LCP", concept: "Aceite y filtros", amount: 224.8, source: "Manual", status: "Asociada" },
  { id: "FAC-2026-1684", date: "28 may 2026", provider: "Peugeot Madrid", plate: "9401 LTG", concept: "Aceite y filtros", amount: 198.6, source: "Correo", status: "Pendiente" },
];

const maintenanceConceptRows = [
  { label: "Aceite y filtro", matches: ["aceite y filtro", "aceite motor", "filtro de aceite"] },
  { label: "Filtro habitáculo", matches: ["filtro habitaculo", "filtro de polen"] },
  { label: "Filtro de aire", matches: ["filtro de aire"] },
  { label: "Neumáticos", matches: ["neumatico", "rueda"] },
  { label: "Pastillas de freno", matches: ["pastilla de freno", "pastillas de freno"] },
  { label: "Discos de freno", matches: ["disco de freno", "discos de freno"] },
  { label: "Transmisión", matches: ["transmision"] },
  { label: "Bomba de agua", matches: ["bomba de agua"] },
  { label: "Bujías", matches: ["bujia"] },
  { label: "Aceite de caja de cambios", matches: ["aceite de caja", "aceite caja"] },
  { label: "Limpiaparabrisas", matches: ["limpiaparabrisas", "escobilla"] },
  { label: "Fundas de asientos", matches: ["funda de asiento", "fundas de asientos"] },
  { label: "Varios", matches: ["varios", "otros"] },
];

const photoInvoiceStorageKey = "talleria:photo-invoices:clean-v3";
const processedDocumentStorageKey = "talleria:processed-documents:v1";
const maintenanceEditsStorageKey = "sobre-ruedas:maintenance-edits:v1";
const invoiceNoticeCountStoragePrefix = "sobre-ruedas:invoice-notice-count:v1:";
const notificationReadKeysStoragePrefix = "sobre-ruedas:notification-read-keys:v1:";
const migratedPlates = { "3456 HTR": "0344 LCP", "7890 GYL": "9401 LTG" };

const loadStoredNumber = (key, fallback = 0) => {
  try {
    const value = Number(window.localStorage.getItem(key));
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  } catch {
    return fallback;
  }
};

const loadStoredStringSet = (key) => {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return new Set(Array.isArray(value) ? value.filter((item) => typeof item === "string" && item) : []);
  } catch {
    return new Set();
  }
};

const loadPhotoInvoices = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(photoInvoiceStorageKey) ?? "[]");
    return Array.isArray(stored)
      ? stored.filter((invoice) => invoice?.id && invoice?.plate && Array.isArray(invoice?.items)).map((invoice) => ({ ...invoice, plate: canonicalizeVehiclePlate(migratedPlates[invoice.plate] ?? invoice.plate) }))
      : [];
  } catch {
    return [];
  }
};

const loadMaintenanceEdits = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(maintenanceEditsStorageKey) ?? "{}");
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
};

const normalizeText = (value = "") => String(value).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es");

const getMaintenanceEditKey = (record) => {
  if (!record) return "";
  return String(record.sourceDocumentId || record.id || [
    normalizeText(record.plate),
    record.dateIso || record.date,
    normalizeText(record.concept),
    record.km,
  ].join("|"));
};

const isMaintenanceDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? "")) && !Number.isNaN(Date.parse(`${value}T12:00:00`));

const applyMaintenanceEdit = (record, edits = {}) => {
  const editKey = getMaintenanceEditKey(record);
  const override = edits?.[editKey];
  if (!override) return { ...record, maintenanceEditKey: editKey };
  const dateIso = isMaintenanceDate(override.dateIso) ? override.dateIso : record.dateIso;
  const km = override.km !== "" && override.km !== null && Number.isFinite(Number(override.km))
    ? Number(override.km)
    : record.km;
  const date = dateIso
    ? new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${dateIso}T12:00:00`)).replace(".", "")
    : record.date;
  return { ...record, dateIso, date, km, maintenanceEditKey: editKey, maintenanceEditedAt: override.updatedAt };
};

const getImportedMaintenanceAmount = (record) => {
  const override = emailMaintenanceAmountOverrides[record?.id];
  if (Number.isFinite(Number(override))) return Number(override);
  return Number(record?.amount) || 0;
};

const buildImportedMaintenanceInvoices = () => {
  // El PDF de mantenimiento es la fuente prioritaria cuando comparte matrícula
  // y fecha con un resumen o una captura ya importada. Así no se duplica el día.
  const records = [...maintenanceCochesDocuments, ...emailMaintenanceDocuments, ...funesmotorsportDocuments];
  const signatures = new Set();
  const dateSignatures = new Set();
  return records.map((record) => {
    const plate = canonicalizeVehiclePlate(record.plate);
    const amount = getImportedMaintenanceAmount(record);
    const typeOverride = emailMaintenanceTypeOverrides[record?.id] ?? {};
    const signature = [
      normalizeText(plate),
      record.dateIso || record.date,
      amount.toFixed(2),
      normalizeText(record.concept),
    ].join("|");
    const dateSignature = [normalizeText(plate), record.dateIso || record.date].join("|");
    return {
      ...record,
      plate,
      amount,
      type: typeOverride.type || record.type,
      typeLabel: typeOverride.typeLabel || record.typeLabel,
      signature,
      dateSignature,
      provider: record.provider || (record.source?.includes("Funes") ? "FUNESMOTORSPORT" : "Taller no identificado"),
      id: record.documentNumber || record.id,
      sourceDocumentId: `authorized-gmail:${record.id}`,
      imageSrc: record.imageSrc || funesmotorsportAssetMap[record.id] || "",
      filePath: record.imageSrc || funesmotorsportAssetMap[record.id] || "",
      status: record.needsReview ? "Revisar" : "Asociada",
    };
  }).filter((record) => {
    const keepDocumentedZero = record.sourceFile === "MANTENIMIENTO COCHES (3)_260821_140325.pdf";
    if (!vehicleOrder.includes(record.plate) || signatures.has(record.signature) || dateSignatures.has(record.dateSignature)) return false;
    signatures.add(record.signature);
    dateSignatures.add(record.dateSignature);
    return record.amount > 0 || keepDocumentedZero;
  });
};

const importedMaintenanceInvoices = buildImportedMaintenanceInvoices();

const expenseCategories = [
  { canonicalKey: "leasing", label: "Leasing coche", cadence: "Mensual" },
  { canonicalKey: "license-loan", label: "Préstamo licencia", cadence: "Mensual" },
  { canonicalKey: "fuel", label: "Gasolina", cadence: "Variable" },
  { canonicalKey: "workshop", label: "Taller", cadence: "Variable" },
  { canonicalKey: "social-security", label: "Seguridad Social", cadence: "Mensual" },
  { canonicalKey: "payroll", label: "Nóminas", cadence: "Manual" },
  { canonicalKey: "driver-commission", label: "Comisiones de conductores", cadence: "Variable" },
  { canonicalKey: "taxes", label: "Impuestos trimestrales", cadence: "Trimestral" },
  { canonicalKey: "eu-vat", label: "IVA intracomunitario", cadence: "8% desde enero de 2025" },
  { canonicalKey: "accounting", label: "Gestoría", cadence: "Mensual" },
  { canonicalKey: "insurance", label: "Seguro", cadence: "Anual" },
  { canonicalKey: "inspection", label: "ITV", cadence: "Noviembre · recurrente anual" },
  { label: "Limpieza coche", cadence: "Variable" },
  { label: "Varios", cadence: "Variable" },
];

const normalizeNetExpenseCategory = (value = "") => String(value)
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .toLocaleLowerCase("es")
  .replace(/\s+/g, " ")
  .trim();
const netExpenseCategoryAliases = {
  "leasing coche": "leasing",
  "prestamo licencia": "license-loan",
  gasolina: "fuel",
  combustible: "fuel",
  repostaje: "fuel",
  taller: "workshop",
  "seguridad social": "social-security",
  "seguros sociales": "social-security",
  nominas: "payroll",
  "comisiones de conductores": "driver-commission",
  "comisiones de conductor": "driver-commission",
  gestoria: "accounting",
  impuestos: "taxes",
  "impuestos trimestrales": "taxes",
  "iva intracomunitario": "eu-vat",
  seguro: "insurance",
  itv: "inspection",
  "impuesto circulacion": "road-tax",
  "seguros anexos al coche": "annex-insurance",
};
const getNetExpenseCategoryKey = (value) => netExpenseCategoryAliases[normalizeNetExpenseCategory(value)] ?? "";
const INTRACOMMUNITY_VAT_START_PERIOD = "2025-01";
const getIntracommunityVatRateForPeriod = (year, month) => {
  const periodKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  return periodKey >= INTRACOMMUNITY_VAT_START_PERIOD ? INTRACOMMUNITY_VAT_RATE : 0;
};

const leasingContractsByPlate = Object.freeze({
  "5043 MLC": { amount: 571.65, endPeriod: "2027-10", endDateLabel: "22/10/2027" },
  "5750 MJV": { amount: 560.47, endPeriod: "2027-07", endDateLabel: "30/07/2027" },
  "5754 MJV": { amount: 560.47, endPeriod: "2027-07", endDateLabel: "30/07/2027" },
});
const getLeasingContract = (plate) => leasingContractsByPlate[canonicalizeVehiclePlate(plate)] ?? null;
const getLeasingAmountForPeriod = (plate, year, month) => {
  const contract = getLeasingContract(plate);
  const periodKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  return contract && periodKey <= contract.endPeriod ? contract.amount : 0;
};
const getLeasingCadence = (plate, year, month) => {
  const contract = getLeasingContract(plate);
  const amount = getLeasingAmountForPeriod(plate, year, month);
  if (!contract) return "Sin cuota configurada";
  return amount > 0 ? `${formatCurrency(amount)} hasta ${contract.endDateLabel}` : `Finalizado ${contract.endDateLabel}`;
};
const licenseLoanAmountsByPlate = Object.freeze({
  "5043 MLC": 696.55,
  "5750 MJV": 516.78,
  "5754 MJV": 516.78,
});
const getLicenseLoanAmountForPeriod = (plate) => Number(licenseLoanAmountsByPlate[canonicalizeVehiclePlate(plate)] ?? 0);
const getLicenseLoanCadence = (plate) => getLicenseLoanAmountForPeriod(plate) > 0 ? "Mensual · cuota fija" : "Sin cuota configurada";
const netFuelAverageAmountsByPlate = Object.freeze({
  "5043 MLC": 1000,
  "5750 MJV": 1000,
  "5754 MJV": 1000,
});
const getNetFuelAmountForPeriod = (plate, year, month) => {
  const amount = netFuelAverageAmountsByPlate[canonicalizeVehiclePlate(plate)];
  const periodKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  return amount != null && periodKey >= "2024-01" && periodKey <= "2026-08" ? amount : null;
};
const getNetFuelCadence = (plate, year, month) => getNetFuelAmountForPeriod(plate, year, month) == null ? "Por conductor" : "Media mensual fija · 1.000,00 €";
const annualRecurringExpenses = Object.freeze({
  inspection: { month: 10, amount: 29.90, cadence: "Noviembre · recurrente anual" },
});
const getAnnualRecurringExpenseAmount = (key, plate, month) => {
  const expense = annualRecurringExpenses[key];
  return expense && month === expense.month && vehicleOrder.includes(canonicalizeVehiclePlate(plate)) ? expense.amount : 0;
};
const getAnnualRecurringExpenseCadence = (key) => annualRecurringExpenses[key]?.cadence ?? "Anual";

const vehicleExpenseAmounts = {};
const netAdditionalExpenseAmounts = {};
const netPayrollAmounts = {};
const netSocialSecurityAmounts = Object.freeze({
  "5043 MLC": Object.freeze([299.57, 644.20, 644.20]),
  "5750 MJV": Object.freeze([299.57, 644.20, 644.20]),
  "5754 MJV": Object.freeze([299.57, 644.20, 644.20]),
});
const getNetSocialSecurityAmount = (plate, index) => Number(netSocialSecurityAmounts[canonicalizeVehiclePlate(plate)]?.[index] ?? 0);

const manualNetExpensesStorageKey = "talleria:manual-net-expenses:clean-v3";
const getNetExpensePeriodRange = (periodKey) => {
  const [rawYear, rawMonth] = String(periodKey ?? "").split("-").map(Number);
  const year = Number.isInteger(rawYear) && rawYear >= 2000 ? rawYear : new Date().getFullYear();
  const month = Number.isInteger(rawMonth) && rawMonth >= 0 && rawMonth <= 11 ? rawMonth : new Date().getMonth();
  const min = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return { min, max: `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}` };
};
const isNetExpenseDateInPeriod = (value, periodKey) => {
  const range = getNetExpensePeriodRange(periodKey);
  return isMaintenanceDate(value) && String(value) >= range.min && String(value) <= range.max;
};
const getNetExpenseDateForPeriod = (value, periodKey) => isNetExpenseDateInPeriod(value, periodKey) ? String(value) : getNetExpensePeriodRange(periodKey).min;
const formatNetExpenseDate = (value) => isMaintenanceDate(value)
  ? new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T12:00:00`))
  : "";
const loadManualNetExpenses = () => {
  try {
    if (typeof window === "undefined") return [];
    const stored = JSON.parse(window.localStorage.getItem(manualNetExpensesStorageKey) ?? "[]");
    return Array.isArray(stored)
      ? stored.filter((expense) => expense?.id && expense?.periodKey && expense?.plate && expense?.label && Number(expense.amount) > 0).map((expense) => ({ ...expense, plate: canonicalizeVehiclePlate(expense.plate), amount: Number(expense.amount), date: isMaintenanceDate(expense.date) ? expense.date : "" }))
      : [];
  } catch {
    return [];
  }
};
const saveManualNetExpenses = (expenses) => {
  try {
    window.localStorage.setItem(manualNetExpensesStorageKey, JSON.stringify(expenses));
  } catch {
    // El detalle sigue funcionando aunque el dispositivo no permita persistencia local.
  }
};

const manualNetBreakdownsStorageKey = "talleria:manual-net-breakdowns:clean-v1";
const loadManualNetBreakdowns = () => {
  try {
    if (typeof window === "undefined") return [];
    const stored = JSON.parse(window.localStorage.getItem(manualNetBreakdownsStorageKey) ?? "[]");
    return Array.isArray(stored)
      ? stored.filter((breakdown) => breakdown?.id && breakdown?.periodKey && breakdown?.plate && breakdown?.expenseKey && breakdown?.breakdownKey && breakdown?.driverLabel && breakdown?.concept && Number.isFinite(Number(breakdown.amount)) && Number(breakdown.amount) >= 0).map((breakdown) => ({ ...breakdown, plate: canonicalizeVehiclePlate(breakdown.plate), amount: Number(breakdown.amount), date: isMaintenanceDate(breakdown.date) ? breakdown.date : "" }))
      : [];
  } catch {
    return [];
  }
};
const saveManualNetBreakdowns = (breakdowns) => {
  try {
    window.localStorage.setItem(manualNetBreakdownsStorageKey, JSON.stringify(breakdowns));
  } catch {
    // El detalle sigue funcionando aunque el dispositivo no permita persistencia local.
  }
};
const getNetBreakdownKey = (breakdown, index = 0) => breakdown.breakdownKey || breakdown.driverId || normalizeNetExpenseCategory(breakdown.label) || `fila-${index}`;
const applyNetBreakdownOverrides = (expenseKey, breakdowns, manualBreakdowns = []) => breakdowns.map((breakdown, index) => {
  const breakdownKey = getNetBreakdownKey(breakdown, index);
  const override = manualBreakdowns.find((candidate) => candidate.expenseKey === expenseKey && candidate.breakdownKey === breakdownKey);
  return override ? { ...breakdown, amount: Number(override.amount), concept: override.concept, date: override.date || breakdown.date || "", manualBreakdownId: override.id } : breakdown;
});

const buildNetExpenseBreakdown = ({ vehicle, fuel, maintenance, commission, periodFactor, driverRows = [], driverNames = [], additionalHistoricalBilling = 0, fuelEntries = [], periodFinancials = [], manualBreakdowns = [], reportMonth = 6, reportYear = 2026 }) => {
  const amounts = vehicleExpenseAmounts[vehicle.plate] ?? [];
  const additional = netAdditionalExpenseAmounts[vehicle.plate] ?? {};
  const scale = (amount) => Number(((amount ?? 0) * periodFactor).toFixed(2));
  const leasingAmount = getLeasingAmountForPeriod(vehicle.plate, reportYear, reportMonth);
  const licenseLoanAmount = getLicenseLoanAmountForPeriod(vehicle.plate);
  const configuredFuelAmount = getNetFuelAmountForPeriod(vehicle.plate, reportYear, reportMonth);
  const inspectionAmount = getAnnualRecurringExpenseAmount("inspection", vehicle.plate, reportMonth);
  const gestoriaPeriodDocuments = getGestoriaDocumentsForPeriod(vehicle.plate, reportYear, reportMonth);
  const gestoriaPeriodAmount = getGestoriaExpenseForPeriod(vehicle.plate, reportYear, reportMonth);
  const vehicleDrivers = (driverNames.length ? driverNames : vehicle.drivers).slice(0, 2);
  const fallbackDriverRows = vehicleDrivers.map((driver) => ({ driver, revenue: 0 }));
  const resolvedDriverRows = driverRows.length ? driverRows : fallbackDriverRows;
  const driverBillingTotal = Number((resolvedDriverRows.reduce((sum, row) => sum + (Number(row.revenue) || 0), 0) + (Number(additionalHistoricalBilling) || 0)).toFixed(2));
  const intracommunityVatRate = getIntracommunityVatRateForPeriod(reportYear, reportMonth);
  const intracommunityVat = Number((driverBillingTotal * intracommunityVatRate).toFixed(2));
  const periodStart = `${reportYear}-${String(reportMonth + 1).padStart(2, "0")}-01`;
  const periodEnd = `${reportYear}-${String(reportMonth + 1).padStart(2, "0")}-${String(new Date(reportYear, reportMonth + 1, 0).getDate()).padStart(2, "0")}`;
  const periodPayrollFor = (row, driverIndex) => {
    const stored = periodFinancials.find((item) => item.driver_id && row.driverId && item.driver_id === row.driverId && item.period_start === periodStart);
    const importedPayroll = getImportedPayrollForPeriod(row.driver, reportYear, reportMonth);
    return Number(stored?.payroll ?? (importedPayroll > 0 ? importedPayroll : undefined) ?? netPayrollAmounts[vehicle.plate]?.[driverIndex] ?? 0) || 0;
  };
  const fuelBreakdown = vehicleDrivers.map((driver, driverIndex) => {
    const profile = vehicle.driverProfiles?.[driverIndex];
    const refuellings = fuelEntries.length
      ? fuelEntries.filter((entry) => (entry.driverId && profile?.id ? entry.driverId === profile.id : !entry.driverId && driverIndex === vehicleDrivers.length - 1))
      : getDriverFuelEntriesForPeriod(vehicle, driver, reportMonth, reportYear);
    const liters = refuellings.reduce((sum, entry) => sum + entry.liters, 0);
    const cost = refuellings.reduce((sum, entry) => sum + entry.cost, 0);
    return { breakdownKey: profile?.id || normalizeNetExpenseCategory(driver), driverId: profile?.id ?? "", label: driver, amount: Number(cost.toFixed(2)), meta: `${Number(liters.toFixed(1)).toLocaleString("es-ES")} L · ${refuellings.length} repostajes` };
  });
  const payrollBreakdown = resolvedDriverRows.map((row, index) => ({ breakdownKey: row.driverId || normalizeNetExpenseCategory(row.driver), driverId: row.driverId ?? "", label: row.driver, amount: Number(periodPayrollFor(row, index).toFixed(2)), meta: "Nómina mensual" }));
  const commissionSummary = resolvedDriverRows.map((row, index) => {
    const monthEntries = (row.entries ?? []).filter((entry) => String(entry.entry_date ?? "").startsWith(periodStart.slice(0, 7)));
    const tips = monthEntries.reduce((sum, entry) => sum + (Number(entry.tips) || 0), 0);
    const tolls = monthEntries.reduce((sum, entry) => sum + (Number(entry.tolls) || 0), 0);
    const payroll = payrollBreakdown[index]?.amount ?? 0;
    const commissionCalculation = calculateDriverCommission({ driverName: row.driver, billing: row.revenue, tips, tolls, payroll });
    const calculation = isAlex(row.driver) ? commissionCalculation : null;
    return { driver: row.driver, driverId: row.driverId ?? "", amount: commissionCalculation.totalToCollect, commissionCalculation, calculation, periodStart, periodEnd, vehiclePlate: vehicle.plate };
  });
  const commissionBreakdown = commissionSummary.map((row) => ({ breakdownKey: row.driverId || normalizeNetExpenseCategory(row.driver), driverId: row.driverId ?? "", label: row.driver, amount: row.amount, meta: `Total a cobrar · ${Math.round(row.commissionCalculation.commissionRate * 100)}% + bonos desde 5.000 €` }));
  const alexCommissionReport = commissionSummary.find((row) => row.calculation)?.calculation
    ? commissionSummary.find((row) => row.calculation)
    : null;
  const commissionRates = [...new Set(commissionSummary.map((row) => `${Math.round(row.commissionCalculation.commissionRate * 100)}%`))];
  const commissionCadence = commissionRates.length ? `${commissionRates.join(" y ")} + bonos · total a cobrar` : "Según facturación mensual";
  const socialBreakdown = [
    { breakdownKey: "autonomo", label: "Autónomo", amount: getNetSocialSecurityAmount(vehicle.plate, 0), meta: "Cuota mensual fija" },
    ...vehicleDrivers.map((driver, index) => ({ breakdownKey: vehicle.driverProfiles?.[index]?.id || normalizeNetExpenseCategory(driver), driverId: vehicle.driverProfiles?.[index]?.id ?? "", label: driver, amount: getNetSocialSecurityAmount(vehicle.plate, index + 1), meta: "Cuota mensual fija" })),
  ];
  const breakdownTotal = (rows) => rows.reduce((sum, row) => sum + row.amount, 0);
  const fuelTotal = breakdownTotal(fuelBreakdown);
  const targetFuelAmount = configuredFuelAmount ?? fuel;
  if (fuelBreakdown.length && Math.abs(fuelTotal - targetFuelAmount) > 0.01) {
    const adjustment = Number((targetFuelAmount - fuelTotal).toFixed(2));
    fuelBreakdown[fuelBreakdown.length - 1].amount = Number((fuelBreakdown[fuelBreakdown.length - 1].amount + adjustment).toFixed(2));
  }
  const resolvedFuelBreakdown = applyNetBreakdownOverrides("fuel", fuelBreakdown, manualBreakdowns);
  const resolvedPayrollBreakdown = applyNetBreakdownOverrides("payroll", payrollBreakdown, manualBreakdowns);
  const resolvedCommissionBreakdown = applyNetBreakdownOverrides("driver-commission", commissionBreakdown, manualBreakdowns);
  const resolvedSocialBreakdown = applyNetBreakdownOverrides("social-security", socialBreakdown, manualBreakdowns);
  const accountingBreakdown = gestoriaPeriodDocuments.length
    ? gestoriaPeriodDocuments.map((document) => ({
      breakdownKey: document.id,
      label: document.recurring ? "Cuota mensual de gestoría" : "Gasto extraordinario",
      concept: document.recurring ? "Cuota mensual de gestoría" : document.concept || "Gasto de gestoría",
      amount: Number(document.amount) || 0,
      meta: `${document.documentNumber} · ${formatDocumentDisplayDate(document.dateIso)}`,
      date: document.dateIso,
    }))
    : (Number(additional.gestoria) > 0 ? [{ breakdownKey: "gestoria-manual", label: "Gestoría", concept: "Gestoría", amount: scale(additional.gestoria), meta: "Importe registrado", date: "" }] : []);
  const resolvedAccountingBreakdown = applyNetBreakdownOverrides("accounting", accountingBreakdown, manualBreakdowns);
  return [
    { key: "workshop", label: "Taller", amount: maintenance, cadence: "Variable" },
    { key: "accounting", label: "Gestoría", amount: resolvedAccountingBreakdown.length ? breakdownTotal(resolvedAccountingBreakdown) : gestoriaPeriodAmount || scale(additional.gestoria), cadence: resolvedAccountingBreakdown.length ? `${resolvedAccountingBreakdown.length} documento${resolvedAccountingBreakdown.length === 1 ? "" : "s"}` : "Mensual", breakdown: resolvedAccountingBreakdown },
    { key: "fuel", label: "Gasolina", amount: breakdownTotal(resolvedFuelBreakdown), cadence: getNetFuelCadence(vehicle.plate, reportYear, reportMonth), breakdown: resolvedFuelBreakdown },
    { key: "payroll", label: "Nóminas", amount: breakdownTotal(resolvedPayrollBreakdown), cadence: "2 conductores", breakdown: resolvedPayrollBreakdown },
    { key: "driver-commission", label: "Comisiones de conductores", amount: resolvedCommissionBreakdown.length ? breakdownTotal(resolvedCommissionBreakdown) : commission, cadence: commissionCadence, breakdown: resolvedCommissionBreakdown, commissionReport: alexCommissionReport },
    { key: "social-security", label: "Seguros sociales", amount: breakdownTotal(resolvedSocialBreakdown), cadence: "Autónomo + 2 conductores", breakdown: resolvedSocialBreakdown },
    { key: "taxes", label: "Impuestos", amount: scale(amounts[7]), cadence: "Trimestral" },
    { key: "eu-vat", label: "IVA intracomunitario", amount: intracommunityVat, cadence: intracommunityVatRate > 0 ? `${Math.round(intracommunityVatRate * 100)}% desde enero de 2025` : "0% anterior a enero de 2025", meta: `${formatCurrency(driverBillingTotal)} × ${Math.round(intracommunityVatRate * 100)}%` },
    { key: "leasing", label: "Leasing coche", amount: leasingAmount, cadence: getLeasingCadence(vehicle.plate, reportYear, reportMonth) },
    { key: "insurance", label: "Seguro", amount: scale(amounts[9]), cadence: "Anual" },
    { key: "inspection", label: "ITV", amount: inspectionAmount || scale(additional.itv), cadence: getAnnualRecurringExpenseCadence("inspection") },
    { key: "road-tax", label: "Impuesto circulación", amount: scale(additional.circulation), cadence: "Anual" },
    { key: "license-loan", label: "Préstamo licencia", amount: licenseLoanAmount, cadence: getLicenseLoanCadence(vehicle.plate) },
    { key: "annex-insurance", label: "Seguros anexos al coche", amount: scale(additional.annexInsurance), cadence: "Mensual" },
  ];
};

const reportMonths = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DRIVER_BILLING_VISIBLE_MONTHS = 12;
const DRIVER_BILLING_EXPANDED_VISIBLE_MONTHS = 8;
const DRIVER_BILLING_CHART_LEFT_MARGIN = 76;
const DRIVER_BILLING_CHART_Y_AXIS_WIDTH = 66;
const DRIVER_BILLING_CHART_RIGHT_MARGIN = 22;
const reportMonthTokens = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const fuelPeriodSuffixPattern = /\b[a-záéíóú]{3}\s+\d{4}$/i;
const reportYears = [2024, 2025, 2026, 2027];
const reportSeasonality = [0.82, 0.87, 0.94, 0.91, 0.98, 1.03, 1, 0.96, 1.05, 1.02, 0.93, 0.79];
const getReportPeriodFactor = (month, year) => reportSeasonality[month] * (year === 2026 ? 1 : 0.9);
const calendarWeekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const getDriverBillingDays = (driver, plate, month, year, monthlyRevenue) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const seed = `${driver}-${plate}-${month}-${year}`.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const billableDays = Array.from({ length: daysInMonth }, (_, index) => index + 1).filter((day) => {
    const weekday = new Date(year, month, day).getDay();
    return weekday !== 0 && (day + seed) % 11 !== 0;
  });
  const totalCents = Math.round(monthlyRevenue * 100);
  const weights = billableDays.map((day) => 80 + ((seed + day * 17) % 71));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let assignedCents = 0;

  return new Map(billableDays.map((day, index) => {
    const cents = index === billableDays.length - 1
      ? totalCents - assignedCents
      : Math.floor((totalCents * weights[index]) / totalWeight);
    assignedCents += cents;
    return [day, cents / 100];
  }));
};

const loadProcessedDocuments = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(processedDocumentStorageKey) ?? "[]");
    return Array.isArray(stored) ? stored.filter((document) => document?.id && document?.category && document?.fields) : [];
  } catch {
    return [];
  }
};
const getMaintenanceAmountForPeriod = (vehicle, month, year) => vehicle.maintenance
  .filter((item) => {
    const date = new Date(getMaintenanceDateValue(item));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month;
  })
  .reduce((sum, item) => sum + item.amount, 0);

const readingSeed = [
  { id: "LEC-4381", time: "Hoy · 04:08", driver: "Fernando", plate: "5754 MJV", total: 128460, daily: 150, confidence: 98, status: "Validada" },
  { id: "LEC-4380", time: "Hoy · 07:03", driver: "Amin", plate: "5750 MJV", total: 210735, daily: 121, confidence: 96, status: "Revisar" },
  { id: "LEC-4379", time: "Hoy · 06:05", driver: "Alex", plate: "5043 MLC", total: 142980, daily: 138, confidence: 97, status: "Validada" },
  { id: "LEC-4378", time: "Hoy · 19:05", driver: "David García", plate: "0344 LCP", total: 98215, daily: 13, confidence: 92, status: "Revisar" },
  { id: "LEC-4377", time: "Hoy · 16:05", driver: "Andrés", plate: "5754 MJV", total: 128310, daily: 168, confidence: 99, status: "Validada" },
  { id: "LEC-4376", time: "Hoy · 19:02", driver: "Mauricio", plate: "5750 MJV", total: 210614, daily: 120, confidence: 98, status: "Validada" },
];

const formatKm = (value) => `${new Intl.NumberFormat("es-ES").format(value)} km`;
const formatCurrency = (value) => `${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const formatRoundedAmount = (value) => Math.round(Number(value) || 0).toLocaleString("es-ES");
const formatMainAmount = (value) => `${formatRoundedAmount(value)} €`;
const formatBillingMilestone = (value) => {
  const amount = Math.round(Number(value) || 0);
  if (amount < 1000) return String(amount);
  return `${Math.floor(amount / 1000)}.${String(amount % 1000).padStart(3, "0")}`;
};
const DRIVER_BILLING_MILESTONE_START_PERCENT = 30;
const DRIVER_BILLING_MILESTONE_END_PERCENT = 98;
const getDriverBillingVisualPosition = (value, milestones = [], scaleMax = 9000) => {
  const numericValue = Math.max(0, Number(value) || 0);
  const firstMilestone = Number(milestones[0]) || 0;
  if (!firstMilestone || !scaleMax) return 0;
  if (numericValue <= firstMilestone) return Math.min(DRIVER_BILLING_MILESTONE_START_PERCENT, (numericValue / firstMilestone) * DRIVER_BILLING_MILESTONE_START_PERCENT);
  if (numericValue >= scaleMax) return numericValue > scaleMax ? 100 : DRIVER_BILLING_MILESTONE_END_PERCENT;
  return DRIVER_BILLING_MILESTONE_START_PERCENT + ((numericValue - firstMilestone) / (scaleMax - firstMilestone)) * (DRIVER_BILLING_MILESTONE_END_PERCENT - DRIVER_BILLING_MILESTONE_START_PERCENT);
};
const formatShortCurrency = (value) => `${Math.round(value).toLocaleString("es-ES")} €`;
const formatDriverBarAmount = (value) => Number(value) >= 1000 ? `${(Number(value) / 1000).toLocaleString("es-ES", { maximumFractionDigits: 1 })}k` : `${Math.round(Number(value) || 0)}`;
const parseDriverDateKey = (value) => {
  const [year, month, day] = String(value ?? "").split("-").map(Number);
  return Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
    ? new Date(year, month - 1, day)
    : null;
};
const getDriverWeekStart = (date) => {
  const start = new Date(date);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  start.setHours(0, 0, 0, 0);
  return start;
};
const getDriverEntryAmount = (entry, key) => Number(entry?.[key]) || 0;
const getDriverWeeklyAmount = (entry, key, dateKey, manualValues = {}) => {
  const manualKey = key === "wash" ? "wash" : key === "other_expenses" ? "other" : "";
  if (manualKey && Object.hasOwn(manualValues?.[dateKey] ?? {}, manualKey)) {
    return Number(manualValues[dateKey][manualKey]) || 0;
  }
  return getDriverEntryAmount(entry, key === "wash" ? "wash_expenses" : key === "net" ? "billing" : key);
};
const getDriverDailyNetAmount = (entry, dateKey, manualValues = {}) => Number((
  getDriverWeeklyAmount(entry, "cash_collected", dateKey, manualValues)
  - getDriverWeeklyAmount(entry, "fuel_cost", dateKey, manualValues)
  - getDriverWeeklyAmount(entry, "refunds", dateKey, manualValues)
  - getDriverWeeklyAmount(entry, "wash", dateKey, manualValues)
  - getDriverWeeklyAmount(entry, "other_expenses", dateKey, manualValues)
).toFixed(2));
const accumulateDriverWeekTotals = (dailyValues) => {
  let runningTotal = 0;
  return dailyValues.map((value) => {
    runningTotal = Number((runningTotal + (Number(value) || 0)).toFixed(2));
    return runningTotal;
  });
};
const driverWeeklyManualStorageKey = "sobre-ruedas-driver-weekly-manual-v1";
const driverMaintenanceNoteStorageKey = "sobre-ruedas-driver-maintenance-note-v1";
const loadDriverWeeklyManualValues = (driverId) => {
  if (!driverId || typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem(driverWeeklyManualStorageKey) ?? "{}");
    return stored?.[driverId] && typeof stored[driverId] === "object" ? stored[driverId] : {};
  } catch {
    return {};
  }
};
const loadDriverMaintenanceNote = (vehiclePlate) => {
  if (!vehiclePlate || typeof window === "undefined") return "";
  try {
    const stored = JSON.parse(window.localStorage.getItem(driverMaintenanceNoteStorageKey) ?? "{}");
    return typeof stored?.[vehiclePlate] === "string" ? stored[vehiclePlate] : "";
  } catch {
    return "";
  }
};
const saveDriverMaintenanceNote = (vehiclePlate, note) => {
  if (!vehiclePlate || typeof window === "undefined") return;
  try {
    const stored = JSON.parse(window.localStorage.getItem(driverMaintenanceNoteStorageKey) ?? "{}");
    window.localStorage.setItem(driverMaintenanceNoteStorageKey, JSON.stringify({ ...stored, [vehiclePlate]: note }));
  } catch {
    // La nota se mantiene en memoria aunque el navegador no permita guardar preferencias locales.
  }
};
const buildDriverWeekPage = (anchorDate, entries, manualValues = {}, billingStatsByDate = new Map()) => {
  const weekStart = getDriverWeekStart(anchorDate);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);
    return { date, key: getDriverDateKey(date) };
  });
  const weekEntries = days.map(({ key }) => getDriverDailyLedgerEntry(entries, key, billingStatsByDate));
  const total = (entry, key, index) => getDriverWeeklyAmount(entry, key, days[index]?.key, manualValues);
  const cumulativeTotals = accumulateDriverWeekTotals(days.map(({ key }, index) => getDriverDailyNetAmount(weekEntries[index], key, manualValues)));
  const rows = [
    { key: "net", label: "Precio\nneto", values: weekEntries.map((entry, index) => total(entry, "net", index)) },
    { key: "cash", label: "Efectivo", values: weekEntries.map((entry, index) => total(entry, "cash_collected", index)) },
    { key: "fuel", label: "Repostaje", values: weekEntries.map((entry, index) => total(entry, "fuel_cost", index)) },
    { key: "refunds", label: "Reembolsos", values: weekEntries.map((entry, index) => total(entry, "refunds", index)) },
    { key: "wash", label: "Lavados", values: weekEntries.map((entry, index) => total(entry, "wash", index)) },
    { key: "other", label: "Varios", values: weekEntries.map((entry, index) => total(entry, "other_expenses", index)) },
    { key: "total", label: "Total", values: cumulativeTotals },
  ];
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const shortDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
  return {
    days,
    rows,
    key: getDriverDateKey(weekStart),
    label: `${shortDate.format(weekStart)} · ${shortDate.format(weekEnd)}`.replace(/\./g, ""),
  };
};
const getDriverDocumentNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? "").replace(/[^\d,.-]/g, "").trim();
  if (!raw) return 0;
  const normalized = raw.includes(",") && raw.includes(".") ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
};
const getDriverCalendarDays = (anchor = new Date(), monthSpan = 2, monthOffset = 0) => {
  const start = new Date(anchor.getFullYear(), anchor.getMonth() + monthOffset, 1);
  const end = new Date(start.getFullYear(), start.getMonth() + monthSpan, 0);
  const days = [];
  for (const current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    days.push({ key: getDriverDateKey(current), date: new Date(current) });
  }
  return days;
};
const getDriverDayParts = (value) => {
  const date = parseDriverDateKey(value) ?? new Date();
  return {
    weekday: new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(date).replace(/\./g, ""),
    day: new Intl.DateTimeFormat("es-ES", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("es-ES", { month: "long" }).format(date).replace(/\./g, ""),
  };
};
const formatDriverDateLong = (value) => {
  const parts = getDriverDayParts(value);
  return `${parts.weekday} ${parts.day} de ${parts.month}`;
};
const formatDriverTipDate = (value) => {
  if (value === "undated") return "Fecha pendiente";
  const date = parseDriverDateKey(value);
  if (!date) return "Fecha pendiente";
  return new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short" }).format(date).replace(/\./g, "");
};
const formatDriverMonthLong = (value) => {
  const date = parseDriverDateKey(value) ?? new Date();
  return new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(date).replace(/\./g, "");
};
const normalizeDriverDocumentDate = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2, "0")}-${String(iso[3]).padStart(2, "0")}`;
  const european = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (european) return `${european[3]}-${String(european[2]).padStart(2, "0")}-${String(european[1]).padStart(2, "0")}`;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : getDriverDateKey(parsed);
};
const getDriverDocumentDateKey = (document) => {
  const extracted = document?.extracted_data ?? {};
  return [extracted.date, extracted.entryDate, extracted.invoiceDate, extracted.serviceDate, extracted.documentDate, extracted.fecha, document?.document_date, document?.created_at]
    .map(normalizeDriverDocumentDate)
    .find(Boolean) ?? null;
};
const getDriverCalendarDayNumber = (value, month, year) => {
  const dateKey = normalizeDriverDocumentDate(value);
  if (dateKey) {
    const [dateYear, dateMonth, dateDay] = dateKey.split("-").map(Number);
    return dateYear === year && dateMonth === month + 1 ? dateDay : null;
  }
  const day = Number(String(value ?? "").match(/^(?:\s*)(\d{1,2})(?:\s|$)/)?.[1]);
  return Number.isInteger(day) && day >= 1 && day <= new Date(year, month + 1, 0).getDate() ? day : null;
};
const buildDriverDocumentModalItem = (document, { driver = "", plate = "", fallbackDate = "" } = {}) => {
  const dateKey = getDriverDocumentDateKey(document) ?? fallbackDate;
  return {
    id: `driver-document-${document?.id ?? document?.file_path ?? document?.file_name ?? Date.now()}`,
    documentNumber: document?.file_name || document?.id || "Documento original",
    provider: "SOBRE RUEDAS",
    date: formatDocumentDisplayDate(dateKey),
    plate,
    driver,
    concept: getDriverDocumentKindLabel(document),
    source: "Foto original de la aplicación del conductor",
    status: document?.status === "approved" ? "Validada" : "Archivada",
    filePath: document?.file_path || document?.filePath || "",
    fileName: document?.file_name || document?.fileName || "Documento original",
    mimeType: document?.mime_type || document?.mimeType || "",
  };
};
const buildDriverTipDayRows = (records = []) => {
  const totals = new Map();
  records.forEach(({ dateKey, amount }) => {
    const numericAmount = getDriverDocumentNumber(amount);
    if (numericAmount <= 0) return;
    const normalizedDate = normalizeDriverDocumentDate(dateKey) ?? "undated";
    totals.set(normalizedDate, (totals.get(normalizedDate) ?? 0) + numericAmount);
  });
  return [...totals.entries()]
    .map(([dateKey, amount]) => ({ dateKey, amount: Number(amount.toFixed(2)) }))
    .sort((left, right) => {
      if (left.dateKey === "undated") return 1;
      if (right.dateKey === "undated") return -1;
      return right.dateKey.localeCompare(left.dateKey);
    });
};
const getDriverFormValue = (value) => value === null || value === undefined ? "" : String(value);
const getDriverEntryForm = (date, item) => ({
  entryDate: date,
  fuelCost: getDriverFormValue(item?.fuel_cost),
  fuelLiters: getDriverFormValue(item?.fuel_liters),
  odometerKm: getDriverFormValue(item?.odometer_km),
  billing: getDriverFormValue(item?.billing),
  cashCollected: getDriverFormValue(item?.cash_collected),
  tips: getDriverFormValue(item?.tips),
  refunds: getDriverFormValue(item?.refunds),
  tolls: getDriverFormValue(item?.tolls),
  washExpenses: getDriverFormValue(item?.wash_expenses),
  otherExpenses: getDriverFormValue(item?.other_expenses),
  notes: getDriverFormValue(item?.notes),
});
const getExtractedDocumentFields = (document) => {
  const data = document?.extracted_data ?? {};
  const fields = data.fields && typeof data.fields === "object" ? data.fields : data;
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value && typeof value === "object" && "value" in value ? value.value : value]));
};
const getDriverDocumentRecordType = (document) => {
  const data = document?.extracted_data ?? {};
  const fields = getExtractedDocumentFields(document);
  return normalizeText(data.recordType || data.metric || fields.recordType || fields.metric || "");
};
const getDriverDocumentKind = (document) => {
  const recordType = getDriverDocumentRecordType(document);
  if (document?.category === "billing" || recordType === "billing" || recordType === "billing_daily") return "billing";
  if (["daily-km", "partial-1", "total-km", "total", "odometer", "odometro", "kilometraje diario", "km diarios", "kilometraje total", "km acumulados"].includes(recordType)) return "mileage";
  if (["fuel", "fuel receipt", "fuel_receipt", "repostaje"].includes(recordType)) return "fuel";
  if (["consumption", "consumption rate", "consumo"].includes(recordType)) return "consumption";
  if (document?.category === "consumption") return "fuel";
  return "";
};
const driverDocumentKindLabels = Object.freeze({ billing: "Facturación", fuel: "Repostaje", mileage: "Kilómetros", consumption: "Consumo diario" });
const getDriverDocumentKindLabel = (document) => driverDocumentKindLabels[getDriverDocumentKind(document)] ?? "Documento";
const getDriverDocumentFieldValue = (fields = {}, keys = []) => {
  for (const key of keys) {
    const candidate = fields?.[key];
    const value = candidate && typeof candidate === "object" && "value" in candidate ? candidate.value : candidate;
    if (value !== null && value !== undefined && String(value).trim() !== "") return value;
  }
  return "";
};
const getDriverBillingDocumentStats = (document) => {
  const fields = getExtractedDocumentFields(document);
  const billingAmounts = getDriverBillingAmounts(fields);
  const totalValue = getDriverDocumentFieldValue(fields, ["total", "earningsTotal", "grossTotal"]);
  const tips = getDriverDocumentNumber(getDriverDocumentFieldValue(fields, ["tips", "tip"]));
  const hasComputedNetAmount = billingAmounts.hasBaseNetAmount || billingAmounts.hasPromotions;
  const netAmount = billingAmounts.hasNetAmount || hasComputedNetAmount
    ? billingAmounts.netAmount
    : totalValue !== ""
      ? Math.max(0, getDriverDocumentNumber(totalValue) - tips)
      : getDriverDocumentNumber(getDriverDocumentFieldValue(fields, ["billing", "amount"]));
  const total = hasComputedNetAmount ? Number((netAmount + tips).toFixed(2)) : totalValue !== "" ? getDriverDocumentNumber(totalValue) : netAmount + tips;
  return {
    dateKey: getDriverDocumentDateKey(document),
    connection: String(getDriverDocumentFieldValue(fields, ["connection", "connectionTime", "duration"]) || "").trim(),
    trips: getDriverDocumentNumber(getDriverDocumentFieldValue(fields, ["trips", "journeys", "viajes"])),
    points: getDriverDocumentNumber(getDriverDocumentFieldValue(fields, ["points", "puntos"])),
    baseNetAmount: billingAmounts.baseNetAmount,
    netAmount,
    promotions: billingAmounts.promotions,
    tips,
    total,
    refunds: getDriverDocumentNumber(getDriverDocumentFieldValue(fields, ["refunds", "reimbursements", "reembolsos"])),
    cashCollected: getDriverDocumentNumber(getDriverDocumentFieldValue(fields, ["cashCollected", "cash_collected", "cash", "efectivo"])),
    hasBillingAmount: hasDriverBillingAmount(fields),
  };
};
const isDriverBillingDocument = (document) => {
  const data = document?.extracted_data ?? {};
  const recordType = getDriverDocumentRecordType(document);
  const metric = normalizeText(data.metric || getExtractedDocumentFields(document).metric || "");
  return document?.category === "billing" && (recordType === "billing" || recordType === "billing_daily" || metric === "billing_daily");
};
const getDriverBillingDocumentsForDriver = (documents = [], driverId) => (documents ?? [])
  .filter((document) => {
    if (!driverId || !isDriverBillingDocument(document)) return false;
    const fields = getExtractedDocumentFields(document);
    const assignedDriverId = document?.driver_id || fields.driverId || fields.driver_id || "";
    return document?.owner_id === driverId || assignedDriverId === driverId;
  });
const getDriverBillingDocumentsForPeriod = (documents = [], driverId, month, year) => getDriverBillingDocumentsForDriver(documents, driverId)
  .filter((document) => {
    const dateKey = getDriverDocumentDateKey(document);
    if (!dateKey) return false;
    const date = new Date(`${dateKey}T12:00:00`);
    return date.getFullYear() === year && date.getMonth() === month;
  });
function getDriverBillingStatsByDate(documents = [], driverId) {
  const statsByDate = new Map();
  getDriverBillingDocumentsForDriver(documents, driverId).forEach((document) => {
    const stats = getDriverBillingDocumentStats(document);
    if (!stats.dateKey || !stats.hasBillingAmount) return;
    const current = statsByDate.get(stats.dateKey) ?? {
      dateKey: stats.dateKey,
      connection: "",
      trips: 0,
      points: 0,
      baseNetAmount: 0,
      netAmount: 0,
      promotions: 0,
      tips: 0,
      total: 0,
      refunds: 0,
      cashCollected: 0,
      hasBillingAmount: true,
    };
    statsByDate.set(stats.dateKey, {
      ...current,
      connection: stats.connection || current.connection,
      trips: current.trips + stats.trips,
      points: current.points + stats.points,
      baseNetAmount: Number((current.baseNetAmount + stats.baseNetAmount).toFixed(2)),
      netAmount: Number((current.netAmount + stats.netAmount).toFixed(2)),
      promotions: Number((current.promotions + stats.promotions).toFixed(2)),
      tips: Number((current.tips + stats.tips).toFixed(2)),
      total: Number((current.total + stats.total).toFixed(2)),
      refunds: Number((current.refunds + stats.refunds).toFixed(2)),
      cashCollected: Number((current.cashCollected + stats.cashCollected).toFixed(2)),
    });
  });
  return statsByDate;
}
function getDriverDailyLedgerEntry(entries = [], dateKey, billingStatsByDate = new Map()) {
  const existing = entries.find((item) => String(item.entry_date) === dateKey) ?? null;
  const billingStats = billingStatsByDate.get(dateKey);
  if (!billingStats) return existing;
  return {
    ...(existing ?? {}),
    entry_date: dateKey,
    billing: billingStats.netAmount,
    billing_override: true,
    cash_collected: billingStats.cashCollected,
    tips: billingStats.tips,
    refunds: billingStats.refunds,
    driver_billing_stats: billingStats,
  };
}
function getDriverDailyLedgerEntries(entries = [], billingStatsByDate = new Map(), datePredicate = () => true) {
  const byDate = new Map();
  (entries ?? []).forEach((entry) => {
    const dateKey = String(entry?.entry_date ?? "");
    if (dateKey && datePredicate(dateKey)) byDate.set(dateKey, entry);
  });
  billingStatsByDate.forEach((stats, dateKey) => {
    if (datePredicate(dateKey)) byDate.set(dateKey, getDriverDailyLedgerEntry(entries, dateKey, billingStatsByDate));
  });
  return [...byDate.values()].sort((left, right) => String(left.entry_date ?? "").localeCompare(String(right.entry_date ?? "")));
}
const normalizeTransactionRecord = (transaction = {}) => ({
  ...transaction,
  vehicle_plate: canonicalizeVehiclePlate(transaction.vehicle_plate),
});
const normalizeDriverEntryRecord = (entry = {}) => ({
  ...entry,
  vehicle_plate: canonicalizeVehiclePlate(entry.vehicle_plate),
});
const normalizeDriverProfileRecord = (driver = {}) => ({
  ...driver,
  vehicle_plate: canonicalizeVehiclePlate(driver.vehicle_plate),
});
const normalizeMaintenanceReportRecord = (report = {}) => ({
  ...report,
  reporterId: report.reporterId ?? report.reporter_id ?? "",
  vehiclePlate: canonicalizeVehiclePlate(report.vehiclePlate ?? report.vehicle_plate),
  photoPath: report.photoPath ?? report.photo_path ?? "",
  photoName: report.photoName ?? report.photo_name ?? "",
  photoMimeType: report.photoMimeType ?? report.photo_mime_type ?? "",
  photoSize: Number(report.photoSize ?? report.photo_size) || 0,
  createdAt: report.createdAt ?? report.created_at ?? "",
  updatedAt: report.updatedAt ?? report.updated_at ?? "",
});
const normalizeDocumentRecord = (document = {}) => {
  const extracted = getExtractedDocumentFields(document);
  const vehiclePlate = canonicalizeVehiclePlate(document.vehicle_plate || extracted.vehicle);
  return { ...document, vehicle_plate: vehiclePlate };
};
const formatDocumentDisplayDate = (dateIso) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateIso ?? ""))) return "Fecha pendiente";
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${dateIso}T12:00:00`)).replace(".", "");
};
const getDocumentNumericField = (fields = {}, keys = []) => {
  for (const key of keys) {
    const rawValue = fields?.[key] && typeof fields[key] === "object" && "value" in fields[key] ? fields[key].value : fields?.[key];
    const value = Number(rawValue);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return 0;
};
const buildAdminDataActivities = ({ transactions = [], documents = [], driverEntries = [], driverProfiles = [] }) => {
  const driverNames = new Map(driverProfiles.map((driver) => [driver.id, driver.full_name]));
  const activities = [];
  const add = (activity) => {
    if (activity?.plate && activity?.key) activities.push(activity);
  };
  transactions.forEach((transaction) => {
    const amount = Number(transaction.amount) || 0;
    const plate = transaction.vehicle_plate || "Vehículo sin asignar";
    const driver = driverNames.get(transaction.driver_id) || "";
    const date = formatDocumentDisplayDate(transaction.occurred_on);
    const suffix = driver ? ` · ${driver}` : "";
    if (transaction.type === "fuel") add({ key: `transaction:${transaction.id}:fuel`, kind: "fuel", target: "Vehículos", plate, title: "Nuevo gasto de combustible", detail: `${plate}${suffix} · ${formatCurrency(amount)} · ${date}`, createdAt: transaction.created_at });
    if (transaction.type === "billing") add({ key: `transaction:${transaction.id}:billing`, kind: "billing", target: "Conductores", plate, title: "Nueva facturación", detail: `${plate}${suffix} · ${formatCurrency(amount)} · ${date}`, createdAt: transaction.created_at });
    if (["maintenance", "toll", "refund", "wash", "miscellaneous"].includes(transaction.type)) add({ key: `transaction:${transaction.id}:${transaction.type}`, kind: "expense", target: "Vehículos", plate, title: "Nuevo gasto registrado", detail: `${plate}${suffix} · ${formatCurrency(amount)} · ${date}`, createdAt: transaction.created_at });
    const odometerKm = getDocumentNumericField(transaction.metadata, ["odometerKm", "odometer_km", "kilometres", "km"]);
    if (odometerKm > 0) add({ key: `transaction:${transaction.id}:odometer`, kind: "mileage", target: "Vehículos", plate, title: "Nuevo kilometraje", detail: `${plate}${suffix} · ${formatKm(odometerKm)} · ${date}`, createdAt: transaction.created_at });
  });
  documents.forEach((document) => {
    const extracted = getExtractedDocumentFields(document);
    const plate = document.vehicle_plate || extracted.vehicle || "Vehículo sin asignar";
    const date = formatDocumentDisplayDate(document.document_date || getDriverDocumentDateKey(document));
    const suffix = driverNames.get(document.owner_id) ? ` · ${driverNames.get(document.owner_id)}` : "";
    const recordType = normalizeText(extracted.recordType || extracted.metric || "");
    const odometerKm = getDocumentNumericField(extracted, ["odometerKm", "odometer_km", "totalKm", "kilometres", "kilometers", "km"]);
    const dailyKm = getDocumentNumericField(extracted, ["dailyKm", "daily_km"]);
    const consumption = getDocumentNumericField(extracted, ["consumption", "consumptionRate", "consumption_rate"]);
    if (odometerKm > 0 || dailyKm > 0) add({ key: `document:${document.id}:mileage`, kind: "mileage", target: "Vehículos", plate, title: "Nuevo kilometraje", detail: `${plate}${suffix} · ${formatKm(odometerKm || dailyKm)}${odometerKm ? " acumulados" : " diarios"} · ${date}`, createdAt: document.created_at });
    if (consumption > 0 && (recordType === "consumption" || recordType === "consumption rate" || recordType === "consumo")) add({ key: `document:${document.id}:consumption`, kind: "consumption", target: "Vehículos", plate, title: "Nuevo consumo", detail: `${plate}${suffix} · ${consumption.toLocaleString("es-ES", { maximumFractionDigits: 1 })} l/100 km · ${date}`, createdAt: document.created_at });
  });
  driverEntries.forEach((entry) => {
    const plate = entry.vehicle_plate || "Vehículo sin asignar";
    const driver = driverNames.get(entry.driver_id) || "";
    const date = formatDocumentDisplayDate(entry.entry_date);
    const suffix = driver ? ` · ${driver}` : "";
    const matchesTransaction = (type, amount) => transactions.some((transaction) => transaction.type === type && transaction.driver_id === entry.driver_id && transaction.vehicle_plate === entry.vehicle_plate && transaction.occurred_on === entry.entry_date && Math.abs((Number(transaction.amount) || 0) - amount) < 0.01);
    if ((Number(entry.fuel_cost) || 0) > 0 && !matchesTransaction("fuel", Number(entry.fuel_cost) || 0)) add({ key: `entry:${entry.id}:fuel:${entry.updated_at}`, kind: "fuel", target: "Vehículos", plate, title: "Nuevo gasto de combustible", detail: `${plate}${suffix} · ${formatCurrency(Number(entry.fuel_cost) || 0)} · ${date}`, createdAt: entry.updated_at || entry.created_at });
    if ((Number(entry.billing) || 0) > 0 && !matchesTransaction("billing", Number(entry.billing) || 0)) add({ key: `entry:${entry.id}:billing:${entry.updated_at}`, kind: "billing", target: "Conductores", plate, title: "Nueva facturación", detail: `${plate}${suffix} · ${formatCurrency(Number(entry.billing) || 0)} · ${date}`, createdAt: entry.updated_at || entry.created_at });
    if ((Number(entry.odometer_km) || 0) > 0) add({ key: `entry:${entry.id}:odometer:${entry.updated_at}`, kind: "mileage", target: "Vehículos", plate, title: "Nuevo kilometraje", detail: `${plate}${suffix} · ${formatKm(Number(entry.odometer_km) || 0)} acumulados · ${date}`, createdAt: entry.updated_at || entry.created_at });
  });
  return activities.sort((left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? "")));
};
const getMaintenanceRecordKey = (item, index = 0) => `${item.date}-${item.concept}-${item.km}-${index}`;
const getMaintenanceEventDomId = (plate, key) => `maintenance-event-${normalizeText(`${plate}-${key}`).replace(/[^a-z0-9]+/g, "-")}`;
const maintenanceMonths = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };
const getVehicleBrand = (vehicle) => vehicle.model.split(" ")[0];
const getVehicleOwner = (vehicleOrPlate) => getCanonicalVehicleOwner(vehicleOrPlate);
function VehiclePlateLabel({ vehicleOrPlate, className = "", showInitials = false }) {
  const plate = typeof vehicleOrPlate === "string" ? vehicleOrPlate : vehicleOrPlate?.plate;
  const owner = getVehicleOwner(vehicleOrPlate);
  const classes = ["vehicle-plate-label", className].filter(Boolean).join(" ");
  if (!plate) return null;
  return <span className={classes} title={owner ? `Titular: ${owner.name}` : undefined} aria-label={owner ? `${plate}, titular ${owner.name}` : plate}>
    <strong>{plate}</strong>
    {showInitials && owner?.initials && <small className="vehicle-plate-label__initials" aria-hidden="true">{owner.initials}</small>}
  </span>;
}

const getGestoriaOwner = (record) => gestoriaOwnerByKey[record?.ownerKey] ?? getVehicleOwner(record?.plate) ?? null;
const buildGestoriaInvoices = () => gestoriaDocuments.map((record) => {
  const plate = canonicalizeVehiclePlate(record.plate);
  const owner = getGestoriaOwner(record);
  const concept = record.recurring ? "Cuota mensual de gestoría" : record.concept || "Gasto de gestoría";
  const sourceItems = record.concepts?.length ? record.concepts : [concept];
  const amount = Number(record.amount) || 0;
  const evenItemAmount = sourceItems.length > 1 ? Number((amount / sourceItems.length).toFixed(2)) : amount;
  const items = sourceItems.map((item, index) => ({
    concept: item,
    amount: index === sourceItems.length - 1
      ? Number((amount - evenItemAmount * Math.max(0, sourceItems.length - 1)).toFixed(2))
      : evenItemAmount,
  }));
  return {
    id: record.documentNumber || record.id,
    documentNumber: record.documentNumber || record.id,
    kind: "gestoria",
    sourceDocumentId: `authorized-gestoria-gmail:${record.id}`,
    date: formatDocumentDisplayDate(record.dateIso),
    dateIso: record.dateIso,
    periodKey: record.periodKey,
    periodLabel: record.periodKey,
    provider: "Gestoría Durán Rivas",
    sender: gestoriaSender,
    plate,
    plateReference: record.plateReference || "",
    owner,
    ownerKey: record.ownerKey,
    concept,
    concepts: record.concepts ?? [],
    amount,
    source: "Correo · Gestoría",
    sourceAccount: record.sourceAccount,
    sourceFile: record.sourceFile,
    sourceMessageId: record.sourceMessageId,
    recurring: Boolean(record.recurring),
    needsReview: Boolean(record.needsReview || !plate),
    status: record.needsReview || !plate ? "Revisar" : "Asociada",
    items,
  };
});

const gestoriaInvoices = buildGestoriaInvoices();
const gestoriaTransactions = gestoriaDocuments
  .filter((record) => record.plate && !record.needsReview)
  .map((record) => ({
    id: `gestoria-transaction:${record.id}`,
    type: "expense",
    occurred_on: `${record.periodKey}-01`,
    amount: Number(record.amount) || 0,
    driver_id: null,
    vehicle_plate: canonicalizeVehiclePlate(record.plate),
    source_document_id: `authorized-gestoria-gmail:${record.id}`,
    category: "accounting",
    metadata: {
      company: "Gestoría Durán Rivas",
      provider: "Gestoría Durán Rivas",
      sender: gestoriaSender,
      invoiceNumber: record.documentNumber,
      concept: record.recurring ? "Cuota mensual de gestoría" : record.concept || "Gasto de gestoría",
      expenseCategory: "Gestoría",
      sourceFile: record.sourceFile,
      sourceMessageId: record.sourceMessageId,
      invoiceDate: record.dateIso,
      servicePeriod: record.periodKey,
      ownerKey: record.ownerKey,
      recurring: Boolean(record.recurring),
    },
    dedupe_key: `gestoria-gmail:${record.id}`,
    created_at: record.dateIso,
  }));

const getMaintenanceDateValue = (item) => {
  if (item.dateIso) return Date.parse(item.dateIso);
  const [day, month, year] = normalizeText(item.date).split(/\s+/);
  return Date.UTC(Number(year), maintenanceMonths[month] ?? 0, Number(day));
};
const getMaintenanceDateInputValue = (item) => {
  if (isMaintenanceDate(item?.dateIso)) return item.dateIso;
  const timestamp = getMaintenanceDateValue(item);
  if (!Number.isFinite(timestamp)) return "";
  const date = new Date(timestamp);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
};
const getFuelEntryDateValue = (entry) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(entry.date ?? ""))) {
    const [year, month, day] = String(entry.date).split("-").map(Number);
    const [hour = 0, minute = 0] = String(entry.time ?? "").split(":").map(Number);
    return Date.UTC(year, month - 1, day, hour, minute);
  }
  const [day, month, year] = normalizeText(entry.date).split(/\s+/);
  const [hour = 0, minute = 0] = (entry.time ?? "").split(":").map(Number);
  return Date.UTC(Number(year), maintenanceMonths[month] ?? 0, Number(day), hour, minute);
};
const formatMaintenanceDate = (item) => {
  const date = new Date(getMaintenanceDateValue(item));
  return `${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCDate()).padStart(2, "0")}`;
};
const getMaintenanceInvoice = (item, vehicle, invoices) => invoices.find((invoice) => invoice.kind !== "gestoria" && invoice.id === item.invoiceId)
  ?? invoices.find((invoice) => invoice.kind !== "gestoria" && invoice.plate === vehicle.plate
    && normalizeText(invoice.date) === normalizeText(item.date)
    && normalizeText(invoice.concept) === normalizeText(item.concept));
const matchesMaintenanceConcept = (value, matches) => {
  const normalized = normalizeText(value);
  return matches.some((match) => normalized.includes(normalizeText(match)));
};
const getDriverDay = (vehicle, driver) => {
  const driverShifts = vehicle.shifts.filter((shift) => shift.driver === driver);
  if (driverShifts.length > 1) {
    return driverShifts.reduce((summary, shift) => ({
      ...summary,
      km: summary.km + shift.km,
      liters: summary.liters + shift.liters,
      cost: summary.cost + shift.cost,
      revenue: summary.revenue + shift.revenue,
      cash: summary.cash + shift.cash,
      monthRevenue: summary.monthRevenue + shift.monthRevenue,
      monthTrips: summary.monthTrips + shift.monthTrips,
      confidence: Math.min(summary.confidence, shift.confidence),
    }), { driver, km: 0, liters: 0, cost: 0, revenue: 0, cash: 0, monthRevenue: 0, monthTrips: 0, time: `${driverShifts.length} turnos registrados`, sentAt: driverShifts[0].sentAt, confidence: 100 });
  }
  return driverShifts[0] ??
    vehicle.daily?.find((entry) => entry.driver === driver) ??
    { driver, km: 0, liters: 0, cost: 0, revenue: 0, cash: 0, monthRevenue: 0, monthTrips: 0, time: "Sin actividad" };
};
const getFuelAssignment = (vehicle, entry) => {
  if (entry.driver) return { driver: entry.driver, label: "Registro manual" };
  const hour = Number(entry.time?.split(":")[0]);
  return vehicle.fuelSchedule?.find((shift) =>
    shift.start < shift.end
      ? hour >= shift.start && hour < shift.end
      : hour >= shift.start || hour < shift.end
  ) ?? { driver: "Sin asignar", label: "Fuera de turno" };
};

const getDriverFuelEntriesForPeriod = (vehicle, driver, month, year) => {
  const periodFactor = getReportPeriodFactor(month, year);
  return (vehicle.monthlyFuel ?? [])
    .map((entry) => ({
      ...entry,
      date: entry.date.replace(fuelPeriodSuffixPattern, `${reportMonthTokens[month]} ${year}`),
      liters: Number(((entry.liters ?? 0) * periodFactor).toFixed(2)),
      cost: Number(((entry.cost ?? 0) * periodFactor).toFixed(2)),
    }))
    .filter((entry) => getFuelAssignment(vehicle, entry).driver === driver);
};

const getFuelCostForPeriod = (vehicle, month, year) => {
  const periodFactor = getReportPeriodFactor(month, year);
  return Number((vehicle.monthlyFuel ?? []).reduce((sum, entry) => sum + Number(((entry.cost ?? 0) * periodFactor).toFixed(2)), 0).toFixed(2));
};

const distributeInteger = (total, keys, seed) => {
  const result = new Map(keys.map((key) => [key, 0]));
  if (!keys.length || total <= 0) return result;
  const weights = keys.map((key) => 50 + ((seed + key * 13) % 50));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let assigned = 0;
  keys.forEach((key, index) => {
    const value = index === keys.length - 1 ? total - assigned : Math.floor((total * weights[index]) / totalWeight);
    result.set(key, value);
    assigned += value;
  });
  return result;
};

const isAmin = (name = "") => String(name).trim().toLocaleLowerCase("es") === "amin";
const isFernando = (name = "") => String(name).trim().toLocaleLowerCase("es") === "fernando";
const isMauricio = (name = "") => String(name).trim().toLocaleLowerCase("es") === "mauricio";
const isTirso = (name = "") => String(name).trim().toLocaleLowerCase("es") === "tirso";
const driverBillingGoals = Object.freeze({ alex: 7000, amin: 8000, andres: 6500, fernando: 6000, mauricio: 6500, tirso: 6500 });
const getDriverBillingGoal = (name = "") => {
  const driverKey = String(name).trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return driverBillingGoals[driverKey] ?? 7000;
};
const importedBillingSources = Object.freeze([
  { key: "alex", label: "Alex", summary: alexBillingByPeriod },
  { key: "amin", label: "Amin", summary: aminBillingByPeriod },
  { key: "fernando", label: "Fernando", summary: fernandoBillingByPeriod },
  { key: "mauricio", label: "Mauricio", summary: mauricioBillingByPeriod },
  { key: "tirso", label: "Tirso", summary: tirsoBillingByPeriod },
]);
const allHistoricalBillingSources = Object.freeze([...importedBillingSources, ...additionalHistoricalBillingSources]);
const historicalDriverVehicleByKey = Object.freeze({ alex: "5043 MLC", amin: "5750 MJV", fernando: "5754 MJV", mauricio: "5750 MJV", tirso: "5043 MLC" });
const historicalDriverNamesByPlate = vehicleDriverNamesByPlate;
const getImportedDriverKey = (driver) => String(driver ?? "").trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/)[0];
const getImportedBillingSource = (driver) => importedBillingSources.find((source) => source.key === getImportedDriverKey(driver)) ?? null;
const getImportedBillingByPeriod = (driver) => {
  const summary = getImportedBillingSource(driver)?.summary ?? null;
  if (!summary) return null;
  return Object.fromEntries(Object.entries(summary).map(([period, record]) => [period, record.amount]));
};

const getDriverBillingRows = (vehicles, driverEntries, month, year, documents = []) => vehicles
  .filter((vehicle) => vehicle.use === "Profesional")
  .flatMap((vehicle) => vehicle.drivers.map((driver, driverIndex) => {
    const profile = vehicle.driverProfiles?.[driverIndex];
    const allEntries = (driverEntries ?? []).filter((entry) => profile?.id && entry.driver_id === profile.id && entry.entry_date);
    const entries = allEntries.filter((entry) => {
      const entryDate = new Date(`${entry.entry_date}T12:00:00`);
      return entryDate.getMonth() === month && entryDate.getFullYear() === year;
    });
    const billingDocumentStats = getDriverBillingDocumentsForPeriod(documents, profile?.id, month, year).map(getDriverBillingDocumentStats);
    const hasDocumentedBilling = billingDocumentStats.some((stats) => stats.hasBillingAmount);
    const periodKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const recordedRevenue = Number((hasDocumentedBilling
      ? billingDocumentStats.reduce((sum, stats) => sum + stats.netAmount, 0)
      : entries.reduce((sum, entry) => sum + (Number(entry.billing) || 0), 0)).toFixed(2));
    const hasBillingOverride = entries.some((entry) => entry.billing_override === true);
    const hasRecordedBilling = hasDocumentedBilling || entries.some((entry) => Number(entry.billing) > 0) || hasBillingOverride;
    const importedBillingByPeriod = getImportedBillingByPeriod(driver);
    const importedTipsByPeriod = getImportedTipsByPeriod(driver);
    const importedRevenue = importedBillingByPeriod?.[periodKey] ?? 0;
    const importedTips = importedTipsByPeriod?.[periodKey] ?? 0;
    const revenue = hasRecordedBilling ? recordedRevenue : importedRevenue;
    const billingByPeriod = importedBillingByPeriod ? { ...importedBillingByPeriod, ...(hasRecordedBilling ? { [periodKey]: recordedRevenue } : {}) } : null;
    const importedPeriodEntry = !hasRecordedBilling && importedRevenue > 0
      ? [{ id: `${String(driver).toLocaleLowerCase("es").replace(/\s+/g, "-")}-billing-${periodKey}`, driver_id: profile?.id ?? "", vehicle_plate: vehicle.plate, entry_date: `${periodKey}-01`, billing: importedRevenue, cash_collected: 0, tips: importedTips, tolls: 0, fuel_cost: 0, fuel_liters: 0, other_expenses: 0, odometer_km: 0, isImportedBilling: true }]
      : [];
    return {
      key: `${vehicle.plate}-${driver}`,
      driver,
      driverId: profile?.id ?? "",
      plate: vehicle.plate,
      model: vehicle.model,
      trips: billingDocumentStats.reduce((sum, stats) => sum + stats.trips, 0),
      revenue,
      entries: [...allEntries, ...importedPeriodEntry],
      billingDocumentStats,
      billingByPeriod,
      hasBillingOverride,
      billingSource: hasRecordedBilling ? "ledger" : importedRevenue > 0 ? "document" : "none",
    };
  }));

const getHistoricalBillingRowsForPeriod = (vehicles, driverEntries = [], month, year) => {
  const periodKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const profiles = vehicles.flatMap((vehicle) => vehicle.driverProfiles ?? []);
  return allHistoricalBillingSources.map((source) => {
    const record = source.summary?.[periodKey];
    const sourcePlate = canonicalizeVehiclePlate(source.vehiclePlate || historicalDriverVehicleByKey[source.key] || "");
    const vehicle = vehicles.find((candidate) => candidate.plate === sourcePlate)
      ?? vehicles.find((candidate) => candidate.use === "Profesional" && candidate.drivers.some((driver) => getImportedDriverKey(driver) === source.key));
    const sourceDriverKey = getImportedDriverKey(source.label);
    const profile = profiles.find((candidate) => getImportedDriverKey(candidate.full_name) === sourceDriverKey);
    const recordedAmount = driverEntries
      .filter((entry) => profile?.id && entry.driver_id === profile.id && String(entry.entry_date ?? "").startsWith(periodKey))
      .reduce((sum, entry) => sum + (Number(entry.billing) || 0), 0);
    const importedTips = getImportedTipsByPeriod(source.label)?.[periodKey] ?? 0;
    if (!record || !(Number(record.amount) > 0)) return null;
    const hasVehicle = Boolean(vehicle);
    return {
      key: `historical-${source.key}-${periodKey}`,
      driver: source.label,
      driverId: "",
      plate: vehicle?.plate ?? sourcePlate,
      model: vehicle?.model ?? "Matrícula pendiente",
      revenue: Number(record.amount) || 0,
      entries: [{ id: `historical-entry-${source.key}-${periodKey}`, entry_date: `${periodKey}-01`, billing: Number(record.amount) || 0, tips: Number(importedTips) || 0, tolls: 0, driver_id: "", isImportedBilling: true }],
      sourceFile: record.sourceFile ?? "Documento de facturación",
      extractedLabel: record.extractedLabel ?? "Total facturado",
      note: record.note ?? "",
      usedInNet: hasVehicle && recordedAmount <= 0,
      recordedAmount: Number(recordedAmount.toFixed(2)),
      isHistoricalBilling: true,
      isHistoricalOnly: Boolean(source.historicalOnly),
      missingVehicle: !hasVehicle,
    };
  }).filter(Boolean);
};

const getNetDriverRowsForVehicle = ({ vehicle, billingRows = [], historicalBillingRows = [], includeHistoricalDrivers = false }) => {
  const driverNames = vehicle.driverProfiles?.length
    ? vehicle.driverProfiles.slice(0, 2).map((profile) => profile.full_name)
    : historicalDriverNamesByPlate[vehicle.plate] ?? vehicle.drivers.slice(0, 2);
  const currentDriverRows = driverNames.map((driver, index) => {
    const driverKey = getImportedDriverKey(driver);
    const liveRow = billingRows.find((row) => row.plate === vehicle.plate && getImportedDriverKey(row.driver) === driverKey && row.billingSource === "ledger");
    const historicalRow = historicalBillingRows.find((row) => getImportedDriverKey(row.driver) === driverKey);
    const profile = vehicle.driverProfiles?.find((candidate) => getImportedDriverKey(candidate.full_name) === driverKey);
    if (liveRow) return { ...liveRow, plate: vehicle.plate, model: vehicle.model };
    if (historicalRow) return { ...historicalRow, driverId: profile?.id ?? historicalRow.driverId, plate: vehicle.plate, model: vehicle.model };
    return { key: `${vehicle.plate}-${driver}-${index}`, driver, driverId: profile?.id ?? "", plate: vehicle.plate, model: vehicle.model, trips: 0, revenue: 0, entries: [], billingSource: "none" };
  });
  if (!includeHistoricalDrivers) return currentDriverRows;
  const knownDriverKeys = new Set(currentDriverRows.map((row) => getImportedDriverKey(row.driver)));
  const additionalDriverRows = historicalBillingRows
    .filter((row) => row.isHistoricalOnly && row.plate === vehicle.plate && !row.missingVehicle && !knownDriverKeys.has(getImportedDriverKey(row.driver)))
    .map((row) => ({ ...row, driverId: "", plate: vehicle.plate, model: vehicle.model, billingSource: "document" }));
  return [...currentDriverRows, ...additionalDriverRows];
};

const getDriverCalendarRows = (vehicle, row, month, year, documents = [], transactions = []) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const realEntries = (row.entries ?? []).filter((entry) => {
    // Los importes mensuales importados se conservan para los resúmenes y
    // comisiones, pero no representan un registro introducido el día 1.
    if (entry?.isImportedBilling) return false;
    if (!entry.entry_date) return false;
    const entryDate = new Date(`${entry.entry_date}T12:00:00`);
    return entryDate.getMonth() === month && entryDate.getFullYear() === year;
  });
  const ownedDriverDocuments = (documents ?? [])
    .filter((document) => {
      const extracted = getExtractedDocumentFields(document);
      const assignedDriverId = document?.driver_id || extracted.driverId || extracted.driver_id || "";
      return Boolean(row.driverId) && (document?.owner_id === row.driverId || assignedDriverId === row.driverId);
    });
  const documentsByDate = new Map();
  ownedDriverDocuments.forEach((document) => {
    const dateKey = getDriverDocumentDateKey(document);
    if (dateKey) documentsByDate.set(dateKey, [...(documentsByDate.get(dateKey) ?? []), document]);
  });
  const documentsById = new Map(ownedDriverDocuments.map((document) => [document.id, document]));
  const billingStatsByDate = new Map();
  ownedDriverDocuments.filter(isDriverBillingDocument).forEach((document) => {
    const stats = getDriverBillingDocumentStats(document);
    if (!stats.dateKey || !stats.hasBillingAmount || !stats.dateKey.startsWith(`${year}-${String(month + 1).padStart(2, "0")}-`)) return;
    const current = billingStatsByDate.get(stats.dateKey) ?? { connection: "", trips: 0, points: 0, baseNetAmount: 0, netAmount: 0, promotions: 0, tips: 0, total: 0, refunds: 0, cashCollected: 0, hasBillingAmount: true };
    billingStatsByDate.set(stats.dateKey, {
      ...current,
      connection: stats.connection || current.connection,
      trips: current.trips + stats.trips,
      points: current.points + stats.points,
      baseNetAmount: current.baseNetAmount + stats.baseNetAmount,
      netAmount: current.netAmount + stats.netAmount,
      promotions: current.promotions + stats.promotions,
      tips: current.tips + stats.tips,
      total: current.total + stats.total,
      refunds: current.refunds + stats.refunds,
      cashCollected: current.cashCollected + stats.cashCollected,
    });
  });
  const mileageDocuments = ownedDriverDocuments
    .map((document) => {
      const data = document?.extracted_data ?? {};
      const extracted = getExtractedDocumentFields(document);
      const recordType = getDriverDocumentRecordType(document);
      const dateKey = getDriverDocumentDateKey(document);
      if (!dateKey) return null;
      const isDailyMileage = recordType === "daily-km" || recordType === "partial-1" || recordType === "kilometraje diario" || recordType === "km diarios";
      const isTotalMileage = recordType === "total-km" || recordType === "total" || recordType === "odometer" || recordType === "odometro" || recordType === "kilometraje total" || recordType === "km acumulados";
      return {
        dateKey,
        dailyKm: isDailyMileage ? getDriverDocumentNumber(data.dailyKm ?? data.daily_km ?? extracted.dailyKm ?? extracted.daily_km ?? extracted.kilometres ?? extracted.kilometers ?? extracted.km) : 0,
        totalKm: isTotalMileage ? getDriverDocumentNumber(data.odometerKm ?? data.odometer_km ?? data.totalKm ?? extracted.odometerKm ?? extracted.odometer_km ?? extracted.totalKm ?? extracted.kilometres ?? extracted.kilometers ?? extracted.km) : 0,
      };
    })
    .filter(Boolean);
  const dailyKmByDate = new Map();
  const odometerByDate = new Map();
  mileageDocuments.forEach(({ dateKey, dailyKm, totalKm }) => {
    if (dailyKm > 0) dailyKmByDate.set(dateKey, Math.max(dailyKmByDate.get(dateKey) ?? 0, dailyKm));
    if (totalKm > 0) odometerByDate.set(dateKey, Math.max(odometerByDate.get(dateKey) ?? 0, totalKm));
  });
  (row.entries ?? []).forEach((entry) => {
    const dateKey = String(entry.entry_date ?? "");
    const odometerKm = getDriverEntryAmount(entry, "odometer_km");
    if (dateKey && odometerKm > 0) odometerByDate.set(dateKey, Math.max(odometerByDate.get(dateKey) ?? 0, odometerKm));
  });
  const dailyKmResolvedByDate = new Map();
  const totalKmResolvedByDate = new Map();
  let previousOdometer = 0;
  [...new Set([...dailyKmByDate.keys(), ...odometerByDate.keys()])].sort().forEach((dateKey) => {
    const explicitDailyKm = dailyKmByDate.get(dateKey) ?? 0;
    const explicitOdometer = odometerByDate.get(dateKey) ?? 0;
    const resolvedOdometer = explicitOdometer > 0 ? explicitOdometer : explicitDailyKm > 0 && previousOdometer > 0 ? previousOdometer + explicitDailyKm : 0;
    const calculatedDailyKm = resolvedOdometer > 0 && previousOdometer > 0 ? Math.max(0, resolvedOdometer - previousOdometer) : 0;
    const resolvedDailyKm = explicitDailyKm > 0 ? explicitDailyKm : calculatedDailyKm;
    if (resolvedDailyKm > 0) dailyKmResolvedByDate.set(dateKey, resolvedDailyKm);
    if (resolvedOdometer > 0) {
      totalKmResolvedByDate.set(dateKey, resolvedOdometer);
      previousOdometer = resolvedOdometer;
    }
  });
  const periodKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const periodRevenue = row.billingByPeriod ? (row.billingByPeriod[periodKey] ?? 0) : row.revenue;
  const billingEntries = realEntries.filter((entry) => Number(entry.billing) > 0);
  const documentedBillingDays = new Map([...billingStatsByDate.entries()].map(([dateKey, stats]) => [Number(dateKey.slice(8, 10)), Number(stats.netAmount.toFixed(2))]));
  const billingDays = documentedBillingDays.size > 0
    ? documentedBillingDays
    : billingEntries.length
    ? billingEntries.reduce((days, entry) => {
      const day = Number(entry.entry_date.slice(8, 10));
      days.set(day, Number(((days.get(day) ?? 0) + (Number(entry.billing) || 0)).toFixed(2)));
      return days;
    }, new Map())
    : row.hasBillingOverride ? new Map() : getDriverBillingDays(row.driver, row.plate, month, year, periodRevenue);
  const billingDayKeys = [...billingDays.keys()];
  const seed = `${row.driver}-${row.plate}-${month}-${year}`.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const documentedTripsByDay = new Map([...billingStatsByDate.entries()].map(([dateKey, stats]) => [Number(dateKey.slice(8, 10)), stats.trips]));
  const tripsByDay = documentedTripsByDay.size > 0 ? documentedTripsByDay : distributeInteger(row.trips, billingDayKeys, seed);
  const fuelByDay = new Map();
  const transactionFuelEntries = (transactions ?? [])
    .filter((transaction) => transaction.type === "fuel" && transaction.driver_id === row.driverId && transaction.vehicle_plate === vehicle.plate && transaction.occurred_on)
    .filter((transaction) => {
      const transactionDate = new Date(`${transaction.occurred_on}T12:00:00`);
      return transactionDate.getMonth() === month && transactionDate.getFullYear() === year;
    })
    .map((transaction) => ({
      id: transaction.id,
      transactionId: transaction.id,
      sourceDocumentId: transaction.source_document_id,
      sourceDocument: documentsById.get(transaction.source_document_id) ?? null,
      date: transaction.occurred_on,
      time: transaction.metadata?.time || "",
      liters: Number(transaction.metadata?.liters) || 0,
      cost: Number(transaction.amount) || 0,
    }));
  const entryFuelEntries = realEntries
    .filter((entry) => Number(entry.fuel_cost) > 0 || Number(entry.fuel_liters) > 0)
    .map((entry) => ({
      id: entry.id,
      date: entry.entry_date,
      time: "",
      sourceDocument: null,
      liters: Number(entry.fuel_liters) || 0,
      cost: Number(entry.fuel_cost) || 0,
    }));
  const periodFuelEntries = transactionFuelEntries.length
    ? transactionFuelEntries
    : entryFuelEntries.length
      ? entryFuelEntries
      : getDriverFuelEntriesForPeriod(vehicle, row.driver, month, year);
  periodFuelEntries.forEach((entry) => {
    const day = getDriverCalendarDayNumber(entry.date, month, year);
    if (!day) return;
    fuelByDay.set(day, [...(fuelByDay.get(day) ?? []), entry]);
  });
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const billing = billingDays.get(day) ?? 0;
    const fuelEntries = fuelByDay.get(day) ?? [];
    const km = dailyKmResolvedByDate.get(dateKey) ?? 0;
    const fuelLiters = fuelEntries.reduce((sum, entry) => sum + entry.liters, 0);
    const fuelCost = fuelEntries.reduce((sum, entry) => sum + entry.cost, 0);
    const totalKm = totalKmResolvedByDate.get(dateKey) ?? 0;
    const entryForDate = realEntries.find((entry) => String(entry.entry_date) === dateKey);
    const documentBillingStats = billingStatsByDate.get(dateKey);
    const billingStats = documentBillingStats ? { ...documentBillingStats } : {
      connection: "",
      trips: tripsByDay.get(day) ?? 0,
      points: 0,
      baseNetAmount: billing,
      netAmount: billing,
      promotions: 0,
      tips: Number(entryForDate?.tips) || 0,
      total: billing + (Number(entryForDate?.tips) || 0),
      refunds: Number(entryForDate?.refunds) || 0,
      cashCollected: Number(entryForDate?.cash_collected) || 0,
      hasBillingAmount: billing > 0,
    };
    if (entryForDate?.billing_override === true) {
      billingStats.netAmount = Number(entryForDate.billing) || 0;
      billingStats.total = billingStats.netAmount + billingStats.tips;
    }
    return {
      day,
      billing,
      trips: tripsByDay.get(day) ?? 0,
      billingStats,
      km,
      totalKm,
      fuelEntries,
      fuelLiters,
      fuelCost,
      notes: realEntries.find((entry) => String(entry.entry_date) === dateKey)?.notes || "",
      documents: documentsByDate.get(dateKey) ?? [],
      active: billing > 0 || fuelEntries.length > 0 || km > 0 || totalKm > 0 || documentsByDate.has(dateKey),
    };
  });
};

const navFromHash = () => {
  const slug = window.location.hash.replace(/^#\/?/, "");
  if (slug === "gasolina") return "Vehículos";
  return [...navItems, conductorNavItem, ...fleetSubItems, adminNavItem, ...utilityItems].find((item) => item.slug === slug)?.label ?? "Informes";
};

const passwordRecoveryPath = "/reset-password";
const passwordRecoveryRedirectUrl = () => "https://talleria-flota.vercel.app/reset-password";
const passwordRecoveryCode = () => new URLSearchParams(window.location.search ?? "").get("code");
const futureJwtErrorMessage = "La sesión guardada en este dispositivo tenía una fecha futura y se ha eliminado. Comprueba que la fecha y hora estén configuradas automáticamente y vuelve a entrar.";
const isFutureJwtError = (error) => {
  const details = [error?.message, error?.details, error?.hint, error?.code]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return details.includes("jwt issued at future")
    || details.includes("issued at future")
    || details.includes("token issued in the future");
};
const clearLocalSupabaseSession = async () => {
  if (!supabase) return;
  const storageKey = supabase.storageKey || "";
  try {
    // Solo elimina la sesión local. No intenta revocar el token en el servidor,
    // porque un JWT con una fecha futura puede ser rechazado también al cerrar sesión.
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // El objetivo es dejar el navegador limpio aunque Supabase rechace el token.
  }
  try {
    // Elimina también la entrada persistida por si el cierre local no pudo
    // completarse mientras el JWT seguía siendo rechazado.
    if (storageKey) window.localStorage.removeItem(storageKey);
  } catch {
    // La sesión ya no se puede usar; no bloqueamos el acceso por esta limpieza.
  }
  try {
    window.sessionStorage.removeItem("sobre-ruedas:temporary-session");
  } catch {
    // La sesión de Supabase ya se ha limpiado; esta preferencia no es esencial.
  }
};
const passwordRecoveryErrorMessage = (error) => {
  const code = String(error?.code ?? "").toLowerCase();
  const message = String(error?.message ?? "").toLowerCase();
  const status = Number(error?.status ?? 0);
  if (status === 429 || code === "over_email_send_rate_limit" || message.includes("rate limit") || message.includes("after 20 seconds")) {
    return "Supabase ha limitado temporalmente los correos de recuperación por varios intentos. Espera a que se libere el límite y solicita un único correo nuevo; no es un problema de tu contraseña.";
  }
  if (message.includes("redirect") || message.includes("url")) {
    return "Supabase ha rechazado la dirección de retorno del correo. Actualiza la aplicación y vuelve a solicitar el enlace desde la dirección pública.";
  }
  return "No se ha podido enviar el correo de recuperación. Comprueba la dirección e inténtalo de nuevo.";
};

const isPasswordRecoveryLink = () => {
  const hash = window.location.hash ?? "";
  const search = window.location.search ?? "";
  const searchParams = new URLSearchParams(search);
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  return pathname === passwordRecoveryPath
    || /(?:^|[&#?])type=recovery(?:&|$)/.test(hash)
    || searchParams.get("type") === "recovery"
    || searchParams.has("code");
};

const isStandaloneApp = () => window.matchMedia("(display-mode: standalone)").matches || Boolean(window.navigator.standalone);
const isAppleTouchDevice = () => {
  const userAgent = String(window.navigator.userAgent ?? "");
  return /iPhone|iPad|iPod/i.test(userAgent)
    || (window.navigator.platform === "MacIntel" && Number(window.navigator.maxTouchPoints) > 1);
};

const initialAppNav = () => {
  if (isStandaloneApp() || !window.location.hash) {
    window.history.replaceState(null, "", "#/informes");
    return "Informes";
  }
  return navFromHash();
};

function UseBadge({ value }) {
  const Icon = value === "Profesional" ? IconBriefcase : IconHome;
  return <span className={`use-badge use-badge--${value.toLowerCase()}`}><Icon size={13} />{value}</span>;
}

function StatusBadge({ status }) {
  const statusClass = status.toLowerCase().replace(" ", "-");
  return <span className={`status-badge status-badge--${statusClass}`}><i />{status}</span>;
}

function PageIntro({ eyebrow, title, description, action }) {
  return (
    <header className="page-intro">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone = "green" }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span className="metric-card__icon"><Icon size={20} /></span>
      <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
    </article>
  );
}

function BottomNavigation({ onHome, onAdd, onProfile, homeActive, profileLabel = "Abrir perfil de usuario" }) {
  return (
    <nav className="bottom-navigation" aria-label="Navegación inferior">
      <button type="button" className={`bottom-navigation__item${homeActive ? " bottom-navigation__item--active" : ""}`} onClick={onHome} aria-label="Ir a la página principal" aria-current={homeActive ? "page" : undefined} title="Página principal"><IconHome size={21} /></button>
      <button type="button" className="bottom-navigation__add" onClick={onAdd} aria-label="Añadir" title="Añadir"><IconPlus size={24} /></button>
      <button type="button" className="bottom-navigation__item" onClick={onProfile} aria-label={profileLabel} title={profileLabel.replace(/^Abrir /, "")}><IconUserCircle size={21} /></button>
    </nav>
  );
}

function QuickActionMenu({ step, category, onCategory, onDocumentAction, onNotice }) {
  const nativeInputRef = useRef(null);
  const categoryRef = useRef(category);

  useEffect(() => {
    categoryRef.current = category;
  }, [category]);

  const openNativePicker = (input = nativeInputRef.current) => {
    if (!input) return;
    input.value = "";
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      // Some mobile browsers expose showPicker but only allow click().
    }
    input.click();
  };

  const handleCategory = (nextCategory) => {
    categoryRef.current = nextCategory;
    openNativePicker();
    onCategory(nextCategory);
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateDocumentFile(file, "upload");
      if (!validation.valid) {
        onNotice?.(validation.message);
      } else {
        onDocumentAction({ category: categoryRef.current, source: "upload", file });
      }
    }
    event.target.value = "";
  };

  return (
    <>
      {step === "categories" && <div className="bottom-navigation__quick-menu bottom-navigation__quick-menu--categories" onClick={(event) => event.stopPropagation()} role="menu" aria-label="Seleccionar tipo de registro">
        <div className="bottom-navigation__quick-options bottom-navigation__quick-options--categories">
          <button type="button" role="menuitem" className="bottom-navigation__quick-option bottom-navigation__quick-option--billing" onClick={() => handleCategory("billing")}><IconFileInvoice size={21} /><span>Facturación</span></button>
          <button type="button" role="menuitem" className="bottom-navigation__quick-option bottom-navigation__quick-option--fuel" onClick={() => handleCategory("consumption")}><IconGasStation size={21} /><span>Consumo</span></button>
        </div>
      </div>}
      <input ref={nativeInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,.pdf,application/pdf" aria-label="Seleccionar una acción: Cámara o Archivos" onChange={handleFile} />
    </>
  );
}

export function App() {
  const [authState, setAuthState] = useState({ loading: true, session: null, profile: null, error: null });
  const [passwordRecovery, setPasswordRecovery] = useState(() => initialPasswordRecoveryIntent || isPasswordRecoveryLink());
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(isStandaloneApp);
  const futureJwtResetRef = useRef(false);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const onInstallAvailable = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };
    const syncDisplayMode = () => setIsStandalone(isStandaloneApp());
    const addDisplayModeListener = displayMode.addEventListener ? "addEventListener" : "addListener";
    const removeDisplayModeListener = displayMode.removeEventListener ? "removeEventListener" : "removeListener";

    window.addEventListener("beforeinstallprompt", onInstallAvailable);
    window.addEventListener("appinstalled", onInstalled);
    displayMode[addDisplayModeListener]("change", syncDisplayMode);
    window.addEventListener("pageshow", syncDisplayMode);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallAvailable);
      window.removeEventListener("appinstalled", onInstalled);
      displayMode[removeDisplayModeListener]("change", syncDisplayMode);
      window.removeEventListener("pageshow", syncDisplayMode);
    };
  }, []);

  const handleFutureJwt = useCallback(async () => {
    if (!futureJwtResetRef.current) {
      futureJwtResetRef.current = true;
      await clearLocalSupabaseSession();
    }
    // La notificación SIGNED_OUT puede llegar después de limpiar el almacenamiento.
    // Dejamos directamente el formulario de acceso, sin mantener el error del JWT.
    window.setTimeout(() => {
      setAuthState({ loading: false, session: null, profile: null, error: null });
    }, 0);
  }, []);

  const applySession = useCallback(async (session, { skipProfile = false } = {}) => {
    if (!session?.user) {
      setAuthState({
        loading: false,
        session: null,
        profile: null,
        error: null,
      });
      return;
    }
    if (skipProfile) {
      // Durante la recuperación solo necesitamos la sesión de Auth para
      // actualizar la contraseña. Cargar profiles aquí puede fallar con un
      // JWT de recuperación todavía no aceptado por PostgREST y provocar un
      // cierre de sesión antes de mostrar el formulario.
      setAuthState({ loading: false, session, profile: null, error: null });
      return;
    }
    const { data: profile, error } = await getProfile(session.user);
    if (isFutureJwtError(error)) {
      await handleFutureJwt();
      return;
    }
    futureJwtResetRef.current = false;
    setAuthState({ loading: false, session, profile: profile ?? null, error: error ?? null });
  }, [handleFutureJwt]);

  useEffect(() => {
    if (!supabase) {
      setAuthState({ loading: false, session: null, profile: null, error: new Error("Supabase no está configurado.") });
      return undefined;
    }
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const recoveryEvent = event === "PASSWORD_RECOVERY" || initialPasswordRecoveryIntent || isPasswordRecoveryLink();
      if (recoveryEvent) setPasswordRecovery(true);
      if (event === "SIGNED_OUT") setPasswordRecovery(false);
      window.setTimeout(() => {
        if (mounted) applySession(session, { skipProfile: recoveryEvent && Boolean(session) });
      }, 0);
    });
    const loadSession = async () => {
      // El cliente de Supabase puede haber retirado ya el hash de la URL al
      // detectar la sesión. La marca capturada durante la importación evita
      // que el enlace se confunda con un login normal y se cierre la sesión.
      const recoveryLink = isPasswordRecoveryLink() || initialPasswordRecoveryIntent;
      const recoveryCode = passwordRecoveryCode();
      if (recoveryLink) setPasswordRecovery(true);

      let session = null;
      let sessionError = null;
      try {
        if (recoveryCode) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(recoveryCode);
          session = data?.session ?? null;
          sessionError = error ?? null;
        } else {
          const { data, error } = await supabase.auth.getSession();
          session = data?.session ?? null;
          sessionError = error ?? null;
        }
      } catch (error) {
        sessionError = error;
      }
      if (!mounted) return;
      if (sessionError) {
        if (isFutureJwtError(sessionError)) {
          await handleFutureJwt();
          return;
        }
        setAuthState({ loading: false, session: null, profile: null, error: sessionError });
        return;
      }
      if (recoveryLink && session) {
        window.history.replaceState(null, "", passwordRecoveryPath);
        await applySession(session, { skipProfile: true });
        return;
      }
      const keepSignedIn = window.localStorage.getItem("sobre-ruedas:keep-signed-in") !== "false";
      const temporarySessionActive = window.sessionStorage.getItem("sobre-ruedas:temporary-session") === "active";
      if (session && !keepSignedIn && !temporarySessionActive && !recoveryLink) {
        await supabase.auth.signOut();
        if (mounted) applySession(null);
        return;
      }
      await applySession(session);
    };
    loadSession();
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [applySession, handleFutureJwt]);

  const updateProfile = useCallback((profile) => setAuthState((current) => ({ ...current, profile: { ...current.profile, ...profile } })), []);
  const signOut = useCallback(() => {
    window.sessionStorage.removeItem("sobre-ruedas:temporary-session");
    return supabase?.auth.signOut();
  }, []);

  const installApplication = useCallback(async (onNotice) => {
    const notice = (message) => onNotice?.(message);
    if (isStandalone || isStandaloneApp()) {
      setIsStandalone(true);
      notice("SOBRE RUEDAS ya está instalada y abierta como aplicación en este dispositivo.");
      return;
    }
    if (isAppleTouchDevice()) {
      notice("En iPhone o iPad: abre esta página en Safari, pulsa Compartir y elige «Añadir a pantalla de inicio». Después abre SOBRE RUEDAS desde su icono.");
      return;
    }
    if (!installPrompt) {
      notice("En Android, abre esta página en Chrome y elige «Instalar aplicación» en el menú ⋮. Si no aparece, vuelve a pulsar este botón cuando termine de cargar.");
      return;
    }
    try {
      const promptEvent = installPrompt;
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setInstallPrompt(null);
      notice(choice?.outcome === "accepted"
        ? "Instalación iniciada. Encontrarás SOBRE RUEDAS en la pantalla de inicio."
        : "Instalación cancelada.");
    } catch {
      setInstallPrompt(null);
      notice("No se ha podido abrir la instalación. Usa el menú del navegador para añadirla a la pantalla de inicio.");
    }
  }, [installPrompt, isStandalone]);

  if (authState.loading) return <AuthLoadingScreen />;
  if (!isSupabaseConfigured) return <AuthScreen configurationError onInstall={installApplication} isStandalone={isStandalone} />;
  if (passwordRecovery) {
    if (!authState.session) return <AuthScreen error={authState.error ?? new Error("El enlace de recuperación ha caducado. Solicita uno nuevo para continuar.")} onInstall={installApplication} isStandalone={isStandalone} />;
    return <PasswordRecoveryScreen onComplete={() => setPasswordRecovery(false)} />;
  }
  if (!authState.session) return <AuthScreen error={authState.error} onInstall={installApplication} isStandalone={isStandalone} />;
  if (!authState.profile) return <AuthScreen error={authState.error ?? new Error("No se ha encontrado el perfil de esta cuenta.")} onInstall={installApplication} isStandalone={isStandalone} />;
  if (!authState.profile.active) return <AccessBlockedScreen onSignOut={signOut} />;
  if (roleFromUser(authState.session.user, authState.profile) === "driver") {
    return <DriverApp session={authState.session} profile={authState.profile} onSignOut={signOut} onProfileChange={updateProfile} onInstall={installApplication} isStandalone={isStandalone} />;
  }
  return <AuthenticatedApp session={authState.session} profile={authState.profile} onSignOut={signOut} onProfileChange={updateProfile} onInstall={installApplication} isStandalone={isStandalone} />;
}

function AuthenticatedApp({ session, profile, onSignOut, onProfileChange, onInstall, isStandalone }) {
  const isAdmin = roleFromUser(session.user, profile) === "admin";
  const profileName = profile.full_name || (isAdmin ? "David Diaz" : session.user.email);
  const profileInitials = profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
  const [previewDriver, setPreviewDriver] = useState(null);
  const [driverProfiles, setDriverProfiles] = useState([]);
  const [driverEntries, setDriverEntries] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeNav, setActiveNav] = useState(initialAppNav);
  const [selectedPlate, setSelectedPlate] = useState("5043 MLC");
  const [maintenancePlate, setMaintenancePlate] = useState("5043 MLC");
  const [selectedDrivers, setSelectedDrivers] = useState({
    "5754 MJV": "Andrés",
    "5750 MJV": "Mauricio",
    "5043 MLC": "Alex",
    "0344 LCP": "Ana García",
    "9401 LTG": "Sergio Ruiz",
  });
  const [filter, setFilter] = useState("Todos");
  const [query, setQuery] = useState("");
  const [openShift, setOpenShift] = useState("jbv-t2");
  const [inspectorTab, setInspectorTab] = useState(() => navFromHash() === "Gasolina" ? "Gasolina" : "Turnos");
  const [inspectorOpen, setInspectorOpen] = useState(() => window.innerWidth > 820 && navFromHash() !== "Gasolina");
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);
  const [photoInvoices, setPhotoInvoices] = useState(loadPhotoInvoices);
  const [maintenanceEdits, setMaintenanceEdits] = useState(loadMaintenanceEdits);
  const [documentRecords, setDocumentRecords] = useState([]);
  const [maintenanceReports, setMaintenanceReports] = useState([]);
  const [processedDocuments, setProcessedDocuments] = useState(loadProcessedDocuments);
  const [realtimeRevision, setRealtimeRevision] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const accountStorageKey = session.user?.id ?? "anonymous";
  const invoiceNoticeCountStorageKey = `${invoiceNoticeCountStoragePrefix}${accountStorageKey}`;
  const notificationReadKeysStorageKey = `${notificationReadKeysStoragePrefix}${accountStorageKey}`;
  const [unreadInvoiceCount, setUnreadInvoiceCount] = useState(() => loadStoredNumber(invoiceNoticeCountStorageKey, 3));
  const [readNotificationKeys, setReadNotificationKeys] = useState(() => loadStoredStringSet(notificationReadKeysStorageKey));
  const [topbarMenuOpen, setTopbarMenuOpen] = useState(false);
  const [adminHeaderOpen, setAdminHeaderOpen] = useState(false);
  const [adminFunctionWindow, setAdminFunctionWindow] = useState("");
  const [adminHeaderName, setAdminHeaderName] = useState(profileName);
  const [adminHeaderPassword, setAdminHeaderPassword] = useState("");
  const [adminHeaderMessage, setAdminHeaderMessage] = useState("");
  const [pushNotificationState, setPushNotificationState] = useState("idle");
  const [pushNotificationSaving, setPushNotificationSaving] = useState(false);
  const [pushNotificationMessage, setPushNotificationMessage] = useState("");
  const [automationEnabled, setAutomationEnabled] = useState({ whatsapp: true, email: true, openai: true });
  const [openFaq, setOpenFaq] = useState(0);
  const [settings, setSettings] = useState({ company: "SOBRE RUEDAS", email: "flota@sobreruedas.es", serviceWarning: "5000", lowConfidence: "94" });
  const [homeReportTab, setHomeReportTab] = useState("General");
  const [homeChartMetric, setHomeChartMetric] = useState("summary");
  const [reportMonth, setReportMonth] = useState(() => new Date().getMonth());
  const [reportYear, setReportYear] = useState(() => new Date().getFullYear());
  const [quickMenuStep, setQuickMenuStep] = useState("");
  const [quickMenuCategory, setQuickMenuCategory] = useState("");
  const [maintenanceSearchQuery, setMaintenanceSearchQuery] = useState("");
  const [maintenanceSearchOpen, setMaintenanceSearchOpen] = useState(false);
  const [maintenanceSearchSelection, setMaintenanceSearchSelection] = useState(null);
  const toastTimer = useRef();
  const adminDataSnapshotRef = useRef({
    transactionsReady: false,
    documentsReady: false,
    driverEntriesReady: false,
    transactionIds: new Set(),
    documentIds: new Set(),
    driverEntries: new Map(),
  });

  const unreadAdminNotifications = useMemo(
    () => adminNotifications.filter((activity) => !readNotificationKeys.has(activity.key)),
    [adminNotifications, readNotificationKeys],
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(invoiceNoticeCountStorageKey, String(unreadInvoiceCount));
    } catch {
      // El marcador solo mejora la continuidad; no debe impedir usar la aplicación.
    }
  }, [invoiceNoticeCountStorageKey, unreadInvoiceCount]);

  useEffect(() => {
    try {
      window.localStorage.setItem(notificationReadKeysStorageKey, JSON.stringify([...readNotificationKeys].slice(-200)));
    } catch {
      // El marcador solo mejora la continuidad; no debe impedir usar la aplicación.
    }
  }, [notificationReadKeysStorageKey, readNotificationKeys]);

  const markAdminNotificationsSeen = useCallback((activities = []) => {
    const keys = activities.map((activity) => activity?.key).filter(Boolean);
    if (!keys.length) return;
    setReadNotificationKeys((current) => {
      const next = new Set(current);
      keys.forEach((key) => next.add(key));
      return next;
    });
  }, []);

  const markInvoicesSeen = useCallback(() => {
    setUnreadInvoiceCount(0);
  }, []);

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setPushNotificationState("idle");
      setPushNotificationMessage("");
      return undefined;
    }
    let mounted = true;
    getPushNotificationState().then((state) => {
      if (mounted) setPushNotificationState(state);
    });
    return () => { mounted = false; };
  }, [isAdmin]);

  const enableAdminPushNotifications = useCallback(async () => {
    if (!isAdmin || pushNotificationSaving) return;
    setPushNotificationSaving(true);
    setPushNotificationMessage("");
    try {
      await enablePushNotifications();
      setPushNotificationState("enabled");
      setPushNotificationMessage("Avisos activados en este dispositivo.");
    } catch (error) {
      const nextMessage = error?.message || "No se han podido activar los avisos.";
      setPushNotificationState(nextMessage.includes("bloqueados") ? "denied" : "error");
      setPushNotificationMessage(nextMessage);
    } finally {
      setPushNotificationSaving(false);
    }
  }, [isAdmin, pushNotificationSaving]);

  useEffect(() => {
    setAdminHeaderName(profileName);
  }, [profileName]);

  const saveAdminHeaderName = async (event) => {
    event.preventDefault();
    if (!supabase) return;
    const nextName = adminHeaderName.trim();
    if (!nextName) {
      setAdminHeaderMessage("El nombre del administrador no puede estar vacío.");
      return;
    }
    const { error } = await supabase.from("profiles").update({ full_name: nextName, updated_at: new Date().toISOString() }).eq("id", session.user.id);
    if (error) {
      setAdminHeaderMessage(error.message);
      return;
    }
    const { error: authError } = await supabase.auth.updateUser({ data: { full_name: nextName } });
    onProfileChange({ full_name: nextName });
    if (authError) {
      setAdminHeaderMessage(`El perfil se guardó, pero no se pudo sincronizar la sesión: ${authError.message}`);
      return;
    }
    setAdminHeaderMessage("");
    notify("Perfil de administrador actualizado");
  };

  const saveAdminHeaderPassword = async (event) => {
    event.preventDefault();
    if (!adminHeaderPassword || adminHeaderPassword.length < 8 || !supabase) {
      setAdminHeaderMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: adminHeaderPassword });
    if (error) {
      setAdminHeaderMessage(error.message);
      return;
    }
    setAdminHeaderPassword("");
    setAdminHeaderMessage("");
    notify("Contraseña de administrador actualizada");
  };

  const openAdminFunctionWindow = (windowName) => {
    setAdminFunctionWindow(windowName);
    setAdminHeaderOpen(false);
    setTopbarMenuOpen(false);
    setNotificationsOpen(false);
  };

  const refreshDriverProfiles = useCallback(async () => {
    if (!isAdmin) return;
    const response = await invokeAdminUsers({ action: "list" });
    setDriverProfiles((response.profiles ?? []).map(normalizeDriverProfileRecord));
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setDriverProfiles([]);
      return undefined;
    }
    let mounted = true;
    refreshDriverProfiles().catch(() => { if (mounted) setDriverProfiles([]); });
    return () => { mounted = false; };
  }, [isAdmin, refreshDriverProfiles]);

  const announceAdminDataChanges = useCallback(({ source, nextTransactions = [], nextDocuments = [], nextDriverEntries = [] }) => {
    const snapshot = adminDataSnapshotRef.current;
    let activities = [];
    if (source === "transactions") {
      const freshTransactions = snapshot.transactionsReady ? nextTransactions.filter((transaction) => !snapshot.transactionIds.has(transaction.id)) : [];
      const nextEntryMap = new Map(nextDriverEntries.map((entry) => [entry.id, `${entry.updated_at ?? ""}:${entry.entry_date}:${entry.billing}:${entry.fuel_cost}:${entry.refunds}:${entry.odometer_km}`]));
      const freshEntries = snapshot.driverEntriesReady
        ? nextDriverEntries.filter((entry) => snapshot.driverEntries.get(entry.id) !== nextEntryMap.get(entry.id))
        : [];
      activities = buildAdminDataActivities({ transactions: freshTransactions, driverEntries: freshEntries, driverProfiles });
      snapshot.transactionIds = new Set(nextTransactions.map((transaction) => transaction.id));
      snapshot.driverEntries = nextEntryMap;
      snapshot.transactionsReady = true;
      snapshot.driverEntriesReady = true;
    }
    if (source === "documents") {
      const freshDocuments = snapshot.documentsReady ? nextDocuments.filter((document) => !snapshot.documentIds.has(document.id)) : [];
      const freshInvoiceCount = freshDocuments.filter((document) => document.category === "billing").length;
      if (freshInvoiceCount > 0) setUnreadInvoiceCount((current) => current + freshInvoiceCount);
      activities = buildAdminDataActivities({ documents: freshDocuments, driverProfiles });
      snapshot.documentIds = new Set(nextDocuments.map((document) => document.id));
      snapshot.documentsReady = true;
    }
    if (!activities.length) return;
    setAdminNotifications((current) => {
      const existing = new Set(current.map((activity) => activity.key));
      const unique = activities.filter((activity) => !existing.has(activity.key));
      if (!unique.length) return current;
      return [...unique, ...current].slice(0, 20);
    });
    const first = activities[0];
    notify(`${first.title}: ${first.detail}`);
  }, [driverProfiles, notify]);

  const refreshTransactions = useCallback(async () => {
    if (!isAdmin || !supabase) return;
    const [transactionResult, entryResult] = await Promise.all([
      fetchAllSupabaseRows(() => supabase
        .from("transactions")
        .select("id, type, occurred_on, amount, driver_id, vehicle_plate, source_document_id, category, metadata, dedupe_key, created_at")
        .order("occurred_on", { ascending: false })),
      fetchAllSupabaseRows(() => supabase
        .from("driver_entries")
        .select("id, driver_id, vehicle_plate, entry_date, billing, billing_override, cash_collected, tips, fuel_cost, fuel_liters, odometer_km, tolls, refunds, wash_expenses, other_expenses, notes, created_at, updated_at")
        .order("entry_date", { ascending: false })),
    ]);
    if (transactionResult.error) throw transactionResult.error;
    if (entryResult.error) throw entryResult.error;
    const nextTransactions = (transactionResult.data ?? []).map(normalizeTransactionRecord);
    const nextEntries = (entryResult.data ?? []).map(normalizeDriverEntryRecord);
    const centralEntries = transactionsToDriverEntries(nextTransactions);
    setTransactions(nextTransactions);
    setDriverEntries(mergeDriverEntries(nextEntries, centralEntries));
    announceAdminDataChanges({ source: "transactions", nextTransactions, nextDriverEntries: nextEntries });
  }, [announceAdminDataChanges, isAdmin]);

  const refreshDocuments = useCallback(async () => {
    if (!isAdmin || !supabase) return;
    const { data, error } = await fetchAllSupabaseRows(() => supabase
      .from("documents")
      .select("id, owner_id, category, vehicle_plate, file_path, file_name, mime_type, file_size, file_hash, extracted_data, field_confidence, overall_confidence, document_date, status, created_at, updated_at")
      .order("created_at", { ascending: false }));
    if (error) throw error;
    const nextDocuments = (data ?? []).map(normalizeDocumentRecord);
    setDocumentRecords(nextDocuments);
    announceAdminDataChanges({ source: "documents", nextDocuments });
  }, [announceAdminDataChanges, isAdmin]);

  const refreshMaintenanceReports = useCallback(async () => {
    if (!isAdmin || !supabase) return;
    const { data, error } = await listMaintenanceReports();
    if (error) throw error;
    setMaintenanceReports((data ?? []).map(normalizeMaintenanceReportRecord));
  }, [isAdmin]);

  const saveAdminMaintenanceReport = useCallback(async ({ vehiclePlate, note = "", photoFile = null } = {}) => {
    if (!isAdmin || !session.user.id) throw new Error("Solo el administrador puede crear este aviso.");
    if (photoFile) {
      const validation = validateMaintenancePhotoFile(photoFile);
      if (!validation.valid) throw new Error(validation.message);
    }
    const saved = await createMaintenanceReport({ reporterId: session.user.id, vehiclePlate, note, photoFile });
    const normalizedReport = normalizeMaintenanceReportRecord(saved);
    setMaintenanceReports((current) => [normalizedReport, ...current.filter((report) => report.id !== normalizedReport.id)]);
    notify(`Aviso de mantenimiento guardado para ${vehiclePlate}.`);
    return normalizedReport;
  }, [isAdmin, notify, session.user.id]);

  const markMaintenanceReportReviewed = useCallback(async (reportId, status = "reviewed") => {
    const updated = await updateMaintenanceReportStatus(reportId, status);
    const normalizedReport = normalizeMaintenanceReportRecord(updated);
    setMaintenanceReports((current) => current.map((report) => report.id === normalizedReport.id ? normalizedReport : report));
    notify(status === "resolved" ? "Aviso marcado como resuelto." : "Aviso marcado como revisado.");
    return normalizedReport;
  }, [notify]);

  const saveAdminDriverDay = useCallback(async ({ driverId, vehiclePlate, dateKey, mode, amount, liters, dailyKm, odometerKm, dailyKmChanged = false, odometerChanged = false, notes = "" }) => {
    if (!driverId || !vehiclePlate || !dateKey) throw new Error("Falta la asociación del conductor, coche o día.");
    const existing = driverEntries.find((entry) => entry.driver_id === driverId && String(entry.entry_date) === dateKey) ?? {};
    const numberFor = (key, nextValue) => nextValue === undefined ? Math.max(0, Number(existing[key]) || 0) : Math.max(0, Number(String(nextValue).replace(",", ".")) || 0);
    const nextBilling = mode === "billing" ? numberFor("billing", amount) : numberFor("billing");
    const nextFuelCost = mode === "fuel" ? numberFor("fuel_cost", amount) : numberFor("fuel_cost");
    const nextFuelLiters = mode === "fuel" ? numberFor("fuel_liters", liters) : numberFor("fuel_liters");
    const previousOdometer = driverEntries
      .filter((entry) => entry.driver_id === driverId && String(entry.entry_date) < dateKey)
      .reduce((max, entry) => Math.max(max, Number(entry.odometer_km) || 0), 0);
    const nextOdometer = mode === "mileage"
      ? Math.round(odometerChanged || !dailyKmChanged ? numberFor("odometer_km", odometerKm) : Math.max(0, previousOdometer + numberFor("odometer_km", dailyKm)))
      : Math.round(numberFor("odometer_km"));
    const values = {
      driver_id: driverId,
      vehicle_plate: vehiclePlate,
      entry_date: dateKey,
      billing: nextBilling,
      billing_override: mode === "billing" ? true : existing.billing_override === true,
      cash_collected: numberFor("cash_collected"),
      tips: numberFor("tips"),
      fuel_cost: nextFuelCost,
      fuel_liters: nextFuelLiters,
      odometer_km: nextOdometer,
      tolls: numberFor("tolls"),
      refunds: numberFor("refunds"),
      wash_expenses: numberFor("wash_expenses"),
      other_expenses: numberFor("other_expenses"),
      notes: notes === undefined ? existing.notes ?? null : String(notes || "").trim() || null,
      updated_at: new Date().toISOString(),
    };
    const localEntry = { ...existing, ...values, id: existing.id ?? `local-admin-${driverId}-${dateKey}`, created_at: existing.created_at ?? new Date().toISOString() };
    if (!supabase) {
      setDriverEntries((current) => mergeDriverEntries(current.filter((entry) => !(entry.driver_id === driverId && String(entry.entry_date) === dateKey)), [localEntry]));
      return localEntry;
    }

    const transactionType = mode === "billing" ? "billing" : mode === "fuel" ? "fuel" : "";
    const matchingTransactions = transactionType
      ? transactions.filter((transaction) => transaction.type === transactionType && transaction.driver_id === driverId && transaction.vehicle_plate === vehiclePlate && String(transaction.occurred_on) === dateKey)
      : [];
    const dedupeKeyForAmount = (key, nextAmount) => {
      const parts = String(key ?? "").split(":");
      if (parts.length < 4) return key || null;
      parts[3] = Number(nextAmount).toFixed(2);
      return parts.join(":");
    };
    if (matchingTransactions.length > 0) {
      const nextAmount = transactionType === "billing" ? nextBilling : nextFuelCost;
      if (nextAmount <= 0) {
        const { error } = await supabase.from("transactions").delete().in("id", matchingTransactions.map((transaction) => transaction.id));
        if (error) throw error;
      } else {
        const [primary, ...duplicates] = matchingTransactions;
        const nextMetadata = transactionType === "fuel"
          ? { ...(primary.metadata ?? {}), liters: nextFuelLiters }
          : primary.metadata ?? {};
        if (duplicates.length > 0) {
          const { error: duplicateError } = await supabase.from("transactions").delete().in("id", duplicates.map((transaction) => transaction.id));
          if (duplicateError) throw duplicateError;
        }
        const nextDedupeKey = dedupeKeyForAmount(primary.dedupe_key, nextAmount);
        const transactionUpdate = { amount: Number(nextAmount.toFixed(2)), metadata: nextMetadata, ...(nextDedupeKey ? { dedupe_key: nextDedupeKey } : {}) };
        const { error } = await supabase.from("transactions").update(transactionUpdate).eq("id", primary.id);
        if (error) throw error;
      }
    }

    const { data, error } = await supabase
      .from("driver_entries")
      .upsert(values, { onConflict: "driver_id,entry_date" })
      .select("id, driver_id, vehicle_plate, entry_date, billing, billing_override, cash_collected, tips, fuel_cost, fuel_liters, odometer_km, tolls, refunds, wash_expenses, other_expenses, notes, created_at, updated_at")
      .single();
    if (error) throw error;
    await refreshTransactions();
    return normalizeDriverEntryRecord(data);
  }, [driverEntries, refreshTransactions, transactions]);

  const removeAdminDriverDocument = useCallback(async (document) => {
    if (!document?.id) throw new Error("No se ha encontrado el documento.");
    if (!supabase) {
      setDocumentRecords((current) => current.filter((candidate) => candidate.id !== document.id));
      return true;
    }
    const result = await deleteDocumentRecord(document);
    await Promise.allSettled([refreshTransactions(), refreshDocuments()]);
    if (result?.storageError) notify("Documento eliminado; el archivo privado quedó pendiente de limpieza.");
    return true;
  }, [notify, refreshDocuments, refreshTransactions]);

  useEffect(() => {
    if (!isAdmin || !supabase) {
      setDriverEntries([]);
      setTransactions([]);
      setDocumentRecords([]);
      setMaintenanceReports([]);
      setAdminNotifications([]);
      adminDataSnapshotRef.current = {
        transactionsReady: false,
        documentsReady: false,
        driverEntriesReady: false,
        transactionIds: new Set(),
        documentIds: new Set(),
        driverEntries: new Map(),
      };
      return undefined;
    }
    const refreshAll = () => Promise.allSettled([refreshTransactions(), refreshDocuments(), refreshMaintenanceReports(), refreshDriverProfiles()]);
    void refreshAll();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshAll();
    };
    const refreshTimer = window.setInterval(refreshWhenVisible, 15000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const unsubscribe = subscribeToAppChanges({
      userId: session.user.id,
      isAdmin: true,
      onChange: ({ table }) => {
        setRealtimeRevision((current) => current + 1);
        if (table === "profiles") {
          Promise.allSettled([refreshDriverProfiles(), getProfile({ id: session.user.id }).then(({ data, error }) => {
            if (!error && data) onProfileChange(data);
          })]);
          return;
        }
        if (table === "maintenance_reports") {
          refreshMaintenanceReports().catch(() => undefined);
          return;
        }
        if (table === "documents") {
          Promise.allSettled([refreshDocuments(), refreshTransactions()]);
          return;
        }
        if (["driver_entries", "transactions"].includes(table)) {
          refreshTransactions().catch(() => undefined);
          return;
        }
        refreshAll();
      },
      onStatus: (status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") notify("La conexión en tiempo real se está recuperando.");
      },
    });
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      unsubscribe();
    };
  }, [isAdmin, notify, onProfileChange, refreshDocuments, refreshDriverProfiles, refreshMaintenanceReports, refreshTransactions, session.user.id]);

  useEffect(() => {
    const onBottomNavigationClick = (event) => {
      if (!(event.target instanceof Element)) return;
      if (quickMenuStep && !event.target.closest(".bottom-navigation__quick-menu") && !event.target.closest(".bottom-navigation__add")) setQuickMenuStep("");
    };
    document.addEventListener("click", onBottomNavigationClick);
    return () => document.removeEventListener("click", onBottomNavigationClick);
  }, [quickMenuStep]);

  useEffect(() => {
    const handleHash = () => {
      const nextNav = navFromHash();
      setActiveNav(nextNav);
      setTopbarMenuOpen(false);
      setAdminHeaderOpen(false);
      setAdminFunctionWindow("");
      if (nextNav === "Gasolina") {
        setInspectorTab("Gasolina");
        setInspectorOpen(false);
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setModal(null);
        setNotificationsOpen(false);
        setTopbarMenuOpen(false);
        setAdminHeaderOpen(false);
        setAdminFunctionWindow("");
        setQuickMenuStep("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!(event.target instanceof Element)) return;
      if (topbarMenuOpen && !event.target.closest(".topbar-management-menu, .topbar-menu-button")) setTopbarMenuOpen(false);
      if (adminHeaderOpen && !event.target.closest(".admin-header-sheet, .admin-title-control")) setAdminHeaderOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [adminHeaderOpen, topbarMenuOpen]);

  const centralMaintenanceInvoices = useMemo(() => transactions
    .filter((transaction) => transaction.type === "maintenance" && transaction.vehicle_plate)
    .map((transaction) => {
      const sourceDocument = documentRecords.find((document) => document.id === transaction.source_document_id);
      const fields = getExtractedDocumentFields(sourceDocument);
      const metadata = transaction.metadata ?? {};
      const concept = metadata.concept || fields.concept || fields.expenseCategory || "Taller";
      const provider = metadata.company || fields.company || fields.provider || "Taller no identificado";
      const invoiceNumber = metadata.invoiceNumber || fields.invoiceNumber || `DOC-${String(transaction.source_document_id ?? transaction.id).slice(0, 8)}`;
      return {
        id: invoiceNumber,
        sourceDocumentId: transaction.source_document_id,
        date: formatDocumentDisplayDate(transaction.occurred_on),
        dateIso: transaction.occurred_on,
        provider,
        plate: canonicalizeVehiclePlate(transaction.vehicle_plate),
        concept,
        amount: Number(transaction.amount) || 0,
        source: "Documento IA",
        status: sourceDocument?.status === "approved" ? "Asociada" : "Revisar",
        items: [{ concept, amount: Number(transaction.amount) || 0 }],
        filePath: sourceDocument?.file_path ?? "",
      };
    }), [documentRecords, transactions]);
  const invoices = useMemo(() => {
    const central = centralMaintenanceInvoices.map((invoice) => applyMaintenanceEdit(invoice, maintenanceEdits));
    const imported = importedMaintenanceInvoices
      .map((invoice) => ({ ...invoice, plate: canonicalizeVehiclePlate(invoice.plate), owner: getVehicleOwner(invoice.plate) }))
      .map((invoice) => applyMaintenanceEdit(invoice, maintenanceEdits));
    const gestoria = gestoriaInvoices.map((invoice) => ({ ...invoice, plate: canonicalizeVehiclePlate(invoice.plate), owner: invoice.owner ?? getVehicleOwner(invoice.plate) }));
    const centralIds = new Set(central.map((invoice) => invoice.sourceDocumentId).filter(Boolean));
    const knownSignatures = new Set([...central, ...imported].map((invoice) => [
      normalizeText(invoice.plate),
      invoice.dateIso || invoice.date,
      Number(invoice.amount || 0).toFixed(2),
      normalizeText(invoice.concept),
    ].join("|")));
    const local = photoInvoices
      .map((invoice) => applyMaintenanceEdit({ ...invoice, plate: canonicalizeVehiclePlate(invoice.plate), owner: getVehicleOwner(invoice.plate) }, maintenanceEdits))
      .filter((invoice) => {
        const signature = [
          normalizeText(invoice.plate),
          invoice.dateIso || invoice.date,
          Number(invoice.amount || 0).toFixed(2),
          normalizeText(invoice.concept),
        ].join("|");
        return (!invoice.sourceDocumentId || !centralIds.has(invoice.sourceDocumentId)) && !knownSignatures.has(signature);
      })
    return [...central, ...imported, ...gestoria, ...local]
      .map((invoice) => ({ ...invoice, plate: canonicalizeVehiclePlate(invoice.plate), owner: invoice.owner ?? getVehicleOwner(invoice.plate) }))
      .sort((left, right) => String(right.dateIso ?? "").localeCompare(String(left.dateIso ?? "")));
  }, [centralMaintenanceInvoices, maintenanceEdits, photoInvoices]);
  const ledgerTransactions = useMemo(() => {
    const existingDedupeKeys = new Set(transactions.map((transaction) => transaction.dedupe_key).filter(Boolean));
    const importedGestoriaRows = gestoriaTransactions.filter((transaction) => !existingDedupeKeys.has(transaction.dedupe_key));
    const rows = [...transactions.map(normalizeTransactionRecord), ...importedGestoriaRows].map((transaction) => {
      if (transaction.type !== "maintenance") return transaction;
      const override = maintenanceEdits?.[getMaintenanceEditKey(transaction)];
      if (!override) return transaction;
      const occurredOn = isMaintenanceDate(override.dateIso) ? override.dateIso : transaction.occurred_on;
      const metadata = { ...(transaction.metadata ?? {}) };
      if (override.km !== "" && override.km !== null && Number.isFinite(Number(override.km))) metadata.odometerKm = Number(override.km);
      return { ...transaction, occurred_on: occurredOn, metadata };
    });
    const signatures = new Set(rows.map((transaction) => [
      transaction.type,
      normalizeText(transaction.vehicle_plate),
      transaction.occurred_on,
      Number(transaction.amount || 0).toFixed(2),
      normalizeText(transaction.metadata?.concept),
    ].join("|")));
    invoices.filter((invoice) => invoice.sourceDocumentId?.startsWith("authorized-gmail:")).forEach((invoice) => {
      const signature = ["maintenance", normalizeText(invoice.plate), invoice.dateIso || "", Number(invoice.amount || 0).toFixed(2), normalizeText(invoice.concept)].join("|");
      if (!invoice.dateIso || signatures.has(signature)) return;
      signatures.add(signature);
      rows.push({
        id: `authorized-maintenance:${invoice.id}`,
        type: "maintenance",
        occurred_on: invoice.dateIso,
        amount: Number(invoice.amount) || 0,
        vehicle_plate: invoice.plate,
        driver_id: null,
        source_document_id: invoice.sourceDocumentId,
        dedupe_key: `authorized-maintenance:${invoice.id}`,
        metadata: {
          concept: invoice.concept,
          company: invoice.provider,
          invoiceNumber: invoice.id,
          sourceFile: invoice.sourceFile,
          documentType: invoice.typeLabel,
        },
        created_at: invoice.sourceDate || invoice.dateIso,
      });
    });
    return rows;
  }, [invoices, maintenanceEdits, transactions]);
  const vehicles = useMemo(() => vehiclesSeed.map((vehicle) => {
    const recordedMaintenance = invoices
      .filter((invoice) => invoice.kind !== "gestoria" && invoice.plate === vehicle.plate)
      .map((invoice) => ({
        date: invoice.date,
        dateIso: invoice.dateIso,
        km: Number(invoice.km) || vehicle.odometer,
        concept: invoice.concept,
        amount: Number(invoice.amount) || 0,
        invoiceId: invoice.id,
        maintenanceEditKey: invoice.maintenanceEditKey || getMaintenanceEditKey(invoice),
      }));
    return { ...vehicle, maintenance: recordedMaintenance, monthlyFuel: [], nextServiceKm: vehicle.odometer, serviceDate: "" };
  }).map((vehicle) => {
    if (vehicle.use !== "Profesional") return { ...vehicle, driverProfiles: [] };
    const assignedProfiles = orderDriverProfilesForVehicle(vehicle, driverProfiles.filter((driver) => canonicalizeVehiclePlate(driver.vehicle_plate) === vehicle.plate));
    if (!assignedProfiles.length) return { ...vehicle, driverProfiles: [] };
    const resolvedDrivers = vehicle.drivers.map((seedDriver, index) => assignedProfiles[index]?.full_name || seedDriver);
    const extraDrivers = assignedProfiles.slice(vehicle.drivers.length).map((driver) => driver.full_name);
    const driverNameMap = new Map(vehicle.drivers.map((seedDriver, index) => [seedDriver, resolvedDrivers[index]]));
    const resolveDriver = (name) => driverNameMap.get(name) ?? name;
    return {
      ...vehicle,
      drivers: [...resolvedDrivers, ...extraDrivers],
      driverProfiles: assignedProfiles,
      shifts: vehicle.shifts.map((shift) => ({ ...shift, driver: resolveDriver(shift.driver) })),
      fuelSchedule: vehicle.fuelSchedule?.map((shift) => ({ ...shift, driver: resolveDriver(shift.driver) })),
      monthlyFuel: vehicle.monthlyFuel?.map((entry) => entry.driver ? { ...entry, driver: resolveDriver(entry.driver) } : entry),
    };
  }).sort((a, b) => vehicleOrder.indexOf(a.plate) - vehicleOrder.indexOf(b.plate)), [driverProfiles, invoices]);

  useEffect(() => {
    setSelectedDrivers((current) => {
      let changed = false;
      const next = { ...current };
      vehicles.forEach((vehicle) => {
        if (vehicle.use === "Profesional" && vehicle.drivers.length > 0 && !vehicle.drivers.includes(next[vehicle.plate])) {
          next[vehicle.plate] = vehicle.drivers[0];
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [vehicles]);

  const maintenanceSearchRecords = useMemo(() => buildMaintenanceSearchRecords(vehicles, invoices), [invoices, vehicles]);
  const maintenanceSearchSuggestions = useMemo(() => {
    const normalizedQuery = normalizeText(maintenanceSearchQuery.trim());
    if (!normalizedQuery) return [];
    return maintenanceSearchRecords.filter((record) => record.searchText.includes(normalizedQuery)).slice(0, 5);
  }, [maintenanceSearchQuery, maintenanceSearchRecords]);

  useEffect(() => {
    window.localStorage.setItem(photoInvoiceStorageKey, JSON.stringify(photoInvoices));
  }, [photoInvoices]);

  useEffect(() => {
    window.localStorage.setItem(maintenanceEditsStorageKey, JSON.stringify(maintenanceEdits));
  }, [maintenanceEdits]);

  useEffect(() => {
    window.localStorage.setItem(processedDocumentStorageKey, JSON.stringify(processedDocuments));
  }, [processedDocuments]);

  useEffect(() => {
    if (activeNav === "Mantenimiento") return;
    setMaintenanceSearchQuery("");
    setMaintenanceSearchOpen(false);
    setMaintenanceSearchSelection(null);
  }, [activeNav]);

  useEffect(() => {
    if (activeNav === "Facturas" && unreadInvoiceCount > 0) markInvoicesSeen();
  }, [activeNav, markInvoicesSeen, unreadInvoiceCount]);

  const selected = vehicles.find((vehicle) => vehicle.plate === selectedPlate) ?? vehicles[0];
  const selectedDriver = selectedDrivers[selected.plate] ?? selected.drivers[0];
  const selectedActivity = getDriverDay(selected, selectedDriver);
  const showInspector = activeNav === "Vehículos" && inspectorOpen;
  const detailHeaderTitle = activeNav === "Mantenimiento"
    ? "MANTENIMIENTO"
    : activeNav === "Informes" && homeReportTab === "Facturación"
      ? "Facturación"
      : activeNav === "Informes" && homeReportTab === "Repostaje"
        ? "Combustible"
        : "";
  const compactDetailHeader = Boolean(detailHeaderTitle);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return vehicles.filter((vehicle) => {
      const searchable = `${vehicle.plate} ${vehicle.model} ${vehicle.drivers.join(" ")} ${vehicle.maintenance.map((item) => item.concept).join(" ")}`.toLocaleLowerCase("es");
      return (!normalized || searchable.includes(normalized)) && (filter === "Todos" || vehicle.use === filter);
    });
  }, [filter, query, vehicles]);

  const savePhotoInvoiceLegacy = async (invoice) => {
    const { file, ...localInvoice } = invoice;
    const normalizedInvoice = { ...localInvoice, plate: canonicalizeVehiclePlate(localInvoice.plate) };
    setPhotoInvoices((current) => [normalizedInvoice, ...current.filter((item) => item.id !== normalizedInvoice.id)]);
    if (file && supabase && session.user?.id) {
      try {
        await uploadDocumentRecord({ ownerId: session.user.id, category: "billing", vehiclePlate: normalizedInvoice.plate, file, documentDate: normalizedInvoice.dateIso || null, extractedData: normalizedInvoice, overallConfidence: 96, status: "review" });
      } catch (error) {
        notify(`Factura guardada localmente; no se pudo subir el adjunto: ${error.message}`);
      }
    }
  };

  const saveProcessedDocumentLegacy = async (document) => {
    const { file, originalFile, ...documentWithoutFile } = document;
    const archiveFile = originalFile || file;
    const savedDocument = { ...documentWithoutFile, id: document.id || `DOC-${Date.now()}`, savedAt: new Date().toISOString() };
    setProcessedDocuments((current) => [savedDocument, ...current.filter((item) => item.id !== savedDocument.id)]);
    let cloudSaved = false;
    if (archiveFile && supabase && session.user?.id) {
      try {
        const fields = savedDocument.fields ?? {};
        const documentDate = savedDocument.category === "billing" ? fields.serviceDate || fields.issueDate || fields.date || fields.periodStart : fields.date || fields.serviceDate || fields.issueDate;
        if (!documentDate) throw new Error("Indica la fecha impresa del documento antes de guardarlo.");
        const fileHash = await hashDocumentFile(archiveFile);
        const assignedVehicle = savedDocument.driverId ? driverProfiles.find((profile) => profile.id === savedDocument.driverId)?.vehicle_plate : "";
        const vehiclePlate = canonicalizeVehiclePlate(assignedVehicle || savedDocument.vehiclePlate || fields.vehicle) || resolveVehiclePlate(fields.vehicle);
        const uploaded = await uploadDocumentRecord({ ownerId: session.user.id, category: savedDocument.category, vehiclePlate, file: archiveFile, fileHash, documentDate, extractedData: { ...fields, vehicle: vehiclePlate }, fieldConfidence: savedDocument.fieldConfidence, overallConfidence: savedDocument.overallConfidence, status: "review" });
        const operations = operationsFromDocument({ category: savedDocument.category, fields: { ...fields, vehicle: vehiclePlate }, vehiclePlate, fileHash, fallbackDate: documentDate });
        const result = await confirmDocumentTransactions(uploaded.id, operations);
        if (result?.duplicate && !result?.created && operations.length > 0) throw new Error("Este documento ya estaba registrado y no se ha vuelto a sumar.");
        await refreshTransactions();
        cloudSaved = true;
      } catch (error) {
        const duplicate = error?.code === "23505" || /duplicad|ya estaba registrado|file_hash/i.test(error?.message ?? "");
        notify(duplicate ? "Documento duplicado: no se ha vuelto a sumar ningún importe." : `No se pudo registrar el documento: ${error.message}`);
        return;
      }
    }
    if (savedDocument.category === "billing" && !cloudSaved) {
      const fields = savedDocument.fields ?? {};
      const amount = Number(fields.total) || Number(fields.netAmount) || 0;
      const vehiclePlate = resolveVehiclePlate(fields.vehicle);
      if (amount > 0 && vehiclePlate) {
        const dateIso = /^\d{4}-\d{2}-\d{2}$/.test(String(fields.issueDate ?? "")) ? fields.issueDate : fields.serviceDate;
        if (!dateIso) {
          notify("La factura necesita una fecha impresa antes de archivarse.");
          return;
        }
        const displayDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${dateIso}T12:00:00`)).replace(".", "");
        savePhotoInvoiceLegacy({
          id: fields.invoiceNumber || `FAC-IA-${String(Date.now()).slice(-6)}`,
          date: displayDate,
          dateIso,
          provider: fields.company || "Empresa no identificada",
          plate: vehiclePlate,
          concept: fields.concept || fields.expenseCategory || "Documento de facturación",
          amount,
          source: "IA · Documento",
          status: savedDocument.lowConfidence ? "Revisar" : "Asociada",
          items: [{ concept: fields.concept || fields.expenseCategory || "Importe extraído", amount }],
        });
      }
    }
    notify(savedDocument.lowConfidence ? `Datos guardados${cloudSaved ? " en Supabase" : ""}; revisa los campos de baja confianza` : `Datos clasificados y guardados${cloudSaved ? " en Supabase" : ""} correctamente`);
  };

  const resolveVehiclePlate = (value) => {
    const normalizedPlate = canonicalizeVehiclePlate(value);
    return vehicles.find((vehicle) => vehicle.plate === normalizedPlate)?.plate ?? selectedPlate;
  };
  const addLocalDocumentTransactions = (documentId, operations) => {
    const duplicate = operations.some((operation) => transactions.some((transaction) => transaction.dedupe_key === operation.dedupeKey));
    if (duplicate) return { duplicate: true };
    const rows = operations.map((operation, index) => ({
      id: `local-transaction-${documentId}-${index}`,
      type: operation.type,
      occurred_on: operation.date,
      amount: operation.amount,
      driver_id: operation.driverId || null,
      vehicle_plate: operation.vehiclePlate || null,
      source_document_id: documentId,
      category: operation.category,
      metadata: operation.metadata ?? {},
      dedupe_key: operation.dedupeKey,
      created_at: new Date().toISOString(),
    }));
    setTransactions((current) => [...rows, ...current]);
    setDriverEntries((current) => mergeDriverEntries(current, transactionsToDriverEntries(rows)));
    return { duplicate: false, rows };
  };

  const savePhotoInvoiceCentral = async (invoice) => {
    const { file, ...rawInvoice } = invoice;
    const localInvoice = { ...rawInvoice, plate: canonicalizeVehiclePlate(rawInvoice.plate) };
    if (file && supabase && session.user?.id) {
      try {
        const fileHash = await hashDocumentFile(file);
        const fields = { company: localInvoice.provider, invoiceNumber: localInvoice.id, serviceDate: localInvoice.dateIso, total: localInvoice.amount, netAmount: localInvoice.amount, concept: localInvoice.concept, expenseCategory: "Taller", vehicle: localInvoice.plate };
        const uploaded = await uploadDocumentRecord({ ownerId: session.user.id, category: "billing", vehiclePlate: localInvoice.plate, file, fileHash, documentDate: localInvoice.dateIso, extractedData: fields, overallConfidence: 96, status: "review" });
        const operations = operationsFromDocument({ category: "billing", fields, vehiclePlate: localInvoice.plate, fileHash, fallbackDate: localInvoice.dateIso });
        const result = await confirmDocumentTransactions(uploaded.id, operations);
        if (result?.duplicate && !result?.created) throw Object.assign(new Error("Este documento ya estaba registrado y no se ha vuelto a sumar."), { code: "DUPLICATE_DOCUMENT" });
        const normalizedUploaded = normalizeDocumentRecord(uploaded);
        setDocumentRecords((current) => [normalizedUploaded, ...current.filter((document) => document.id !== normalizedUploaded.id)]);
        await Promise.allSettled([refreshTransactions(), refreshDocuments()]);
        return true;
      } catch (error) {
        const duplicate = error?.code === "23505" || error?.code === "DUPLICATE_DOCUMENT" || /duplicad|ya estaba registrado|file_hash/i.test(error?.message ?? "");
        setPhotoInvoices((current) => [localInvoice, ...current.filter((item) => item.id !== localInvoice.id)]);
        notify(duplicate ? "Documento duplicado: no se ha vuelto a sumar ningÃºn importe." : `Factura guardada localmente; no se pudo registrar en Supabase: ${error.message}`);
        return false;
      }
    }
    const localDocument = { ...localInvoice, id: localInvoice.id || `DOC-${Date.now()}`, category: "billing", vehicle_plate: localInvoice.plate, extracted_data: localInvoice, status: "review", created_at: new Date().toISOString() };
    const operations = operationsFromDocument({ category: "billing", fields: { ...localInvoice, serviceDate: localInvoice.dateIso, total: localInvoice.amount, expenseCategory: "Taller", vehicle: localInvoice.plate }, vehiclePlate: localInvoice.plate, fallbackDate: localInvoice.dateIso });
    const result = addLocalDocumentTransactions(localDocument.id, operations);
    if (result.duplicate) {
      notify("Documento duplicado: no se ha vuelto a sumar ningÃºn importe.");
      return false;
    }
    setPhotoInvoices((current) => [localInvoice, ...current.filter((item) => item.id !== localInvoice.id)]);
    const normalizedLocalDocument = normalizeDocumentRecord(localDocument);
    setDocumentRecords((current) => [normalizedLocalDocument, ...current.filter((document) => document.id !== normalizedLocalDocument.id)]);
    return true;
  };

  const saveMaintenanceEdit = ({ editKey, dateIso, km }) => {
    if (!editKey || !isMaintenanceDate(dateIso) || !Number.isFinite(Number(km)) || Number(km) < 0) return false;
    setMaintenanceEdits((current) => ({
      ...current,
      [editKey]: { dateIso, km: Number(km), updatedAt: new Date().toISOString() },
    }));
    return true;
  };

  const saveProcessedDocumentCentral = async (document) => {
    const { file, originalFile, ...documentWithoutFile } = document;
    const archiveFile = originalFile || file;
    const savedDocument = { ...documentWithoutFile, id: document.id || `DOC-${Date.now()}`, savedAt: new Date().toISOString() };
    const fields = savedDocument.fields ?? {};
    const driverId = savedDocument.driverId || "";
    const assignedVehicle = driverId ? driverProfiles.find((profile) => profile.id === driverId)?.vehicle_plate : "";
    // A driver upload inherits the active profile's vehicle. OCR may contain
    // a stale or unrelated plate; it must never redirect the ledger to a
    // different car.
    const vehiclePlate = canonicalizeVehiclePlate(assignedVehicle || savedDocument.vehiclePlate || fields.vehicle) || resolveVehiclePlate(fields.vehicle);
    const recordType = savedDocument.recordType || fields.recordType || "";
    const mileageOnly = ["daily-km", "partial-1", "total-km", "total", "odometer", "odometro", "kilometraje diario", "km diarios", "kilometraje total", "km acumulados"].includes(normalizeText(recordType));
    const extractedData = { ...fields, vehicle: vehiclePlate, ...(driverId ? { driverId } : {}), ...(recordType ? { recordType } : {}), source: savedDocument.source || "document-processing" };
    let cloudSaved = false;
    try {
      const documentDate = savedDocument.category === "billing" ? fields.serviceDate || fields.issueDate || fields.date || fields.periodStart : fields.date || fields.serviceDate || fields.issueDate;
      if (!documentDate) throw Object.assign(new Error("Indica la fecha impresa del documento antes de guardarlo."), { code: "MISSING_DOCUMENT_DATE" });
      const fileHash = archiveFile ? await hashDocumentFile(archiveFile) : "";
      const operations = mileageOnly ? [] : operationsFromDocument({ category: savedDocument.category, fields: extractedData, driverId, vehiclePlate, fileHash, fallbackDate: documentDate });
      if (archiveFile && supabase && session.user?.id) {
        const uploaded = await uploadDocumentRecord({ ownerId: driverId || session.user.id, category: savedDocument.category, vehiclePlate, file: archiveFile, fileHash, documentDate, extractedData, fieldConfidence: savedDocument.fieldConfidence, overallConfidence: savedDocument.overallConfidence, status: "review" });
        // Confirm even an empty operation list: if this is a re-review and the
        // user has cleared every amount, the old central movements must be
        // removed instead of being resurrected on the next refresh. A new
        // document with no recognized amount remains archived for review.
        const result = await confirmDocumentTransactions(uploaded.id, operations);
        if (result?.duplicate && !result?.created && operations.length > 0) throw Object.assign(new Error("Este documento ya estaba registrado y no se ha vuelto a sumar."), { code: "DUPLICATE_DOCUMENT" });
        const normalizedUploaded = normalizeDocumentRecord(uploaded);
        setDocumentRecords((current) => [normalizedUploaded, ...current.filter((record) => record.id !== normalizedUploaded.id)]);
        await Promise.allSettled([refreshTransactions(), refreshDocuments()]);
        cloudSaved = true;
      } else {
        if (operations.length > 0) {
          const result = addLocalDocumentTransactions(savedDocument.id, operations);
          if (result.duplicate) throw Object.assign(new Error("Este documento ya estaba registrado y no se ha vuelto a sumar."), { code: "DUPLICATE_DOCUMENT" });
        }
        const localDocument = { ...savedDocument, vehicle_plate: vehiclePlate, extracted_data: extractedData, status: operations.length > 0 ? "approved" : "review", created_at: new Date().toISOString() };
        const normalizedLocalDocument = normalizeDocumentRecord(localDocument);
        setDocumentRecords((current) => [normalizedLocalDocument, ...current.filter((record) => record.id !== normalizedLocalDocument.id)]);
      }
    } catch (error) {
      const duplicate = error?.code === "23505" || error?.code === "DUPLICATE_DOCUMENT" || /duplicad|ya estaba registrado|file_hash/i.test(error?.message ?? "");
      const message = duplicate ? "Documento duplicado: no se ha vuelto a sumar ningún importe." : `No se pudo registrar el documento: ${error.message}`;
      notify(message);
      return { ok: false, message };
    }
    setProcessedDocuments((current) => [savedDocument, ...current.filter((item) => item.id !== savedDocument.id)]);
    notify(savedDocument.lowConfidence ? `Datos guardados${cloudSaved ? " en Supabase" : ""}; revisa los campos de baja confianza` : `Datos clasificados y guardados${cloudSaved ? " en Supabase" : ""} correctamente`);
    return { ok: true };
  };

  const installApplication = () => onInstall?.(notify);

  const navigate = (item) => {
    setActiveNav(item.label);
    setNotificationsOpen(false);
    setTopbarMenuOpen(false);
    if (window.location.hash !== `#/${item.slug}`) window.location.hash = `/${item.slug}`;
  };

  const openMaintenanceSearchRecord = (record) => {
    setMaintenanceSearchOpen(false);
    setMaintenanceSearchQuery(record.item.concept);
    setMaintenanceSearchSelection({ plate: record.plate, key: record.key, selectionId: Date.now() });
    setMaintenancePlate(record.plate);
  };

  const openGeneral = () => {
    setHomeReportTab("General");
    setHomeChartMetric("summary");
    navigate(navItems[0]);
  };

  const navigateFleetSubItem = (item) => {
    if (item.label === "Gasolina") {
      setInspectorTab("Gasolina");
      setInspectorOpen(window.innerWidth > 820);
      navigate(navItems[1]);
      return;
    }
    navigate(item);
  };

  const selectVehicle = (vehicle) => {
    const driver = selectedDrivers[vehicle.plate] ?? vehicle.drivers[0];
    const activity = getDriverDay(vehicle, driver);
    setSelectedPlate(vehicle.plate);
    setOpenShift(activity.id ?? "");
    setInspectorOpen(true);
  };

  const selectDriver = (vehicle, driver) => {
    const activity = getDriverDay(vehicle, driver);
    setSelectedDrivers((current) => ({ ...current, [vehicle.plate]: driver }));
    setSelectedPlate(vehicle.plate);
    setOpenShift(activity.id ?? "");
    if (activeNav !== "Gasolina") setInspectorTab("Turnos");
    setInspectorOpen(true);
  };

  const openWorkshop = (vehicle) => {
    setMaintenancePlate(vehicle.plate);
    navigateFleetSubItem(fleetSubItems[0]);
    window.setTimeout(() => document.getElementById("taller-vehiculo")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const openVehicleFromModule = (plate, tab = "Turnos") => {
    setSelectedPlate(plate);
    setInspectorTab(tab);
    setInspectorOpen(true);
    navigate(navItems[1]);
  };
  const openAdminActivity = (activity) => {
    markAdminNotificationsSeen([activity]);
    setNotificationsOpen(false);
    if (activity?.plate && vehicles.some((vehicle) => vehicle.plate === activity.plate)) setSelectedPlate(activity.plate);
    navigate(activity?.target === "Conductores" ? conductorNavItem : navItems[1]);
  };

  if (previewDriver) {
    return <DriverApp session={session} profile={previewDriver} preview onExitPreview={() => setPreviewDriver(null)} onSignOut={onSignOut} onProfileChange={onProfileChange} onInstall={onInstall} isStandalone={isStandalone} />;
  }

  return (
    <div className={`app-shell ${showInspector ? "app-shell--inspector" : ""}${activeNav === "Informes" && homeReportTab === "General" ? " app-shell--dashboard" : ""}${activeNav === adminNavItem.label ? " app-shell--admin" : ""}`}>
      <main className="workspace">
          <header className={`${["Informes", "Gasolina", "Vehículos", "Conductores", "Administración"].includes(activeNav) ? "topbar topbar--reports" : "topbar"}${compactDetailHeader ? " topbar--detail" : ""}${activeNav === "Mantenimiento" ? " topbar--maintenance" : ""}`}>
          <div className="topbar-title">
            <button className="workspace-home-button admin-topbar-home" onClick={openGeneral} aria-label="Abrir SOBRE RUEDAS" title="SOBRE RUEDAS · Resumen general"><picture aria-hidden="true"><source media="(max-width: 520px)" srcSet="/icons/sobre-ruedas-192.png?v=20260827" /><img src="/brand/sobre-ruedas-logo.png" alt="" /></picture></button>
            {activeNav === adminNavItem.label && isAdmin ? <button type="button" className="admin-title-control" onClick={() => { setAdminHeaderOpen((value) => !value); setAdminHeaderMessage(""); setTopbarMenuOpen(false); setNotificationsOpen(false); }} aria-expanded={adminHeaderOpen} aria-controls="admin-header-sheet"><span>ADMINISTRADOR</span><strong>{profileName.toLocaleUpperCase("es")}</strong><IconChevronDown size={17} /></button> : <div><span>{compactDetailHeader ? detailHeaderTitle : activeNav === "Informes" ? "SOBRE RUEDAS" : activeNav === "Conductores" ? "CONDUCTORES" : activeNav}</span>{!compactDetailHeader && <small>{activeNav === "Informes" ? "Resumen general de la flota" : activeNav === "Gasolina" ? "Control de combustible" : activeNav === "Vehículos" ? "Vehículos, facturación y consumo" : activeNav === "Conductores" ? "Facturación y consumo por conductor" : activeNav === "Administración" ? "Usuarios y permisos" : "Gestión centralizada de vehículos"}</small>}</div>}
          </div>
          {activeNav === "Mantenimiento" && <MaintenanceSearch query={maintenanceSearchQuery} open={maintenanceSearchOpen} suggestions={maintenanceSearchSuggestions} onQueryChange={setMaintenanceSearchQuery} onOpenChange={setMaintenanceSearchOpen} onSelect={openMaintenanceSearchRecord} />}
          {!compactDetailHeader && <div className="topbar-actions">
            {!isStandalone && <button className="install-app-button" onClick={installApplication} aria-label="Instalar SOBRE RUEDAS como aplicación" title="Instalar aplicación"><IconDownload size={17} /><span>Instalar app</span></button>}
            {!(activeNav === "Informes" && homeReportTab === "General") && <span className="date"><IconCalendar size={18} />28 jul 2026</span>}
            <button type="button" className={`topbar-route-button topbar-route-button--facturas${activeNav === "Facturas" ? " topbar-route-button--active" : ""}`} onClick={() => navigate(navItems[3])} aria-label="Abrir Facturas" aria-current={activeNav === "Facturas" ? "page" : undefined} title="Facturas"><IconFileInvoice size={14} /><span>Facturas</span>{unreadInvoiceCount > 0 && <i>{Math.min(unreadInvoiceCount, 99)}</i>}</button>
            <button className="bell-button" aria-label={`Notificaciones${unreadAdminNotifications.length ? ` · ${unreadAdminNotifications.length} nuevas` : ""}`} aria-expanded={notificationsOpen} onClick={() => { const nextOpen = !notificationsOpen; if (nextOpen) markAdminNotificationsSeen(adminNotifications); setNotificationsOpen(nextOpen); setTopbarMenuOpen(false); }}><IconBell size={17} />{unreadAdminNotifications.length > 0 && <i>{Math.min(unreadAdminNotifications.length, 99)}</i>}</button>
            <button className="topbar-menu-button" aria-label="Abrir accesos de gestión" aria-expanded={topbarMenuOpen} aria-controls="topbar-management-menu" onClick={() => { setTopbarMenuOpen((value) => !value); setNotificationsOpen(false); }} title="Accesos de gestión"><IconMenu2 size={18} /></button>
            <button className="profile" onClick={() => { setTopbarMenuOpen((value) => !value); setNotificationsOpen(false); }}><span className="avatar">{profileInitials}</span><span><strong>{profileName}</strong><small>{isAdmin ? "Administrador" : "Conductor"}</small></span><IconChevronDown size={17} /></button>
          </div>}
          {!compactDetailHeader && topbarMenuOpen && (
            <aside id="topbar-management-menu" className="topbar-management-menu" aria-label="Accesos de gestión">
              {!isStandalone && <button className="topbar-management-menu__item" onClick={installApplication}><IconDownload size={18} /><span>Instalar app</span></button>}
              <div className="topbar-management-menu__meta"><IconCalendar size={18} /><span>28 jul 2026</span></div>
              <div className="topbar-management-menu__divider" />
              {topbarItems.map((item) => {
                const Icon = item.icon;
                const active = activeNav === item.label;
                return <button className={active ? "topbar-management-menu__item topbar-management-menu__item--active" : "topbar-management-menu__item"} key={item.label} onClick={() => navigate(item)} aria-current={active ? "page" : undefined}><Icon size={18} /><span>{item.label}</span></button>;
              })}
              <button className="topbar-management-menu__item" onClick={onSignOut}><IconLogout size={18} /><span>Cerrar sesión</span></button>
            </aside>
          )}
          {!compactDetailHeader && activeNav === adminNavItem.label && isAdmin && adminHeaderOpen && (
            <aside id="admin-header-sheet" className="admin-header-sheet" aria-label="Funciones del administrador">
              <header className="admin-header-sheet__header"><div><span>PERFIL Y FUNCIONES</span><strong>{profileName.toLocaleUpperCase("es")}</strong></div><button type="button" className="icon-button" onClick={() => setAdminHeaderOpen(false)} aria-label="Cerrar funciones del administrador"><IconX size={17} /></button></header>
              <div className="admin-header-sheet__functions">
                <button type="button" onClick={() => openAdminFunctionWindow("drivers")}><IconUsers size={16} /><span><b>Gestionar conductores</b><small>Perfiles y accesos de los tres coches profesionales</small></span><IconChevronRight size={15} /></button>
                <button type="button" onClick={() => openAdminFunctionWindow("permissions")}><IconShieldCheck size={16} /><span><b>Controlar permisos</b><small>Pausar, activar y revisar cada cuenta</small></span><IconChevronRight size={15} /></button>
                <button type="button" onClick={() => openAdminFunctionWindow("security")}><IconKey size={16} /><span><b>Seguridad de accesos</b><small>Restablecer contraseñas cuando sea necesario</small></span><IconChevronRight size={15} /></button>
              </div>
              <section className="admin-push-settings" aria-label="Avisos en este dispositivo">
                <div><IconBell size={17} /><span><b>Avisos en este dispositivo</b><small>Recibe una notificación cuando entre un documento aunque la aplicación esté cerrada.</small></span></div>
                <button type="button" className="secondary-button" onClick={enableAdminPushNotifications} disabled={pushNotificationSaving || pushNotificationState === "enabled"}>{pushNotificationSaving ? "Activando…" : pushNotificationState === "enabled" ? "Avisos activados" : "Activar avisos"}</button>
                {pushNotificationMessage && <p role="status">{pushNotificationMessage}</p>}
              </section>
              <form className="admin-header-sheet__form" onSubmit={saveAdminHeaderName}><label>Nombre visible<input value={adminHeaderName} onChange={(event) => setAdminHeaderName(event.target.value)} required /></label><button className="secondary-button" type="submit">Guardar nombre</button></form>
              <form className="admin-header-sheet__form admin-header-sheet__form--password" onSubmit={saveAdminHeaderPassword}><label>Nueva contraseña<input type="password" value={adminHeaderPassword} onChange={(event) => setAdminHeaderPassword(event.target.value)} minLength={8} placeholder="Mínimo 8 caracteres" /></label><button className="secondary-button" type="submit"><IconKey size={15} />Cambiar contraseña</button></form>
              {adminHeaderMessage && <p className="admin-header-sheet__message" role="alert">{adminHeaderMessage}</p>}
            </aside>
          )}
          {!compactDetailHeader && notificationsOpen && (
            <aside className="notification-popover" aria-label="Notificaciones recientes">
              <header><strong>Notificaciones</strong><div><span>{unreadAdminNotifications.length} nuevas</span><button className="icon-button" onClick={() => markAdminNotificationsSeen(adminNotifications)} aria-label="Marcar notificaciones como vistas"><IconCheck size={15} /></button><button className="icon-button" onClick={() => setNotificationsOpen(false)} aria-label="Cerrar notificaciones"><IconX size={18} /></button></div></header>
              {adminNotifications.length === 0 ? <p className="notification-popover__empty">No hay avisos nuevos.</p> : adminNotifications.slice(0, 8).map((activity) => {
                const ActivityIcon = activity.kind === "fuel" ? IconGasStation : activity.kind === "billing" ? IconFileInvoice : activity.kind === "mileage" ? IconGauge : activity.kind === "consumption" ? IconChartBar : IconAlertTriangle;
                return <button type="button" key={activity.key} onClick={() => openAdminActivity(activity)}><ActivityIcon size={18} /><span><strong>{activity.title}</strong><small>{activity.detail}</small></span></button>;
              })}
            </aside>
          )}
        </header>

        <div className={`page-scroll${activeNav === "Informes" && homeReportTab === "General" ? " page-scroll--dashboard" : ""}`}>
          {activeNav === "Vehículos" && <FuelView key="vehiculos" mode="vehicles" realtimeRevision={realtimeRevision} reportMonth={reportMonth} reportYear={reportYear} onReportMonthChange={setReportMonth} onReportYearChange={setReportYear} adminUserId={session.user.id} vehicles={vehicles} driverEntries={driverEntries} transactions={ledgerTransactions} documents={documentRecords} selected={selected} onSelectVehicle={selectVehicle} onNavigate={navigate} setModal={setModal} filtered={filtered} filter={filter} query={query} selectedDrivers={selectedDrivers} setFilter={setFilter} setQuery={setQuery} selectVehicle={selectVehicle} selectDriver={selectDriver} openWorkshop={openWorkshop} />}
          {activeNav === "Conductores" && <DriversView reportMonth={reportMonth} reportYear={reportYear} onReportMonthChange={setReportMonth} onReportYearChange={setReportYear} vehicles={vehicles} driverEntries={driverEntries} transactions={transactions} documents={documentRecords} setModal={setModal} onSaveDriverDay={saveAdminDriverDay} onDeleteDriverDocument={removeAdminDriverDocument} />}
          {activeNav === "Informes" && <FuelView key="informes" initialTab="General" realtimeRevision={realtimeRevision} reportTab={homeReportTab} onReportTabChange={setHomeReportTab} chartMetric={homeChartMetric} onChartMetricChange={setHomeChartMetric} reportMonth={reportMonth} reportYear={reportYear} onReportMonthChange={setReportMonth} onReportYearChange={setReportYear} adminUserId={session.user.id} vehicles={vehicles} driverEntries={driverEntries} transactions={ledgerTransactions} documents={documentRecords} selected={selected} onSelectVehicle={(vehicle) => setSelectedPlate(vehicle.plate)} onNavigate={navigate} setModal={setModal} />}
          {activeNav === "Gasolina" && <FuelView key="gasolina" initialTab="Repostaje" realtimeRevision={realtimeRevision} reportMonth={reportMonth} reportYear={reportYear} onReportMonthChange={setReportMonth} onReportYearChange={setReportYear} adminUserId={session.user.id} vehicles={vehicles} driverEntries={driverEntries} transactions={ledgerTransactions} documents={documentRecords} selected={selected} onSelectVehicle={(vehicle) => setSelectedPlate(vehicle.plate)} onNavigate={navigate} setModal={setModal} />}
          {activeNav === "Lecturas" && <ReadingsView setModal={setModal} />}
          {activeNav === "Facturas" && <InvoicesView invoices={invoices} setModal={setModal} />}
          {activeNav === "Mantenimiento" && <MaintenanceView initialPlate={maintenancePlate} invoices={invoices} setModal={setModal} vehicles={vehicles} maintenanceSearchSelection={maintenanceSearchSelection} maintenanceReports={maintenanceReports} driverProfiles={driverProfiles} onSaveMaintenanceReport={saveAdminMaintenanceReport} onMarkMaintenanceReportReviewed={markMaintenanceReportReviewed} />}
          {activeNav === "Administración" && isAdmin && <AdminView notify={notify} onPreviewDriver={setPreviewDriver} onDriversChange={setDriverProfiles} invoices={invoices} adminFunctionWindow={adminFunctionWindow} onAdminFunctionWindowChange={setAdminFunctionWindow} />}
          {activeNav === "Automatizaciones" && <AutomationsView enabled={automationEnabled} setEnabled={setAutomationEnabled} notify={notify} />}
          {activeNav === "Ajustes" && <SettingsView settings={settings} setSettings={setSettings} notify={notify} />}
          {activeNav === "Ayuda" && <HelpView openFaq={openFaq} setOpenFaq={setOpenFaq} setModal={setModal} />}
        </div>
      </main>

      {showInspector && (
        <VehicleInspector
          selected={selected}
          selectedDriver={selectedDriver}
          selectedActivity={selectedActivity}
          invoices={invoices}
          transactions={ledgerTransactions}
          inspectorTab={inspectorTab}
          setInspectorTab={setInspectorTab}
          setInspectorOpen={setInspectorOpen}
          setModal={setModal}
          selectDriver={selectDriver}
          openShift={openShift}
          setOpenShift={setOpenShift}
          notify={notify}
        />
      )}

      <BottomNavigation homeActive={activeNav === "Informes" && homeReportTab === "General"} onHome={openGeneral} onAdd={() => { setQuickMenuStep((current) => current ? "" : "categories"); setQuickMenuCategory(""); }} onProfile={() => navigate(adminNavItem)} profileLabel={isAdmin ? "Abrir administración" : "Abrir perfil de usuario"} />
      <QuickActionMenu
        step={quickMenuStep}
        category={quickMenuCategory}
        onCategory={(category) => { setQuickMenuCategory(category); setQuickMenuStep(""); }}
        onNotice={(message) => notify(message)}
        onDocumentAction={({ category, source, file }) => { setQuickMenuStep(""); setQuickMenuCategory(""); setModal({ type: "document-processing", category, source, file, selectedPlate }); }}
      />
      {modal && <AppModalV2 modal={modal} onClose={() => setModal(null)} notify={notify} onSaveInvoice={savePhotoInvoiceCentral} onSaveDocument={saveProcessedDocumentCentral} onSaveMaintenance={saveMaintenanceEdit} vehicles={vehicles} />}
      {toast && <div className="toast" role="status"><IconCircleCheck size={19} />{toast}</div>}
    </div>
  );
}

function AuthLoadingScreen() {
  return <main className="auth-screen"><section className="auth-panel auth-panel--loading"><span className="auth-logo"><img src="/brand/sobre-ruedas-logo.png" alt="" /></span><IconSparkles size={24} /><strong>Preparando tu espacio seguro</strong><small>Conectando con SOBRE RUEDAS…</small></section></main>;
}

function AuthScreen({ error, configurationError = false, onInstall, isStandalone = false }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("davidydiaz@gmail.com");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(() => {
    try {
      return window.localStorage.getItem("sobre-ruedas:keep-signed-in") !== "false";
    } catch {
      return true;
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [installMessage, setInstallMessage] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!supabase) {
      setFormError("La conexión con Supabase todavía no está configurada.");
      return;
    }
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (signInError) {
      if (isFutureJwtError(signInError)) {
        await clearLocalSupabaseSession();
        setFormError(futureJwtErrorMessage);
      } else {
        setFormError("Usuario o contraseña incorrectos. Si eres conductor, solicita un restablecimiento al administrador.");
      }
      return;
    }
    try {
      window.localStorage.setItem("sobre-ruedas:keep-signed-in", keepSignedIn ? "true" : "false");
      if (keepSignedIn) window.sessionStorage.removeItem("sobre-ruedas:temporary-session");
      else window.sessionStorage.setItem("sobre-ruedas:temporary-session", "active");
    } catch {
      // La sesión sigue siendo válida aunque el navegador no permita guardar esta preferencia.
    }
  };
  const requestRecovery = async (event) => {
    event.preventDefault();
    setFormError("");
    if (!supabase) {
      setFormError("La conexión con Supabase todavía no está configurada.");
      return;
    }
    const recoveryEmail = email.trim();
    if (!recoveryEmail) {
      setFormError("Introduce el correo de la cuenta que quieres recuperar.");
      return;
    }
    setSubmitting(true);
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
      redirectTo: passwordRecoveryRedirectUrl(),
    });
    setSubmitting(false);
    if (recoveryError) {
      setFormError(passwordRecoveryErrorMessage(recoveryError));
      return;
    }
    setRecoverySent(true);
  };
  const openRecovery = () => {
    setFormError("");
    setInstallMessage("");
    setRecoverySent(false);
    setMode("recovery");
  };
  const backToLogin = () => {
    setFormError("");
    setInstallMessage("");
    setRecoverySent(false);
    setPassword("");
    setMode("login");
  };
  return <main className="auth-screen"><section className="auth-panel">
    <div className="auth-panel__brand"><span className="auth-logo"><img src="/brand/sobre-ruedas-logo.png" alt="" /></span><div><span>SOBRE RUEDAS</span><small>Gestión de flota</small></div></div>
    <div className="auth-panel__heading"><span className="auth-eyebrow">{mode === "login" ? "ACCESO PRIVADO" : "RECUPERACIÓN SEGURA"}</span><h1>{mode === "login" ? "Entra en tu espacio" : "Recupera tu acceso"}</h1><p>{mode === "login" ? "Usa el correo y la contraseña de tu cuenta." : "Te enviaremos un enlace oficial de Supabase para crear una contraseña nueva."}</p></div>
    {(formError || (error && !configurationError)) && <div className="auth-alert" role="alert"><IconAlertTriangle size={18} /><span>{formError || error.message}</span></div>}
    {configurationError && <div className="auth-alert auth-alert--info" role="status"><IconDatabase size={18} /><span>La aplicación está pendiente de conectar las variables públicas de Supabase.</span></div>}
    {mode === "login" ? <>
      <form className="auth-form" onSubmit={submit}>
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@email.com" autoComplete="username" required /></label>
        <label>Contraseña<span className="auth-password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" autoComplete="current-password" required /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}</button></span></label>
        <label className="auth-keep-session"><input type="checkbox" checked={keepSignedIn} onChange={(event) => setKeepSignedIn(event.target.checked)} /><span><strong>Mantener la cuenta iniciada</strong><small>Guarda este acceso en este dispositivo.</small></span></label>
        <button className="primary-button auth-form__submit" type="submit" disabled={submitting || configurationError}>{submitting ? "Comprobando…" : "Entrar"}<IconChevronRight size={17} /></button>
      </form>
      <button className="auth-panel__link" type="button" onClick={openRecovery} disabled={configurationError}>¿Has olvidado tu contraseña?</button>
      {!isStandalone && <>
        <button className="auth-install-link" type="button" onClick={() => { setInstallMessage(""); void onInstall?.(setInstallMessage); }} disabled={!onInstall}><IconDownload size={16} />Instalar SOBRE RUEDAS en este dispositivo</button>
        {installMessage && <p className="auth-install-message" role="status">{installMessage}</p>}
      </>}
      <p className="auth-panel__help">El administrador puede gestionar los accesos de los conductores. Nunca compartas tu contraseña.</p>
    </> : <>
      {recoverySent ? <div className="auth-recovery-success" role="status"><IconMail size={22} /><strong>Revisa tu correo</strong><span>Si existe una cuenta con ese correo, recibirás un enlace para actualizar la contraseña.</span></div> : <form className="auth-form" onSubmit={requestRecovery}>
        <label>Email de la cuenta<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="davidydiaz@gmail.com" autoComplete="email" required /></label>
        <button className="primary-button auth-form__submit" type="submit" disabled={submitting || configurationError}>{submitting ? "Enviando…" : "Enviar correo de recuperación"}<IconMail size={17} /></button>
      </form>}
      <button className="auth-panel__link" type="button" onClick={backToLogin}>Volver al acceso</button>
      <p className="auth-panel__help">El enlace te devolverá a esta aplicación y te permitirá guardar la nueva contraseña.</p>
    </>}
  </section></main>;
}

function PasswordRecoveryScreen({ onComplete }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const recoveryUpdateErrorMessage = (error) => {
    const code = String(error?.code ?? "").toLowerCase();
    const message = String(error?.message ?? "").toLowerCase();
    if (code.includes("session") || message.includes("session") || message.includes("jwt") || message.includes("token")) {
      return "Este enlace de recuperación ya se ha utilizado o ha caducado. Solicita un correo nuevo y pulsa el enlace una sola vez desde un único dispositivo.";
    }
    if (message.includes("password") && (message.includes("weak") || message.includes("short") || message.includes("characters"))) {
      return "La contraseña no cumple la política de seguridad de Supabase. Usa una contraseña más larga y combina mayúsculas, minúsculas, números y símbolos.";
    }
    return "No se ha podido actualizar la contraseña. Solicita un enlace nuevo e inténtalo otra vez.";
  };
  const submit = async (event) => {
    event.preventDefault();
    setFormError("");
    if (password.length < 8) return setFormError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirmation) return setFormError("Las contraseñas no coinciden.");
    if (!supabase) return setFormError("La conexión con Supabase todavía no está configurada.");
    setSubmitting(true);
    const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshedSession?.session) {
      setSubmitting(false);
      setFormError(recoveryUpdateErrorMessage(refreshError ?? new Error("Sesión de recuperación no disponible.")));
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setFormError(recoveryUpdateErrorMessage(error));
      return;
    }
    // Deja el navegador en un estado limpio para que el usuario vuelva a
    // entrar con la contraseña recién actualizada, sin reutilizar la sesión
    // temporal del enlace de recuperación.
    await clearLocalSupabaseSession();
    window.history.replaceState(null, "", "/");
    onComplete();
  };
  return <main className="auth-screen"><section className="auth-panel auth-panel--password">
    <div className="auth-panel__brand"><span className="auth-logo"><img src="/brand/sobre-ruedas-logo.png" alt="" /></span><div><span>SOBRE RUEDAS</span><small>Gestión de flota</small></div></div>
    <div className="auth-panel__heading"><span className="auth-eyebrow">ENLACE VERIFICADO</span><h1>Crea tu nueva contraseña</h1><p>Elige una contraseña segura para volver a entrar en tu cuenta.</p></div>
    {formError && <div className="auth-alert" role="alert"><IconAlertTriangle size={18} /><span>{formError}</span></div>}
    <form className="auth-form" onSubmit={submit}>
      <label>Nueva contraseña<span className="auth-password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}>{showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}</button></span></label>
      <label>Repite la contraseña<span className="auth-password-field"><input type={showConfirmation ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={8} required /><button type="button" className="auth-password-toggle" onClick={() => setShowConfirmation((current) => !current)} aria-label={showConfirmation ? "Ocultar confirmación" : "Mostrar confirmación"}>{showConfirmation ? <IconEyeOff size={18} /> : <IconEye size={18} />}</button></span></label>
      <button className="primary-button auth-form__submit" type="submit" disabled={submitting}>{submitting ? "Guardando…" : "Actualizar contraseña"}<IconCheck size={17} /></button>
    </form>
    <p className="auth-panel__help">La contraseña se actualiza directamente en Supabase Auth y no se guarda en el navegador.</p>
  </section></main>;
}

function AccessBlockedScreen({ onSignOut }) {
  return <main className="auth-screen"><section className="auth-panel auth-panel--blocked"><span className="auth-logo"><img src="/brand/sobre-ruedas-logo.png" alt="" /></span><IconShieldCheck size={29} /><h1>Acceso pendiente</h1><p>Esta cuenta está desactivada. Contacta con David Diaz para recuperar el acceso.</p><button className="secondary-button" type="button" onClick={onSignOut}><IconLogout size={17} />Cerrar sesión</button></section></main>;
}

function DriverApp({ session, profile, onSignOut, onProfileChange, onInstall, isStandalone = false, preview = false, onExitPreview }) {
  // A preview is an administrator acting on behalf of a selected driver. In
  // a real driver session, always use the authenticated id for writes so a
  // stale profile object can never produce an RLS mismatch.
  const activeProfileId = preview ? (profile.id ?? session.user.id) : session.user.id;
  const canQueryDriverData = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(activeProfileId));
  const [selectedDate, setSelectedDate] = useState(getDriverDateKey());
  const [entry, setEntry] = useState(() => getDriverEntryForm(getDriverDateKey()));
  const [entries, setEntries] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [documentPreviews, setDocumentPreviews] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [fileCapturedAt, setFileCapturedAt] = useState(null);
  const [entryDateWasEdited, setEntryDateWasEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const selectedDayButtonRef = useRef(null);
  const periodPickerOptionRef = useRef(null);
  const periodPickerRef = useRef(null);
  const driverHomeRef = useRef(null);
  const driverStatsRef = useRef(null);
  const driverHistoryRef = useRef(null);
  const driverEntryRef = useRef(null);
  const [periodPickerOpen, setPeriodPickerOpen] = useState("");
  const [driverMenuOpen, setDriverMenuOpen] = useState(false);
  const [driverNoticeOpen, setDriverNoticeOpen] = useState(false);
  const [driverNavSection, setDriverNavSection] = useState("home");
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  useEffect(() => {
    setSelectedDate(getDriverDateKey());
    setPeriodPickerOpen("");
    setDriverMenuOpen(false);
    setDriverNoticeOpen(false);
  }, [activeProfileId, preview]);
  const [circleUpload, setCircleUpload] = useState({ key: "", status: "idle", fileName: "" });
  const [circleReview, setCircleReview] = useState(null);
  const [circlePreviewUrls, setCirclePreviewUrls] = useState({});
  const [circleMetricValues, setCircleMetricValues] = useState({});
  const [weeklyManualValues, setWeeklyManualValues] = useState(() => loadDriverWeeklyManualValues(activeProfileId));
  const profileVehiclePlate = canonicalizeVehiclePlate(profile.vehicle_plate);
  const [maintenanceNote, setMaintenanceNote] = useState(() => loadDriverMaintenanceNote(profileVehiclePlate || activeProfileId));
  const [maintenanceReports, setMaintenanceReports] = useState([]);
  const [maintenanceReportSaving, setMaintenanceReportSaving] = useState(false);
  const circleFileInputRef = useRef(null);
  const circleUploadKeyRef = useRef("");
  const circlePreviewUrlsRef = useRef({});
  const vehicle = vehiclesSeed.find((candidate) => candidate.plate === profileVehiclePlate);

  useEffect(() => {
    circlePreviewUrlsRef.current = circlePreviewUrls;
  }, [circlePreviewUrls]);

  useEffect(() => {
    setWeeklyManualValues(loadDriverWeeklyManualValues(activeProfileId));
  }, [activeProfileId]);

  useEffect(() => {
    setMaintenanceNote(loadDriverMaintenanceNote(profileVehiclePlate || activeProfileId));
  }, [activeProfileId, profileVehiclePlate]);

  useEffect(() => {
    let mounted = true;
    if (!supabase || !activeProfileId || !profileVehiclePlate || !canQueryDriverData) {
      setMaintenanceReports([]);
      return undefined;
    }
    listMaintenanceReports({ vehiclePlate: profileVehiclePlate, reporterId: activeProfileId })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setMessage(error.message);
          return;
        }
        const nextReports = (data ?? []).map(normalizeMaintenanceReportRecord);
        setMaintenanceReports(nextReports);
        const latestNote = nextReports.find((report) => report.note)?.note ?? "";
        if (latestNote) setMaintenanceNote(latestNote);
      })
      .catch((error) => { if (mounted) setMessage(`No se han podido cargar los avisos de mantenimiento: ${error.message}`); });
    return () => { mounted = false; };
  }, [activeProfileId, profileVehiclePlate, canQueryDriverData]);

  useEffect(() => {
    if (!activeProfileId || typeof window === "undefined") return;
    try {
      const stored = JSON.parse(window.localStorage.getItem(driverWeeklyManualStorageKey) ?? "{}");
      window.localStorage.setItem(driverWeeklyManualStorageKey, JSON.stringify({ ...stored, [activeProfileId]: weeklyManualValues }));
    } catch {
      // La persistencia local es un apoyo para los gastos manuales; Supabase sigue siendo la fuente principal.
    }
  }, [activeProfileId, weeklyManualValues]);

  useEffect(() => () => {
    Object.values(circlePreviewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!supabase || !canQueryDriverData) {
      setEntries([]);
      setDocuments([]);
      setDocumentsLoading(false);
      return undefined;
    }
    Promise.all([
      fetchAllSupabaseRows(() => supabase.from("driver_entries").select("id, vehicle_plate, entry_date, fuel_cost, fuel_liters, odometer_km, billing, billing_override, cash_collected, tips, tolls, refunds, wash_expenses, other_expenses, notes, created_at").eq("driver_id", activeProfileId).order("entry_date", { ascending: false })),
      fetchAllSupabaseRows(() => supabase.from("documents").select("id, owner_id, category, vehicle_plate, file_path, file_name, mime_type, file_size, file_hash, document_date, extracted_data, field_confidence, overall_confidence, status, created_at, updated_at").eq("owner_id", activeProfileId).order("created_at", { ascending: false })),
    ]).then(([entryResult, documentResult]) => {
      if (!mounted) return;
      if (entryResult.error) setMessage(entryResult.error.message);
      if (documentResult.error) setMessage(documentResult.error.message);
      setEntries((entryResult.data ?? []).map(normalizeDriverEntryRecord));
      setDocuments((documentResult.data ?? []).map(normalizeDocumentRecord));
      setDocumentsLoading(false);
    }).catch((error) => { if (mounted) { setMessage(error.message); setDocumentsLoading(false); } });
    return () => { mounted = false; };
  }, [activeProfileId, canQueryDriverData]);

  const refreshDriverData = useCallback(async () => {
    if (!supabase || !canQueryDriverData) return;
    const [entryResult, documentResult] = await Promise.all([
      fetchAllSupabaseRows(() => supabase.from("driver_entries").select("id, vehicle_plate, entry_date, fuel_cost, fuel_liters, odometer_km, billing, billing_override, cash_collected, tips, tolls, refunds, wash_expenses, other_expenses, notes, created_at").eq("driver_id", activeProfileId).order("entry_date", { ascending: false })),
      fetchAllSupabaseRows(() => supabase.from("documents").select("id, owner_id, category, vehicle_plate, file_path, file_name, mime_type, file_size, file_hash, document_date, extracted_data, field_confidence, overall_confidence, status, created_at, updated_at").eq("owner_id", activeProfileId).order("created_at", { ascending: false })),
    ]);
    if (entryResult.error) throw entryResult.error;
    if (documentResult.error) throw documentResult.error;
    setEntries((entryResult.data ?? []).map(normalizeDriverEntryRecord));
    setDocuments((documentResult.data ?? []).map(normalizeDocumentRecord));
    setDocumentsLoading(false);
  }, [activeProfileId, canQueryDriverData]);

  useEffect(() => {
    if (!supabase || !canQueryDriverData) return undefined;
    let mounted = true;
    let refreshTimer = 0;
    const queueRefresh = (showError = true) => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        refreshDriverData().catch((error) => {
          if (mounted && showError) setMessage(`No se han podido actualizar los datos: ${error.message}`);
        });
      }, 80);
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") queueRefresh(false);
    };
    const refreshInterval = window.setInterval(() => queueRefresh(false), 30000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const unsubscribe = subscribeToAppChanges({
      userId: activeProfileId,
      isAdmin: preview,
      onChange: ({ table }) => {
        if (table === "profiles" && !preview) {
          getProfile({ id: session.user.id }).then(({ data, error }) => {
            if (!mounted || error || !data) return;
            onProfileChange?.(data);
            if (!data.active) onSignOut?.();
          }).catch(() => undefined);
          return;
        }
        if (["driver_entries", "documents"].includes(table)) queueRefresh();
        if (table === "maintenance_reports") {
          listMaintenanceReports({ vehiclePlate: profileVehiclePlate, reporterId: activeProfileId })
            .then(({ data, error }) => {
              if (mounted && !error) setMaintenanceReports((data ?? []).map(normalizeMaintenanceReportRecord));
            })
            .catch(() => undefined);
        }
      },
      onStatus: (status) => {
        if (!mounted) return;
        if (["SUBSCRIBED", "CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) queueRefresh(false);
      },
    });
    return () => {
      mounted = false;
      window.clearTimeout(refreshTimer);
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      unsubscribe();
    };
  }, [activeProfileId, canQueryDriverData, onProfileChange, onSignOut, preview, profileVehiclePlate, refreshDriverData, session.user.id]);

  useEffect(() => {
    const selectedEntry = entries.find((item) => String(item.entry_date) === selectedDate);
    setEntry(getDriverEntryForm(selectedDate, selectedEntry));
    setFile(null);
    setFileCapturedAt(null);
    setEntryDateWasEdited(false);
  }, [entries, selectedDate]);

  const driverPeriodDate = parseDriverDateKey(selectedDate) ?? new Date();
  const driverPeriodMonth = driverPeriodDate.getMonth();
  const driverPeriodYear = driverPeriodDate.getFullYear();
  const driverPeriodYears = useMemo(() => Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - index), []);
  const selectDriverPeriod = (year, month) => {
    const day = Math.min(driverPeriodDate.getDate(), new Date(year, month + 1, 0).getDate());
    setSelectedDate(getDriverDateKey(new Date(year, month, day)));
    setPeriodPickerOpen("");
    setMessage("");
  };
  const scrollDriverSection = (section, ref) => {
    setDriverNavSection(section);
    setDriverMenuOpen(false);
    setDriverNoticeOpen(false);
    window.requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const shiftDriverWeek = (offset) => {
    const nextDate = new Date(driverPeriodDate);
    nextDate.setDate(nextDate.getDate() + offset * 7);
    setSelectedDate(getDriverDateKey(nextDate));
    setMessage("");
  };
  const calendarDays = useMemo(() => getDriverCalendarDays(driverPeriodDate, 13, -6), [selectedDate]);
  const selectedDayEntry = useMemo(() => entries.find((item) => String(item.entry_date) === selectedDate) ?? null, [entries, selectedDate]);
  const selectedDayDocuments = useMemo(() => documents.filter((document) => getDriverDocumentDateKey(document) === selectedDate), [documents, selectedDate]);
  const driverBillingStatsByDate = useMemo(() => getDriverBillingStatsByDate(documents, activeProfileId), [documents, activeProfileId]);

  useEffect(() => {
    if (!periodPickerOpen) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!periodPickerRef.current?.contains(event.target)) setPeriodPickerOpen("");
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setPeriodPickerOpen("");
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [periodPickerOpen]);

  useEffect(() => {
    if (!periodPickerOpen) return undefined;
    const frame = window.requestAnimationFrame(() => periodPickerOptionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
    return () => window.cancelAnimationFrame(frame);
  }, [periodPickerOpen, driverPeriodMonth, driverPeriodYear]);

  useEffect(() => {
    let cancelled = false;
    setDocumentPreviews([]);
    if (!supabase || selectedDayDocuments.length === 0) return undefined;
    Promise.all(selectedDayDocuments.map(async (document) => {
      if (!document.file_path) return { ...document, signedUrl: "" };
      const { data, error } = await supabase.storage.from("documents").createSignedUrl(document.file_path, 60 * 60);
      return { ...document, signedUrl: data?.signedUrl ?? "", urlError: error?.message ?? "" };
    })).then((result) => {
      if (!cancelled) setDocumentPreviews(result);
    }).catch(() => {
      if (!cancelled) setDocumentPreviews(selectedDayDocuments.map((document) => ({ ...document, signedUrl: "", urlError: "No se ha podido generar la vista previa." })));
    });
    return () => { cancelled = true; };
  }, [selectedDayDocuments]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => selectedDayButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }));
    return () => window.cancelAnimationFrame(frame);
  }, [selectedDate]);

  const updateEntry = (key, value) => setEntry((current) => ({ ...current, [key]: value }));
  const upsertDriverEntry = async (dateKey, patch = {}) => {
    const existing = entries.find((item) => String(item.entry_date) === dateKey) ?? {};
    const numberFor = (key) => patch[key] === undefined ? getDriverEntryAmount(existing, key) : Math.max(0, Number(patch[key]) || 0);
    const values = {
      driver_id: activeProfileId,
      vehicle_plate: profileVehiclePlate,
      entry_date: dateKey,
      fuel_cost: numberFor("fuel_cost"),
      fuel_liters: numberFor("fuel_liters"),
      odometer_km: Math.round(numberFor("odometer_km")),
      billing: numberFor("billing"),
      cash_collected: numberFor("cash_collected"),
      tips: numberFor("tips"),
      tolls: numberFor("tolls"),
      refunds: numberFor("refunds"),
      wash_expenses: numberFor("wash_expenses"),
      other_expenses: numberFor("other_expenses"),
      notes: patch.notes === undefined ? existing.notes ?? null : String(patch.notes || "").trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (!supabase) {
      const localEntry = { ...existing, ...values, id: existing.id ?? `local-${activeProfileId}-${dateKey}`, created_at: existing.created_at ?? new Date().toISOString() };
      setEntries((current) => [localEntry, ...current.filter((candidate) => String(candidate.entry_date) !== dateKey)]);
      return localEntry;
    }
    const { data, error } = await supabase.from("driver_entries").upsert(values, { onConflict: "driver_id,entry_date" }).select("id, vehicle_plate, entry_date, fuel_cost, fuel_liters, odometer_km, billing, billing_override, cash_collected, tips, tolls, refunds, wash_expenses, other_expenses, notes, created_at").single();
    if (error) throw error;
    const normalizedData = normalizeDriverEntryRecord(data);
    setEntries((current) => [normalizedData, ...current.filter((candidate) => candidate.id !== normalizedData.id && String(candidate.entry_date) !== dateKey)]);
    return normalizedData;
  };
  const saveEntry = async (event) => {
    event.preventDefault();
    setMessage("");
    if (preview) return setMessage("Estás viendo una vista previa. Solo el conductor puede guardar sus datos.");
    setSaving(true);
    try {
      const captureMoment = fileCapturedAt ? new Date(fileCapturedAt) : new Date();
      const captureDate = getDriverDateKey(captureMoment);
      const intentionalUploadDate = file && entryDateWasEdited ? entry.entryDate : "";
      const uploadDate = file
        ? resolveDriverUploadDate({
          driverName: profile.full_name,
          category: "consumption",
          recordType: "fuel",
          captureAt: captureMoment,
          captureDate,
          intentionalDate: intentionalUploadDate,
        })
        : entry.entryDate;
      const data = await upsertDriverEntry(uploadDate, {
        wash_expenses: Number(entry.washExpenses) || 0,
        other_expenses: Number(entry.otherExpenses) || 0,
      });
      let uploadMessage = "";
      let savedDocument = null;
      if (file && supabase) {
        try {
          const fileHash = await hashDocumentFile(file);
          const extractedData = { date: uploadDate, captureDate, dateSource: intentionalUploadDate ? "intentional-edit" : uploadDate === captureDate ? "capture" : "operating-day", recordType: "fuel", cost: data.fuel_cost, consumption: data.fuel_liters, unit: "L", odometerKm: data.odometer_km, billing: data.billing, cashCollected: data.cash_collected, tips: data.tips, refunds: data.refunds, tolls: data.tolls, otherExpenses: data.other_expenses, driverId: activeProfileId, vehicle: profileVehiclePlate, source: "driver-weekly-entry" };
          savedDocument = await uploadDocumentRecord({ ownerId: activeProfileId, category: "consumption", vehiclePlate: profileVehiclePlate, file, fileHash, documentDate: uploadDate, extractedData, status: "review" });
          const operations = operationsFromDocument({ category: "consumption", fields: extractedData, recordType: "fuel", driverId: activeProfileId, vehiclePlate: profileVehiclePlate, fileHash, fallbackDate: uploadDate });
          if (operations.length > 0) {
            const result = await confirmDocumentTransactions(savedDocument.id, operations);
            uploadMessage = result?.duplicate && !result?.created ? " y el justificante ya estaba archivado" : " y el justificante se ha archivado";
          } else {
            uploadMessage = " y el justificante se ha archivado para revisión";
          }
          savedDocument = { ...savedDocument, extracted_data: extractedData };
          // The document and ledger are already persisted at this point. A
          // transient refresh failure must not turn a successful upload into
          // a misleading "not uploaded" error; the realtime/visibility
          // refresh will reconcile the view on the next opportunity.
          await refreshDriverData().catch(() => undefined);
        } catch (uploadError) {
          uploadMessage = `, pero el justificante no se ha podido subir: ${uploadError.message}`;
        }
      } else if (file) {
        uploadMessage = "; la imagen se ha quedado preparada en este dispositivo";
      }
      if (savedDocument) {
        const normalizedDocument = normalizeDocumentRecord(savedDocument);
        setDocuments((current) => [normalizedDocument, ...current.filter((document) => document.id !== normalizedDocument.id)]);
      }
      setFile(null);
      setFileCapturedAt(null);
      setEntryDateWasEdited(false);
      setSaving(false);
      setMessage(`Registro del ${uploadDate} guardado${uploadMessage}.`);
    } catch (error) {
      setSaving(false);
      setMessage(`No se ha podido guardar el registro: ${error.message}`);
    }
  };

  const periodSummary = useMemo(() => {
    const periodDate = parseDriverDateKey(selectedDate) ?? new Date();
    const monthKey = getDriverDateKey(periodDate).slice(0, 7);
    const weekStart = getDriverWeekStart(periodDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEntries = getDriverDailyLedgerEntries(entries, driverBillingStatsByDate, (dateKey) => dateKey.startsWith(monthKey));
    const weekEntries = getDriverDailyLedgerEntries(entries, driverBillingStatsByDate, (dateKey) => {
      const date = parseDriverDateKey(dateKey);
      return date && date >= weekStart && date < weekEnd;
    });
    const total = (list, key) => list.reduce((sum, item) => sum + getDriverEntryAmount(item, key), 0);
    const washFor = (item) => Object.hasOwn(weeklyManualValues?.[item?.entry_date] ?? {}, "wash") ? Number(weeklyManualValues[item.entry_date].wash) || 0 : getDriverEntryAmount(item, "wash_expenses");
    const recordedMonthlyBilling = total(monthEntries, "billing");
    const billingDocuments = getDriverBillingDocumentsForPeriod(documents, activeProfileId, periodDate.getMonth(), periodDate.getFullYear()).map(getDriverBillingDocumentStats);
    const hasDocumentedMonthlyBilling = billingDocuments.some((stats) => stats.hasBillingAmount);
    const documentedMonthlyBilling = billingDocuments.reduce((sum, stats) => sum + stats.netAmount, 0);
    const documentedMonthlyTips = billingDocuments.reduce((sum, stats) => sum + stats.tips, 0);
    const importedBillingByPeriod = getImportedBillingByPeriod(profile.full_name);
    const importedTipsByPeriod = getImportedTipsByPeriod(profile.full_name);
    const importedMonthlyBilling = importedBillingByPeriod?.[monthKey] ?? 0;
    const recordedMonthlyTips = total(monthEntries, "tips");
    const importedMonthlyTips = importedTipsByPeriod?.[monthKey] ?? 0;
    const monthlyBilling = hasDocumentedMonthlyBilling ? documentedMonthlyBilling : recordedMonthlyBilling > 0 ? recordedMonthlyBilling : importedMonthlyBilling;
    const monthlyTips = hasDocumentedMonthlyBilling ? documentedMonthlyTips : recordedMonthlyTips > 0 ? recordedMonthlyTips : importedMonthlyTips;
    const documentedTipDays = buildDriverTipDayRows(billingDocuments.map((stats) => ({ dateKey: stats.dateKey, amount: stats.tips })));
    const recordedTipDays = buildDriverTipDayRows(monthEntries.map((item) => ({ dateKey: item.entry_date, amount: getDriverEntryAmount(item, "tips") })));
    const monthlyTipsByDay = hasDocumentedMonthlyBilling ? documentedTipDays : recordedMonthlyTips > 0 ? recordedTipDays : [];
    const monthlyTipsDailySource = hasDocumentedMonthlyBilling ? "document" : recordedMonthlyTips > 0 ? "entry" : importedMonthlyTips > 0 ? "imported" : "none";
    const billingGoal = getDriverBillingGoal(profile.full_name);
    const billingScaleMax = 9000;
    const billingMilestones = [5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000];
    const billingCurrentMilestone = billingMilestones.reduce((current, milestone) => monthlyBilling >= milestone ? milestone : current, null);
    const weeklyCash = total(weekEntries, "cash_collected");
    const weeklyFuel = total(weekEntries, "fuel_cost");
    const weeklyRefunds = total(weekEntries, "refunds");
    const weeklyWash = weekEntries.reduce((sum, item) => sum + washFor(item), 0);
    const weeklyOther = total(weekEntries, "other_expenses") + weeklyWash;
    const monthlyWash = monthEntries.reduce((sum, item) => sum + washFor(item), 0);
    const weeklyNet = weeklyCash - weeklyFuel - weeklyRefunds - weeklyOther;
    const weekEndLabel = new Date(weekEnd);
    weekEndLabel.setDate(weekEndLabel.getDate() - 1);
    const periodFormatter = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
    return {
      monthLabel: new Intl.DateTimeFormat("es-ES", { month: "long" }).format(periodDate),
      weekLabel: `${periodFormatter.format(weekStart)} · ${periodFormatter.format(weekEndLabel)}`.replace(/\./g, ""),
      monthlyBilling,
      monthlyTips,
      monthlyTipsByDay,
      monthlyTipsDailySource,
      monthlyRefunds: total(monthEntries, "refunds"),
      monthlyOther: total(monthEntries, "other_expenses") + monthlyWash,
      tipsProgress: monthlyBilling > 0 ? Math.min(100, (monthlyTips / monthlyBilling) * 100) : 0,
      billingGoal,
      billingScaleMax,
      billingMilestones,
      billingCurrentMilestone,
      billingProgress: billingGoal > 0 ? (monthlyBilling / billingGoal) * 100 : 0,
      billingBarProgress: billingScaleMax > 0 ? Math.min(100, (monthlyBilling / billingScaleMax) * 100) : 0,
      billingTargetBarProgress: getDriverBillingVisualPosition(monthlyBilling, billingMilestones, billingScaleMax),
      weeklyCash,
      weeklyFuel,
      weeklyRefunds,
      weeklyOther,
      weeklyNet,
      weeklyProgress: weeklyCash > 0 ? Math.max(0, Math.min(100, (weeklyNet / weeklyCash) * 100)) : 0,
      weekEntries: weekEntries.length,
    };
  }, [activeProfileId, documents, driverBillingStatsByDate, entries, profile.full_name, profileVehiclePlate, selectedDate, vehicle, weeklyManualValues]);

  const selectedDayDocumentData = useMemo(() => selectedDayDocuments.reduce((summary, document) => {
    const data = document.extracted_data ?? {};
    const billingStats = document.category === "billing" ? getDriverBillingDocumentStats(document) : null;
    const billing = billingStats
      ? billingStats.netAmount
      : getDriverDocumentNumber(data.billing ?? data.total ?? data.amount ?? data.netAmount);
    const fuelCost = getDriverDocumentNumber(data.fuelCost ?? data.fuel_cost ?? data.cost ?? (document.category === "consumption" ? data.amount : 0));
    const fuelLiters = getDriverDocumentNumber(data.fuelLiters ?? data.fuel_liters ?? data.consumption ?? data.liters);
    const odometerKm = getDriverDocumentNumber(data.odometerKm ?? data.odometer_km ?? data.kilometres ?? data.km);
    summary.billing += document.category === "billing" ? billing : getDriverDocumentNumber(data.billing);
    summary.hasBilling = summary.hasBilling || Boolean(billingStats?.hasBillingAmount);
    summary.fuelCost += fuelCost;
    summary.fuelLiters += fuelLiters;
    summary.odometerKm = odometerKm || summary.odometerKm;
    summary.cashCollected += getDriverDocumentNumber(data.cashCollected ?? data.cash_collected);
    summary.tips += getDriverDocumentNumber(data.tips);
    summary.refunds += getDriverDocumentNumber(data.refunds ?? data.reimbursements);
    summary.otherExpenses += getDriverDocumentNumber(data.otherExpenses ?? data.other_expenses);
    return summary;
  }, { billing: 0, fuelCost: 0, fuelLiters: 0, odometerKm: 0, cashCollected: 0, tips: 0, refunds: 0, tolls: 0, otherExpenses: 0, hasBilling: false }), [selectedDayDocuments]);
  const selectedDaySource = selectedDayEntry ?? entry;
  const selectedDayData = {
    billing: selectedDayDocumentData.hasBilling ? selectedDayDocumentData.billing : getDriverEntryAmount(selectedDaySource, "billing") || selectedDayDocumentData.billing,
    odometer_km: getDriverEntryAmount(selectedDaySource, "odometer_km") || selectedDayDocumentData.odometerKm,
    fuel_cost: getDriverEntryAmount(selectedDaySource, "fuel_cost") || selectedDayDocumentData.fuelCost,
    fuel_liters: getDriverEntryAmount(selectedDaySource, "fuel_liters") || selectedDayDocumentData.fuelLiters,
    cash_collected: selectedDayDocumentData.hasBilling ? selectedDayDocumentData.cashCollected : getDriverEntryAmount(selectedDaySource, "cash_collected") || selectedDayDocumentData.cashCollected,
    tips: selectedDayDocumentData.hasBilling ? selectedDayDocumentData.tips : getDriverEntryAmount(selectedDaySource, "tips") || selectedDayDocumentData.tips,
    refunds: selectedDayDocumentData.hasBilling ? selectedDayDocumentData.refunds : getDriverEntryAmount(selectedDaySource, "refunds") || selectedDayDocumentData.refunds,
    tolls: getDriverEntryAmount(selectedDaySource, "tolls") || selectedDayDocumentData.tolls,
    other_expenses: getDriverEntryAmount(selectedDaySource, "other_expenses") || selectedDayDocumentData.otherExpenses,
  };
  const driverWeekDays = useMemo(() => {
    const weekStart = getDriverWeekStart(driverPeriodDate);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + index);
      return { date, key: getDriverDateKey(date) };
    });
  }, [selectedDate]);
  const driverWeekEntries = useMemo(() => driverWeekDays.map(({ key }) => getDriverDailyLedgerEntry(entries, key, driverBillingStatsByDate)), [driverWeekDays, entries, driverBillingStatsByDate]);
  const driverWeekPages = useMemo(() => [-1, 0, 1].map((offset) => {
    const pageDate = new Date(driverPeriodDate);
    pageDate.setDate(pageDate.getDate() + (offset * 7));
    return { offset, ...buildDriverWeekPage(pageDate, entries, weeklyManualValues, driverBillingStatsByDate) };
  }), [driverPeriodDate, entries, weeklyManualValues, driverBillingStatsByDate]);
  const seededDriverShift = vehicle?.shifts?.find((shift) => normalizeText(shift.driver) === normalizeText(profile.full_name)) ?? vehicle?.shifts?.[0] ?? null;
  const seededDriverConsumption = 0;
  const otherDriversConsumptionAverage = useMemo(() => {
    const professionalShifts = vehiclesSeed.filter((candidate) => candidate.use === "Profesional").flatMap((candidate) => candidate.shifts ?? []);
    const otherShifts = professionalShifts.filter((shift) => shift.id !== seededDriverShift?.id);
    const values = otherShifts.map((shift) => shift.km > 0 ? (Number(shift.liters) || 0) / shift.km * 100 : 0).filter((value) => value > 0);
    return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : seededDriverConsumption;
  }, [seededDriverConsumption, seededDriverShift]);
  const otherDriversKmAverage = useMemo(() => {
    const professionalShifts = vehiclesSeed.filter((candidate) => candidate.use === "Profesional").flatMap((candidate) => candidate.shifts ?? []);
    const otherShifts = professionalShifts.filter((shift) => shift.id !== seededDriverShift?.id);
    const values = otherShifts.map((shift) => Number(shift.km) || 0).filter((value) => value > 0);
    return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }, [seededDriverShift]);
  const weeklyConsumptionData = useMemo(() => {
    const chronologicalEntries = [...entries].sort((left, right) => String(left.entry_date ?? "").localeCompare(String(right.entry_date ?? "")));
    return driverWeekDays.map(({ date, key }) => {
      const currentEntry = entries.find((item) => String(item.entry_date) === key);
      const consumptionDocument = documents.find((document) => {
        const data = document.extracted_data ?? {};
        return getDriverDocumentDateKey(document) === key
          && (data.recordType === "consumption" || data.metric === "consumption")
          && getDriverDocumentNumber(data.consumption) > 0;
      });
      const extractedConsumption = getDriverDocumentNumber(consumptionDocument?.extracted_data?.consumption);
      const currentOdometer = getDriverEntryAmount(currentEntry, "odometer_km");
      const previousEntry = [...chronologicalEntries].reverse().find((item) => String(item.entry_date ?? "") < key);
      const previousEntryOdometer = getDriverEntryAmount(previousEntry, "odometer_km");
      const kilometres = Math.max(0, currentOdometer - previousEntryOdometer);
      const litres = getDriverEntryAmount(currentEntry, "fuel_liters");
      const driverConsumption = extractedConsumption || (litres > 0 && kilometres > 0 ? litres / kilometres * 100 : seededDriverConsumption);
      return {
        label: new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(date).replace(".", ""),
        kilometres,
        driverConsumption: Number(driverConsumption.toFixed(1)),
        otherConsumption: Number(otherDriversConsumptionAverage.toFixed(1)),
      };
    });
  }, [driverWeekDays, documents, entries, otherDriversConsumptionAverage, seededDriverConsumption]);
  const weeklyConsumptionAverage = useMemo(() => {
    const values = weeklyConsumptionData.map((item) => item.driverConsumption).filter((value) => value > 0);
    return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }, [weeklyConsumptionData]);
  const weeklyKmData = useMemo(() => weeklyConsumptionData.map((item) => ({
    label: item.label,
    driverKm: Math.round(item.kilometres || 0),
    otherKm: Math.round(otherDriversKmAverage || 0),
  })), [otherDriversKmAverage, weeklyConsumptionData]);
  const weeklyKmAverage = useMemo(() => {
    const values = weeklyKmData.map((item) => item.driverKm).filter((value) => value > 0);
    return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }, [weeklyKmData]);
  const previousDriverEntry = useMemo(() => {
    const previous = entries
      .filter((item) => String(item.entry_date ?? "") < selectedDate)
      .sort((a, b) => String(b.entry_date ?? "").localeCompare(String(a.entry_date ?? "")));
    return previous[0] ?? null;
  }, [entries, selectedDate]);
  const selectedOdometer = Number(selectedDayData.odometer_km) || 0;
  const previousOdometer = getDriverEntryAmount(previousDriverEntry, "odometer_km");
  const partialKm2 = Math.max(0, selectedOdometer - previousOdometer);
  const averageConsumption = partialKm2 > 0 ? (Number(selectedDayData.fuel_liters) || 0) / partialKm2 * 100 : 0;
  const monthlyBillingHistory = useMemo(() => {
    const monthly = new Map();
    const documentedBillingMonths = new Set();
    entries.forEach((item) => {
      const entryDate = parseDriverDateKey(item.entry_date);
      if (!entryDate) return;
      const monthKey = String(item.entry_date).slice(0, 7);
      monthly.set(monthKey, (monthly.get(monthKey) || 0) + getDriverEntryAmount(item, "billing"));
    });
    getDriverBillingDocumentsForDriver(documents, activeProfileId).forEach((document) => {
      const stats = getDriverBillingDocumentStats(document);
      if (!stats.dateKey || !stats.hasBillingAmount) return;
      const monthKey = stats.dateKey.slice(0, 7);
      if (!documentedBillingMonths.has(monthKey)) monthly.set(monthKey, 0);
      documentedBillingMonths.add(monthKey);
      monthly.set(monthKey, Number((monthly.get(monthKey) + stats.netAmount).toFixed(2)));
    });
    const currentMonthKey = `${driverPeriodYear}-${String(driverPeriodMonth + 1).padStart(2, "0")}`;
    if (!monthly.has(currentMonthKey)) monthly.set(currentMonthKey, 0);
    const calendarToday = new Date();
    const calendarCurrentMonthKey = `${calendarToday.getFullYear()}-${String(calendarToday.getMonth() + 1).padStart(2, "0")}`;
    if (!monthly.has(calendarCurrentMonthKey)) monthly.set(calendarCurrentMonthKey, 0);
    const importedBillingByPeriod = getImportedBillingByPeriod(profile.full_name);
    if (importedBillingByPeriod) {
      Object.entries(importedBillingByPeriod).forEach(([monthKey, amount]) => {
        const recordedAmount = monthly.get(monthKey) || 0;
        monthly.set(monthKey, documentedBillingMonths.has(monthKey) || recordedAmount > 0 ? recordedAmount : Number(amount) || 0);
      });
    }
    const currentDate = new Date(driverPeriodYear, driverPeriodMonth, 1);
    const calendarCurrentDate = new Date(calendarToday.getFullYear(), calendarToday.getMonth(), 1);
    const fallbackStartDate = new Date(driverPeriodYear, driverPeriodMonth - 11, 1);
    const historyDates = [...monthly.keys()]
      .filter((monthKey) => (monthly.get(monthKey) || 0) > 0)
      .map((monthKey) => {
        const [year, month] = String(monthKey).split("-").map(Number);
        return Number.isFinite(year) && Number.isFinite(month) ? new Date(year, month - 1, 1) : null;
      })
      .filter(Boolean);
    const earliestDataDate = historyDates.reduce((earliest, date) => date < earliest ? date : earliest, historyDates[0] ?? currentDate);
    const latestDataDate = historyDates.reduce((latest, date) => date > latest ? date : latest, currentDate);
    const startDate = earliestDataDate < fallbackStartDate ? earliestDataDate : fallbackStartDate;
    const endDate = [latestDataDate, currentDate, calendarCurrentDate].reduce((latest, date) => date > latest ? date : latest, latestDataDate);
    const months = [];
    for (let monthDate = new Date(startDate); monthDate <= endDate; monthDate.setMonth(monthDate.getMonth() + 1)) {
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      const recordedAmount = monthly.get(monthKey) || 0;
      const importedAmount = importedBillingByPeriod?.[monthKey] ?? 0;
      months.push([monthKey, documentedBillingMonths.has(monthKey) || recordedAmount > 0 ? recordedAmount : importedAmount]);
    }
    const maximum = Math.max(1, ...months.map(([, amount]) => amount));
    return months.map(([monthKey, amount]) => {
      const [year, month] = monthKey.split("-").map(Number);
      const monthDate = new Date(year, month - 1, 1);
      const shortLabel = reportMonthTokens[month - 1] ?? new Intl.DateTimeFormat("es-ES", { month: "short" }).format(monthDate).replace(/\./g, "");
      return {
        key: monthKey,
        year,
        monthIndex: month - 1,
        label: `${shortLabel} ${year}`,
        shortLabel,
        amount,
        barWidth: Math.max(7, amount / maximum * 100),
        barHeight: amount > 0 ? Math.max(14, amount / maximum * 100) : 5,
        isCurrent: monthKey === currentMonthKey,
      };
    });
  }, [activeProfileId, documents, entries, driverPeriodMonth, driverPeriodYear, profile.full_name]);
  const imageDocument = (predicate) => documentPreviews.find((document) => predicate(document) && document.signedUrl)?.signedUrl ?? "";
  const uploadedDriverImages = {
    fuelReceipt: circlePreviewUrls.fuel || imageDocument((document) => document.extracted_data?.recordType === "fuel" || document.category === "consumption" && document.extracted_data?.metric === "fuel_receipt"),
    billingReceipt: circlePreviewUrls.billing || imageDocument((document) => document.category === "billing" || document.extracted_data?.recordType === "billing"),
    dailyKm: circlePreviewUrls["daily-km"] || imageDocument((document) => ["daily-km", "partial-1"].includes(document.extracted_data?.recordType)),
    totalKm: circlePreviewUrls["total-km"] || imageDocument((document) => ["total-km", "total"].includes(document.extracted_data?.recordType)),
    consumption: circlePreviewUrls.consumption || imageDocument((document) => document.extracted_data?.recordType === "consumption" || document.extracted_data?.metric === "consumption"),
  };
  const driverImages = {
    fuelReceipt: uploadedDriverImages.fuelReceipt,
    billingReceipt: uploadedDriverImages.billingReceipt || "/assets/driver-examples/photo-5.jpg",
    dailyKm: uploadedDriverImages.dailyKm || "/assets/driver-examples/photo-1.jpg",
    totalKm: uploadedDriverImages.totalKm || "/assets/driver-examples/photo-2.jpg",
    consumption: uploadedDriverImages.consumption || "/assets/driver-examples/photo-4.jpg",
  };
  const documentCircleValues = selectedDayDocuments.reduce((values, document) => {
    const data = document.extracted_data ?? {};
    const recordType = data.recordType;
    if (recordType === "consumption" && getDriverDocumentNumber(data.consumption) > 0) values.consumption = getDriverDocumentNumber(data.consumption);
    if (recordType === "daily-km" && getDriverDocumentNumber(data.dailyKm) > 0) values.dailyKm = getDriverDocumentNumber(data.dailyKm);
    if (data.unit) values.consumptionUnit = data.unit;
    if (recordType === "total-km" && getDriverDocumentNumber(data.odometerKm ?? data.odometer_km) > 0) values.totalKm = getDriverDocumentNumber(data.odometerKm ?? data.odometer_km);
    return values;
  }, {});
  const directCircleValues = { ...documentCircleValues, ...(circleMetricValues[selectedDate] ?? {}) };
  const dailyPhotoRecords = [
    { key: "fuel", label: "Gasolina", value: formatCurrency(selectedDayData.fuel_cost), image: driverImages.fuelReceipt, hasAttachment: Boolean(uploadedDriverImages.fuelReceipt), Icon: IconGasStation, alt: "Justificante de gasolina" },
    { key: "billing", label: "Facturación", value: formatCurrency(selectedDayData.billing), image: driverImages.billingReceipt, hasAttachment: Boolean(uploadedDriverImages.billingReceipt), Icon: IconFileInvoice, alt: "Foto de facturación diaria" },
    { key: "daily-km", label: "Km diarios", value: formatKm(directCircleValues.dailyKm ?? partialKm2), image: driverImages.dailyKm, hasAttachment: Boolean(uploadedDriverImages.dailyKm), Icon: IconGauge, alt: "Lectura de kilómetros diarios" },
    { key: "total-km", label: "Km acumulados", value: formatKm(directCircleValues.totalKm ?? vehicle?.odometer ?? selectedOdometer), image: driverImages.totalKm, hasAttachment: Boolean(uploadedDriverImages.totalKm), Icon: IconGauge, alt: "Lectura de kilómetros acumulados" },
    { key: "consumption", label: "Consumo", value: `${Number(directCircleValues.consumption || averageConsumption).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${directCircleValues.consumptionUnit || "l/100 km"}`, image: driverImages.consumption, hasAttachment: Boolean(uploadedDriverImages.consumption), Icon: IconChartBar, alt: "Historial de consumo del vehículo" },
  ];
  const driverReferenceImages = {
    consumption: "/assets/driver-examples/photo-4.jpg",
    billing: "/assets/driver-examples/photo-5.jpg",
  };
  const openCirclePicker = (recordKey) => {
    circleUploadKeyRef.current = recordKey;
    const input = circleFileInputRef.current;
    if (!input) return;
    input.value = "";
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      // Algunos navegadores móviles solo permiten abrir el selector con click().
    }
    input.click();
  };
  const handleCircleFile = async (event) => {
    const file = event.target.files?.[0];
    const recordKey = circleUploadKeyRef.current;
    event.target.value = "";
    if (!file || !recordKey) return;
    const validation = validateDocumentFile(file, "upload");
    if (!validation.valid) {
      setCircleUpload({ key: recordKey, status: "error", fileName: file.name });
      setMessage(validation.message);
      return;
    }
    // The upload moment is the safe default. The calendar may still be
    // showing another day, and the printed date belongs to the document, not
    // necessarily to the day on which the driver is registering it.
    const captureAt = new Date();
    const captureDate = getDriverDateKey(captureAt);
    setCircleReview({ recordKey, file, defaultDate: captureDate, captureDate, captureAt: captureAt.toISOString() });
    setCircleUpload({ key: recordKey, status: "review", fileName: file.name });
    return;
  };
  const saveCircleReview = async (reviewDocument) => {
    const recordKey = circleReview?.recordKey;
    const file = reviewDocument?.originalFile || reviewDocument?.file;
    if (!recordKey || !file) return { ok: false, message: "No se ha encontrado el archivo que estabas revisando." };
    const fields = reviewDocument.fields ?? {};
    const fieldNumber = (...keys) => {
      for (const key of keys) {
        const rawValue = fields[key] && typeof fields[key] === "object" && "value" in fields[key] ? fields[key].value : fields[key];
        if (rawValue === null || rawValue === undefined || String(rawValue).trim() === "") continue;
        return getDriverDocumentNumber(rawValue);
      }
      return 0;
    };
    const documentCategory = recordKey === "billing" ? "billing" : "consumption";
    // A driver upload inherits the vehicle from the active profile. The
    // document can contain no vehicle at all (or OCR can invent one), so the
    // extracted value must never be allowed to change the driver's owner
    // context or trip the vehicle-bound RLS check.
    const documentVehiclePlate = profileVehiclePlate || canonicalizeVehiclePlate(fields.vehicle);
    const captureAt = circleReview?.captureAt || new Date().toISOString();
    const captureDate = circleReview?.captureDate || circleReview?.defaultDate || getDriverDateKey(captureAt);
    const targetDate = resolveDriverUploadDate({
      captureDate,
      captureAt,
      driverName: profile.full_name,
      category: documentCategory,
      recordType: recordKey,
      intentionalDate: reviewDocument.dateWasEdited ? fields.date : "",
    });
    const cost = fieldNumber("cost", "total", "amount", "netAmount");
    const consumption = fieldNumber("consumption");
    const consumptionCount = Math.max(1, Math.round(fieldNumber("consumptionCount") || (recordKey === "consumption" ? 1 : 0)));
    const dailyKm = fieldNumber("dailyKm");
    const odometerKm = fieldNumber("odometerKm");
    const billingAmounts = recordKey === "billing" ? getDriverBillingAmounts(fields) : null;
    const hasDriverNetAmount = Boolean(billingAmounts?.hasNetAmount || billingAmounts?.hasBaseNetAmount || billingAmounts?.hasPromotions);
    const billing = recordKey === "billing" ? (hasDriverNetAmount ? billingAmounts.netAmount : fieldNumber("total", "amount")) : fieldNumber("total", "netAmount", "amount");
    const cashCollected = fieldNumber("cashCollected");
    const tips = fieldNumber("tips");
    const grossTotal = recordKey === "billing" ? (billingAmounts?.hasBaseNetAmount || billingAmounts?.hasPromotions ? Number((billing + tips).toFixed(2)) : fieldNumber("total", "earningsTotal", "amount", "netAmount")) : 0;
    const refunds = fieldNumber("refunds", "reimbursements");
    const connection = String(fields.connection ?? "").trim();
    const points = fieldNumber("points");
    const extractedData = {
      date: targetDate,
      captureDate,
      dateSource: reviewDocument.dateWasEdited ? "intentional-edit" : "capture",
      source: "driver-circle",
      recordType: recordKey,
      recordLabel: dailyPhotoRecords.find((record) => record.key === recordKey)?.label ?? recordKey,
      metric: recordKey === "fuel" ? "fuel_receipt" : recordKey === "billing" ? "billing_daily" : recordKey,
      analysisStatus: "complete",
      analyzedAt: new Date().toISOString(),
      documentType: reviewDocument.documentType ?? "",
      fields,
      confidence: reviewDocument.fieldConfidence ?? {},
      overallConfidence: reviewDocument.overallConfidence ?? null,
      warnings: reviewDocument.warnings ?? [],
      cost,
      consumption,
      consumptionCount: recordKey === "consumption" ? consumptionCount : 0,
      dailyKm,
      odometerKm,
      billing,
      baseNetAmount: recordKey === "billing" ? billingAmounts.baseNetAmount : 0,
      netAmount: recordKey === "billing" ? billing : 0,
      promotions: recordKey === "billing" ? billingAmounts.promotions : 0,
      earningsTotal: recordKey === "billing" ? grossTotal : 0,
      cashCollected,
      tips,
      connection,
      points,
      refunds,
      unit: fields.unit ?? "",
      vehicle: documentVehiclePlate,
    };
    const centralEconomic = recordKey === "fuel" || recordKey === "billing";
    setCircleUpload({ key: recordKey, status: "uploading", fileName: file.name });
    try {
      const fileHash = await hashDocumentFile(file);
      let savedDocument;
      if (centralEconomic && supabase) {
        const uploaded = await uploadDocumentRecord({
          ownerId: activeProfileId,
          category: documentCategory,
          vehiclePlate: documentVehiclePlate,
          file,
          fileHash,
          documentDate: targetDate,
          extractedData,
          fieldConfidence: reviewDocument.fieldConfidence,
          overallConfidence: reviewDocument.overallConfidence,
          status: "review",
        });
        const operations = operationsFromDocument({
          category: documentCategory,
          fields: { ...fields, date: targetDate, serviceDate: targetDate, vehicle: documentVehiclePlate, recordType: recordKey },
          recordType: recordKey,
          driverId: activeProfileId,
          vehiclePlate: documentVehiclePlate,
          fileHash,
          fallbackDate: targetDate,
        });
        const result = await confirmDocumentTransactions(uploaded.id, operations);
        if (result?.duplicate && !result?.created) throw Object.assign(new Error("Este documento ya estaba registrado y no se ha vuelto a sumar."), { code: "DUPLICATE_DOCUMENT" });
        savedDocument = { ...uploaded, extracted_data: extractedData };
      } else if (supabase) {
        const uploaded = await uploadDocumentRecord({
          ownerId: activeProfileId,
          category: documentCategory,
          vehiclePlate: documentVehiclePlate,
          file,
          fileHash,
          documentDate: targetDate,
          extractedData,
          fieldConfidence: reviewDocument.fieldConfidence,
          overallConfidence: reviewDocument.overallConfidence,
          status: "review",
        });
        savedDocument = { ...uploaded, extracted_data: extractedData };
      } else {
        savedDocument = {
          id: `local-circle-${Date.now()}`,
          owner_id: activeProfileId,
          category: documentCategory,
          vehicle_plate: profileVehiclePlate,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          extracted_data: extractedData,
          status: "review",
          created_at: new Date().toISOString(),
        };
      }

      const entryPatch = {};
      if (recordKey === "fuel") {
        if (cost > 0) entryPatch.fuel_cost = cost;
        if (consumption > 0 && !String(fields.unit ?? "").includes("100")) entryPatch.fuel_liters = consumption;
        if (odometerKm > 0) entryPatch.odometer_km = odometerKm;
      } else if (recordKey === "billing") {
        if (billing > 0) entryPatch.billing = billing;
        entryPatch.cash_collected = cashCollected;
        entryPatch.tips = tips;
        entryPatch.refunds = refunds;
      } else if (recordKey === "daily-km") {
        const previous = [...entries]
          .filter((item) => String(item.entry_date ?? "") < targetDate)
          .sort((left, right) => String(right.entry_date ?? "").localeCompare(String(left.entry_date ?? "")))[0];
        const dailyValue = dailyKm || fieldNumber("kilometres", "kilometers");
        const totalKm = odometerKm || (dailyValue > 0 ? getDriverEntryAmount(previous, "odometer_km") + dailyValue : 0);
        if (totalKm > 0) entryPatch.odometer_km = totalKm;
        setCircleMetricValues((current) => ({ ...current, [targetDate]: { ...(current[targetDate] ?? {}), ...(dailyValue > 0 ? { dailyKm: dailyValue } : {}), ...(totalKm > 0 ? { totalKm } : {}) } }));
      } else if (recordKey === "total-km" && odometerKm > 0) {
        entryPatch.odometer_km = odometerKm;
        setCircleMetricValues((current) => ({ ...current, [targetDate]: { ...(current[targetDate] ?? {}), totalKm: odometerKm } }));
      } else if (recordKey === "consumption" && consumption > 0) {
        setCircleMetricValues((current) => ({ ...current, [targetDate]: { ...(current[targetDate] ?? {}), consumption, consumptionUnit: fields.unit || "l/100 km" } }));
      }
      if (Object.keys(entryPatch).length > 0 && (!centralEconomic || !supabase)) await upsertDriverEntry(targetDate, entryPatch);
      if (centralEconomic && supabase) {
        const { data: refreshedEntries } = await fetchAllSupabaseRows(() => supabase.from("driver_entries").select("id, vehicle_plate, entry_date, fuel_cost, fuel_liters, odometer_km, billing, billing_override, cash_collected, tips, tolls, refunds, wash_expenses, other_expenses, notes, created_at").eq("driver_id", activeProfileId).order("entry_date", { ascending: false }));
        if (refreshedEntries) setEntries(refreshedEntries.map(normalizeDriverEntryRecord));
      }
      const normalizedDocument = normalizeDocumentRecord(savedDocument);
      setDocuments((current) => [normalizedDocument, ...current.filter((document) => document.id !== normalizedDocument.id)]);
      setCirclePreviewUrls((current) => ({ ...current, [recordKey]: URL.createObjectURL(file) }));
      setCircleUpload({ key: recordKey, status: supabase ? "saved" : "local", fileName: file.name });
      setCircleReview(null);
      if (targetDate !== selectedDate) setSelectedDate(targetDate);
      const recordLabel = dailyPhotoRecords.find((record) => record.key === recordKey)?.label ?? "Registro";
      const destinationMessage = recordKey === "fuel"
        ? "Repostaje semanal, Administración > Vehículos > Combustible y Neto"
        : recordKey === "billing"
          ? "Facturación mensual, Administración > Conductores y Neto"
          : "el registro diario del conductor";
      setMessage(`${recordLabel} guardado para el ${targetDate}, con su justificante. Ya está actualizado en ${destinationMessage}.`);
      return { ok: true };
    } catch (error) {
      const duplicate = error?.code === "23505" || error?.code === "DUPLICATE_DOCUMENT" || /duplicad|ya estaba registrado|file_hash/i.test(error?.message ?? "");
      const errorMessage = duplicate ? "Este documento ya estaba guardado y no se ha vuelto a sumar." : `No se ha podido guardar el documento: ${error.message}`;
      setCircleUpload({ key: recordKey, status: duplicate ? "duplicate" : "error", fileName: file.name });
      setMessage(errorMessage);
      return { ok: false, message: errorMessage };
    }
  };
  const saveWeeklyAmount = async (dateKey, rowKey, rawValue) => {
    const editableWeeklyRows = preview ? ADMIN_EDITABLE_WEEKLY_ROWS : DRIVER_EDITABLE_WEEKLY_ROWS;
    if (!editableWeeklyRows.has(rowKey)) return;
    const amount = Math.max(0, Number(String(rawValue ?? "").replace(",", ".")) || 0);
    const entryFieldByRow = { cash: "cash_collected", fuel: "fuel_cost", refunds: "refunds", wash: "wash_expenses", other: "other_expenses" };
    const rowLabelByKey = { cash: "Efectivo", fuel: "Repostaje", refunds: "Reembolsos", wash: "Lavados", other: "Varios" };
    const entryField = entryFieldByRow[rowKey];
    if (!entryField) return;
    try {
      await upsertDriverEntry(dateKey, { [entryField]: amount });
      if (rowKey === "wash" || rowKey === "other") {
        setWeeklyManualValues((current) => ({ ...current, [dateKey]: { ...(current[dateKey] ?? {}), [rowKey]: amount } }));
      }
      setMessage(`${rowLabelByKey[rowKey]} del ${dateKey}: ${formatCurrency(amount)}.`);
    } catch (error) {
      setMessage(`No se ha podido guardar ${rowLabelByKey[rowKey].toLowerCase()}: ${error.message}`);
    }
  };
  const handleMaintenanceReportSave = async ({ note = "", photoFile = null } = {}) => {
    const nextNote = String(note ?? "").trim();
    if (!nextNote && !photoFile) throw new Error("Escribe una incidencia o añade una fotografía.");
    if (photoFile && (!String(photoFile.type ?? "").startsWith("image/") || photoFile.size > 8 * 1024 * 1024)) {
      throw new Error("La foto debe ser una imagen de hasta 8 MB.");
    }
    setMaintenanceReportSaving(true);
    try {
      if (!supabase) {
        if (photoFile) throw new Error("La foto necesita una conexión segura con Supabase.");
        setMaintenanceNote(nextNote);
        saveDriverMaintenanceNote(profileVehiclePlate || activeProfileId, nextNote);
        setMessage("Pendiente de mantenimiento guardado en este dispositivo.");
        return null;
      }
      const saved = await createMaintenanceReport({ reporterId: activeProfileId, vehiclePlate: profileVehiclePlate, note: nextNote, photoFile });
      const normalizedReport = normalizeMaintenanceReportRecord(saved);
      setMaintenanceReports((current) => [normalizedReport, ...current.filter((report) => report.id !== normalizedReport.id)]);
      if (nextNote) {
        setMaintenanceNote(nextNote);
        saveDriverMaintenanceNote(profileVehiclePlate || activeProfileId, nextNote);
      }
      setMessage("Pendiente de mantenimiento guardado y enviado a Administración.");
      return normalizedReport;
    } catch (error) {
      setMessage(`No se ha podido guardar el aviso de mantenimiento: ${error.message}`);
      throw error;
    } finally {
      setMaintenanceReportSaving(false);
    }
  };
  const handleMaintenanceNoteSave = (value) => handleMaintenanceReportSave({ note: value });
  const weeklyCumulativeTotals = accumulateDriverWeekTotals(driverWeekDays.map(({ key }, index) => getDriverDailyNetAmount(driverWeekEntries[index], key, weeklyManualValues)));
  const weeklyRows = [
    { key: "net", label: "Precio\nneto", values: driverWeekEntries.map((item, index) => getDriverWeeklyAmount(item, "net", driverWeekDays[index].key, weeklyManualValues)) },
    { key: "cash", label: "Efectivo", values: driverWeekEntries.map((item, index) => getDriverWeeklyAmount(item, "cash_collected", driverWeekDays[index].key, weeklyManualValues)) },
    { key: "fuel", label: "Repostaje", values: driverWeekEntries.map((item, index) => getDriverWeeklyAmount(item, "fuel_cost", driverWeekDays[index].key, weeklyManualValues)) },
    { key: "refunds", label: "Reembolsos", values: driverWeekEntries.map((item, index) => getDriverWeeklyAmount(item, "refunds", driverWeekDays[index].key, weeklyManualValues)) },
    { key: "wash", label: "Lavados", values: driverWeekEntries.map((item, index) => getDriverWeeklyAmount(item, "wash", driverWeekDays[index].key, weeklyManualValues)) },
    { key: "other", label: "Varios", values: driverWeekEntries.map((item, index) => getDriverWeeklyAmount(item, "other_expenses", driverWeekDays[index].key, weeklyManualValues)) },
    { key: "total", label: "Total", values: weeklyCumulativeTotals },
  ];
  const weeklyChartData = driverWeekDays.map(({ date }, index) => ({
    label: new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(date).replace(".", ""),
    consumption: getDriverEntryAmount(driverWeekEntries[index], "fuel_liters"),
    billing: getDriverEntryAmount(driverWeekEntries[index], "billing"),
  }));

  const selectedDayMetrics = [
    ["Facturación", getDriverEntryAmount(selectedDayData, "billing"), "€"],
    ["Kilómetros", getDriverEntryAmount(selectedDayData, "odometer_km"), "km"],
    ["Repostaje", getDriverEntryAmount(selectedDayData, "fuel_cost"), "€"],
  ];

  return <DriverMobileExperience
    preview={preview}
    onExitPreview={onExitPreview}
    onSignOut={onSignOut}
    onInstall={onInstall}
    isStandalone={isStandalone}
    profile={profile}
    vehicle={vehicle}
    periodSummary={periodSummary}
    driverPeriodMonth={driverPeriodMonth}
    driverPeriodYear={driverPeriodYear}
    driverPeriodYears={driverPeriodYears}
    reportMonths={reportMonths}
    periodPickerOpen={periodPickerOpen}
    setPeriodPickerOpen={setPeriodPickerOpen}
    periodPickerRef={periodPickerRef}
    periodPickerOptionRef={periodPickerOptionRef}
    selectDriverPeriod={selectDriverPeriod}
    driverWeekDays={driverWeekDays}
    driverWeekPages={driverWeekPages}
    weeklyRows={weeklyRows}
    weeklyChartData={weeklyChartData}
    monthlyBillingHistory={monthlyBillingHistory}
    weeklyConsumptionData={weeklyConsumptionData}
    weeklyKmData={weeklyKmData}
    weeklyKmAverage={weeklyKmAverage}
    weeklyConsumptionAverage={weeklyConsumptionAverage}
    otherDriversConsumptionAverage={otherDriversConsumptionAverage}
    otherDriversKmAverage={otherDriversKmAverage}
    dailyPhotoRecords={dailyPhotoRecords}
    driverReferenceImages={driverReferenceImages}
    averageConsumption={averageConsumption}
    selectedDate={selectedDate}
    setSelectedDate={setSelectedDate}
    driverPeriodDate={driverPeriodDate}
    shiftDriverWeek={shiftDriverWeek}
    message={message}
    entryFormOpen={entryFormOpen}
    setEntryFormOpen={setEntryFormOpen}
    entry={entry}
    updateEntry={updateEntry}
    saveEntry={saveEntry}
    saving={saving}
    file={file}
    setFile={setFile}
    setFileCapturedAt={setFileCapturedAt}
    driverMenuOpen={driverMenuOpen}
    setDriverMenuOpen={setDriverMenuOpen}
    driverNoticeOpen={driverNoticeOpen}
    setDriverNoticeOpen={setDriverNoticeOpen}
    driverNavSection={driverNavSection}
    setDriverNavSection={setDriverNavSection}
    circleUpload={circleUpload}
    circleReview={circleReview}
    closeCircleReview={() => { setCircleReview(null); setCircleUpload((current) => ({ ...current, status: "idle" })); }}
    circleFileInputRef={circleFileInputRef}
    openCirclePicker={openCirclePicker}
    handleCircleFile={handleCircleFile}
    saveCircleReview={saveCircleReview}
    saveWeeklyAmount={saveWeeklyAmount}
    maintenanceNote={maintenanceNote}
    maintenanceReports={maintenanceReports}
    maintenanceReportSaving={maintenanceReportSaving}
    saveMaintenanceNote={handleMaintenanceNoteSave}
    saveMaintenanceReport={handleMaintenanceReportSave}
  />;

  return (
    <main className={preview ? "driver-app driver-app--preview" : "driver-app"}>
      <header className="driver-app__topbar">
        <div className="driver-app__brand"><span className="auth-logo"><img src="/brand/sobre-ruedas-logo.png" alt="" /></span><div><strong>SOBRE RUEDAS</strong><small>{preview ? "Vista de conductor" : "Panel de conductor"}</small></div></div>
        <button className="driver-app__logout" type="button" onClick={preview ? onExitPreview : onSignOut} aria-label={preview ? "Volver a administración" : "Cerrar sesión"}><IconLogout size={18} /></button>
      </header>
      <div className="driver-app__body">
        {preview && <div className="driver-preview-banner" role="status"><IconEye size={18} /><span><strong>Vista previa de {profile.full_name}</strong><small>El administrador puede adjuntar las cinco lecturas y editar los importes semanales desde esta vista.</small></span><button type="button" className="secondary-button" onClick={onExitPreview}>Volver a administración</button></div>}
        <section className="driver-welcome">
          <div className="driver-welcome__identity"><span>HOLA</span><h1>{profile.full_name.toUpperCase()}</h1></div>
          <div className="driver-welcome__vehicle">
            <span>MATRÍCULA</span>
            <VehiclePlateLabel vehicleOrPlate={vehicle?.plate ?? profileVehiclePlate} className="driver-welcome__plate" />
            {vehicle?.owner && <>
              <strong className="driver-welcome__owner-name">{vehicle.owner.name}</strong>
              <strong className="driver-welcome__owner-dni">{vehicle.owner.dni}</strong>
            </>}
          </div>
        </section>
        <section className="driver-period-overview driver-period-overview--top" aria-label="Resumen mensual y semanal">
          <article className="driver-period-card driver-period-card--month">
            <header className="driver-period-card__header"><div><span>REGISTRO MENSUAL</span><h2>Facturación · {periodSummary.monthLabel}</h2></div><IconChartBar size={22} /></header>
            <div className="driver-period-card__headline"><div><strong>{formatCurrency(periodSummary.monthlyBilling)}</strong><small>Facturación mensual acumulada</small></div><span>{Math.round(periodSummary.billingProgress)}%</span></div>
            <div className="driver-period-progress" role="progressbar" aria-label="Progreso de facturación mensual" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.min(100, Math.round(periodSummary.billingProgress))} aria-valuetext={`${Math.round(periodSummary.billingProgress)}% del objetivo`}><i style={{ width: periodSummary.billingBarProgress + "%" }} /></div>
            <div className="driver-period-card__target"><span>Objetivo orientativo</span><strong>{formatCurrency(periodSummary.billingGoal)}</strong></div>
            <div className="driver-period-card__stats">
              <span><small>Propinas</small><strong>{formatCurrency(periodSummary.monthlyTips)}</strong></span>
      <span><small>Reembolsos</small><strong>{formatCurrency(periodSummary.monthlyRefunds)}</strong></span>
              <span><small>Otros gastos</small><strong>{formatCurrency(periodSummary.monthlyOther)}</strong></span>
            </div>
          </article>
          <article className="driver-period-card driver-period-card--week">
            <header className="driver-period-card__header"><div><span>REGISTRO SEMANAL</span><h2>Semana en curso</h2><small>{periodSummary.weekLabel} · {periodSummary.weekEntries} registros</small></div><IconCurrencyEuro size={22} /></header>
            <div className="driver-period-card__headline driver-period-card__headline--week"><div><strong>{formatCurrency(periodSummary.weeklyNet)}</strong><small>Efectivo neto de la semana</small></div><span>{Math.round(periodSummary.weeklyProgress)}%</span></div>
            <div className="driver-period-progress" role="progressbar" aria-label="Efectivo neto semanal" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(periodSummary.weeklyProgress)}><i style={{ width: periodSummary.weeklyProgress + "%" }} /></div>
            <div className="driver-period-card__ledger">
              <span><small>Efectivo cobrado</small><strong>{formatCurrency(periodSummary.weeklyCash)}</strong></span>
              <span><small>− Gasolina</small><strong>− {formatCurrency(periodSummary.weeklyFuel)}</strong></span>
              <span><small>− Reembolsos</small><strong>− {formatCurrency(periodSummary.weeklyRefunds)}</strong></span>
              <span><small>− Otros gastos</small><strong>− {formatCurrency(periodSummary.weeklyOther)}</strong></span>
            </div>
          </article>
        </section>
        <section className="driver-period-picker" ref={periodPickerRef} aria-label="Seleccionar mes y año">
          <div className="driver-period-picker__fields">
            <div className="driver-period-picker__field">
              <span>MES</span>
              <button type="button" className="driver-period-picker__trigger" aria-label="Seleccionar mes" aria-haspopup="listbox" aria-expanded={periodPickerOpen === "month"} onClick={() => setPeriodPickerOpen((current) => current === "month" ? "" : "month")}><strong>{reportMonths[driverPeriodMonth]}</strong><IconChevronDown size={15} /></button>
              {periodPickerOpen === "month" && <div className="driver-period-picker__menu" role="listbox" aria-label="Meses disponibles">{reportMonths.map((monthLabel, monthIndex) => <button type="button" role="option" aria-selected={driverPeriodMonth === monthIndex} ref={driverPeriodMonth === monthIndex ? periodPickerOptionRef : undefined} className={driverPeriodMonth === monthIndex ? "is-selected" : ""} onClick={() => selectDriverPeriod(driverPeriodYear, monthIndex)} key={monthLabel}>{monthLabel}</button>)}</div>}
            </div>
            <div className="driver-period-picker__field">
              <span>AÑO</span>
              <button type="button" className="driver-period-picker__trigger" aria-label="Seleccionar año" aria-haspopup="listbox" aria-expanded={periodPickerOpen === "year"} onClick={() => setPeriodPickerOpen((current) => current === "year" ? "" : "year")}><strong>{driverPeriodYear}</strong><IconChevronDown size={15} /></button>
              {periodPickerOpen === "year" && <div className="driver-period-picker__menu driver-period-picker__menu--years" role="listbox" aria-label="Años disponibles">{driverPeriodYears.map((yearOption) => <button type="button" role="option" aria-selected={driverPeriodYear === yearOption} ref={driverPeriodYear === yearOption ? periodPickerOptionRef : undefined} className={driverPeriodYear === yearOption ? "is-selected" : ""} onClick={() => selectDriverPeriod(yearOption, driverPeriodMonth)} key={yearOption}>{yearOption}</button>)}</div>}
            </div>
          </div>
        </section>
        <section className="driver-day-picker" aria-label="Calendario diario">
          <div className="driver-day-picker__scroller" role="list">
            {calendarDays.map((day) => {
              const parts = getDriverDayParts(day.key);
              const isSelected = day.key === selectedDate;
              const isMonthStart = day.date.getDate() === 1;
              return <div className={`driver-day-picker__item${isMonthStart ? " driver-day-picker__item--month-start" : ""}`} key={day.key} role="listitem">
                <button ref={isSelected ? selectedDayButtonRef : undefined} className={isSelected ? "driver-day-picker__button is-selected" : "driver-day-picker__button"} type="button" aria-pressed={isSelected} aria-label={`Ver ${formatDriverDateLong(day.key)}`} onClick={() => { setSelectedDate(day.key); setMessage(""); }}>
                  <span>{parts.weekday}</span><strong>{parts.day}</strong><small>{parts.month}</small>
                </button>
              </div>;
            })}
          </div>
        </section>
        <section className="driver-day-workspace" aria-live="polite" aria-labelledby="driver-day-detail-title">
          <section className="driver-day-detail">
          <header>
            <div><span>DETALLE Y REGISTRO DIARIO</span><h2 id="driver-day-detail-title">{formatDriverDateLong(selectedDate)}</h2></div>
            <strong>{documentsLoading ? "Cargando…" : `${selectedDayDocuments.length} ${selectedDayDocuments.length === 1 ? "justificante" : "justificantes"}`}</strong>
          </header>
          <div className="driver-day-detail__content">
            <div className="driver-day-metrics">
              {selectedDayMetrics.map(([label, value, unit]) => <span key={label}><small>{label}</small><strong>{unit === "€" ? formatCurrency(value) : `${new Intl.NumberFormat("es-ES").format(value)} ${unit}`}</strong></span>)}
            </div>
            <div className="driver-day-documents">
              {documentsLoading ? <span className="driver-day-documents__empty">Buscando fotos y documentos del día…</span> : selectedDayDocuments.length === 0 ? <span className="driver-day-documents__empty"><IconCamera size={16} />Sin fotos o justificantes para este día</span> : documentPreviews.length === 0 ? <span className="driver-day-documents__empty">Preparando las fotos del día…</span> : documentPreviews.map((document) => {
                const isImage = String(document.mime_type ?? "").startsWith("image/");
                const label = document.category === "billing" ? "Facturación" : "Repostaje / consumo";
                const content = isImage && document.signedUrl ? <img src={document.signedUrl} alt={`Foto de ${label} del ${formatDriverDateLong(selectedDate)}`} loading="lazy" /> : <IconFileInvoice size={22} />;
                return <article className="driver-day-document" key={document.id}><a href={document.signedUrl || undefined} target="_blank" rel="noreferrer" aria-label={`Abrir ${document.file_name}`}>{content}</a><span><strong>{label}</strong><small>{document.file_name}</small><em>{document.status === "approved" ? "Validado" : "Pendiente de revisión"}</em></span></article>;
              })}
            </div>
          </div>
        </section>
          <form className={preview ? "driver-entry-card driver-entry-card--preview" : "driver-entry-card"} onSubmit={saveEntry}>
            <header><div><span>REGISTRO DIARIO</span><h2>Datos del servicio</h2></div><time dateTime={entry.entryDate}>{entry.entryDate}</time></header>
            <fieldset className="driver-entry-fieldset" disabled={preview}>
              <div className="driver-entry-grid">
                <label>Fecha<input type="date" value={entry.entryDate} onChange={(event) => { setSelectedDate(event.target.value); updateEntry("entryDate", event.target.value); }} required /></label>
                <label>Precio neto<input readOnly={!preview} type="number" min="0" step="0.01" placeholder="0,00" value={entry.billing} onChange={(event) => updateEntry("billing", event.target.value)} /><i>€</i></label>
                <label>Efectivo cobrado<input readOnly={!preview} type="number" min="0" step="0.01" placeholder="0,00" value={entry.cashCollected} onChange={(event) => updateEntry("cashCollected", event.target.value)} /><i>€</i></label>
                <label>Gasolina<input readOnly={!preview} type="number" min="0" step="0.01" placeholder="0,00" value={entry.fuelCost} onChange={(event) => updateEntry("fuelCost", event.target.value)} /><i>€</i></label>
                <label>Litros repostados<input readOnly={!preview} type="number" min="0" step="0.01" placeholder="0,00" value={entry.fuelLiters} onChange={(event) => updateEntry("fuelLiters", event.target.value)} /><i>L</i></label>
                <label>Propinas<input readOnly={!preview} type="number" min="0" step="0.01" placeholder="0,00" value={entry.tips} onChange={(event) => updateEntry("tips", event.target.value)} /><i>€</i></label>
                <label>Reembolsos<input readOnly={!preview} type="number" min="0" step="0.01" placeholder="0,00" value={entry.refunds} onChange={(event) => updateEntry("refunds", event.target.value)} /><i>€</i></label>
                <label>Lavados<input type="number" min="0" step="0.01" placeholder="0,00" value={entry.washExpenses} onChange={(event) => updateEntry("washExpenses", event.target.value)} /><i>€</i></label>
                <label>Varios<input type="number" min="0" step="0.01" placeholder="0,00" value={entry.otherExpenses} onChange={(event) => updateEntry("otherExpenses", event.target.value)} /><i>€</i></label>
                <label>Kilometraje del día<input readOnly={!preview} type="number" min="0" step="1" placeholder="0" value={entry.odometerKm} onChange={(event) => updateEntry("odometerKm", event.target.value)} /><i>km</i></label>
                <output className="driver-entry-grid__readonly" aria-label={"Kilómetros totales del coche " + (vehicle?.plate ?? "vehículo")}><span>Kilómetros totales</span><strong>{formatKm(vehicle?.odometer ?? 0)}</strong></output>
                <label className="driver-entry-grid__wide">Nota opcional<textarea readOnly={!preview} rows={2} value={entry.notes} onChange={(event) => updateEntry("notes", event.target.value)} placeholder="Lavado, reembolso u otro gasto imputable" /></label>
              </div>
              <label className="driver-file-input"><IconUpload size={18} /><span>{file ? file.name : "Adjuntar justificante"}<small>JPG, PNG, WEBP o PDF · máximo 12 MB</small></span><input type="file" accept="image/jpeg,image/png,image/webp,.pdf,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
              <footer><span className="driver-entry-status" role="status">{message}</span><button className="primary-button" type="submit" disabled={saving || preview}>{preview ? "Solo lectura" : saving ? "Guardando…" : "Guardar registro"}<IconCheck size={17} /></button></footer>
            </fieldset>
          </form>
        </section>
      </div>
    </main>
  );
}

function DriverBillingTarget({ periodSummary }) {
  const { monthlyBilling, billingGoal, billingProgress, billingScaleMax, billingMilestones, billingCurrentMilestone, billingTargetBarProgress } = periodSummary;
  return <div className={`driver-mobile-billing-target${billingProgress >= 100 ? " is-goal-reached" : ""}`} aria-label={`Escala de facturación hasta ${formatBillingMilestone(billingScaleMax)} euros, objetivo de ${formatBillingMilestone(billingGoal)} euros: ${Math.round(billingProgress)}%`}>
    <div className="driver-mobile-billing-target__header">
      <div className="driver-mobile-billing-target__billing">
        <span>Facturación</span>
        <strong>{formatCurrency(monthlyBilling)}</strong>
      </div>
      <div className="driver-mobile-billing-target__goal">
        <span>Objetivo {formatBillingMilestone(billingGoal)} €</span>
        <strong>{Math.round(billingProgress)}%<small> del objetivo</small></strong>
      </div>
    </div>
    <div className="driver-mobile-billing-target__scale">
      <div className="driver-mobile-billing-target__track" role="progressbar" aria-valuemin="0" aria-valuemax={billingScaleMax} aria-valuenow={Math.min(billingScaleMax, monthlyBilling)} aria-valuetext={`${formatCurrency(monthlyBilling)} · ${Math.round(billingProgress)}% del objetivo`}>
        <i style={{ width: `${billingTargetBarProgress}%` }} />
        {billingMilestones.map((milestone) => {
          const isGoal = milestone === billingGoal;
          const isCurrent = milestone === billingCurrentMilestone;
          return <span key={milestone} className={`driver-mobile-billing-target__milestone${monthlyBilling >= milestone ? " is-reached" : ""}${isCurrent ? " is-current" : ""}${isGoal ? " is-goal" : ""}`} style={{ left: `${getDriverBillingVisualPosition(milestone, billingMilestones, billingScaleMax)}%` }} aria-hidden="true" />;
        })}
      </div>
      <div className="driver-mobile-billing-target__labels">
        <span className="is-start" style={{ left: "0%" }}>0</span>
        {billingMilestones.map((milestone, index) => {
          const isGoal = milestone === billingGoal;
          const isCurrent = milestone === billingCurrentMilestone;
          return <span key={milestone} className={`${index === billingMilestones.length - 1 ? "is-end " : ""}${isGoal ? "is-goal " : ""}${isCurrent ? "is-current" : ""}`} style={{ left: `${getDriverBillingVisualPosition(milestone, billingMilestones, billingScaleMax)}%` }}>{formatBillingMilestone(milestone)}</span>;
        })}
      </div>
    </div>
  </div>;
}

function DriverMobileExperience({ preview, onExitPreview, onSignOut, onInstall, isStandalone = false, profile, vehicle, periodSummary, driverPeriodMonth, driverPeriodYear, driverPeriodYears, reportMonths, periodPickerOpen, setPeriodPickerOpen, periodPickerRef, periodPickerOptionRef, selectDriverPeriod, driverWeekDays, driverWeekPages, weeklyRows, weeklyChartData, monthlyBillingHistory, weeklyConsumptionData, weeklyKmData, weeklyKmAverage, weeklyConsumptionAverage, otherDriversConsumptionAverage, otherDriversKmAverage, dailyPhotoRecords, driverReferenceImages, averageConsumption, selectedDate, setSelectedDate, driverPeriodDate, shiftDriverWeek, message, entryFormOpen, setEntryFormOpen, entry, updateEntry, saveEntry, saving, file, setFile, setFileCapturedAt, driverMenuOpen, setDriverMenuOpen, driverNoticeOpen, setDriverNoticeOpen, driverNavSection, setDriverNavSection, circleUpload, circleReview, closeCircleReview, circleFileInputRef, openCirclePicker, handleCircleFile, saveCircleReview, saveWeeklyAmount, maintenanceNote, maintenanceReports = [], maintenanceReportSaving = false, saveMaintenanceNote, saveMaintenanceReport }) {
  const weekSwipeDuration = 520;
  const kmChartMax = Math.max(500, Math.ceil(Math.max(0, ...weeklyKmData.flatMap(({ driverKm, otherKm }) => [Number(driverKm) || 0, Number(otherKm) || 0])) / 100) * 100);
  const kmChartTicks = Array.from({ length: kmChartMax / 100 + 1 }, (_, index) => index * 100);
  const consumptionChartTicks = [3.5, 4, 4.5, 5, 5.5];
  const homeRef = useRef(null);
  const statsRef = useRef(null);
  const historyRef = useRef(null);
  const entryRef = useRef(null);
  const weekSwipeViewportRef = useRef(null);
  const weekGestureRef = useRef({ pointerId: null, startX: 0, startY: 0, axis: "", offset: 0 });
  const weekSwipeTimerRef = useRef(null);
  const weekSwipeDirectionRef = useRef(0);
  const weekSuppressClickRef = useRef(false);
  const [referenceOpen, setReferenceOpen] = useState("");
  const [expandedPreviewMetric, setExpandedPreviewMetric] = useState("");
  const [activeDriverChartTooltip, setActiveDriverChartTooltip] = useState("");
  const billingChartScrollRef = useRef(null);
  const [billingChartWidth, setBillingChartWidth] = useState(760);
  const [weekSwipeOffset, setWeekSwipeOffset] = useState(0);
  const [weekSwipeActive, setWeekSwipeActive] = useState(false);
  const [weekSwipeTransition, setWeekSwipeTransition] = useState(false);
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);
  const [weeklyDrafts, setWeeklyDrafts] = useState({});
  const [weeklyEditKey, setWeeklyEditKey] = useState("");
  const weeklyPressRef = useRef({ pointerId: null, startAt: 0, startX: 0, startY: 0, cancelled: false });
  const weekPickerRef = useRef(null);
  const [maintenanceNoteOpen, setMaintenanceNoteOpen] = useState(false);
  const [maintenanceNoteDraft, setMaintenanceNoteDraft] = useState(maintenanceNote ?? "");
  const [maintenanceNotePhoto, setMaintenanceNotePhoto] = useState(null);
  const [tipsBreakdownOpen, setTipsBreakdownOpen] = useState(false);
  const maintenanceNoteInputRef = useRef(null);
  const maintenanceNotePhotoInputRef = useRef(null);
  const driverAvatarPath = getDriverAvatarPath(profile.full_name);
  const driverAvatarInitials = String(profile.full_name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
  const referenceLabels = {
    consumption: { title: "Ejemplo de consumo", caption: "Historial del vehículo", alt: "Ejemplo de historial de consumo del vehículo" },
    billing: { title: "Ejemplo de facturación", caption: "Resumen semanal", alt: "Ejemplo de resumen semanal de facturación" },
  };
  const activeBillingMonth = monthlyBillingHistory.find((month) => month.isCurrent) ?? monthlyBillingHistory[monthlyBillingHistory.length - 1] ?? { amount: 0 };
  const currentBillingHistoryIndex = monthlyBillingHistory.findIndex((month) => month.isCurrent);
  const compactBillingHistoryEnd = currentBillingHistoryIndex >= 0 ? currentBillingHistoryIndex + 1 : monthlyBillingHistory.length;
  const compactMonthlyBillingHistory = monthlyBillingHistory.slice(Math.max(0, compactBillingHistoryEnd - DRIVER_BILLING_VISIBLE_MONTHS), compactBillingHistoryEnd);
  const consumptionDifference = weeklyConsumptionAverage - otherDriversConsumptionAverage;
  const openPreviewMetric = (metric) => {
    setActiveDriverChartTooltip("");
    setExpandedPreviewMetric(metric);
  };
  const showDriverChartTooltip = (chartKey, state) => {
    const hasActivePoint = state?.isTooltipActive !== false && (state?.activeTooltipIndex !== undefined || state?.activeIndex !== undefined || state?.activePayload?.length);
    setActiveDriverChartTooltip(hasActivePoint ? chartKey : "");
  };
  const hideDriverChartTooltip = () => setActiveDriverChartTooltip("");
  const handlePreviewGridClick = (event) => {
    if (event.target.closest("button")) {
      if (event.target.closest(".driver-mobile-preview-history")) openPreviewMetric("billing");
      return;
    }
    const card = event.target.closest(".driver-mobile-preview-history, .driver-mobile-preview-consumption, .driver-mobile-preview-km");
    if (!card) return;
    if (card.classList.contains("driver-mobile-preview-km")) openPreviewMetric("km");
    else if (card.classList.contains("driver-mobile-preview-consumption")) openPreviewMetric("consumption");
    else openPreviewMetric("billing");
  };
  const handlePreviewGridKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest(".driver-mobile-preview-history, .driver-mobile-preview-consumption, .driver-mobile-preview-km");
    if (!card) return;
    event.preventDefault();
    openPreviewMetric(card.classList.contains("driver-mobile-preview-km") ? "km" : card.classList.contains("driver-mobile-preview-consumption") ? "consumption" : "billing");
  };
  useEffect(() => {
    setActiveDriverChartTooltip("");
  }, [expandedPreviewMetric]);
  useEffect(() => {
    if (!expandedPreviewMetric) return undefined;
    const handleEscape = (event) => { if (event.key === "Escape") setExpandedPreviewMetric(""); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [expandedPreviewMetric]);
  useEffect(() => {
    if (expandedPreviewMetric !== "billing") return undefined;
    const scrollElement = billingChartScrollRef.current;
    if (!scrollElement) return undefined;
    const updateBillingChartWidth = () => {
      const viewportWidth = scrollElement.clientWidth;
      if (!viewportWidth) return;
      const availableChartWidth = Math.max(1, viewportWidth);
      const monthColumnWidth = Math.max(24, availableChartWidth / DRIVER_BILLING_EXPANDED_VISIBLE_MONTHS);
      const nextWidth = Math.max(viewportWidth, DRIVER_BILLING_CHART_LEFT_MARGIN + DRIVER_BILLING_CHART_Y_AXIS_WIDTH + DRIVER_BILLING_CHART_RIGHT_MARGIN + monthlyBillingHistory.length * monthColumnWidth);
      setBillingChartWidth(nextWidth);
    };
    updateBillingChartWidth();
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateBillingChartWidth);
    resizeObserver?.observe(scrollElement);
    window.addEventListener("resize", updateBillingChartWidth);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateBillingChartWidth);
    };
  }, [expandedPreviewMetric, monthlyBillingHistory.length]);
  useEffect(() => {
    if (expandedPreviewMetric !== "billing") return undefined;
    const frame = window.requestAnimationFrame(() => {
      const scrollElement = billingChartScrollRef.current;
      if (!scrollElement) return;
      const calendarToday = new Date();
      const calendarCurrentMonthKey = `${calendarToday.getFullYear()}-${String(calendarToday.getMonth() + 1).padStart(2, "0")}`;
      const currentIndex = monthlyBillingHistory.findIndex((month) => month.key === calendarCurrentMonthKey);
      const endIndex = currentIndex >= 0 ? currentIndex + 1 : monthlyBillingHistory.length;
      const startIndex = Math.max(0, endIndex - DRIVER_BILLING_EXPANDED_VISIBLE_MONTHS);
      const chartDataWidth = Math.max(1, billingChartWidth - DRIVER_BILLING_CHART_LEFT_MARGIN - DRIVER_BILLING_CHART_Y_AXIS_WIDTH - DRIVER_BILLING_CHART_RIGHT_MARGIN);
      const monthColumnWidth = chartDataWidth / Math.max(1, monthlyBillingHistory.length);
      const targetScrollLeft = monthlyBillingHistory.length > DRIVER_BILLING_EXPANDED_VISIBLE_MONTHS ? DRIVER_BILLING_CHART_LEFT_MARGIN + startIndex * monthColumnWidth : 0;
      scrollElement.scrollLeft = Math.max(0, Math.min(scrollElement.scrollWidth - scrollElement.clientWidth, targetScrollLeft));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [billingChartWidth, driverPeriodMonth, driverPeriodYear, expandedPreviewMetric, monthlyBillingHistory.length]);
  const scrollTo = (section, ref) => {
    setDriverNavSection(section);
    setDriverMenuOpen(false);
    setDriverNoticeOpen(false);
    window.requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const openEntry = () => {
    setEntryFormOpen(true);
    setDriverNavSection("home");
    window.requestAnimationFrame(() => entryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  useEffect(() => {
    if (!driverMenuOpen) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!(event.target instanceof Element) || !event.target.closest(".driver-mobile-topbar")) setDriverMenuOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === "Escape") setDriverMenuOpen(false); };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [driverMenuOpen, setDriverMenuOpen]);
  const currentWeekPage = driverWeekPages.find((page) => page.offset === 0) ?? driverWeekPages[1];
  const currentWeekStartDate = currentWeekPage?.days?.[0]?.date ? getDriverWeekStart(currentWeekPage.days[0].date) : getDriverWeekStart(driverPeriodDate);
  const weekLabel = currentWeekStartDate ? String(currentWeekStartDate.getDate()) : "";
  const weekPickerOptions = (() => {
    const periodStart = new Date(driverPeriodYear, driverPeriodMonth, 1);
    const firstWeekStart = getDriverWeekStart(periodStart);
    const periodEnd = new Date(driverPeriodYear, driverPeriodMonth + 1, 0);
    const lastWeekStart = getDriverWeekStart(periodEnd);
    const currentWeekStart = currentWeekPage?.days?.[0]?.date ? getDriverWeekStart(currentWeekPage.days[0].date) : firstWeekStart;
    const rangeFormatter = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
    const options = [];
    for (let start = new Date(firstWeekStart); start <= lastWeekStart; start.setDate(start.getDate() + 7)) {
      const startDate = new Date(start);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      options.push({
        key: getDriverDateKey(startDate),
        offset: Math.round((startDate.getTime() - currentWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)),
        label: `SEMANA DEL ${startDate.getDate()}`,
        range: `${rangeFormatter.format(startDate).replace(/\./g, "")} – ${rangeFormatter.format(endDate).replace(/\./g, "")}`,
      });
    }
    return options;
  })();
  const selectDriverWeek = (offset) => {
    setWeekPickerOpen(false);
    if (offset !== 0) shiftDriverWeek(offset);
  };
  useEffect(() => {
    if (!weekPickerOpen) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!weekPickerRef.current?.contains(event.target)) setWeekPickerOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === "Escape") setWeekPickerOpen(false); };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [weekPickerOpen]);
  const editableWeeklyRows = preview ? ADMIN_EDITABLE_WEEKLY_ROWS : DRIVER_EDITABLE_WEEKLY_ROWS;
  const formatWeeklyAmount = (value) => {
    const numericValue = Number(value) || 0;
    return numericValue === 0
      ? "0"
      : numericValue.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const formatWeeklyCellAmount = (value) => formatWeeklyAmount(value);
  const clearWeeklyPress = () => {
    weeklyPressRef.current = { pointerId: null, startAt: 0, startX: 0, startY: 0, cancelled: false };
  };
  const openWeeklyEditor = (draftKey, value, rowKey = "") => {
    if (rowKey && !editableWeeklyRows.has(rowKey)) return;
    setWeeklyDrafts((current) => Object.hasOwn(current, draftKey) ? current : { ...current, [draftKey]: formatWeeklyAmount(value) });
    setWeeklyEditKey(draftKey);
  };
  const startWeeklyPress = (draftKey, value, rowKey, event) => {
    if (!editableWeeklyRows.has(rowKey)) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    weeklyPressRef.current = { pointerId: event.pointerId, startAt: Date.now(), startX: event.clientX, startY: event.clientY, cancelled: false };
  };
  const moveWeeklyPress = (event) => {
    const press = weeklyPressRef.current;
    if (press.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - press.startX, event.clientY - press.startY) > 12) press.cancelled = true;
  };
  const finishWeeklyPress = (draftKey, value, rowKey, event) => {
    event.stopPropagation();
    const press = weeklyPressRef.current;
    if (press.pointerId !== event.pointerId) return;
    const isShortPress = !press.cancelled && Date.now() - press.startAt <= WEEKLY_EDIT_MAX_PRESS_MS;
    clearWeeklyPress();
    if (isShortPress) openWeeklyEditor(draftKey, value, rowKey);
  };
  useEffect(() => () => clearWeeklyPress(), []);
  useEffect(() => {
    if (!weeklyEditKey) return undefined;
    const closeWeeklyEditorOutside = (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest(".driver-mobile-week-table__amount-editor")) return;
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLInputElement && activeElement.classList.contains("driver-mobile-week-table__amount-input")) activeElement.blur();
      setWeeklyEditKey("");
    };
    document.addEventListener("pointerdown", closeWeeklyEditorOutside, true);
    return () => document.removeEventListener("pointerdown", closeWeeklyEditorOutside, true);
  }, [weeklyEditKey]);
  const weeklyCell = (row, value, dateKey, isEditorHost = false) => {
    if (!editableWeeklyRows.has(row.key)) {
      const formattedValue = formatWeeklyCellAmount(value, row.key);
      return <span className="driver-mobile-week-table__amount-readonly" aria-label={`${row.label} del ${dateKey}: ${formattedValue}. Solo lectura`}>{formattedValue}</span>;
    }
    const draftKey = `${dateKey}:${row.key}`;
    const hasDraft = Object.hasOwn(weeklyDrafts, draftKey);
    const displayedValue = hasDraft ? weeklyDrafts[draftKey] : formatWeeklyCellAmount(value, row.key);
    if (weeklyEditKey !== draftKey || !isEditorHost) return <button type="button" className="driver-mobile-week-table__amount-trigger" aria-label={`Editar ${row.label} del ${dateKey} con una pulsación breve`} title="Pulsa y suelta antes de 1 segundo para editar" onPointerDown={(event) => { event.stopPropagation(); startWeeklyPress(draftKey, value, row.key, event); }} onPointerMove={(event) => { event.stopPropagation(); moveWeeklyPress(event); }} onPointerUp={(event) => finishWeeklyPress(draftKey, value, row.key, event)} onPointerCancel={(event) => { event.stopPropagation(); clearWeeklyPress(); }} onPointerLeave={(event) => { event.stopPropagation(); clearWeeklyPress(); }} onContextMenu={(event) => event.preventDefault()} onKeyDown={(event) => { if (event.key !== "Enter" && event.key !== " ") return; event.preventDefault(); openWeeklyEditor(draftKey, value, row.key); }}>{displayedValue}</button>;
    return <span className="driver-mobile-week-table__amount-editor"><input autoFocus className="driver-mobile-week-table__amount-input" type="text" inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" value={displayedValue} aria-label={`${row.label} del ${dateKey}`} placeholder="0,00" onFocus={(event) => event.currentTarget.select()} onPointerDown={(event) => event.stopPropagation()} onPointerMove={(event) => event.stopPropagation()} onPointerUp={(event) => { event.stopPropagation(); event.preventDefault(); }} onChange={(event) => setWeeklyDrafts((current) => ({ ...current, [draftKey]: event.target.value }))} onBlur={async () => { const nextValue = Object.hasOwn(weeklyDrafts, draftKey) ? weeklyDrafts[draftKey] : displayedValue; await saveWeeklyAmount(dateKey, row.key, nextValue); setWeeklyDrafts((current) => { const next = { ...current }; delete next[draftKey]; return next; }); setWeeklyEditKey((current) => current === draftKey ? "" : current); }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { setWeeklyDrafts((current) => { const next = { ...current }; delete next[draftKey]; return next; }); setWeeklyEditKey(""); event.currentTarget.blur(); } }} /><b aria-hidden="true">€</b></span>;
  };
  const completeWeekSwipe = () => {
    const direction = weekSwipeDirectionRef.current;
    if (!weekSwipeTransition && !weekSwipeActive && direction === 0) return;
    window.clearTimeout(weekSwipeTimerRef.current);
    weekSwipeTimerRef.current = null;
    flushSync(() => {
      if (direction !== 0) shiftDriverWeek(direction);
      weekSwipeDirectionRef.current = 0;
      setWeekSwipeOffset(0);
      setWeekSwipeActive(false);
      setWeekSwipeTransition(false);
    });
  };
  const settleWeekSwipe = (direction) => {
    const width = weekSwipeViewportRef.current?.clientWidth ?? 320;
    window.clearTimeout(weekSwipeTimerRef.current);
    weekSwipeDirectionRef.current = direction;
    setWeekSwipeTransition(true);
    setWeekSwipeOffset(direction === 0 ? 0 : direction > 0 ? -width : width);
    // La transición real es la que confirma el cambio; este temporizador solo evita
    // que el carrusel quede bloqueado si el navegador no emite transitionend.
    weekSwipeTimerRef.current = window.setTimeout(completeWeekSwipe, weekSwipeDuration + 120);
  };
  const handleWeekPointerDown = (event) => {
    if (weekSwipeTransition || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (event.target instanceof Element && event.target.closest(".driver-mobile-week-table-wrap")) return;
    weekGestureRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, axis: "", offset: 0 };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handleWeekPointerMove = (event) => {
    const gesture = weekGestureRef.current;
    if (gesture.pointerId !== event.pointerId || weekSwipeTransition) return;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (!gesture.axis) {
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 6) return;
      gesture.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
      if (gesture.axis === "horizontal") setWeekSwipeActive(true);
    }
    if (gesture.axis !== "horizontal") return;
    event.preventDefault();
    const width = weekSwipeViewportRef.current?.clientWidth ?? 320;
    gesture.offset = Math.max(-width, Math.min(width, deltaX));
    setWeekSwipeOffset(gesture.offset);
  };
  const handleWeekPointerEnd = (event) => {
    const gesture = weekGestureRef.current;
    if (gesture.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    weekGestureRef.current = { pointerId: null, startX: 0, startY: 0, axis: "", offset: 0 };
    if (gesture.axis !== "horizontal") return;
    weekSuppressClickRef.current = true;
    const width = weekSwipeViewportRef.current?.clientWidth ?? 320;
    const threshold = Math.max(48, width * 0.18);
    const direction = Math.abs(gesture.offset) >= threshold ? (gesture.offset < 0 ? 1 : -1) : 0;
    settleWeekSwipe(direction);
  };
  const handleWeekClickCapture = (event) => {
    if (!weekSuppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    weekSuppressClickRef.current = false;
  };
  useEffect(() => () => window.clearTimeout(weekSwipeTimerRef.current), []);

  useEffect(() => {
    if (!maintenanceNoteOpen) {
      setMaintenanceNoteDraft(maintenanceNote ?? "");
      setMaintenanceNotePhoto(null);
    }
  }, [maintenanceNote, maintenanceNoteOpen]);

  const chooseMaintenanceNotePhoto = () => {
    const input = maintenanceNotePhotoInputRef.current;
    if (!input) return;
    input.value = "";
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      // Algunos navegadores móviles solo permiten abrir el selector con click().
    }
    input.click();
  };

  const handleMaintenanceNotePhoto = (event) => {
    const nextFile = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!nextFile) return;
    if (!String(nextFile.type ?? "").startsWith("image/")) return;
    if (nextFile.size > 8 * 1024 * 1024) return;
    setMaintenanceNotePhoto(nextFile);
  };

  const submitMaintenanceReport = async (event) => {
    event.preventDefault();
    try {
      await saveMaintenanceReport({ note: maintenanceNoteDraft, photoFile: maintenanceNotePhoto });
      setMaintenanceNoteOpen(false);
    } catch (error) {
      // El mensaje visible lo gestiona DriverApp; mantener el formulario abierto
      // permite corregir el texto o elegir otra imagen sin perder lo escrito.
      return error;
    }
    return undefined;
  };

  useEffect(() => {
    if (!maintenanceNoteOpen) return undefined;
    const frame = window.requestAnimationFrame(() => maintenanceNoteInputRef.current?.focus());
    const closeOnEscape = (event) => { if (event.key === "Escape") setMaintenanceNoteOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [maintenanceNoteOpen]);

  useEffect(() => {
    setTipsBreakdownOpen(false);
  }, [driverPeriodMonth, driverPeriodYear]);

  return (
    <main className={`driver-app driver-mobile-app driver-mobile-app--updated ${preview ? "driver-app--preview" : "driver-app--live"}`}>
      <header className="driver-mobile-topbar">
        {preview && <button type="button" className="driver-mobile-topbar__back" onClick={onExitPreview} aria-label="Volver a administración" title="Volver a administración"><IconChevronLeft size={24} /></button>}
        <button type="button" className="driver-mobile-topbar__title" onClick={() => { setDriverMenuOpen((current) => !current); setDriverNoticeOpen(false); }} aria-label={`Abrir opciones de ${profile.full_name}`} aria-haspopup="menu" aria-expanded={driverMenuOpen} aria-controls="driver-mobile-options"><span className="driver-mobile-topbar__avatar" aria-hidden="true">{driverAvatarPath ? <img src={driverAvatarPath} alt="" /> : <span>{driverAvatarInitials}</span>}</span><span className="driver-mobile-topbar__identity"><strong>{profile.full_name.toUpperCase()}</strong><span className="driver-mobile-topbar__vehicle"><VehiclePlateLabel vehicleOrPlate={vehicle?.plate ?? profileVehiclePlate} className="driver-mobile-topbar__plate" />{vehicle?.owner?.dni && <small>{String(vehicle.owner.dni).replaceAll("-", "")}</small>}</span></span></button>
        {driverMenuOpen && <aside id="driver-mobile-options" className="driver-mobile-topbar__popover driver-mobile-topbar__popover--menu" aria-label="Menú del conductor" role="menu">
          <button type="button" role="menuitem" onClick={() => scrollTo("home", homeRef)}><IconHome size={16} />Inicio</button>
          <button type="button" role="menuitem" onClick={() => scrollTo("history", historyRef)}><IconHistory size={16} />Historial semanal</button>
          <button type="button" role="menuitem" onClick={openEntry}><IconPlus size={16} />Añadir registro</button>
          {!isStandalone && <button type="button" role="menuitem" onClick={() => { setDriverMenuOpen(false); void onInstall?.(setMessage); }}><IconDownload size={16} />Instalar SOBRE RUEDAS</button>}
          <button type="button" role="menuitem" onClick={preview ? onExitPreview : onSignOut}><IconLogout size={16} />{preview ? "Volver a administración" : "Cerrar sesión"}</button>
        </aside>}
        {driverNoticeOpen && <aside className="driver-mobile-topbar__popover driver-mobile-topbar__popover--notice" role="status"><IconBell size={16} /><span><strong>Notificaciones</strong><small>No hay avisos nuevos.</small></span></aside>}
      </header>
      <div className="driver-mobile-body">
        {!preview && !isStandalone && <div className="driver-mobile-install-card"><div className="driver-mobile-install-card__copy"><IconDownload size={17} /><span><strong>Instala SOBRE RUEDAS</strong><small>Ábrela desde el icono de la rueda sin buscar el enlace.</small></span></div><button type="button" onClick={() => void onInstall?.(setMessage)}>Instalar aplicación</button></div>}
        {message && <div className="driver-mobile-message" role="status">{message}</div>}
        <input ref={circleFileInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,.pdf,application/pdf" aria-label="Elegir cámara o archivo para el registro" onChange={handleCircleFile} />
        <section ref={homeRef} className="driver-mobile-section driver-mobile-section--home" aria-label="Resumen del conductor">
          <article className="driver-mobile-month-summary">
            <div className="driver-mobile-month-summary__heading"><strong>ACUMULADO · {periodSummary.monthLabel} {driverPeriodYear}</strong><span className="driver-mobile-owner"><strong>{vehicle?.owner?.name ?? ""}</strong><b>{(vehicle?.owner?.dni ?? "").replaceAll("-", "")}</b></span></div>
            <div className="driver-mobile-month-summary__columns">
              <div className="driver-mobile-month-summary__metric driver-mobile-month-summary__metric--billing"><DriverBillingTarget periodSummary={periodSummary} /></div>
              <div className="driver-mobile-month-summary__metric driver-mobile-month-summary__metric--tips">
                <div className="driver-mobile-month-summary__tips-layout">
                  <div className="driver-mobile-month-summary__tips-value">
                    <button type="button" className="driver-mobile-month-summary__tips-trigger" aria-expanded={tipsBreakdownOpen} aria-controls="driver-monthly-tips-breakdown" aria-label={`Ver días de propinas de ${periodSummary.monthLabel}`} onClick={() => setTipsBreakdownOpen((current) => !current)}>
                      <span>PROPINAS <IconChevronDown size={13} aria-hidden="true" /></span>
                      <strong>{formatCurrency(periodSummary.monthlyTips)}</strong>
                    </button>
                  </div>
                  <button type="button" className="driver-mobile-maintenance-note__trigger" aria-expanded={maintenanceNoteOpen} aria-controls="driver-maintenance-note" onClick={() => { setMaintenanceNoteDraft(maintenanceNote ?? ""); setMaintenanceNotePhoto(null); setMaintenanceNoteOpen((current) => !current); }}><IconTool size={14} /><span>Pendiente de mantenimiento</span>{maintenanceReports.length > 0 && <b className="driver-mobile-maintenance-note__count">{maintenanceReports.length}</b>}</button>
                </div>
                {tipsBreakdownOpen && <section id="driver-monthly-tips-breakdown" className="driver-mobile-tips-breakdown" aria-label={`Desglose diario de propinas de ${periodSummary.monthLabel}`}>
                  <header><strong>DESGLOSE DIARIO</strong><button type="button" aria-label="Cerrar desglose de propinas" onClick={() => setTipsBreakdownOpen(false)}><IconX size={14} /></button></header>
                  {(periodSummary.monthlyTipsByDay ?? []).length > 0 ? <div className="driver-mobile-tips-breakdown__rows">{periodSummary.monthlyTipsByDay.map(({ dateKey, amount }) => <div key={dateKey}><span>{formatDriverTipDate(dateKey)}</span><strong>{formatCurrency(amount)}</strong></div>)}</div> : <p>{periodSummary.monthlyTipsDailySource === "imported" ? "El total importado no incluye el detalle de cada día." : "Aún no hay propinas registradas por día."}</p>}
                  <footer><span>Total del mes</span><strong>{formatCurrency(periodSummary.monthlyTips)}</strong></footer>
                </section>}
                {maintenanceNoteOpen && <form id="driver-maintenance-note" className="driver-mobile-maintenance-note" onSubmit={submitMaintenanceReport}><label htmlFor="driver-maintenance-note-input">Qué conviene hacer en la próxima revisión</label><textarea ref={maintenanceNoteInputRef} id="driver-maintenance-note-input" rows="3" value={maintenanceNoteDraft} onChange={(event) => setMaintenanceNoteDraft(event.target.value)} placeholder="Escribe aquí lo que debería revisarse o cambiarse en el coche…" /><input ref={maintenanceNotePhotoInputRef} className="sr-only" type="file" accept="image/*" capture="environment" aria-label="Fotografiar incidencia de mantenimiento" onChange={handleMaintenanceNotePhoto} /><div className="driver-mobile-maintenance-note__photo-status">{maintenanceNotePhoto ? <><IconCamera size={14} /><span>{maintenanceNotePhoto.name}</span><button type="button" aria-label="Quitar fotografía de la incidencia" onClick={() => setMaintenanceNotePhoto(null)}><IconX size={13} /></button></> : <span>Añade una foto si la incidencia necesita prueba visual.</span>}</div><div className="driver-mobile-maintenance-note__actions"><button type="button" className="secondary-button" onClick={() => { setMaintenanceNoteDraft(maintenanceNote ?? ""); setMaintenanceNotePhoto(null); setMaintenanceNoteOpen(false); }}>Cancelar</button><button type="button" className="driver-mobile-maintenance-note__camera" onClick={chooseMaintenanceNotePhoto} disabled={maintenanceReportSaving}><IconCamera size={15} />Foto</button><button type="submit" className="primary-button" disabled={maintenanceReportSaving}><IconCheck size={15} />{maintenanceReportSaving ? "Guardando…" : "Guardar"}</button></div></form>}
              </div>
            </div>
          </article>
        </section>
        <section ref={statsRef} className="driver-mobile-section driver-mobile-section--today" aria-label="Registros diarios">
          <div className="driver-mobile-record-grid">
            {dailyPhotoRecords.map(({ key, label, image, hasAttachment, Icon: RecordIcon, alt }) => {
              const isUploading = circleUpload.key === key && circleUpload.status === "uploading";
              const isAttached = hasAttachment || circleUpload.key === key && ["saved", "local"].includes(circleUpload.status);
              const statusLabel = isUploading ? "Guardando…" : isAttached ? "Justificante archivado" : "Sin adjunto";
              return <button type="button" className={`driver-mobile-record-card driver-mobile-record-card--${key}${isAttached ? " is-attached" : ""}`} key={key} onClick={() => openCirclePicker(key)} disabled={isUploading} aria-label={`${label}: ${statusLabel}`} title={`Abrir cámara o adjuntar archivo de ${label.toLowerCase()}`}><div className="driver-mobile-record-card__image">{image ? <img src={image} alt={alt} loading="lazy" /> : <RecordIcon size={30} stroke={1.7} aria-hidden="true" />}{isUploading && <i className="driver-mobile-record-card__loader" aria-hidden="true" />}</div><span>{label}</span></button>;
            })}
          </div>
          <div className="driver-mobile-preview-mini-grid" onClick={handlePreviewGridClick} onKeyDown={handlePreviewGridKeyDown}>
            <article className="driver-mobile-preview-km driver-mobile-preview-chart-card" role="button" tabIndex={0} aria-label="Kilómetros realizados frente al resto de conductores"><div className="driver-mobile-preview-chart-card__heading">KM REALIZADOS VS RESTO</div><div className="driver-mobile-preview-chart-card__summary"><strong>{Math.round(weeklyKmAverage).toLocaleString("es-ES")} km</strong><span>Resto conductores: {Math.round(otherDriversKmAverage).toLocaleString("es-ES")} km</span></div><ResponsiveContainer width="100%" height={58}><LineChart data={weeklyKmData} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}><Line type="monotone" dataKey="driverKm" name="Este conductor" stroke="#2c6de9" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="otherKm" name="Resto conductores" stroke="#9aaac0" strokeWidth={1.7} strokeDasharray="4 3" dot={false} /></LineChart></ResponsiveContainer><div className="driver-mobile-preview-chart-card__legend"><span><i className="is-driver" />Tú</span><span><i className="is-fleet" />Resto</span></div></article>
            <article className="driver-mobile-preview-history" aria-label="Facturación mensual histórica"><div className="driver-mobile-history-scroll" role="region" tabIndex="0" aria-label="Histórico de facturación mensual de los últimos doce meses"><div className="driver-mobile-history-bars" role="list">{compactMonthlyBillingHistory.map((month) => <button type="button" className={`driver-mobile-history-bar${month.isCurrent ? " is-selected" : ""}`} role="listitem" aria-pressed={month.isCurrent} aria-label={`${month.label}: ${formatCurrency(month.amount)}`} title={`${month.label}: ${formatCurrency(month.amount)}`} onClick={() => selectDriverPeriod(month.year, month.monthIndex)} key={month.key}><i style={{ height: `${month.barHeight}%` }}><span>{formatDriverBarAmount(month.amount)}</span></i><small><b>{String(month.shortLabel).slice(0, 2)}</b><em>{String(month.year).slice(-2)}</em></small></button>)}</div></div></article>
            <article className="driver-mobile-preview-consumption" aria-label="Consumo semanal comparado"><div className="driver-mobile-consumption-compare"><span>Este conductor<strong>{weeklyConsumptionAverage.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} l/100 km</strong></span><em className={consumptionDifference <= 0 ? "is-better" : "is-higher"}>{consumptionDifference > 0 ? "+" : ""}{consumptionDifference.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} l/100 km</em><span>Resto<strong>{otherDriversConsumptionAverage.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} l/100 km</strong></span></div><ResponsiveContainer width="100%" height={58}><LineChart data={weeklyConsumptionData} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}><Line type="monotone" dataKey="driverConsumption" stroke="#2c6de9" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="otherConsumption" stroke="#9aaac0" strokeWidth={1.7} strokeDasharray="4 3" dot={false} /></LineChart></ResponsiveContainer><div className="driver-mobile-consumption-legend"><span><i className="is-driver" />Tú</span><span><i className="is-fleet" />Resto</span></div></article>
          </div>
          <div className="driver-mobile-mini-grid">
            <article className="driver-mobile-mini-card driver-mobile-mini-card--billing-history"><div className="driver-mobile-mini-card__header"><div><strong>Facturación histórica</strong><span>{formatCurrency(activeBillingMonth.amount)} · este conductor</span></div><button type="button" className="driver-mobile-reference-thumb" onClick={() => setReferenceOpen("billing")} aria-label="Abrir ejemplo de facturación"><img src={driverReferenceImages.billing} alt="" loading="lazy" /><span>Ejemplo</span></button></div><div className="driver-mobile-billing-history" role="list" aria-label="Histórico mensual de facturación de los últimos doce meses">{compactMonthlyBillingHistory.map((month) => <button type="button" className={`driver-mobile-billing-history__month${month.isCurrent ? " is-selected" : ""}`} role="listitem" aria-pressed={month.isCurrent} onClick={() => selectDriverPeriod(month.year, month.monthIndex)} key={month.key}><i style={{ height: `${month.barHeight}%` }}><strong>{formatDriverBarAmount(month.amount)}</strong></i><small><b>{String(month.shortLabel).slice(0, 2)}</b><em>{String(month.year).slice(-2)}</em></small></button>)}</div></article>
            <article className="driver-mobile-mini-card driver-mobile-mini-card--consumption-compare"><div className="driver-mobile-mini-card__header"><div><strong>Consumo semanal</strong><span>{weeklyConsumptionAverage.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} l/100 km · este conductor</span></div><button type="button" className="driver-mobile-reference-thumb" onClick={() => setReferenceOpen("consumption")} aria-label="Abrir ejemplo de consumo"><img src={driverReferenceImages.consumption} alt="" loading="lazy" /><span>Ejemplo</span></button></div><div className="driver-mobile-consumption-compare"><span>Resto conductores<strong>{otherDriversConsumptionAverage.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} l/100 km</strong></span><em className={consumptionDifference <= 0 ? "is-better" : "is-higher"}>{consumptionDifference > 0 ? "+" : ""}{consumptionDifference.toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} l/100 km</em></div><ResponsiveContainer width="100%" height={62}><LineChart data={weeklyConsumptionData} margin={{ top: 5, right: 2, bottom: 0, left: 2 }}><Line type="monotone" dataKey="driverConsumption" stroke="#2c6de9" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="otherConsumption" stroke="#9aaac0" strokeWidth={1.7} strokeDasharray="4 3" dot={false} /></LineChart></ResponsiveContainer><div className="driver-mobile-consumption-legend"><span><i className="is-driver" />Tú</span><span><i className="is-fleet" />Resto</span></div></article>
          </div>
        </section>
        <section ref={historyRef} className="driver-mobile-section driver-mobile-section--history" aria-labelledby="driver-mobile-week-title">
          <div ref={weekSwipeViewportRef} className={`driver-mobile-week-swipe-wrap${weekSwipeActive ? " is-dragging" : ""}`} role="region" aria-label="Semana desplazable" onPointerDown={handleWeekPointerDown} onPointerMove={handleWeekPointerMove} onPointerUp={handleWeekPointerEnd} onPointerCancel={handleWeekPointerEnd} onClickCapture={handleWeekClickCapture}>
            <div className={`driver-mobile-week-track${weekSwipeTransition ? " is-animating" : ""}`} onTransitionEnd={(event) => { if (event.target === event.currentTarget && event.propertyName === "transform") completeWeekSwipe(); }} style={{ transform: `translate3d(calc(-33.333333% + ${weekSwipeOffset}px), 0, 0)` }}>
              {driverWeekPages.map((page) => <div className="driver-mobile-week-page" key={page.key}><div className="driver-mobile-week-table-wrap"><table className="driver-mobile-week-table"><thead><tr><th scope="col"> </th>{page.days.map(({ date, key }) => <th scope="col" key={key}><button type="button" className={selectedDate === key ? "is-selected" : ""} onClick={() => setSelectedDate(key)}><span>{new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(date).replace(".", "")}</span><strong>{date.getDate()}</strong></button></th>)}</tr></thead><tbody>{page.rows.map((row) => <tr className={`driver-mobile-week-table__row--${row.key}${row.key === "total" ? " is-total" : ""}`} key={`${page.key}-${row.key}`}><th className={`driver-mobile-week-table__label driver-mobile-week-table__label--${row.key}`} scope="row">{row.label}</th>{row.values.map((value, index) => <td key={`${page.key}-${row.key}-${page.days[index].key}`}>{weeklyCell(row, value, page.days[index].key, page.offset === 0)}</td>)}</tr>)}</tbody></table></div></div>)}
            </div>
          </div>
          <header className="driver-mobile-section__heading driver-mobile-section__heading--week">
            <div className="driver-mobile-week-picker" ref={weekPickerRef}>
              <button type="button" className="driver-mobile-week-picker__trigger" aria-label={`Seleccionar semana del lunes ${weekLabel}`} aria-haspopup="listbox" aria-expanded={weekPickerOpen} aria-controls="driver-mobile-week-picker-menu" onClick={() => setWeekPickerOpen((current) => !current)}>
                <span className="driver-mobile-week-picker__label" id="driver-mobile-week-title"><span>SEMANA DEL</span><strong>{weekLabel}</strong></span>
                <IconChevronDown size={14} aria-hidden="true" />
              </button>
              {weekPickerOpen && <div id="driver-mobile-week-picker-menu" className="driver-period-picker__menu driver-mobile-week-picker__menu" role="listbox" aria-label="Semanas del mes">
                {weekPickerOptions.map((option) => <button type="button" role="option" aria-selected={option.offset === 0} className={option.offset === 0 ? "is-selected" : ""} onClick={() => selectDriverWeek(option.offset)} key={option.key}><span>{option.label}</span><small>{option.range}</small></button>)}
              </div>}
              <small>Selecciona un día para revisar sus registros</small>
            </div>
            <div className="driver-mobile-week-actions"><button type="button" aria-label="Semana anterior" onClick={() => shiftDriverWeek(-1)}><IconChevronLeft size={16} /></button><button type="button" aria-label="Semana siguiente" onClick={() => shiftDriverWeek(1)}><IconChevronRight size={16} /></button></div>
          </header>
          <div className="driver-mobile-period-control" ref={periodPickerRef}><button type="button" className="driver-mobile-period-trigger" aria-label="Seleccionar mes" aria-haspopup="listbox" aria-expanded={periodPickerOpen === "month"} onClick={() => { setWeekPickerOpen(false); setPeriodPickerOpen((current) => current === "month" ? "" : "month"); }}><span>{reportMonths[driverPeriodMonth]}</span><IconChevronDown size={14} /></button><button type="button" className="driver-mobile-period-year" aria-label="Seleccionar año" aria-haspopup="listbox" aria-expanded={periodPickerOpen === "year"} onClick={() => { setWeekPickerOpen(false); setPeriodPickerOpen((current) => current === "year" ? "" : "year"); }}>{driverPeriodYear}</button>{periodPickerOpen === "month" && <div className="driver-period-picker__menu driver-mobile-period-menu" role="listbox" aria-label="Meses disponibles">{reportMonths.map((monthLabel, monthIndex) => <button type="button" role="option" aria-selected={driverPeriodMonth === monthIndex} ref={driverPeriodMonth === monthIndex ? periodPickerOptionRef : undefined} className={driverPeriodMonth === monthIndex ? "is-selected" : ""} onClick={() => selectDriverPeriod(driverPeriodYear, monthIndex)} key={monthLabel}>{monthLabel}</button>)}</div>}{periodPickerOpen === "year" && <div className="driver-period-picker__menu driver-period-picker__menu--years driver-mobile-period-menu" role="listbox" aria-label="Años disponibles">{driverPeriodYears.map((yearOption) => <button type="button" role="option" aria-selected={driverPeriodYear === yearOption} ref={driverPeriodYear === yearOption ? periodPickerOptionRef : undefined} className={driverPeriodYear === yearOption ? "is-selected" : ""} onClick={() => selectDriverPeriod(yearOption, driverPeriodMonth)} key={yearOption}>{yearOption}</button>)}</div>}</div>
          <div className="driver-mobile-week-table-wrap"><table className="driver-mobile-week-table"><thead><tr><th scope="col"> </th>{driverWeekDays.map(({ date, key }) => <th scope="col" key={key}><button type="button" className={selectedDate === key ? "is-selected" : ""} onClick={() => setSelectedDate(key)}><span>{new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(date).replace(".", "")}</span><strong>{date.getDate()}</strong></button></th>)}</tr></thead><tbody>{weeklyRows.map((row) => <tr className={`driver-mobile-week-table__row--${row.key}${row.key === "total" ? " is-total" : ""}`} key={row.key}><th className={`driver-mobile-week-table__label driver-mobile-week-table__label--${row.key}`} scope="row">{row.label}</th>{row.values.map((value, index) => <td key={`${row.key}-${driverWeekDays[index].key}`}>{weeklyCell(row, value, driverWeekDays[index].key, true)}</td>)}</tr>)}</tbody></table></div>
        </section>
        {entryFormOpen && <section ref={entryRef} className="driver-mobile-entry" aria-labelledby="driver-mobile-entry-title"><header><div><span>REGISTRO DIARIO</span><h2 id="driver-mobile-entry-title">Datos del servicio</h2></div><button type="button" aria-label="Cerrar registro diario" onClick={() => setEntryFormOpen(false)}><IconX size={17} /></button></header><form onSubmit={saveEntry}><fieldset disabled={preview}><div className="driver-mobile-entry-grid"><label>Fecha<input type="date" value={entry.entryDate} onChange={(event) => { setEntryDateWasEdited(true); setSelectedDate(event.target.value); updateEntry("entryDate", event.target.value); }} required /></label><label>Precio neto<input readOnly={!preview} type="number" min="0" step="0.01" value={entry.billing} onChange={(event) => updateEntry("billing", event.target.value)} /><i>€</i></label><label>Efectivo cobrado<input readOnly={!preview} type="number" min="0" step="0.01" value={entry.cashCollected} onChange={(event) => updateEntry("cashCollected", event.target.value)} /><i>€</i></label><label>Gasolina<input readOnly={!preview} type="number" min="0" step="0.01" value={entry.fuelCost} onChange={(event) => updateEntry("fuelCost", event.target.value)} /><i>€</i></label><label>Litros repostados<input readOnly={!preview} type="number" min="0" step="0.01" value={entry.fuelLiters} onChange={(event) => updateEntry("fuelLiters", event.target.value)} /><i>L</i></label><label>Propinas<input readOnly={!preview} type="number" min="0" step="0.01" value={entry.tips} onChange={(event) => updateEntry("tips", event.target.value)} /><i>€</i></label><label>Reembolsos<input readOnly={!preview} type="number" min="0" step="0.01" value={entry.refunds} onChange={(event) => updateEntry("refunds", event.target.value)} /><i>€</i></label><label>Lavados<input type="number" min="0" step="0.01" value={entry.washExpenses} onChange={(event) => updateEntry("washExpenses", event.target.value)} /><i>€</i></label><label>Varios<input type="number" min="0" step="0.01" value={entry.otherExpenses} onChange={(event) => updateEntry("otherExpenses", event.target.value)} /><i>€</i></label><label>Kilometraje del día<input readOnly={!preview} type="number" min="0" step="1" value={entry.odometerKm} onChange={(event) => updateEntry("odometerKm", event.target.value)} /><i>km</i></label><output><span>Kilómetros totales</span><strong>{formatKm(vehicle?.odometer ?? 0)}</strong></output><label className="driver-mobile-entry-grid__wide">Nota<textarea readOnly={!preview} rows="2" value={entry.notes} onChange={(event) => updateEntry("notes", event.target.value)} placeholder="Lavado, reembolso u otro gasto imputable" /></label></div><label className="driver-mobile-file"><IconUpload size={17} /><span>{file ? file.name : "Adjuntar justificante"}<small>JPG, PNG, WEBP o PDF · máximo 12 MB</small></span><input type="file" accept="image/jpeg,image/png,image/webp,.pdf,application/pdf" onChange={(event) => { const nextFile = event.target.files?.[0] ?? null; setFile(nextFile); setFileCapturedAt(nextFile ? new Date().toISOString() : null); }} /></label><footer><span role="status">{message}</span><button className="primary-button" type="submit" disabled={saving || preview}>{preview ? "Solo lectura" : saving ? "Guardando…" : "Guardar registro"}<IconCheck size={16} /></button></footer></fieldset></form></section>}
        {expandedPreviewMetric && (
          <div className="driver-mobile-chart-dialog" role="dialog" aria-modal="true" aria-labelledby="driver-mobile-chart-dialog-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setExpandedPreviewMetric(""); }}>
            <div className="driver-mobile-chart-dialog__panel">
              <header>
                <div><h2 id="driver-mobile-chart-dialog-title">{expandedPreviewMetric === "billing" ? "Facturación mensual" : expandedPreviewMetric === "km" ? "Kilómetros realizados" : "Consumo comparado"}</h2></div>
                <button type="button" aria-label="Cerrar gráfica ampliada" onClick={() => setExpandedPreviewMetric("")}><IconX size={18} /></button>
              </header>
              {expandedPreviewMetric === "billing" && (
                <div className="driver-mobile-chart-dialog__chart driver-mobile-chart-dialog__chart--billing" onPointerUp={hideDriverChartTooltip} onPointerCancel={hideDriverChartTooltip} onPointerLeave={hideDriverChartTooltip} onTouchEnd={hideDriverChartTooltip} onMouseLeave={hideDriverChartTooltip}>
                  <div ref={billingChartScrollRef} className="driver-mobile-chart-dialog__billing-scroll" role="region" aria-label="Facturación mensual por año. Se muestran ocho meses por vista; desliza horizontalmente para consultar el resto">
                    <div className="driver-mobile-chart-dialog__billing-canvas" style={{ width: `${billingChartWidth}px` }}>
                      <BarChart width={billingChartWidth} height={520} data={monthlyBillingHistory} margin={{ top: 30, right: 22, bottom: 96, left: 76 }} onMouseMove={(state) => showDriverChartTooltip("billing", state)} onTouchStart={(state) => showDriverChartTooltip("billing", state)} onTouchMove={(state) => showDriverChartTooltip("billing", state)} onTouchEnd={hideDriverChartTooltip} onMouseLeave={hideDriverChartTooltip}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dce5f0" />
                        <XAxis dataKey="label" interval={0} tick={<DriverBillingMonthTick />} tickLine={false} axisLine={{ stroke: "#cbd8e8" }} />
                        <YAxis width={66} tick={{ fontSize: 14, fontWeight: 850, fill: "#526783" }} tickLine={false} axisLine={false} tickFormatter={(value) => Number(value).toLocaleString("es-ES")} domain={[0, Math.max(periodSummary.billingScaleMax, ...monthlyBillingHistory.map((month) => month.amount))]} />
                        <Tooltip active={activeDriverChartTooltip === "billing"} cursor={false} wrapperStyle={{ pointerEvents: "none", outline: "none" }} formatter={(value) => formatCurrency(Number(value) || 0)} labelFormatter={(label, payload) => payload?.[0]?.payload?.label ?? label} />
                        <ReferenceLine y={periodSummary.billingGoal} stroke="#f2a62a" strokeDasharray="5 4" />
                        {periodSummary.billingMilestones.slice(1).map((milestone) => <ReferenceLine key={milestone} y={milestone} stroke="#e6edf5" strokeDasharray="2 4" />)}
                        <Bar dataKey="amount" fill="#2c6de9" radius={[5, 5, 0, 0]} minPointSize={24} isAnimationActive={false}>
                          <LabelList dataKey="amount" content={<DriverBillingBarValueLabel />} />
                        </Bar>
                      </BarChart>
                    </div>
                  </div>
                  <p className="driver-mobile-chart-dialog__hint">Desliza a derecha e izquierda para consultar el resto de meses.</p>
                </div>
              )}
              {expandedPreviewMetric === "km" && (
                <div className="driver-mobile-chart-dialog__chart driver-mobile-chart-dialog__chart--km" onPointerUp={hideDriverChartTooltip} onPointerCancel={hideDriverChartTooltip} onPointerLeave={hideDriverChartTooltip} onTouchEnd={hideDriverChartTooltip} onMouseLeave={hideDriverChartTooltip}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyKmData} margin={{ top: 32, right: 14, bottom: 62, left: 46 }} onMouseMove={(state) => showDriverChartTooltip("km", state)} onTouchStart={(state) => showDriverChartTooltip("km", state)} onTouchMove={(state) => showDriverChartTooltip("km", state)} onTouchEnd={hideDriverChartTooltip} onMouseLeave={hideDriverChartTooltip}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dce5f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 18, fontWeight: 900, fill: "#102d58" }} tickMargin={13} />
                      <YAxis width={56} ticks={kmChartTicks} domain={[0, kmChartMax]} allowDecimals={false} tick={{ fontSize: 18, fontWeight: 900, fill: "#102d58" }} tickMargin={6} tickFormatter={(value) => Number(value).toLocaleString("es-ES")} />
                      <Tooltip active={activeDriverChartTooltip === "km"} cursor={false} wrapperStyle={{ pointerEvents: "none", outline: "none" }} labelStyle={{ fontSize: 18, fontWeight: 900, color: "#102d58" }} itemStyle={{ fontSize: 17, fontWeight: 900, color: "#173661" }} formatter={(value) => `${Number(value).toLocaleString("es-ES")} km`} />
                      <Line type="monotone" dataKey="driverKm" name="Este conductor" stroke="#2c6de9" strokeWidth={5} dot={{ r: 5 }} />
                      <Line type="monotone" dataKey="otherKm" name="Resto" stroke="#9aaac0" strokeWidth={3} strokeDasharray="6 5" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="driver-mobile-chart-dialog__legend" aria-label="Leyenda del gráfico de kilómetros"><span><i className="driver-mobile-chart-dialog__legend-swatch driver-mobile-chart-dialog__legend-swatch--driver" />Este conductor</span><span><i className="driver-mobile-chart-dialog__legend-swatch driver-mobile-chart-dialog__legend-swatch--rest" />Resto</span></div>
                </div>
              )}
              {expandedPreviewMetric === "consumption" && (
                <div className="driver-mobile-chart-dialog__chart driver-mobile-chart-dialog__chart--consumption" onPointerUp={hideDriverChartTooltip} onPointerCancel={hideDriverChartTooltip} onPointerLeave={hideDriverChartTooltip} onTouchEnd={hideDriverChartTooltip} onMouseLeave={hideDriverChartTooltip}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyConsumptionData} margin={{ top: 32, right: 14, bottom: 62, left: 46 }} onMouseMove={(state) => showDriverChartTooltip("consumption", state)} onTouchStart={(state) => showDriverChartTooltip("consumption", state)} onTouchMove={(state) => showDriverChartTooltip("consumption", state)} onTouchEnd={hideDriverChartTooltip} onMouseLeave={hideDriverChartTooltip}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dce5f0" />
                      <XAxis dataKey="label" interval={0} tick={{ fontSize: 18, fontWeight: 900, fill: "#102d58" }} tickMargin={13} />
                      <YAxis width={56} ticks={consumptionChartTicks} domain={[3.5, 5.5]} allowDataOverflow allowDecimals tickMargin={6} tick={{ fontSize: 18, fontWeight: 900, fill: "#102d58" }} tickFormatter={(value) => Number(value).toLocaleString("es-ES", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} />
                      <Tooltip active={activeDriverChartTooltip === "consumption"} cursor={false} wrapperStyle={{ pointerEvents: "none", outline: "none" }} labelStyle={{ fontSize: 18, fontWeight: 900, color: "#102d58" }} itemStyle={{ fontSize: 17, fontWeight: 900, color: "#173661" }} formatter={(value) => `${Number(value).toLocaleString("es-ES", { maximumFractionDigits: 1 })} l/100 km`} />
                      <Line type="monotone" dataKey="driverConsumption" name="Este conductor" stroke="#2c6de9" strokeWidth={5} dot={{ r: 5 }} />
                      <Line type="monotone" dataKey="otherConsumption" name="Resto" stroke="#9aaac0" strokeWidth={3} strokeDasharray="6 5" dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="driver-mobile-chart-dialog__legend" aria-label="Leyenda del gráfico de consumo"><span><i className="driver-mobile-chart-dialog__legend-swatch driver-mobile-chart-dialog__legend-swatch--driver" />Este conductor</span><span><i className="driver-mobile-chart-dialog__legend-swatch driver-mobile-chart-dialog__legend-swatch--rest" />Resto</span></div>
                </div>
              )}
            </div>
          </div>
        )}
        {referenceOpen && referenceLabels[referenceOpen] && <div className="driver-mobile-reference-dialog" role="dialog" aria-modal="true" aria-labelledby="driver-mobile-reference-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setReferenceOpen(""); }}><div className="driver-mobile-reference-dialog__panel"><header><div><span>REFERENCIA VISUAL</span><h2 id="driver-mobile-reference-title">{referenceLabels[referenceOpen].title}</h2></div><button type="button" aria-label="Cerrar referencia" onClick={() => setReferenceOpen("")}><IconX size={18} /></button></header><img src={driverReferenceImages[referenceOpen]} alt={referenceLabels[referenceOpen].alt} /><p>{referenceLabels[referenceOpen].caption}. Esta imagen es un ejemplo y no modifica los datos del conductor.</p><button type="button" className="primary-button" onClick={() => setReferenceOpen("")}>Cerrar</button></div></div>}
        {circleReview && <DriverCircleReviewDialog review={circleReview} profile={profile} driverId={profile.id} onClose={closeCircleReview} onSave={saveCircleReview} />}
      </div>
    </main>
  );
}

const driverVehicleOptions = vehicleOrder.map((plate) => vehiclesSeed.find((vehicle) => vehicle.plate === plate)).filter((vehicle) => vehicle?.use === "Profesional");
const generateDriverPassword = () => `Rueda-${Math.random().toString(36).slice(2, 7)}-${new Date().getFullYear()}!`;
const getDriverApplicationLink = () => typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}`;
const copyTextToClipboard = async (value) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("El navegador no permite copiar el enlace.");
};

function AdminView({ notify, onPreviewDriver, onDriversChange, invoices = [], adminFunctionWindow = "", onAdminFunctionWindowChange }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [driverActionId, setDriverActionId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", vehiclePlate: driverVehicleOptions[0]?.plate ?? "", password: "" });
  const [editingDriverId, setEditingDriverId] = useState("");
  const [driverProfileForm, setDriverProfileForm] = useState({ fullName: "", email: "", vehiclePlate: driverVehicleOptions[0]?.plate ?? "", active: true });
  const [copiedDriverKey, setCopiedDriverKey] = useState("");
  const longPressRef = useRef({ timer: null, key: "", triggered: false });
  const driverApplicationLink = getDriverApplicationLink();

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await invokeAdminUsers({ action: "list" });
      setDrivers((response.profiles ?? []).map(normalizeDriverProfileRecord));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { loadDrivers(); }, [loadDrivers]);
  useEffect(() => {
    const refreshOnReturn = () => {
      if (document.visibilityState !== "visible") return;
      void loadDrivers();
    };
    window.addEventListener("focus", refreshOnReturn);
    document.addEventListener("visibilitychange", refreshOnReturn);
    return () => {
      window.removeEventListener("focus", refreshOnReturn);
      document.removeEventListener("visibilitychange", refreshOnReturn);
    };
  }, [loadDrivers]);
  useEffect(() => { onDriversChange?.(drivers); }, [drivers, onDriversChange]);
  useEffect(() => {
    const closeDriverMenu = (event) => {
      if (event.key === "Escape") {
        setDriverActionId("");
        setEditingDriverId("");
      }
    };
    window.addEventListener("keydown", closeDriverMenu);
    return () => window.removeEventListener("keydown", closeDriverMenu);
  }, []);
  useEffect(() => () => window.clearTimeout(longPressRef.current.timer), []);
  useEffect(() => {
    const closeOnOutsideTap = (event) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(".admin-driver-card, .admin-driver-access-sheet")) {
        setDriverActionId("");
        setEditingDriverId("");
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideTap);
    return () => document.removeEventListener("pointerdown", closeOnOutsideTap);
  }, []);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const createDriver = async (event) => {
    event.preventDefault();
    setMessage("");
    setGeneratedPassword(null);
    setSaving(true);
    try {
      const response = await invokeAdminUsers({ action: "create", ...form });
      const createdProfile = normalizeDriverProfileRecord(response.profile);
      setDrivers((current) => [...current, createdProfile].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      setGeneratedPassword({ driverId: createdProfile?.id, value: response.password });
      setDriverActionId(createdProfile ? driverActionKey(createdProfile) : "");
      setCreateOpen(false);
      setForm({ fullName: "", email: "", vehiclePlate: driverVehicleOptions[0]?.plate ?? "", password: "" });
      notify("Cuenta de conductor creada");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };
  const driverActionKey = (driver) => `${canonicalizeVehiclePlate(driver.vehicle_plate)}:${driver.id ?? normalizeDriverAvatarKey(driver.full_name)}`;
  const driverInstallInstructions = "Instalación: abre el enlace en el móvil y pulsa «Instalar SOBRE RUEDAS» o el menú del navegador → «Añadir a pantalla de inicio».";
  const copyDriverApplicationLink = async (driver) => {
    try {
      const accessMessage = `SOBRE RUEDAS\nEnlace: ${driverApplicationLink}\nUsuario: ${driver.email || "pendiente de crear"}\n${driverInstallInstructions}`;
      await copyTextToClipboard(accessMessage);
      setCopiedDriverKey(driverActionKey(driver));
      notify(`Acceso copiado para ${driver.full_name}`);
    } catch (error) {
      notify(error.message);
    }
  };
  const shareDriverApplicationLink = async (driver) => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "SOBRE RUEDAS", text: `Acceso de ${driver.full_name}\nUsuario: ${driver.email || "pendiente"}\n${driverInstallInstructions}`, url: driverApplicationLink });
        notify(`Enlace de aplicación preparado para ${driver.full_name}`);
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    await copyDriverApplicationLink(driver);
  };
  const copyGeneratedPassword = async () => {
    if (!generatedPassword?.value) return;
    try {
      await copyTextToClipboard(generatedPassword.value);
      notify("Contraseña copiada");
    } catch (error) {
      notify(error.message);
    }
  };
  const resetDriver = async (driver) => {
    const nextPassword = generateDriverPassword();
    setMessage("");
    setGeneratedPassword(null);
    try {
      const response = await invokeAdminUsers({ action: "reset_password", userId: driver.id, password: nextPassword });
      const updatedProfile = normalizeDriverProfileRecord(response.profile);
      setDrivers((current) => current.map((candidate) => candidate.id === driver.id ? updatedProfile : candidate));
      setGeneratedPassword({ driverId: driver.id, value: response.password });
      setDriverActionId(driverActionKey(driver));
      notify(`Acceso restablecido para ${driver.full_name}`);
    } catch (error) {
      setMessage(error.message);
    }
  };
  const updateDriver = async (driver, changes) => {
    try {
      const response = await invokeAdminUsers({ action: "update", userId: driver.id, ...changes });
      const updatedProfile = normalizeDriverProfileRecord(response.profile);
      setDrivers((current) => current.map((candidate) => candidate.id === driver.id ? updatedProfile : candidate));
      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    }
  };
  const toggleDriverAccess = async (driver) => {
    const saved = await updateDriver(driver, { active: !driver.active });
    if (!saved) return false;
    setDriverActionId("");
    setEditingDriverId("");
    return true;
  };
  const startDriverEdit = (driver) => {
    setEditingDriverId(driver.id);
    setDriverActionId(driverActionKey(driver));
    setDriverProfileForm({ fullName: driver.full_name ?? "", email: driver.email ?? "", vehiclePlate: canonicalizeVehiclePlate(driver.vehicle_plate) || driverVehicleOptions[0]?.plate || "", active: Boolean(driver.active) });
    setMessage("");
  };
  const updateDriverProfileForm = (key, value) => setDriverProfileForm((current) => ({ ...current, [key]: value }));
  const saveDriverProfile = async (event, driver) => {
    event.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      const response = await invokeAdminUsers({ action: "update", userId: driver.id, ...driverProfileForm });
      const updatedProfile = normalizeDriverProfileRecord(response.profile);
      setDrivers((current) => current.map((candidate) => candidate.id === driver.id ? updatedProfile : candidate));
      setEditingDriverId("");
      notify(`Perfil de ${updatedProfile.full_name} actualizado`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };
  const driversForVehicle = (vehicle) => {
    const assigned = orderDriverProfilesForVehicle(vehicle, drivers.filter((driver) => canonicalizeVehiclePlate(driver.vehicle_plate) === vehicle.plate)).slice(0, 2);
    const assignedNames = new Set(assigned.map((driver) => normalizeDriverAvatarKey(driver.full_name)));
    const fallback = (vehicle.drivers ?? [])
      .map((name, index) => ({ id: `seed-${vehicle.plate.replace(/\s/g, "-")}-${index}`, full_name: name, email: "", vehicle_plate: vehicle.plate, active: true, isSeed: true }))
      .filter((driver) => !assignedNames.has(normalizeDriverAvatarKey(driver.full_name)));
    return orderAdminDriverCardsForVehicle(vehicle, [...assigned, ...fallback].slice(0, 2));
  };
  const vehicleDocumentCount = (vehicle) => invoices.filter((invoice) => canonicalizeVehiclePlate(invoice.plate || invoice.vehicle_plate) === vehicle.plate).length;
  const startDriverLongPress = (driverKey) => {
    window.clearTimeout(longPressRef.current.timer);
    longPressRef.current = { timer: window.setTimeout(() => {
      longPressRef.current.triggered = true;
      setDriverActionId(driverKey);
    }, 1000), key: driverKey, triggered: false };
  };
  const stopDriverLongPress = () => {
    window.clearTimeout(longPressRef.current.timer);
    longPressRef.current.timer = null;
  };
  const openDriverApplication = (driver, driverKey) => {
    const longPressed = longPressRef.current.triggered && longPressRef.current.key === driverKey;
    longPressRef.current.triggered = false;
    if (longPressed) return;
    setDriverActionId("");
    onPreviewDriver(driver);
  };
  const driverInitials = (name) => String(name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
  const selectedAccessDriver = driverVehicleOptions
    .flatMap((vehicle) => driversForVehicle(vehicle))
    .find((driver) => driverActionKey(driver) === driverActionId) ?? null;
  const selectedAccessAvatar = selectedAccessDriver ? getDriverAvatarPath(selectedAccessDriver.full_name) : "";
  const selectedAccessPlate = selectedAccessDriver ? canonicalizeVehiclePlate(selectedAccessDriver.vehicle_plate) : "";
  const adminFunctionVehicleGroups = driverVehicleOptions.map((vehicle) => ({ vehicle, drivers: driversForVehicle(vehicle) }));
  const closeAdminFunctionWindow = () => onAdminFunctionWindowChange?.("");
  const openDriverAccessFromFunction = (driver) => {
    if (!driver?.id || driver.isSeed) return;
    setEditingDriverId("");
    setDriverActionId(driverActionKey(driver));
    closeAdminFunctionWindow();
  };
  const openCreateAccessFromFunction = () => {
    closeAdminFunctionWindow();
    setCreateOpen(true);
  };
  const toggleDriverAccessFromFunction = async (driver) => {
    if (!driver?.id || driver.isSeed) return;
    const saved = await toggleDriverAccess(driver);
    if (saved) notify(driver.active ? `Acceso pausado para ${driver.full_name}` : `Acceso activado para ${driver.full_name}`);
  };
  const resetDriverAccessFromFunction = async (driver) => {
    if (!driver?.id || driver.isSeed) return;
    closeAdminFunctionWindow();
    await resetDriver(driver);
  };

  return <section className="admin-page" aria-busy={loading}>
     {message && <div className="admin-alert" role="alert"><IconAlertTriangle size={18} />{message}</div>}
     <div className="admin-access-stack">
       {driverVehicleOptions.map((vehicle) => {
         const vehicleDrivers = driversForVehicle(vehicle);
         const vehicleDocuments = vehicleDocumentCount(vehicle);
         return <section className="admin-vehicle-card" key={vehicle.plate} aria-label={`Coche ${vehicle.plate}`}>
           <header className="admin-vehicle-card__header">
              <div className="admin-vehicle-card__identity"><span className="admin-vehicle-card__icon"><IconCar size={21} /></span><div><VehiclePlateLabel vehicleOrPlate={vehicle} className="admin-vehicle-plate" /><span className="admin-accordion__documents"><IconFileInvoice size={13} /><b>Documentos</b><small>{vehicleDocuments}</small></span></div></div>
           </header>
           <div className="admin-vehicle-card__drivers">
             {vehicleDrivers.map((driver) => {
               const driverKey = driverActionKey(driver);
               const avatarPath = getDriverAvatarPath(driver.full_name);
               const menuOpen = driverActionId === driverKey;
               return <article className={`admin-driver-card${menuOpen ? " is-open" : ""}`} key={driverKey}>
                 <button className="admin-driver-card__trigger" type="button" onClick={() => openDriverApplication(driver, driverKey)} onPointerDown={(event) => { if (event.pointerType !== "mouse" || event.button === 0) startDriverLongPress(driverKey); }} onPointerUp={stopDriverLongPress} onPointerLeave={stopDriverLongPress} onPointerCancel={stopDriverLongPress} onContextMenu={(event) => event.preventDefault()} onKeyDown={(event) => { if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) { event.preventDefault(); setDriverActionId(driverKey); } }} aria-label={`Abrir aplicación de ${driver.full_name}`} aria-haspopup="dialog" title="Toca para ver la aplicación; mantén pulsado para gestionar el acceso">
                    <span className="admin-driver-card__avatar">{avatarPath ? <img src={avatarPath} alt="" /> : <span>{driverInitials(driver.full_name)}</span>}<i className={driver.active ? "is-active" : ""} aria-hidden="true" /></span>
                    <strong>{driver.full_name}</strong>
                  </button>
               </article>;
             })}
           </div>
         </section>;
       })}
       <section className="admin-accordion admin-accordion--create">
         <button className={`admin-accordion__button${createOpen ? " admin-accordion__button--open" : ""}`} type="button" onClick={() => setCreateOpen((current) => !current)} aria-expanded={createOpen} aria-controls="admin-create-panel">
           <span className="admin-accordion__icon admin-accordion__icon--create"><IconUserPlus size={21} /></span>
           <span className="admin-accordion__copy"><strong>CREAR NUEVO ACCESO</strong><small>Añade una cuenta y asigna su coche profesional</small></span>
           <IconChevronRight className="admin-accordion__chevron" size={19} />
         </button>
         {createOpen && <div className="admin-accordion__panel" id="admin-create-panel">
           <header className="admin-accordion__panel-header"><div><span className="admin-eyebrow">CUENTAS DE CONDUCTOR</span><h2>Nuevo acceso</h2><p>La contraseña que introduzcas será definitiva. Solo el administrador podrá cambiarla después.</p></div><IconKey size={23} /></header>
           <form className="admin-create-form" onSubmit={createDriver}><label>Nombre completo<input value={form.fullName} onChange={(event) => updateForm("fullName", event.target.value)} placeholder="Ej. Ana García" required /></label><label>Email de acceso<input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder="conductor@email.com" required /></label><label>Vehículo profesional<select value={form.vehiclePlate} onChange={(event) => updateForm("vehiclePlate", event.target.value)}>{driverVehicleOptions.map((vehicle) => <option key={vehicle.plate} value={vehicle.plate}>{vehicle.plate} · {vehicle.model}</option>)}</select></label><label>Contraseña definitiva<input type="text" value={form.password} onChange={(event) => updateForm("password", event.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} required /></label><button className="primary-button" type="submit" disabled={saving}><IconUserPlus size={17} />{saving ? "Creando…" : "Crear cuenta"}</button></form>
         </div>}
       </section>
     </div>
     {selectedAccessDriver && <div className="admin-driver-access-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDriverActionId(""); }}>
       <section className="admin-driver-access-sheet" role="dialog" aria-modal="true" aria-labelledby="admin-driver-access-title">
         <header className="admin-driver-access-sheet__header">
           <div className="admin-driver-access-sheet__identity">
             <span className="admin-driver-access-sheet__avatar">{selectedAccessAvatar ? <img src={selectedAccessAvatar} alt="" /> : <span>{driverInitials(selectedAccessDriver.full_name)}</span>}<i className={selectedAccessDriver.active ? "is-active" : ""} aria-hidden="true" /></span>
             <span><small>GESTIÓN DE ACCESO</small><h2 id="admin-driver-access-title">{selectedAccessDriver.full_name}</h2><VehiclePlateLabel vehicleOrPlate={selectedAccessPlate} className="admin-driver-access-sheet__plate" /></span>
           </div>
           <button type="button" className="admin-driver-access-sheet__close" onClick={() => { setDriverActionId(""); setEditingDriverId(""); }} aria-label="Cerrar gestión de acceso" autoFocus><IconX size={20} /></button>
         </header>
         <section className="admin-driver-access-sheet__credentials" aria-label={`Acceso de ${selectedAccessDriver.full_name}`}>
           <div className="admin-driver-access-sheet__section-title"><IconLink size={18} /><span><strong>Acceso a SOBRE RUEDAS</strong><small>Envía el enlace y el usuario al conductor.</small></span></div>
           <div className="admin-driver-access-sheet__user"><span>USUARIO</span><strong>{selectedAccessDriver.email || "Pendiente de crear"}</strong></div>
           <a className="admin-driver-access-sheet__url" href={driverApplicationLink} target="_blank" rel="noreferrer">{driverApplicationLink}</a>
           <div className="admin-driver-access-sheet__share-actions"><button type="button" onClick={() => copyDriverApplicationLink(selectedAccessDriver)}><IconCopy size={17} />{copiedDriverKey === driverActionKey(selectedAccessDriver) ? "Acceso copiado" : "Copiar acceso"}</button><button type="button" onClick={() => shareDriverApplicationLink(selectedAccessDriver)}><IconShare3 size={17} />Compartir acceso</button></div>
         </section>
         {generatedPassword?.driverId === selectedAccessDriver.id && <div className="admin-driver-access-sheet__password" role="status"><IconKey size={18} /><span><small>CONTRASEÑA ACTUALIZADA</small><code>{generatedPassword.value}</code></span><button type="button" onClick={copyGeneratedPassword}><IconCopy size={15} />Copiar</button><button type="button" className="admin-driver-access-sheet__password-close" onClick={() => setGeneratedPassword(null)} aria-label="Ocultar contraseña"><IconX size={15} /></button></div>}
         <div className="admin-driver-access-sheet__actions"><button type="button" onClick={() => startDriverEdit(selectedAccessDriver)}><IconUserCircle size={18} /><span><strong>Editar perfil</strong><small>Nombre, email y vehículo</small></span></button><button type="button" onClick={() => toggleDriverAccess(selectedAccessDriver)}>{selectedAccessDriver.active ? <IconShieldCheck size={18} /> : <IconCircleCheck size={18} />}<span><strong>{selectedAccessDriver.active ? "Pausar acceso" : "Activar acceso"}</strong><small>{selectedAccessDriver.active ? "Bloquea el inicio de sesión" : "Permite iniciar sesión"}</small></span></button><button type="button" onClick={() => resetDriver(selectedAccessDriver)}><IconRefresh size={18} /><span><strong>Restablecer contraseña</strong><small>Genera una clave nueva</small></span></button></div>
         {editingDriverId === selectedAccessDriver.id && <form className="admin-driver-access-editor" onSubmit={(event) => saveDriverProfile(event, selectedAccessDriver)}><label>Nombre completo<input value={driverProfileForm.fullName} onChange={(event) => updateDriverProfileForm("fullName", event.target.value)} required /></label><label>Email de acceso<input type="email" value={driverProfileForm.email} onChange={(event) => updateDriverProfileForm("email", event.target.value)} required /></label><label>Vehículo asignado<select value={driverProfileForm.vehiclePlate} onChange={(event) => updateDriverProfileForm("vehiclePlate", event.target.value)}>{driverVehicleOptions.map((option) => <option key={option.plate} value={option.plate}>{option.plate} · {option.model}</option>)}</select></label><label className="admin-driver-access-editor__active"><input type="checkbox" checked={driverProfileForm.active} onChange={(event) => updateDriverProfileForm("active", event.target.checked)} />Acceso activo</label><div className="admin-driver-access-editor__actions"><button type="button" onClick={() => setEditingDriverId("")}>Cancelar</button><button className="primary-button" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar acceso"}</button></div></form>}
       </section>
     </div>}
     {adminFunctionWindow && <AdminFunctionWindow windowType={adminFunctionWindow} vehicleGroups={adminFunctionVehicleGroups} loading={loading} onClose={closeAdminFunctionWindow} onOpenDriverAccess={openDriverAccessFromFunction} onOpenCreateAccess={openCreateAccessFromFunction} onToggleDriverAccess={toggleDriverAccessFromFunction} onResetDriverAccess={resetDriverAccessFromFunction} />}
   </section>;
}

function AdminFunctionWindow({ windowType, vehicleGroups, loading, onClose, onOpenDriverAccess, onOpenCreateAccess, onToggleDriverAccess, onResetDriverAccess }) {
  const copy = {
    drivers: {
      title: "Gestionar conductores",
      description: "Consulta los perfiles asociados a cada coche y abre su gestión de acceso.",
      note: "Desde cada perfil puedes editar los datos del conductor, compartir su aplicación o revisar su cuenta.",
      icon: IconUsers,
    },
    permissions: {
      title: "Controlar permisos",
      description: "Activa o pausa el acceso de cada conductor desde una única ventana.",
      note: "Pausar un acceso impide iniciar sesión; activarlo vuelve a permitir el trabajo del conductor.",
      icon: IconShieldCheck,
    },
    security: {
      title: "Seguridad de accesos",
      description: "Restablece las contraseñas y revisa el usuario de cada cuenta.",
      note: "La nueva contraseña solo se muestra al administrador después de restablecerla.",
      icon: IconKey,
    },
  }[windowType] ?? {
    title: "Perfiles y funciones",
    description: "Gestiona las cuentas de los conductores.",
    note: "Selecciona una función para continuar.",
    icon: IconUsers,
  };
  const WindowIcon = copy.icon;
  const driverInitials = (name) => String(name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
  const renderDriver = (vehicle, driver) => {
    const avatarPath = getDriverAvatarPath(driver.full_name);
    const hasAccount = Boolean(driver.id) && !driver.isSeed;
    return <div className="admin-function-window__driver-row" key={`${vehicle.plate}-${driver.id ?? driver.full_name}`}>
      <span className="admin-function-window__avatar">{avatarPath ? <img src={avatarPath} alt="" /> : <span>{driverInitials(driver.full_name)}</span>}<i className={driver.active ? "is-active" : ""} aria-hidden="true" /></span>
      <span className="admin-function-window__driver-copy"><strong>{driver.full_name}</strong><small><VehiclePlateLabel vehicleOrPlate={vehicle} /> · {driver.email || "Acceso pendiente"}</small></span>
      {windowType === "drivers" && <button type="button" className="admin-function-window__row-action" onClick={() => onOpenDriverAccess(driver)} disabled={!hasAccount}><IconUserCircle size={16} />{hasAccount ? "Abrir gestión" : "Sin cuenta"}</button>}
      {windowType === "permissions" && <><span className={`admin-function-window__status${driver.active ? " admin-function-window__status--active" : " admin-function-window__status--paused"}`}>{driver.active ? "Activo" : "Pausado"}</span><button type="button" className="admin-function-window__row-action" onClick={() => onToggleDriverAccess(driver)} disabled={!hasAccount}>{driver.active ? "Pausar" : "Activar"}</button></>}
      {windowType === "security" && <button type="button" className="admin-function-window__row-action" onClick={() => onResetDriverAccess(driver)} disabled={!hasAccount}><IconRefresh size={16} />{hasAccount ? "Restablecer" : "Sin cuenta"}</button>}
    </div>;
  };
  return <div className="admin-function-window-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="admin-function-window" role="dialog" aria-modal="true" aria-labelledby="admin-function-window-title">
      <header className="admin-function-window__header">
        <div><span>PERFILES Y FUNCIONES</span><h2 id="admin-function-window-title">{copy.title}</h2><p>{copy.description}</p></div>
        <button type="button" className="admin-function-window__close" onClick={onClose} aria-label={`Cerrar ${copy.title}`} autoFocus><IconX size={19} /></button>
      </header>
      <div className="admin-function-window__note"><WindowIcon size={18} /><span>{copy.note}</span></div>
      {loading ? <p className="admin-function-window__loading">Cargando cuentas de conductores…</p> : <div className="admin-function-window__groups">
        {vehicleGroups.map(({ vehicle, drivers }) => <section className="admin-function-window__group" key={vehicle.plate}>
          <header><VehiclePlateLabel vehicleOrPlate={vehicle} /><span>{drivers.length} conductores</span></header>
          <div>{drivers.map((driver) => renderDriver(vehicle, driver))}</div>
        </section>)}
      </div>}
      {windowType === "drivers" && <button type="button" className="admin-function-window__create" onClick={onOpenCreateAccess}><IconUserPlus size={17} />Crear nuevo acceso</button>}
    </section>
  </div>;
}

function FleetView({ filtered, filter, query, selected, selectedDrivers, setFilter, setQuery, selectVehicle, selectDriver, openWorkshop, setModal, compact = false }) {
  return (
    <section className={compact ? "vehicle-workspace-fleet" : "module-page fleet-page"}>
      {!compact && <PageIntro
        eyebrow="Flota"
        title="Vehículos"
        description="Kilómetros, facturación, combustible y mantenimiento en una única vista."
        action={<button className="primary-button" onClick={() => setModal({ type: "reading" })}><IconPlus size={18} />Registrar lectura</button>}
      />}
      {!compact && <div className="metric-cards">
        <MetricCard icon={IconBriefcase} label="Vehículos profesionales" value="3" detail="6 turnos recibidos hoy" />
        <MetricCard icon={IconGasStation} label="Repostaje de hoy" value="177,31 €" detail="6 conductores profesionales" />
        <MetricCard icon={IconTools} label="Próxima revisión" value="4.160 km" detail="Peugeot 2008 · 6 ago" tone="amber" />
      </div>}
      <section className={`content-card fleet-card${compact ? " vehicle-workspace-fleet-card report-section-card" : ""}`}>
        {compact && <header className="vehicle-workspace-section-heading vehicle-workspace-section-heading--fleet"><div><span>Operativa</span><h2>Vehículos y actividad diaria</h2><p>Conductores, facturación, kilómetros, repostaje y taller en una sola tabla.</p></div><button type="button" className="secondary-button" onClick={() => setModal({ type: "reading" })}><IconPlus size={16} />Registrar lectura</button></header>}
        <header className="fleet-toolbar" aria-label="Filtros de vehículos">
          <label className="search"><IconSearch size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar matrícula, conductor o trabajo" /></label>
          <div className="filters">
            {["Todos", "Profesional", "Particular"].map((name) => <button key={name} className={filter === name ? "filter-button filter-button--active" : "filter-button"} onClick={() => setFilter(name)}>{name}</button>)}
          </div>
        </header>
        <div className="table-scroll">
          <table className="fleet-table">
            <caption className="sr-only">Estado operativo de los cinco vehículos</caption>
            <thead><tr><th>Matrícula</th><th>Conductores</th><th>Facturación</th><th>Km hoy</th><th>Repostaje</th><th>Km totales</th><th>Km para revisión</th><th>Taller</th></tr></thead>
            <tbody>
              {filtered.map((vehicle) => {
                const driver = selectedDrivers[vehicle.plate] ?? vehicle.drivers[0];
                const day = getDriverDay(vehicle, driver);
                const remaining = vehicle.nextServiceKm - vehicle.odometer;
                const latestMaintenance = vehicle.maintenance[0] ?? { amount: 0, concept: "Sin intervenciones" };
                return (
                  <tr className={selected.plate === vehicle.plate ? "is-selected" : ""} key={vehicle.plate} onClick={() => selectVehicle(vehicle)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") selectVehicle(vehicle); }}>
                    <td className="plate"><VehiclePlateLabel vehicleOrPlate={vehicle} className="fleet-vehicle-plate" /><small>{vehicle.model}</small></td>
                    <td>
                      {vehicle.use === "Profesional" ? (
                        <div className="driver-selector" aria-label={`Conductores de ${vehicle.plate}`}>
                          {vehicle.drivers.map((name) => <button className={driver === name ? "driver-chip driver-chip--active" : "driver-chip"} key={name} onClick={(event) => { event.stopPropagation(); selectDriver(vehicle, name); }}>{name}</button>)}
                        </div>
                      ) : <span className="no-driver-associated">Sin conductor asociado</span>}
                    </td>
                    <td className="billing-cell"><strong>{formatCurrency(day.revenue)} hoy</strong><small>Mes {formatCurrency(day.monthRevenue)} · {day.monthTrips} viajes</small><small>Efectivo {formatCurrency(day.cash)}</small></td>
                    <td><strong>{formatKm(day.km)}</strong><small>{vehicle.use === "Profesional" ? driver.split(" ")[0] : "Uso particular"}</small></td>
                    <td><strong>{formatCurrency(day.cost)}</strong><small>{day.liters ? `${day.liters.toLocaleString("es-ES")} L` : "Sin repostaje"}</small></td>
                    <td><strong>{formatKm(vehicle.odometer)}</strong><small>Actualizado hoy</small></td>
                    <td><span className={`service-countdown ${remaining <= 4500 ? "service-countdown--urgent" : ""}`}><strong>{formatKm(remaining)}</strong><small>{vehicle.serviceDate}</small></span></td>
                    <td><button className="workshop-cell" onClick={(event) => { event.stopPropagation(); openWorkshop(vehicle); }}><strong>{formatCurrency(latestMaintenance.amount)}</strong><small>{latestMaintenance.concept}</small></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="empty-state"><IconSearch size={25} /><strong>Sin resultados</strong><span>Prueba otra matrícula, conductor o trabajo.</span></div>}
        <footer className="table-footer"><span>5 vehículos · 6 conductores profesionales</span><span>Selecciona un conductor para ver su actividad diaria</span></footer>
      </section>
    </section>
  );
}

function WheelPickerMenu({ options, value, onChange, ariaLabel, className = "" }) {
  const menuRef = useRef(null);
  const settleTimerRef = useRef(null);
  const frameRef = useRef(null);
  const ignoreScrollRef = useRef(false);
  const selectedIndex = Math.max(0, options.findIndex((option) => String(option.value) === String(value)));
  const middleOffset = options.length;
  const loopedOptions = useMemo(() => [0, 1, 2].flatMap((copy) => options.map((option, index) => ({ ...option, loopIndex: copy * options.length + index }))), [options]);
  const [activeLoopIndex, setActiveLoopIndex] = useState(middleOffset + selectedIndex);

  const getButtons = () => Array.from(menuRef.current?.querySelectorAll("button[data-wheel-index]") ?? []);
  const getNearestLoopIndex = () => {
    const menu = menuRef.current;
    const buttons = getButtons();
    if (!menu || !buttons.length) return middleOffset + selectedIndex;
    const viewportCenter = menu.scrollTop + menu.clientHeight / 2;
    return Number(buttons.reduce((nearest, button) => {
      const buttonCenter = button.offsetTop + button.offsetHeight / 2;
      const nearestCenter = nearest.offsetTop + nearest.offsetHeight / 2;
      return Math.abs(buttonCenter - viewportCenter) < Math.abs(nearestCenter - viewportCenter) ? button : nearest;
    }, buttons[0]).dataset.wheelIndex);
  };
  const getLoopHeight = () => {
    const buttons = getButtons();
    const first = buttons[0];
    const middle = buttons[options.length];
    if (!first || !middle) return 0;
    return middle.offsetTop - first.offsetTop;
  };
  const centerOption = (loopIndex, behavior = "auto") => {
    const menu = menuRef.current;
    const button = menu?.querySelector(`button[data-wheel-index="${loopIndex}"]`);
    if (!menu || !button) return;
    if (behavior === "auto") ignoreScrollRef.current = true;
    const targetScroll = button.offsetTop - (menu.clientHeight - button.offsetHeight) / 2;
    menu.scrollTo({ top: Math.max(0, targetScroll), behavior });
  };
  const commitLoopIndex = (loopIndex) => {
    const normalizedIndex = ((loopIndex % options.length) + options.length) % options.length;
    setActiveLoopIndex(middleOffset + normalizedIndex);
    onChange(options[normalizedIndex].value);
  };
  const handleScroll = () => {
    const menu = menuRef.current;
    if (!menu || !options.length || ignoreScrollRef.current) return;
    const loopHeight = getLoopHeight();
    if (loopHeight > 0) {
      if (menu.scrollTop < loopHeight * 0.55) menu.scrollTop += loopHeight;
      else if (menu.scrollTop > loopHeight * 2.45) menu.scrollTop -= loopHeight;
    }
    const nearest = getNearestLoopIndex();
    setActiveLoopIndex(nearest);
    window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => commitLoopIndex(getNearestLoopIndex()), 120);
  };
  const handleKeyDown = (event) => {
    if (!options.length || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    ignoreScrollRef.current = false;
    const current = getNearestLoopIndex();
    const direction = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
    const next = event.key === "Home" ? middleOffset : event.key === "End" ? middleOffset + options.length - 1 : current + direction;
    const normalizedIndex = ((next % options.length) + options.length) % options.length;
    const centeredLoopIndex = middleOffset + normalizedIndex;
    setActiveLoopIndex(centeredLoopIndex);
    centerOption(centeredLoopIndex, "smooth");
    window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => commitLoopIndex(centeredLoopIndex), 180);
  };

  useEffect(() => {
    frameRef.current = window.requestAnimationFrame(() => {
      setActiveLoopIndex(middleOffset + selectedIndex);
      centerOption(middleOffset + selectedIndex);
    });
    return () => {
      window.cancelAnimationFrame(frameRef.current);
      window.clearTimeout(settleTimerRef.current);
    };
  }, [middleOffset, selectedIndex, options.length]);

  return (
    <div className={`report-period-menu report-period-menu--wheel ${className}`} role="listbox" aria-label={ariaLabel}>
      <div className="report-wheel-list" ref={menuRef} onScroll={handleScroll} onPointerDown={() => { ignoreScrollRef.current = false; }} onWheel={() => { ignoreScrollRef.current = false; }} onTouchStart={() => { ignoreScrollRef.current = false; }} onKeyDown={handleKeyDown}>
        {loopedOptions.map((option) => (
          <button
            type="button"
            role="option"
            aria-selected={activeLoopIndex === option.loopIndex}
            tabIndex={activeLoopIndex === option.loopIndex ? 0 : -1}
            data-wheel-index={option.loopIndex}
            className={activeLoopIndex === option.loopIndex ? "selected" : ""}
            onClick={() => commitLoopIndex(option.loopIndex)}
            key={`${option.loopIndex}-${option.value}`}
          >
            {option.label}
            {activeLoopIndex === option.loopIndex && <IconCheck size={12} />}
          </button>
        ))}
      </div>
      <span className="report-wheel-focus" aria-hidden="true" />
    </div>
  );
}

function NetDetailModal({ details, historicalBillingRows: unassignedHistoricalBillingRows = [], periodKey, periodLabel, reportMonth, reportYear, onSelectMonth, onSelectYear, commissionReports = [], commissionReportBusy = false, commissionReportMessage = "", onSaveAlexPayroll, onGenerateAlexReport, onDownloadCommissionReport, onAddExpense, onRemoveExpense, onSaveBreakdown, onClose }) {
  const closeButtonRef = useRef(null);
  const breakdownAmountRef = useRef(null);
  const breakdownPressTimerRef = useRef(null);
  const breakdownLongPressRef = useRef(false);
  const [selectedPlate, setSelectedPlate] = useState("");
  const [expandedExpenseRows, setExpandedExpenseRows] = useState(() => new Set());
  const [activeFormPlate, setActiveFormPlate] = useState("");
  const [formState, setFormState] = useState({ category: "", label: "", amount: "", date: "" });
  const [formError, setFormError] = useState("");
  const [activeBreakdownEditor, setActiveBreakdownEditor] = useState("");
  const [breakdownFormState, setBreakdownFormState] = useState({ expenseKey: "", breakdownKey: "", driverLabel: "", concept: "", amount: "", date: "" });
  const [breakdownFormError, setBreakdownFormError] = useState("");
  const [focusBreakdownAmount, setFocusBreakdownAmount] = useState(false);
  const [periodMenu, setPeriodMenu] = useState("");
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);
  useEffect(() => () => {
    if (breakdownPressTimerRef.current) window.clearTimeout(breakdownPressTimerRef.current);
  }, []);
  useEffect(() => {
    if (!focusBreakdownAmount || !activeBreakdownEditor) return undefined;
    const frame = window.requestAnimationFrame(() => {
      breakdownAmountRef.current?.focus();
      breakdownAmountRef.current?.select();
      setFocusBreakdownAmount(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeBreakdownEditor, focusBreakdownAmount]);
  useEffect(() => {
    if (!periodMenu) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setPeriodMenu(""); };
    const closeOnPointerDown = (event) => {
      if (!event.target.closest?.(".net-detail-modal__period-dropdown")) setPeriodMenu("");
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnPointerDown);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnPointerDown);
    };
  }, [periodMenu]);
  const total = details.reduce((sum, detail) => sum + detail.net, 0);
  const orderedDetails = [...details].sort((left, right) => vehicleOrder.indexOf(left.vehicle.plate) - vehicleOrder.indexOf(right.vehicle.plate));
  const selectedDetail = orderedDetails.find((detail) => detail.vehicle.plate === selectedPlate) ?? null;
  const selectedTone = selectedDetail ? (netVehicleImages[selectedDetail.vehicle.plate]?.tone ?? "green") : "green";
  const historicalBillingRows = [...orderedDetails.flatMap((detail) => detail.historicalBilling ?? []), ...unassignedHistoricalBillingRows.filter((row) => row.missingVehicle)];
  const historicalDocumentTotal = historicalBillingRows.reduce((sum, row) => sum + (Number(row.revenue) || 0), 0);
  const historicalAppliedTotal = historicalBillingRows.filter((row) => row.usedInNet).reduce((sum, row) => sum + (Number(row.revenue) || 0), 0);
  const netExpenseDateRange = getNetExpensePeriodRange(periodKey);
  const selectNetMonth = (month) => { onSelectMonth?.(month); setPeriodMenu(""); };
  const selectNetYear = (year) => { onSelectYear?.(year); setPeriodMenu(""); };
  const toggleVehicle = (plate) => {
    setSelectedPlate((current) => current === plate ? "" : plate);
    setExpandedExpenseRows(new Set());
    setActiveFormPlate("");
    setActiveBreakdownEditor("");
    setBreakdownFormError("");
  };
  const toggleExpenseRow = (rowKey) => {
    setExpandedExpenseRows((current) => {
      const next = new Set(current);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  };
  const openExpenseForm = (plate) => {
    setActiveFormPlate(plate);
    setActiveBreakdownEditor("");
    setFormState({ category: "", label: "", amount: "", date: getNetExpenseDateForPeriod("", periodKey) });
    setFormError("");
  };
  const closeExpenseForm = () => {
    setActiveFormPlate("");
    setFormState({ category: "", label: "", amount: "", date: "" });
    setFormError("");
  };
  const handleExpenseSubmit = (event, plate) => {
    event.preventDefault();
    const selectedCategory = expenseCategories.find((category) => category.label === formState.category);
    const label = formState.category === "__custom__" ? formState.label.trim() : selectedCategory?.label ?? "";
    const amount = Number(String(formState.amount).replace(",", "."));
    if (!label || !Number.isFinite(amount) || amount <= 0 || !isNetExpenseDateInPeriod(formState.date, periodKey)) {
      setFormError("Selecciona una categoría, un día del periodo y un importe mayor que cero.");
      return;
    }
    onAddExpense({ periodKey, plate, label, category: selectedCategory?.label ?? label, categoryKey: formState.category === "__custom__" ? "" : selectedCategory?.canonicalKey ?? "", cadence: selectedCategory?.cadence ?? "Manual", amount: Number(amount.toFixed(2)), date: formState.date });
    setSelectedPlate(plate);
    closeExpenseForm();
  };
  const closeBreakdownEditor = () => {
    setActiveBreakdownEditor("");
    setBreakdownFormState({ expenseKey: "", breakdownKey: "", driverLabel: "", concept: "", amount: "", date: "" });
    setBreakdownFormError("");
    setFocusBreakdownAmount(false);
  };
  const getBreakdownEditorKey = (rowKey, breakdown, index) => `${rowKey}-${getNetBreakdownKey(breakdown, index)}`;
  const openBreakdownEditor = (expense, breakdown, rowKey, index, focusAmount = false) => {
    const breakdownKey = getNetBreakdownKey(breakdown, index);
    setActiveBreakdownEditor(getBreakdownEditorKey(rowKey, breakdown, index));
    setBreakdownFormState({ expenseKey: expense.key, breakdownKey, driverLabel: breakdown.label, concept: breakdown.concept || expense.label, amount: String(Number(breakdown.amount ?? 0)), date: getNetExpenseDateForPeriod(breakdown.date, periodKey) });
    setBreakdownFormError("");
    setFocusBreakdownAmount(focusAmount);
  };
  const clearBreakdownPress = () => {
    if (breakdownPressTimerRef.current) {
      window.clearTimeout(breakdownPressTimerRef.current);
      breakdownPressTimerRef.current = null;
    }
  };
  const startBreakdownPress = (expense, breakdown, rowKey, index) => {
    clearBreakdownPress();
    breakdownLongPressRef.current = false;
    breakdownPressTimerRef.current = window.setTimeout(() => {
      breakdownLongPressRef.current = true;
      openBreakdownEditor(expense, breakdown, rowKey, index, true);
      breakdownPressTimerRef.current = null;
    }, 2000);
  };
  const handleBreakdownTriggerClick = (expense, breakdown, rowKey, index) => {
    if (breakdownLongPressRef.current) {
      breakdownLongPressRef.current = false;
      return;
    }
    openBreakdownEditor(expense, breakdown, rowKey, index);
  };
  const handleBreakdownSubmit = (event, plate) => {
    event.preventDefault();
    const concept = breakdownFormState.concept.trim();
    const amount = Number(String(breakdownFormState.amount).replace(",", "."));
    if (!concept || !Number.isFinite(amount) || amount < 0 || !isNetExpenseDateInPeriod(breakdownFormState.date, periodKey)) {
      setBreakdownFormError("Indica un concepto, un día del periodo y un importe igual o mayor que cero.");
      return;
    }
    onSaveBreakdown?.({ periodKey, plate, expenseKey: breakdownFormState.expenseKey, breakdownKey: breakdownFormState.breakdownKey, driverLabel: breakdownFormState.driverLabel, concept, amount: Number(amount.toFixed(2)), date: breakdownFormState.date });
    closeBreakdownEditor();
  };
  const getExpenseIcon = (key) => {
    if (key === "fuel") return IconGasStation;
    if (key === "payroll") return IconUsers;
    if (key === "driver-commission") return IconCurrencyEuro;
    if (key === "social-security") return IconShieldCheck;
    if (key === "workshop") return IconTool;
    if (key === "accounting") return IconBuildingStore;
    if (key === "leasing" || key === "license-loan") return IconCar;
    return IconFileInvoice;
  };
  const getBreakdownMeta = (breakdown) => [
    breakdown.concept,
    breakdown.meta,
    breakdown.date ? `Día ${formatNetExpenseDate(breakdown.date)}` : "",
  ].filter(Boolean).join(" · ");
  const getExpenseCadence = (expense) => {
    if (expense.manual) return ["Añadido a mano", expense.date ? `Día ${formatNetExpenseDate(expense.date)}` : ""].filter(Boolean).join(" · ");
    const manualDates = [...new Set((expense.manualExpenseDates ?? []).filter(Boolean))];
    if (manualDates.length === 1) return `Gasto manual · Día ${formatNetExpenseDate(manualDates[0])}`;
    if (manualDates.length > 1) return `Gastos manuales · ${manualDates.length} días`;
    return expense.cadence;
  };
  const renderExpenseRows = (detail) => <div className="net-detail-card__expenses" id={`net-expenses-${detail.vehicle.plate.replace(/\s/g, "-")}`} role="table" aria-label={`Gastos de ${detail.vehicle.plate}`}>
    <div className="net-detail-card__expenses-heading" role="row"><strong>GASTOS</strong><strong>IMPORTE</strong></div>
    <div className="net-detail-card__expenses-scroll">
      {detail.expenses.map((expense) => {
        const rowKey = `${detail.vehicle.plate}-${expense.key}`;
        const expandable = Array.isArray(expense.breakdown) && expense.breakdown.length > 0;
        const breakdownOpen = expandedExpenseRows.has(rowKey);
        const ExpenseIcon = getExpenseIcon(expense.key);
        const rowClass = `net-detail-card__expense${expandable ? " net-detail-card__expense--expandable" : ""}${breakdownOpen ? " is-expanded" : ""}`;
        return <div className="net-detail-card__expense-group" key={expense.key}>
          {expandable ? <button type="button" className={rowClass} aria-expanded={breakdownOpen} aria-controls={`net-expense-breakdown-${rowKey.replace(/\s/g, "-")}`} onClick={() => toggleExpenseRow(rowKey)}><span className="net-detail-card__expense-label" role="cell"><i><ExpenseIcon size={17} /></i><span><strong>{expense.label}</strong><small>{getExpenseCadence(expense)}</small></span></span><span className="net-detail-card__expense-value" role="cell"><strong>{formatCurrency(expense.amount)}</strong><IconChevronRight size={15} /></span></button> : <div className={rowClass} role="row"><span className="net-detail-card__expense-label" role="cell"><i><ExpenseIcon size={17} /></i><span><strong>{expense.label}</strong><small>{getExpenseCadence(expense)}</small></span></span><span className="net-detail-card__expense-value" role="cell"><strong>{formatCurrency(expense.amount)}</strong>{(expense.manual || expense.manualExpenseIds?.length > 0) && <button type="button" onClick={() => onRemoveExpense(expense.manual ? expense.id : expense.manualExpenseIds)} aria-label={`Eliminar gasto manual de ${expense.label}`}><IconTrash size={12} /></button>}</span></div>}
          {breakdownOpen && <div className="net-detail-card__expense-breakdown" id={`net-expense-breakdown-${rowKey.replace(/\s/g, "-")}`} role="rowgroup" aria-label={`Detalle de ${expense.label}`}>
            {expense.breakdown.map((breakdown, breakdownIndex) => {
              const breakdownEditorKey = getBreakdownEditorKey(rowKey, breakdown, breakdownIndex);
              const breakdownEditorId = `net-breakdown-editor-${rowKey.replace(/\s/g, "-")}-${breakdownIndex}`;
              const editingBreakdown = activeBreakdownEditor === breakdownEditorKey;
              return <div className={`net-detail-card__expense-breakdown-entry${editingBreakdown ? " is-editing" : ""}`} key={`${rowKey}-${getNetBreakdownKey(breakdown, breakdownIndex)}`}>
                <button type="button" className="net-detail-card__expense-breakdown-row" role="row" aria-expanded={editingBreakdown} aria-controls={editingBreakdown ? breakdownEditorId : undefined} title="Pulsa dos segundos para editar directamente el importe" onPointerDown={(event) => { if (event.pointerType === "mouse" && event.button !== 0) return; startBreakdownPress(expense, breakdown, rowKey, breakdownIndex); }} onPointerUp={clearBreakdownPress} onPointerCancel={clearBreakdownPress} onPointerLeave={clearBreakdownPress} onClick={() => handleBreakdownTriggerClick(expense, breakdown, rowKey, breakdownIndex)}>
                  <span role="cell"><strong>{breakdown.label}</strong><small>{getBreakdownMeta(breakdown)}</small></span><strong role="cell">{formatCurrency(breakdown.amount)}</strong>
                </button>
                {editingBreakdown && <form className="net-detail-card__breakdown-editor" id={breakdownEditorId} onSubmit={(event) => handleBreakdownSubmit(event, selectedDetail.vehicle.plate)}>
                  <label><span>Concepto</span><input type="text" value={breakdownFormState.concept} onChange={(event) => setBreakdownFormState((current) => ({ ...current, concept: event.target.value }))} maxLength={60} autoFocus={false} /></label>
                  <label><span>Día del gasto</span><input type="date" value={breakdownFormState.date} min={netExpenseDateRange.min} max={netExpenseDateRange.max} onChange={(event) => setBreakdownFormState((current) => ({ ...current, date: event.target.value }))} /></label>
                  <label><span>Importe</span><input ref={breakdownAmountRef} type="number" value={breakdownFormState.amount} onChange={(event) => setBreakdownFormState((current) => ({ ...current, amount: event.target.value }))} min="0" step="0.01" inputMode="decimal" /></label>
                  <div className="net-detail-card__breakdown-editor-actions"><button type="button" className="net-detail-card__form-cancel" onClick={closeBreakdownEditor}>Cancelar</button><button type="submit" className="net-detail-card__form-save">Guardar</button></div>
                  {breakdownFormError && <p>{breakdownFormError}</p>}
                </form>}
              </div>;
            })}
          </div>}
          {breakdownOpen && expense.commissionReport && <AlexCommissionReportPanel report={expense.commissionReport} periodLabel={periodLabel} archivedReports={commissionReports} busy={commissionReportBusy} message={commissionReportMessage} onSavePayroll={onSaveAlexPayroll} onGenerate={onGenerateAlexReport} onDownload={onDownloadCommissionReport} />}
        </div>;
      })}
    </div>
  </div>;
  const renderDriverBillingRows = (detail) => {
    if (reportYear !== 2026) return null;
    const driverRows = detail.driverRows ?? [];
    return <section className="net-detail-card__driver-billing" aria-label={`Facturación de conductores de ${detail.vehicle.plate}`}>
      <header><strong>FACTURACIÓN POR CONDUCTOR</strong><strong>IMPORTE</strong></header>
      <div className="net-detail-card__driver-billing-rows">
        {driverRows.map((row) => <div key={row.key}>
          <span className="net-detail-card__driver-identity">
            <span className="net-detail-card__driver-avatar" aria-hidden="true">{getDriverAvatarPath(row.driver) ? <img src={getDriverAvatarPath(row.driver)} alt="" /> : String(row.driver ?? "?").trim().slice(0, 1).toLocaleUpperCase("es")}</span>
            <strong className="net-detail-card__driver-name">{row.driver}</strong>
          </span>
          <strong className="net-detail-card__driver-amount">{formatCurrency(row.revenue)}</strong>
        </div>)}
      </div>
      <footer><span>Facturación del coche</span><strong>{formatCurrency(detail.revenue)}</strong></footer>
    </section>;
  };
  return (
    <div className="net-detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`net-detail-modal${selectedDetail ? " net-detail-modal--expanded" : ""}`} role="dialog" aria-modal="true" aria-label="Detalle de NETO">
        <header className="net-detail-modal__header">
          <div className="net-detail-modal__brand" aria-label="SOBRE RUEDAS">
            <img src="/brand/sobre-ruedas-logo.png" alt="" />
            <span><strong>SOBRE</strong><em> RUEDAS</em><small>GESTIÓN DE FLOTA</small></span>
          </div>
          <div className="net-detail-modal__header-heading"><span>NETO</span><small>{periodLabel}</small></div>
          <button ref={closeButtonRef} type="button" className="icon-button net-detail-modal__close" onClick={onClose} aria-label="Volver al resumen general"><IconX size={20} /></button>
        </header>
        <section className="net-detail-modal__hero" aria-label={`Vista visual de Neto de ${periodLabel}`}>
          <div className="net-detail-modal__hero-cars" aria-hidden="true">
            {orderedDetails.map(({ vehicle }) => {
              const visual = netVehicleImages[vehicle.plate];
              return <span className={`net-detail-modal__hero-car net-detail-modal__hero-car--${visual?.tone ?? "green"}`} key={vehicle.plate}>
                <img src={visual?.src ?? vehicleBrandLogos[getVehicleBrand(vehicle)]} alt="" />
              </span>;
            })}
          </div>
          <div className="net-detail-modal__hero-copy"><span>RESULTADO OPERATIVO</span><h1>NETO</h1></div>
        </section>
        <section className="net-detail-modal__overview" aria-label={`Resumen neto de ${periodLabel}`}>
          <div className="net-detail-modal__header-content">
            <div className="net-detail-modal__total"><span>NETO TOTAL · 3 COCHES</span><strong aria-label={`Total neto de ${periodLabel}`}>{formatCurrency(total)}</strong></div>
            <div className="net-detail-modal__period-controls" role="group" aria-label="Periodo de Neto">
              <div className="net-detail-modal__period-dropdown">
                <button type="button" className="net-detail-modal__period-trigger" aria-label="Seleccionar mes de Neto" title="Mes de Neto" aria-haspopup="listbox" aria-expanded={periodMenu === "month"} onClick={() => setPeriodMenu((current) => current === "month" ? "" : "month")}><span>{reportMonths[reportMonth]}</span><IconChevronDown size={13} /></button>
                {periodMenu === "month" && <WheelPickerMenu options={reportMonths.map((label, index) => ({ value: index, label }))} value={reportMonth} onChange={selectNetMonth} ariaLabel="Seleccionar mes de Neto" className="net-detail-modal__period-menu net-detail-modal__period-menu--months" />}
              </div>
              <div className="net-detail-modal__period-dropdown">
                <button type="button" className="net-detail-modal__period-trigger net-detail-modal__period-trigger--year" aria-label="Seleccionar año de Neto" title="Año de Neto" aria-haspopup="listbox" aria-expanded={periodMenu === "year"} onClick={() => setPeriodMenu((current) => current === "year" ? "" : "year")}><span>{reportYear}</span><IconChevronDown size={13} /></button>
                {periodMenu === "year" && <WheelPickerMenu options={reportYears.map((year) => ({ value: year, label: String(year) }))} value={reportYear} onChange={selectNetYear} ariaLabel="Seleccionar año de Neto" className="net-detail-modal__period-menu net-detail-modal__period-menu--years" />}
              </div>
            </div>
          </div>
        </section>
        {reportYear !== 2026 && <section className="net-detail-historical-billing" aria-label={`Facturación histórica documental de ${periodLabel}`}>
          <header><div><strong>FACTURACIÓN HISTÓRICA</strong><small>Fuente documental separada · no modifica perfiles ni registros diarios</small></div><div><span>Total documental</span><strong>{formatCurrency(historicalDocumentTotal)}</strong></div></header>
          {historicalBillingRows.length > 0 ? <div className="net-detail-historical-billing__rows">{historicalBillingRows.map((row) => <div key={row.key}><span><strong>{row.driver}</strong><small>{row.plate || "Matrícula pendiente"} · {row.missingVehicle ? "No sumado: matrícula pendiente" : row.usedInNet ? "Usado en Neto" : "No sumado: existe registro real"} · {row.extractedLabel}</small></span><strong>{formatCurrency(row.revenue)}</strong></div>)}</div> : <p>No hay facturación documental cargada para este periodo.</p>}
          <footer><span>Importe documental aplicado al cálculo</span><strong>{formatCurrency(historicalAppliedTotal)}</strong></footer>
        </section>}
        {!selectedDetail ? <>
          <div className="net-detail-carousel" aria-label="Vehículos profesionales con resultado neto">
            {orderedDetails.map(({ vehicle, revenue, totalExpenses, net, driverRows = [] }) => <article className={`net-detail-card net-detail-card--collapsed net-detail-card--tone-${netVehicleImages[vehicle.plate]?.tone ?? "green"}`} key={vehicle.plate}>
              <div className={`net-detail-card__vehicle-visual net-detail-card__vehicle-visual--${netVehicleImages[vehicle.plate]?.tone ?? "green"}`}><img src={netVehicleImages[vehicle.plate]?.src ?? vehicleBrandLogos[getVehicleBrand(vehicle)]} alt={`Toyota Corolla sedan, vista ${netVehicleImages[vehicle.plate]?.view ?? "frontal"}`} loading="eager" /></div>
              <div className="net-detail-card__collapsed-content">
              <VehiclePlateLabel vehicleOrPlate={vehicle} className="net-detail-card__plate" />
              <strong className={`net-detail-card__net net-detail-card__net--large${net < 0 ? " net-detail-card__net--negative" : ""}`}>{formatCurrency(net)}</strong>
              <div className="net-detail-card__collapsed-line net-detail-card__collapsed-line--billing"><span>Facturación</span><strong>{formatCurrency(revenue)}</strong></div>
              <div className="net-detail-card__collapsed-line"><span>Gastos registrados</span><strong>{formatCurrency(totalExpenses)}</strong></div>
              {reportYear === 2026 && <div className="net-detail-card__collapsed-drivers" aria-label={`Conductores y facturación de ${vehicle.plate}`}>
                {driverRows.map((row) => <div key={row.key}><span className="net-detail-card__driver-identity"><span className="net-detail-card__driver-avatar" aria-hidden="true">{getDriverAvatarPath(row.driver) ? <img src={getDriverAvatarPath(row.driver)} alt="" /> : String(row.driver ?? "?").trim().slice(0, 1).toLocaleUpperCase("es")}</span><span className="net-detail-card__driver-name">{row.driver}</span></span><strong className="net-detail-card__driver-amount">{formatCurrency(row.revenue)}</strong></div>)}
              </div>}
              <button type="button" className="net-detail-card__expand" onClick={() => toggleVehicle(vehicle.plate)} aria-label={`Abrir gastos de ${vehicle.plate}`}><IconChevronDown size={21} /></button>
              </div>
            </article>)}
          </div>
        </> : <div className="net-detail-expanded">
          <div className="net-detail-expanded__navigation">
            <button type="button" className="net-detail-back" onClick={() => { setSelectedPlate(""); closeExpenseForm(); }}><IconChevronLeft size={16} />VER LOS 3 COCHES</button>
            <VehiclePlateLabel vehicleOrPlate={selectedDetail.vehicle} className="net-detail-back__plate" />
          </div>
          <article className={`net-detail-expanded__card net-detail-expanded__card--tone-${selectedTone}`}>
            {renderDriverBillingRows(selectedDetail)}
            {renderExpenseRows(selectedDetail)}
            {activeFormPlate === selectedDetail.vehicle.plate && <form className="net-detail-card__add-form" onSubmit={(event) => handleExpenseSubmit(event, selectedDetail.vehicle.plate)}>
              <label className="net-detail-card__add-form-category"><span>Categoría del gasto</span><select value={formState.category} onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value, label: "" }))} autoFocus><option value="">Selecciona una categoría…</option>{expenseCategories.map((category) => <option value={category.label} key={category.label}>{category.label}</option>)}<option value="__custom__">+ Crear nueva categoría</option></select></label>
              {formState.category === "__custom__" && <label className="net-detail-card__add-form-custom"><span>Nueva categoría</span><input type="text" value={formState.label} onChange={(event) => setFormState((current) => ({ ...current, label: event.target.value }))} placeholder="Ej. Nóminas · Andrés" maxLength={42} /></label>}
              <label className="net-detail-card__add-form-date"><span>Día del gasto</span><input type="date" value={formState.date} min={netExpenseDateRange.min} max={netExpenseDateRange.max} onChange={(event) => setFormState((current) => ({ ...current, date: event.target.value }))} /></label>
              <label><span>Importe</span><input type="number" value={formState.amount} onChange={(event) => setFormState((current) => ({ ...current, amount: event.target.value }))} placeholder="0,00" min="0.01" step="0.01" inputMode="decimal" /></label>
              <div><button type="button" className="net-detail-card__form-cancel" onClick={closeExpenseForm}>Cancelar</button><button type="submit" className="net-detail-card__form-save">Guardar gasto</button></div>
              {formError && <p>{formError}</p>}
            </form>}
            <footer className="net-detail-expanded__actions"><button type="button" className="net-detail-expanded__hide" onClick={() => setSelectedPlate("")}><span>Ocultar gastos</span><IconChevronUp size={17} /></button><button type="button" className="net-detail-expanded__add" onClick={() => openExpenseForm(selectedDetail.vehicle.plate)}><IconPlus size={18} />Añadir gastos</button></footer>
          </article>
        </div>}
      </section>
    </div>
  );
}

function AlexCommissionReportPanel({ report, periodLabel, archivedReports = [], busy = false, message = "", onSavePayroll, onGenerate, onDownload }) {
  const [payrollDraft, setPayrollDraft] = useState(String(report.calculation.payroll ?? 0));
  useEffect(() => {
    setPayrollDraft(String(report.calculation.payroll ?? 0));
  }, [report.calculation.payroll, report.periodStart]);
  const calculation = report.calculation;
  const periodReports = archivedReports.filter((item) => item.driver_id === report.driverId && item.vehicle_plate === report.vehiclePlate);
  const reachedThresholds = getCommissionThresholdsForBilling(calculation.monthlyBilling);
  return <section className="alex-commission-report" aria-label={`Cálculo mensual de ${report.driver}`}>
    <header className="alex-commission-report__header"><div><span>COMISIÓN DE ALEX</span><strong>{periodLabel}</strong></div><IconCurrencyEuro size={20} /></header>
    <div className="alex-commission-report__formula">
      <div><span>Facturación</span><strong>{formatCurrency(calculation.monthlyBilling)}</strong></div>
      <div><span>32% de facturación</span><strong>{formatCurrency(calculation.commissionBase)}</strong></div>
      <div><span>Bonus por tramos</span><strong>{formatCurrency(calculation.thresholdBonus)}</strong><small>{reachedThresholds.length ? `Superados: ${reachedThresholds.join(" · ")} €` : "Sin tramos superados"}</small></div>
      <div><span>Comisión calculada</span><strong>{formatCurrency(calculation.commission)}</strong></div>
      <div><span>+ Propinas</span><strong>{formatCurrency(calculation.tips)}</strong></div>
      <div><span>+ Peajes</span><strong>{formatCurrency(calculation.tolls)}</strong></div>
      <div className="alex-commission-report__total"><span>Total beneficio mes</span><strong>{formatCurrency(calculation.totalBenefitMonth)}</strong></div>
    </div>
    <div className="alex-commission-report__payroll"><label>Nómina de Alex<input type="number" min="0" step="0.01" inputMode="decimal" value={payrollDraft} onChange={(event) => setPayrollDraft(event.target.value)} /></label><button type="button" className="text-button" onClick={() => onSavePayroll?.(report, payrollDraft)} disabled={busy}>Guardar nómina</button><strong>Total a cobrar {formatCurrency(calculation.totalToCollect)}</strong></div>
    <div className="alex-commission-report__actions"><button type="button" className="primary-button" onClick={() => onGenerate?.(report)} disabled={busy}><IconDownload size={16} />{busy ? "Generando…" : "Generar y archivar PDF"}</button>{message && <span role="status">{message}</span>}</div>
    {periodReports.length > 0 && <div className="alex-commission-report__archive"><strong>INFORMES ARCHIVADOS</strong>{periodReports.map((item) => <button type="button" key={item.id} onClick={() => onDownload?.(item)}><span>{item.period_start.slice(0, 7)}</span><IconDownload size={14} /></button>)}</div>}
  </section>;
}

function FuelView({ vehicles, driverEntries = [], transactions = [], documents = [], selected, onSelectVehicle, onNavigate, setModal, initialTab = "General", reportTab: controlledReportTab, onReportTabChange, chartMetric: controlledChartMetric, onChartMetricChange, reportMonth: controlledReportMonth, reportYear: controlledReportYear, onReportMonthChange, onReportYearChange, mode = "reports", filtered, filter, query, selectedDrivers, setFilter, setQuery, selectVehicle, selectDriver, openWorkshop, adminUserId = "", realtimeRevision = 0 }) {
  const [internalReportTab, setInternalReportTab] = useState(initialTab);
  const reportTab = controlledReportTab ?? internalReportTab;
  const setReportTab = onReportTabChange ?? setInternalReportTab;
  const [internalChartMetric, setInternalChartMetric] = useState("summary");
  const chartMetric = controlledChartMetric ?? internalChartMetric;
  const setChartMetric = onChartMetricChange ?? setInternalChartMetric;
  const [selectedChartMetrics, setSelectedChartMetrics] = useState(() => chartMetric === "summary" ? [] : [chartMetric]);
  const pendingChartMetricsRef = useRef(null);
  const [internalReportMonth, setInternalReportMonth] = useState(() => new Date().getMonth());
  const [internalReportYear, setInternalReportYear] = useState(() => new Date().getFullYear());
  const reportMonth = controlledReportMonth ?? internalReportMonth;
  const reportYear = controlledReportYear ?? internalReportYear;
  const setReportMonth = onReportMonthChange ?? setInternalReportMonth;
  const setReportYear = onReportYearChange ?? setInternalReportYear;
  const [periodMenu, setPeriodMenu] = useState("");
  const [selectedChartBar, setSelectedChartBar] = useState("");
  const [netDetailOpen, setNetDetailOpen] = useState(false);
  const [manualNetExpenses, setManualNetExpenses] = useState(() => loadManualNetExpenses());
  const [manualNetBreakdowns, setManualNetBreakdowns] = useState(() => loadManualNetBreakdowns());
  const [periodFinancials, setPeriodFinancials] = useState([]);
  const [commissionReports, setCommissionReports] = useState([]);
  const [commissionReportBusy, setCommissionReportBusy] = useState(false);
  const [commissionReportMessage, setCommissionReportMessage] = useState("");
  const [billingDriverKey, setBillingDriverKey] = useState("");
  const [billingVehiclePlate, setBillingVehiclePlate] = useState("");
  useEffect(() => {
    setSelectedChartBar("");
  }, [chartMetric, reportMonth, reportYear]);
  useEffect(() => {
    if (chartMetric !== "net" && netDetailOpen) setNetDetailOpen(false);
  }, [chartMetric, netDetailOpen]);
  useEffect(() => {
    if (chartMetric === "summary") {
      if (pendingChartMetricsRef.current) {
        setSelectedChartMetrics(pendingChartMetricsRef.current);
        pendingChartMetricsRef.current = null;
      } else if (selectedChartMetrics.length === 1) {
        setSelectedChartMetrics([]);
      }
    } else if (allChartMetricValues.includes(chartMetric)) {
      pendingChartMetricsRef.current = null;
      setSelectedChartMetrics([chartMetric]);
    }
  }, [chartMetric]);
  useEffect(() => {
    if (!periodMenu) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setPeriodMenu(""); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [periodMenu]);
  useEffect(() => {
    if (!periodMenu) return undefined;
    const closeOnPointerDown = (event) => {
      if (!event.target.closest(".report-period-dropdown, .fuel-period-dropdown")) setPeriodMenu("");
    };
    document.addEventListener("pointerdown", closeOnPointerDown);
    return () => document.removeEventListener("pointerdown", closeOnPointerDown);
  }, [periodMenu]);
  useEffect(() => {
    if (!netDetailOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setNetDetailOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [netDetailOpen]);
  useEffect(() => {
    saveManualNetExpenses(manualNetExpenses);
  }, [manualNetExpenses]);
  useEffect(() => {
    saveManualNetBreakdowns(manualNetBreakdowns);
  }, [manualNetBreakdowns]);
  const periodStart = `${reportYear}-${String(reportMonth + 1).padStart(2, "0")}-01`;
  useEffect(() => {
    let mounted = true;
    if (!supabase) return undefined;
    listDriverPeriodFinancials(periodStart)
      .then(({ data, error }) => { if (mounted && !error) setPeriodFinancials(data ?? []); })
      .catch(() => { if (mounted) setPeriodFinancials([]); });
    return () => { mounted = false; };
  }, [periodStart, realtimeRevision]);
  useEffect(() => {
    let mounted = true;
    if (!supabase) return undefined;
    listCommissionReports()
      .then(({ data, error }) => { if (mounted && !error) setCommissionReports(data ?? []); })
      .catch(() => { if (mounted) setCommissionReports([]); });
    return () => { mounted = false; };
  }, [realtimeRevision]);
  useEffect(() => {
    if (!billingDriverKey) return undefined;
    const animationFrame = window.requestAnimationFrame(() => {
      document.getElementById("driver-billing-calendar")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [billingDriverKey]);
  const periodFactor = getReportPeriodFactor(reportMonth, reportYear);
  const selectedPeriodLabel = `${reportMonths[reportMonth]} ${reportYear}`;
  const periodTransactions = transactions.filter((transaction) => {
    const date = new Date(`${transaction.occurred_on}T12:00:00`);
    return date.getFullYear() === reportYear && date.getMonth() === reportMonth;
  });
  const documentsById = new Map(documents.map((document) => [document.id, document]));
  const vehicleStats = vehicles.map((vehicle) => {
    const entries = periodTransactions.filter((transaction) => transaction.type === "fuel" && transaction.vehicle_plate === vehicle.plate).map((transaction) => {
      const sourceDocument = documentsById.get(transaction.source_document_id) ?? null;
      const fields = getExtractedDocumentFields(sourceDocument);
      const metadata = transaction.metadata ?? {};
      const assignedProfile = vehicle.driverProfiles?.find((driver) => driver.id === transaction.driver_id);
      const createdTime = transaction.created_at
        ? new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(transaction.created_at))
        : "";
      return {
        id: transaction.id,
        date: transaction.occurred_on,
        time: fields.time || metadata.time || createdTime,
        driverId: transaction.driver_id,
        driver: assignedProfile?.full_name ?? "",
        liters: Number(metadata.liters) || 0,
        cost: Number(transaction.amount) || 0,
        costPerUnit: Number(metadata.costPerUnit) || Number(fields.costPerUnit) || 0,
        provider: fields.gasStation || fields.provider || metadata.provider || metadata.company || "Gasolinera no identificada",
        ticketNumber: fields.ticketNumber || fields.invoiceNumber || metadata.invoiceNumber || "",
        sourceDocumentId: transaction.source_document_id,
        sourceDocument,
      };
    });
    return {
      vehicle,
      entries,
      liters: entries.reduce((sum, entry) => sum + (entry.liters ?? 0), 0),
      cost: entries.reduce((sum, entry) => sum + (entry.cost ?? 0), 0),
      refuels: entries.length,
    };
  });
  const totals = vehicleStats.reduce((summary, item) => ({
    liters: summary.liters + item.liters,
    cost: summary.cost + item.cost,
    refuels: summary.refuels + item.refuels,
  }), { liters: 0, cost: 0, refuels: 0 });
  const totalDistance = 0;
  const periodDays = new Date(reportYear, reportMonth + 1, 0).getDate();
  const billingRows = getDriverBillingRows(vehicles, driverEntries, reportMonth, reportYear, documents);
  const historicalBillingRows = getHistoricalBillingRowsForPeriod(vehicles, driverEntries, reportMonth, reportYear);
  const unassignedBillingByPlate = vehicles.reduce((result, vehicle) => {
    result[vehicle.plate] = periodTransactions
      .filter((transaction) => transaction.type === "billing" && transaction.vehicle_plate === vehicle.plate && !transaction.driver_id)
      .reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
    return result;
  }, {});
  const vehicleBillingTotals = vehicles.map((vehicle) => billingRows
    .filter((row) => row.plate === vehicle.plate)
    .reduce((sum, row) => sum + row.revenue, 0) + (unassignedBillingByPlate[vehicle.plate] ?? 0));
  const billingChartData = [
    ...billingRows.map((row) => ({ label: row.driver, detail: row.plate, value: row.revenue })),
    ...vehicles
      .filter((vehicle) => (unassignedBillingByPlate[vehicle.plate] ?? 0) > 0)
      .map((vehicle) => ({ label: "Sin conductor", detail: vehicle.plate, value: unassignedBillingByPlate[vehicle.plate] })),
  ];
  const chartVehicleStats = vehicles.map((vehicle, index) => ({ vehicle, cost: vehicleStats[index]?.cost ?? 0 }));
  const fuelChartData = chartVehicleStats.map(({ vehicle, cost }, index) => ({
    label: vehicle.plate,
    detail: vehicle.model,
    value: Number(cost.toFixed(2)),
  }));
  const maintenanceChartData = vehicles.map((vehicle) => ({
    label: vehicle.plate,
    detail: vehicle.model,
    value: periodTransactions.filter((transaction) => transaction.type === "maintenance" && transaction.vehicle_plate === vehicle.plate).reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0),
  }));
  const netPeriodKey = `${reportYear}-${reportMonth}`;
  const netVehicleDetails = vehicles
    .filter((vehicle) => vehicle.use === "Profesional")
    .map((vehicle) => {
      const vehicleIndex = vehicles.findIndex((candidate) => candidate.plate === vehicle.plate);
      const vehicleHistoricalBilling = historicalBillingRows.filter((row) => row.plate === vehicle.plate);
      const includeHistoricalDrivers = reportYear === 2026;
      const vehicleBillingRows = getNetDriverRowsForVehicle({ vehicle, billingRows, historicalBillingRows: vehicleHistoricalBilling, includeHistoricalDrivers });
      const additionalHistoricalBillingRows = includeHistoricalDrivers ? [] : vehicleHistoricalBilling.filter((row) => row.isHistoricalOnly && row.usedInNet);
      const additionalHistoricalBilling = additionalHistoricalBillingRows.reduce((sum, row) => sum + (Number(row.revenue) || 0), 0);
      const revenue = Number((vehicleBillingRows.reduce((sum, row) => sum + (Number(row.revenue) || 0), 0) + additionalHistoricalBilling).toFixed(2));
      const commission = Number(vehicleBillingRows.reduce((sum, row) => sum + calculateNetDriverCommission(row.driver, row.revenue), 0).toFixed(2));
      const expenses = buildNetExpenseBreakdown({
        vehicle,
        fuel: vehicleStats[vehicleIndex]?.cost ?? 0,
        fuelEntries: vehicleStats[vehicleIndex]?.entries ?? [],
        maintenance: maintenanceChartData[vehicleIndex]?.value ?? 0,
        commission,
        periodFactor,
        driverRows: vehicleBillingRows,
        driverNames: vehicleBillingRows.map((row) => row.driver),
        additionalHistoricalBilling,
        periodFinancials,
        manualBreakdowns: manualNetBreakdowns.filter((breakdown) => breakdown.periodKey === netPeriodKey && breakdown.plate === vehicle.plate),
        reportMonth,
        reportYear,
      });
      const manualExpenses = manualNetExpenses
        .filter((expense) => expense.periodKey === netPeriodKey && expense.plate === vehicle.plate)
        .map((expense) => ({ ...expense, key: `manual-${expense.id}`, cadence: expense.cadence || "Manual", category: expense.category || expense.label, manual: true }));
      const standaloneManualExpenses = [];
      manualExpenses.forEach((manualExpense) => {
        const categoryKey = Object.prototype.hasOwnProperty.call(manualExpense, "categoryKey")
          ? manualExpense.categoryKey
          : getNetExpenseCategoryKey(manualExpense.category || manualExpense.label);
        const canonicalExpense = categoryKey ? expenses.find((expense) => expense.key === categoryKey) : null;
        if (!canonicalExpense) {
          standaloneManualExpenses.push(manualExpense);
          return;
        }
        const amount = Number(manualExpense.amount) || 0;
        canonicalExpense.amount = Number((canonicalExpense.amount + amount).toFixed(2));
        canonicalExpense.manualExpenseIds = [...(canonicalExpense.manualExpenseIds ?? []), manualExpense.id];
        canonicalExpense.manualExpenseDates = [...(canonicalExpense.manualExpenseDates ?? []), manualExpense.date].filter(Boolean);
        if (Array.isArray(canonicalExpense.breakdown)) {
          const manualBreakdown = canonicalExpense.breakdown.find((breakdown) => breakdown.label === "Añadido a mano");
          if (manualBreakdown) {
            manualBreakdown.amount = Number((manualBreakdown.amount + amount).toFixed(2));
            manualBreakdown.date = manualBreakdown.date && manualExpense.date && manualBreakdown.date !== manualExpense.date ? "" : manualBreakdown.date || manualExpense.date || "";
            manualBreakdown.meta = manualBreakdown.date ? "Gasto manual" : "Gastos manuales del periodo";
          } else {
            canonicalExpense.breakdown = [
              ...canonicalExpense.breakdown,
              { label: "Añadido a mano", amount: Number(amount.toFixed(2)), meta: manualExpense.date ? "Gasto manual" : "Gasto manual del periodo", date: manualExpense.date || "" },
            ];
          }
        }
      });
      expenses.push(...standaloneManualExpenses);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const commissionExpense = expenses.find((expense) => expense.key === "driver-commission");
      return {
        vehicle,
        revenue,
        expenses,
        totalExpenses,
        net: Number((revenue - totalExpenses).toFixed(2)),
        driverRows: vehicleBillingRows,
        historicalBilling: vehicleHistoricalBilling,
        alexCommissionReport: commissionExpense?.commissionReport ?? null,
      };
    });
  const netVehicleDetailsByPlate = new Map(netVehicleDetails.map((detail) => [detail.vehicle.plate, detail]));
  const netChartData = vehicles.map((vehicle) => {
    const detail = netVehicleDetailsByPlate.get(vehicle.plate);
    return { label: vehicle.plate, detail: vehicle.model, value: detail?.net ?? 0 };
  });
  const periodTotals = {
    billing: billingChartData.reduce((sum, item) => sum + item.value, 0),
    maintenance: maintenanceChartData.reduce((sum, item) => sum + item.value, 0),
    fuel: fuelChartData.reduce((sum, item) => sum + item.value, 0),
    net: netChartData.reduce((sum, item) => sum + item.value, 0),
  };
  const summaryChartData = vehicles.map((vehicle, index) => ({
    label: vehicle.plate,
    detail: vehicle.model,
    billing: vehicleBillingTotals[index] ?? 0,
    maintenance: maintenanceChartData[index].value,
    fuel: fuelChartData[index].value,
    net: netChartData[index].value,
  }));
  const summaryMetricLabels = {
    billing: "Facturación",
    maintenance: "Mantenimiento",
    fuel: "Combustible",
    net: "Neto",
  };
  const chartOptions = {
    summary: { title: "RESUMEN GENERAL POR COCHE", description: "", color: SUMMARY_CHART_COLOR, data: summaryChartData },
    billing: { title: "FACTURACIÓN POR CONDUCTOR", description: "", color: BILLING_COLOR, data: billingChartData },
    maintenance: { title: "MANTENIMIENTO POR COCHE", description: "", color: MAINTENANCE_COLOR, data: maintenanceChartData },
    fuel: { title: "COMBUSTIBLE POR COCHE", description: "", color: "#df4538", data: fuelChartData },
    net: { title: "BENEFICIO NETO POR COCHE", description: "", color: "#28923c", data: netChartData },
  };
  const activeChart = chartOptions[chartMetric];
  const visibleChartMetrics = selectedChartMetrics.length > 0 ? selectedChartMetrics : allChartMetricValues;
  const chartIconMetricColors = selectedChartMetrics.length === 0 ? { ...chartMetricColors, billing: SUMMARY_CHART_COLOR } : chartMetricColors;
  const chartIconBackground = visibleChartMetrics.length === 1
    ? chartIconMetricColors[visibleChartMetrics[0]]
    : `conic-gradient(from 45deg, ${visibleChartMetrics.map((metric, index) => `${chartIconMetricColors[metric]} ${index * 100 / visibleChartMetrics.length}% ${(index + 1) * 100 / visibleChartMetrics.length}%`).join(", ")})`;
  const selectedFuelStats = vehicleStats.find(({ vehicle }) => vehicle.plate === selected.plate) ?? vehicleStats[0];
  const selectedBillingDriver = billingRows.find((row) => row.key === billingDriverKey) ?? null;
  const selectedBillingDriverVehicle = vehicles.find((vehicle) => vehicle.plate === selectedBillingDriver?.plate) ?? null;
  const selectedBillingVehicle = vehicles.find((vehicle) => vehicle.plate === billingVehiclePlate) ?? null;
  const selectedBillingVehicleRows = billingRows.filter((row) => row.plate === billingVehiclePlate);
  const openBillingSourceDocument = (document) => {
    if (!document || !selectedBillingDriver) return;
    setModal({
      type: "driver-document",
      item: buildDriverDocumentModalItem(document, {
        driver: selectedBillingDriver.driver,
        plate: selectedBillingDriver.plate,
        fallbackDate: periodStart,
      }),
    });
  };
  const hasChartData = true;
  const selectChartBar = (entry) => {
    const label = entry?.payload?.label ?? entry?.label;
    if (label) setSelectedChartBar(label);
  };
  const selectChartMetrics = (nextMetrics) => {
    const normalized = allChartMetricValues.filter((metric) => nextMetrics.includes(metric));
    if (!normalized.length) {
      pendingChartMetricsRef.current = null;
      setSelectedChartMetrics([]);
      if (chartMetric !== "summary") setChartMetric("summary");
      return;
    }
    setSelectedChartMetrics(normalized);
    if (normalized.length === 1) {
      pendingChartMetricsRef.current = null;
      setChartMetric(normalized[0]);
    } else if (chartMetric !== "summary") {
      pendingChartMetricsRef.current = normalized;
      setChartMetric("summary");
    } else {
      pendingChartMetricsRef.current = null;
    }
  };
  const toggleLegendMetric = (event, metric) => {
    event.stopPropagation();
    const nextMetrics = selectedChartMetrics.length === 0
      ? [metric]
      : selectedChartMetrics.includes(metric)
        ? selectedChartMetrics.filter((candidate) => candidate !== metric)
        : [...selectedChartMetrics, metric];
    selectChartMetrics(nextMetrics);
  };
  const handleSaveAlexPayroll = async (report, rawPayroll) => {
    const payroll = Number(String(rawPayroll ?? "").replace(",", "."));
    if (!report?.driverId) {
      setCommissionReportMessage("Alex debe tener un perfil de conductor asignado para guardar su nómina.");
      return;
    }
    if (!Number.isFinite(payroll) || payroll < 0) {
      setCommissionReportMessage("Introduce una nómina válida.");
      return;
    }
    setCommissionReportBusy(true);
    setCommissionReportMessage("");
    try {
      const saved = await upsertDriverPeriodFinancial({ driverId: report.driverId, periodStart: report.periodStart, payroll, createdBy: adminUserId });
      setPeriodFinancials((current) => [...current.filter((item) => !(item.driver_id === saved.driver_id && item.period_start === saved.period_start)), saved]);
      setCommissionReportMessage("Nómina de Alex guardada para este mes.");
    } catch (error) {
      setCommissionReportMessage(`No se pudo guardar la nómina: ${error.message}`);
    } finally {
      setCommissionReportBusy(false);
    }
  };
  const handleGenerateAlexReport = async (report) => {
    if (!report?.driverId) {
      setCommissionReportMessage("Alex debe tener un perfil de conductor asignado para archivar el informe.");
      return;
    }
    setCommissionReportBusy(true);
    setCommissionReportMessage("");
    try {
      const fileName = buildCommissionReportFileName({ driverName: report.driver, year: report.periodStart.slice(0, 4), monthIndex: Number(report.periodStart.slice(5, 7)) - 1 });
      const payload = { driverId: report.driverId, driverName: report.driver, vehiclePlate: report.vehiclePlate, periodStart: report.periodStart, periodEnd: report.periodEnd, calculation: report.calculation, fileName };
      const pdfBlob = buildAlexCommissionReportPdf({ driverName: report.driver, vehiclePlate: report.vehiclePlate, year: Number(report.periodStart.slice(0, 4)), monthIndex: Number(report.periodStart.slice(5, 7)) - 1, calculation: report.calculation });
      const saved = await uploadCommissionReport({ report: payload, pdfBlob, createdBy: adminUserId });
      setCommissionReports((current) => [saved, ...current.filter((item) => item.id !== saved.id && !(item.driver_id === saved.driver_id && item.period_start === saved.period_start))]);
      const objectUrl = URL.createObjectURL(pdfBlob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setCommissionReportMessage("PDF generado, descargado y archivado para el administrador.");
    } catch (error) {
      setCommissionReportMessage(`No se pudo generar el PDF: ${error.message}`);
    } finally {
      setCommissionReportBusy(false);
    }
  };
  const handleDownloadCommissionReport = async (report) => {
    setCommissionReportBusy(true);
    setCommissionReportMessage("");
    try {
      const signedUrl = await createCommissionReportDownloadUrl(report.file_path);
      const anchor = document.createElement("a");
      anchor.href = signedUrl;
      anchor.download = report.file_name;
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      setCommissionReportMessage(`No se pudo abrir el informe: ${error.message}`);
    } finally {
      setCommissionReportBusy(false);
    }
  };
  useEffect(() => {
    if (!periodMenu) return;
    const menu = document.querySelector(".report-period-menu--wheel");
    const selectedOption = menu?.querySelector("button.selected");
    if (!menu || !selectedOption || menu.querySelector(".report-wheel-list")) return;
    const scrollContainer = menu.querySelector(".report-wheel-list") ?? menu;
    const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
    const targetScroll = selectedOption.offsetTop - (scrollContainer.clientHeight - selectedOption.offsetHeight) / 2;
    scrollContainer.scrollTop = Math.max(0, Math.min(maxScroll, targetScroll));
  }, [periodMenu]);

  if (mode === "vehicles") {
    return (
      <section className="fuel-reports-page vehicle-workspace-page">
        <div className="fuel-report-canvas">
          <FuelVehicleOverview mode="vehicles" stats={vehicleStats} billingRows={billingRows} selected={selected} onSelectVehicle={onSelectVehicle} month={reportMonth} year={reportYear} menuOpen={periodMenu === "fuel-month"} onToggleMonth={() => setPeriodMenu((current) => current === "fuel-month" ? "" : "fuel-month")} onSelectMonth={(month) => { setReportMonth(month); setPeriodMenu(""); }} onCloseMenu={() => setPeriodMenu("")} />
          <FuelLedgerDetail selected={selected} entries={selectedFuelStats.entries} periodLabel={selectedPeriodLabel} onOpenInvoice={(item) => setModal({ type: "invoice", item })} />
          <FleetView compact filtered={filtered} filter={filter} query={query} selected={selected} selectedDrivers={selectedDrivers} setFilter={setFilter} setQuery={setQuery} selectVehicle={selectVehicle} selectDriver={selectDriver} openWorkshop={openWorkshop} setModal={setModal} />
          <section className="vehicle-workspace-billing report-billing-stack" aria-labelledby="vehicle-workspace-billing-title">
            <header className="vehicle-workspace-section-heading">
              <div><span>Facturación</span><h2 id="vehicle-workspace-billing-title">Facturación mensual por conductor</h2><p>Ingresos, viajes y calendario diario integrados en Vehículos.</p></div>
              <strong>{formatCurrency(periodTotals.billing)}</strong>
            </header>
            <FuelIncomeReport
              rows={billingRows}
              total={periodTotals.billing}
              month={reportMonth}
              year={reportYear}
              periodMenu={periodMenu}
              selectedDriverKey={billingDriverKey}
              selectedVehiclePlate={billingVehiclePlate}
              onSelectDriver={setBillingDriverKey}
              onSelectVehicle={(plate) => setBillingVehiclePlate((current) => current === plate ? "" : plate)}
              onTogglePeriodMenu={setPeriodMenu}
              onSelectMonth={(month) => { setReportMonth(month); setPeriodMenu(""); }}
              onSelectYear={(year) => { setReportYear(year); setPeriodMenu(""); }}
            />
            {selectedBillingVehicle ? <VehicleBillingSummary vehicle={selectedBillingVehicle} rows={selectedBillingVehicleRows} month={reportMonth} year={reportYear} /> : null}
            {selectedBillingDriver ? <DriverBillingCalendar row={selectedBillingDriver} vehicle={selectedBillingDriverVehicle} month={reportMonth} year={reportYear} documents={documents} transactions={transactions} onOpenDocument={openBillingSourceDocument} onClose={() => setBillingDriverKey("")} /> : null}

          </section>
        </div>
      </section>
    );
  }

  return (
    <section className="fuel-reports-page">
      <div className="fuel-report-canvas">
        {reportTab === "General" && (
          <>
            <div className="dashboard-period-bar" role="group" aria-label="Seleccionar periodo del resumen general">
              <div className="report-chart-filters" role="group" aria-label="Mes y año del resumen general">
                <div className="report-period-dropdown">
                  <span className="sr-only">Mes</span>
                  <div className="report-period-trigger report-period-trigger--arrow-only"><span>{reportMonths[reportMonth]}</span><button type="button" className="report-period-trigger__arrow" aria-label="Seleccionar mes" title="Abrir meses" aria-haspopup="listbox" aria-expanded={periodMenu === "month"} onClick={() => setPeriodMenu((current) => current === "month" ? "" : "month")}><IconChevronDown size={13} /></button></div>
                  {periodMenu === "month" && <WheelPickerMenu options={reportMonths.map((label, index) => ({ value: index, label }))} value={reportMonth} onChange={(value) => { setReportMonth(value); setPeriodMenu(""); }} ariaLabel="Seleccionar mes" className="report-period-menu--months" />}
                </div>
                <div className="report-period-dropdown">
                  <span className="sr-only">Año</span>
                  <div className="report-period-trigger report-period-trigger--year report-period-trigger--arrow-only"><span>{reportYear}</span><button type="button" className="report-period-trigger__arrow" aria-label="Seleccionar año" title="Abrir años" aria-haspopup="listbox" aria-expanded={periodMenu === "year"} onClick={() => setPeriodMenu((current) => current === "year" ? "" : "year")}><IconChevronDown size={13} /></button></div>
                  {periodMenu === "year" && <WheelPickerMenu options={reportYears.map((year) => ({ value: year, label: String(year) }))} value={reportYear} onChange={(value) => { setReportYear(value); setPeriodMenu(""); }} ariaLabel="Seleccionar año" className="report-period-menu--years" />}
                </div>
              </div>
            </div>
            <div className="report-general-grid">
              <div className="report-stat-grid">
                <ReportFleetSummaryCard billing={formatMainAmount(periodTotals.billing)} fuel={formatMainAmount(periodTotals.fuel)} onClick={() => onNavigate(conductorNavItem)} />
                <ReportStatCard wide icon={IconTool} label="Mantenimiento" value={formatMainAmount(periodTotals.maintenance)} daily={formatMainAmount(periodTotals.maintenance / periodDays)} perKm={formatMainAmount(totalDistance > 0 ? periodTotals.maintenance / totalDistance : 0)} tone="orange" active={false} actionLabel="Abrir Mantenimiento" onClick={() => onNavigate(fleetSubItems[0])} />
                <ReportStatCard wide icon={IconCurrencyEuro} label="Neto" value={formatMainAmount(periodTotals.net)} daily={formatMainAmount(periodTotals.net / periodDays)} perKm={formatMainAmount(totalDistance > 0 ? periodTotals.net / totalDistance : 0)} tone="green" active={chartMetric === "net"} actionLabel="Abrir detalle de Neto" onClick={() => { setChartMetric("net"); setNetDetailOpen(true); }} />
              </div>
              <section className="report-chart-card report-chart-card--compact-preview report-chart-card--static">
                <header className="report-chart-card__top">
                  <div><span className={`report-chart-icon report-chart-icon--${chartMetric}`} style={{ background: chartIconBackground }}><IconChartBar size={18} /></span><span><strong className={chartMetric === "summary" ? "report-chart-title report-chart-title--summary" : "report-chart-title"}>{activeChart.title}</strong></span></div>
                </header>
                <div className="report-chart report-chart--summary">
                  {hasChartData ? <>
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeChart.data} margin={{ top: 12, right: 0, left: 0, bottom: 4 }} barCategoryGap="18%" barGap={3} onClick={(state) => { if (state?.activeLabel) setSelectedChartBar(state.activeLabel); }}>
                      {selectedChartBar && <ReferenceArea x1={selectedChartBar} x2={selectedChartBar} fill="#edf0ee" fillOpacity={0.9} stroke="none" ifOverflow="extendDomain" zIndex={-20} />}
                      <CartesianGrid stroke="#e9efed" vertical={false} />
                      <XAxis dataKey="label" interval={0} height={26} tickMargin={2} tick={<ChartAxisTick fontSize={8} fontWeight={chartMetric === "billing" ? 500 : 750} />} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 8, fill: "#87918d" }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={false} wrapperStyle={{ pointerEvents: "none", outline: "none" }} formatter={(value, name) => [formatCurrency(Number(value)), chartMetric === "summary" ? summaryMetricLabels[name] : activeChart.title]} labelFormatter={(label, payload) => payload?.[0]?.payload?.detail ? `${label} · ${payload[0].payload.detail}` : label} contentStyle={{ borderRadius: 10, borderColor: "#dce5e1", fontSize: 10 }} />
                      {(chartMetric === "net" || (chartMetric === "summary" && visibleChartMetrics.includes("net"))) && <ReferenceLine y={0} stroke="#aab5b1" />}
                      {chartMetric === "summary" ? <>
                        {visibleChartMetrics.includes("billing") && <Bar dataKey="billing" name="billing" fill={selectedChartMetrics.length === 0 ? SUMMARY_CHART_COLOR : BILLING_COLOR} maxBarSize={30} minPointSize={22} isAnimationActive={false} activeBar={false} onClick={selectChartBar}><LabelList dataKey="billing" content={<ChartBarValueLabel textFill={selectedChartMetrics.length === 0 ? "#fff" : "#123e5f"} />} /></Bar>}
                        {visibleChartMetrics.includes("maintenance") && <Bar dataKey="maintenance" name="maintenance" fill={MAINTENANCE_COLOR} maxBarSize={30} minPointSize={22} isAnimationActive={false} activeBar={false} onClick={selectChartBar}><LabelList dataKey="maintenance" content={<ChartBarValueLabel />} /></Bar>}
                        {visibleChartMetrics.includes("fuel") && <Bar dataKey="fuel" name="fuel" fill="#df4538" maxBarSize={30} minPointSize={22} isAnimationActive={false} activeBar={false} onClick={selectChartBar}><LabelList dataKey="fuel" content={<ChartBarValueLabel />} /></Bar>}
                        {visibleChartMetrics.includes("net") && <Bar dataKey="net" name="net" fill="#28923c" radius={[5, 5, 0, 0]} maxBarSize={30} minPointSize={22} isAnimationActive={false} activeBar={false} onClick={selectChartBar}><LabelList dataKey="net" content={<ChartBarValueLabel />} /></Bar>}
                      </> : <Bar dataKey="value" name={activeChart.title} fill={activeChart.color} radius={[5, 5, 0, 0]} maxBarSize={76} minPointSize={10} isAnimationActive={false} activeBar={false} onClick={selectChartBar}>
                        <LabelList dataKey="value" content={<ChartBarValueLabel textFill={chartMetric === "billing" ? "#123e5f" : "#fff"} />} />
                        {activeChart.data.map((entry) => <Cell key={`${chartMetric}-${entry.label}`} fill={chartMetric === "net" && entry.value < 0 ? "#df4538" : activeChart.color} />)}
                      </Bar>}
                    </BarChart>
                    </ResponsiveContainer>
                    <div className="report-chart-legend" aria-label="Seleccionar métricas del resumen general">
                      {selectableChartMetrics.map((option) => {
                        const active = visibleChartMetrics.includes(option.value);
                        return <button type="button" className={`report-chart-legend__button report-chart-legend__button--${option.value}${active ? " report-chart-legend__button--active" : ""}`} aria-pressed={active} aria-label={`${active ? "Ocultar" : "Mostrar"} ${option.label}`} onClick={(event) => toggleLegendMetric(event, option.value)} key={option.value}>
                          <i className={`report-chart-legend__swatch report-chart-legend__swatch--${option.value}`} aria-hidden="true" /><span>{option.label}</span>
                        </button>;
                      })}
                    </div>
                  </> : <><div className="report-chart-empty"><IconChartBar size={24} /><strong>Sin datos en este periodo</strong><span>No hay movimientos de {activeChart.title.toLocaleLowerCase("es")} en {selectedPeriodLabel.toLocaleLowerCase("es")}.</span></div><div className="report-chart-legend report-chart-legend--placeholder" aria-hidden="true" /></>}
                </div>
              </section>
              {netDetailOpen && <NetDetailModal details={netVehicleDetails} historicalBillingRows={historicalBillingRows} periodKey={netPeriodKey} periodLabel={selectedPeriodLabel} reportMonth={reportMonth} reportYear={reportYear} onSelectMonth={(month) => { setReportMonth(month); setPeriodMenu(""); }} onSelectYear={(year) => { setReportYear(year); setPeriodMenu(""); }} commissionReports={commissionReports} commissionReportBusy={commissionReportBusy} commissionReportMessage={commissionReportMessage} onSaveAlexPayroll={handleSaveAlexPayroll} onGenerateAlexReport={handleGenerateAlexReport} onDownloadCommissionReport={handleDownloadCommissionReport} onAddExpense={(expense) => setManualNetExpenses((current) => [...current, { ...expense, id: `manual-${Date.now()}-${current.length}`, periodKey: netPeriodKey }])} onRemoveExpense={(ids) => setManualNetExpenses((current) => { const idsToRemove = new Set(Array.isArray(ids) ? ids : [ids]); return current.filter((expense) => !idsToRemove.has(expense.id)); })} onSaveBreakdown={(breakdown) => setManualNetBreakdowns((current) => { const next = current.filter((candidate) => !(candidate.periodKey === netPeriodKey && candidate.plate === breakdown.plate && candidate.expenseKey === breakdown.expenseKey && candidate.breakdownKey === breakdown.breakdownKey)); return [...next, { ...breakdown, id: `breakdown-${Date.now()}-${current.length}`, periodKey: netPeriodKey }]; })} onClose={() => setNetDetailOpen(false)} />}
            </div>
          </>
        )}

        {reportTab === "Repostaje" && (
          <>
            <FuelVehicleOverview stats={vehicleStats} selected={selected} onSelectVehicle={onSelectVehicle} month={reportMonth} year={reportYear} menuOpen={periodMenu === "fuel-month"} onToggleMonth={() => setPeriodMenu((current) => current === "fuel-month" ? "" : "fuel-month")} onSelectMonth={(month) => { setReportMonth(month); setPeriodMenu(""); }} onCloseMenu={() => setPeriodMenu("")} />
            <FuelLedgerDetail selected={selected} entries={selectedFuelStats.entries} periodLabel={selectedPeriodLabel} onOpenInvoice={(item) => setModal({ type: "invoice", item })} />
          </>
        )}

        {reportTab === "Gasto" && <FuelExpenseReport stats={vehicleStats} total={totals.cost} />}
        {reportTab === "Facturación" && <div className="report-billing-stack">
          <FuelIncomeReport
            rows={billingRows}
            total={periodTotals.billing}
            month={reportMonth}
            year={reportYear}
            periodMenu={periodMenu}
            selectedDriverKey={billingDriverKey}
            selectedVehiclePlate={billingVehiclePlate}
            onSelectDriver={setBillingDriverKey}
            onSelectVehicle={(plate) => setBillingVehiclePlate((current) => current === plate ? "" : plate)}
            onTogglePeriodMenu={setPeriodMenu}
            onSelectMonth={(month) => { setReportMonth(month); setPeriodMenu(""); }}
            onSelectYear={(year) => { setReportYear(year); setPeriodMenu(""); }}
          />
          {selectedBillingVehicle ? <VehicleBillingSummary vehicle={selectedBillingVehicle} rows={selectedBillingVehicleRows} month={reportMonth} year={reportYear} /> : null}
          {selectedBillingDriver ? <DriverBillingCalendar row={selectedBillingDriver} vehicle={selectedBillingDriverVehicle} month={reportMonth} year={reportYear} documents={documents} transactions={transactions} onOpenDocument={openBillingSourceDocument} onClose={() => setBillingDriverKey("")} /> : null}
          <FuelDriversReport vehicles={vehicles} selectedDriverKey={billingDriverKey} onSelectDriver={setBillingDriverKey} />
        </div>}
      </div>
    </section>
  );
}

function ReportFleetSummaryCard({ billing, fuel, onClick }) {
  return (
    <button type="button" className="report-stat-card report-stat-card--wide report-stat-card--drivers" onClick={onClick} aria-label="Abrir Conductores, Facturación y Consumo">
      <span className="report-stat-card__header">
        <span className="report-stat-card__icon"><IconUsers size={18} /></span>
        <strong>CONDUCTORES</strong>
      </span>
      <span className="report-stat-card__inline-metrics">
        <span><small>Facturación</small><strong>{billing}</strong></span>
        <span><small>Consumo</small><strong>{fuel}</strong></span>
      </span>
    </button>
  );
}

function ReportStatCard({ wide = false, icon: Icon, label, value, daily, perKm, tone, active, actionLabel, onClick }) {
  return (
    <button type="button" className={`report-stat-card report-stat-card--${tone}${wide ? " report-stat-card--wide" : ""}${active ? " report-stat-card--active" : ""}`} onClick={onClick} aria-label={actionLabel ?? `Mostrar gráfico de ${label}`} aria-pressed={active}>
      <span className="report-stat-card__header"><span className="report-stat-card__icon"><Icon size={18} /></span><strong>{wide ? label.toLocaleUpperCase("es") : label}</strong></span>
      {wide ? <span className="report-stat-card__inline-metrics">
        <span><small>Total</small><strong>{value}</strong></span>
        <span><small>Por día</small><strong>{daily}</strong></span>
        <span><small>Por km</small><strong>{perKm}</strong></span>
      </span> : <>
        <small>Total</small>
        <strong className="report-stat-value">{value}</strong>
        <span className="report-stat-card__footer"><span><small>Por día</small><strong>{daily}</strong></span><span><small>Por km</small><strong>{perKm}</strong></span></span>
      </>}
    </button>
  );
}

function FuelVehicleOverview({ stats, billingRows = [], selected, onSelectVehicle, month, year, menuOpen, onToggleMonth, onSelectMonth, onCloseMenu, mode = "fuel" }) {
  const unified = mode === "vehicles";
  const periodLabel = `${reportMonths[month]} ${year}`;
  return (
    <section className="content-card fuel-overview report-section-card">
      <header className="card-header">
        <div><h2>{unified ? "Vehículos" : "Consumo mensual por vehículo"}</h2><p>{unified ? "Flota, facturación y consumo mensual reunidos en una sola vista." : "Selecciona un coche para consultar sus datos."}</p></div>
        <div className="report-period-dropdown fuel-period-dropdown" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) onCloseMenu(); }}>
          <span>Mes</span>
          <button type="button" className="report-period-trigger fuel-period-trigger" aria-haspopup="listbox" aria-expanded={menuOpen} onClick={onToggleMonth}><IconCalendar size={14} /><span>{reportMonths[month]}</span><IconChevronDown size={13} /></button>
          {menuOpen && <div className="report-period-menu report-period-menu--months report-period-menu--wheel" role="listbox" aria-label={`Seleccionar mes de ${unified ? "Vehículos" : "Combustible"}`}>{reportMonths.map((monthLabel, index) => <button type="button" role="option" aria-selected={month === index} className={month === index ? "selected" : ""} onClick={() => onSelectMonth(index)} key={monthLabel}>{monthLabel}{month === index && <IconCheck size={12} />}</button>)}</div>}
          <small>{periodLabel}</small>
        </div>
      </header>
      <nav className="fuel-vehicle-banners" aria-label={unified ? `Vehículos de la flota en ${periodLabel.toLocaleLowerCase("es")}` : `Vehículos con consumo de ${periodLabel.toLocaleLowerCase("es")}`}>
        {stats.map(({ vehicle, liters, cost, refuels }, index) => {
          const active = selected.plate === vehicle.plate;
          const brand = getVehicleBrand(vehicle);
          const monthlyBilling = billingRows.filter((row) => row.plate === vehicle.plate).reduce((sum, row) => sum + row.revenue, 0);
          const serviceRemaining = vehicle.nextServiceKm - vehicle.odometer;
          return (
            <div className={`fuel-vehicle-entry${active ? " fuel-vehicle-entry--active" : ""}`} key={vehicle.plate}>
              <button className={`fuel-vehicle-banner${unified ? " fuel-vehicle-banner--unified" : ""} ${active ? "active" : ""}`} onClick={() => onSelectVehicle(vehicle)} aria-pressed={active} aria-label={`${unified ? "Ver detalle de" : "Ver repostajes de"} ${vehicle.plate}, ${vehicle.model}`}>
              <span className="fuel-vehicle-number">{index + 1}</span>
              <span className={`vehicle-brand-mark vehicle-brand-mark--${brand.toLocaleLowerCase("es")}`}><img src={vehicleBrandLogos[brand]} alt={`Logotipo de ${brand}`} /></span>
              <span className="fuel-vehicle-identity"><small>{brand}</small><VehiclePlateLabel vehicleOrPlate={vehicle} className="fuel-vehicle-plate" /><span>{vehicle.model}</span></span>
              <span className="fuel-vehicle-type"><UseBadge value={vehicle.use} /></span>
              {unified ? <span className="fuel-vehicle-summary">
                <span><small>Facturación mensual</small><strong>{formatCurrency(monthlyBilling)}</strong><span>{vehicle.use === "Profesional" ? "2 conductores" : "Sin actividad comercial"}</span></span>
                <span><small>Km totales</small><strong>{formatKm(vehicle.odometer)}</strong><span>{formatKm(serviceRemaining)} para revisión</span></span>
                <span><small>Consumo · {reportMonths[month]}</small><strong>{liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</strong><span>{formatCurrency(cost)} · {refuels} repostajes</span></span>
              </span> : <span className="fuel-vehicle-consumption"><small>Consumo · {reportMonths[month]}</small><strong>{liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</strong><span>{formatCurrency(cost)} · {refuels} repostajes</span></span>}
              <IconChevronRight className="fuel-vehicle-chevron" size={21} />
              </button>
              {unified && active && vehicle.use === "Profesional" && <div className="fuel-vehicle-driver-row" aria-label={`Conductores de ${vehicle.plate}`}><small>Conductores</small>{vehicle.drivers.map((driver) => <span className="fuel-vehicle-driver-chip" key={driver}>{driver}</span>)}</div>}
            </div>
          );
        })}
        {unified && <div className="fuel-vehicle-banners__divider" aria-hidden="true" />}
      </nav>
    </section>
  );
}

function FuelLedgerDetail({ selected, entries, periodLabel, onOpenInvoice }) {
  const selectedEntries = [...(entries ?? [])].sort((a, b) => getFuelEntryDateValue(b) - getFuelEntryDateValue(a));
  const selectedLiters = selectedEntries.reduce((sum, entry) => sum + (entry.liters ?? 0), 0);
  const selectedCost = selectedEntries.reduce((sum, entry) => sum + (entry.cost ?? 0), 0);
  const selectedBrand = getVehicleBrand(selected);
  return (
    <section className="content-card fuel-detail report-section-card">
      <header className="fuel-detail__header">
        <div className="fuel-detail__identity"><span className={`vehicle-brand-mark vehicle-brand-mark--${selectedBrand.toLocaleLowerCase("es")}`}><img src={vehicleBrandLogos[selectedBrand]} alt={`Logotipo de ${selectedBrand}`} /></span><span><small>Vehículo seleccionado</small><VehiclePlateLabel vehicleOrPlate={selected} className="fuel-detail__plate" /><small>{selected.model}</small></span></div>
        <div className="fuel-detail__totals"><span><small>Consumo mensual</small><strong>{selectedLiters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</strong></span><span><small>Gasto mensual</small><strong>{formatCurrency(selectedCost)}</strong></span></div>
      </header>
      {selected.fuelSchedule?.length > 0 ? (
        <div className="fuel-page-schedule" aria-label={`Horarios de los conductores de ${selected.plate}`}><span className="fuel-page-schedule__label"><IconClock size={16} /><strong>Asignación por horario</strong></span>{selected.fuelSchedule.map((shift) => <span className="fuel-page-shift" key={shift.label}><strong>{shift.driver}</strong><small>{shift.label}</small></span>)}</div>
      ) : (
        <div className="fuel-page-schedule fuel-page-schedule--manual"><span className="fuel-page-schedule__label"><IconUsers size={16} /><strong>Asignación manual</strong></span><small>Los conductores particulares se indican en cada registro.</small></div>
      )}
      <div className="fuel-ledger-period"><span><strong>Repostajes de {periodLabel}</strong><small>Ordenados del más reciente al más antiguo</small></span><strong>{selectedEntries.length} registros</strong></div>
      <div className="fuel-page-table-wrap">
        <table className="fuel-page-table">
          <caption className="sr-only">Repostajes diarios de {periodLabel.toLocaleLowerCase("es")} para {selected.plate}</caption>
          <thead><tr><th scope="col">Fecha</th><th scope="col">Hora</th><th scope="col">Conductor</th><th scope="col">Importe</th><th scope="col">Precio/Litro</th><th scope="col">Factura</th></tr></thead>
          <tbody>{selectedEntries.map((entry, index) => {
            const assignment = getFuelAssignment(selected, entry);
            const pricePerLiter = entry.costPerUnit || (entry.liters ? entry.cost / entry.liters : 0);
            const sourceDocument = entry.sourceDocument;
            const invoice = {
              id: entry.ticketNumber || `REP-${selected.plate.replace(/\s/g, "")}-${String(index + 1).padStart(2, "0")}`,
              kind: "fuel",
              provider: entry.provider,
              date: formatDocumentDisplayDate(entry.date),
              plate: selected.plate,
              driver: assignment.driver,
              concept: `Repostaje de ${entry.liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L`,
              liters: entry.liters,
              pricePerLiter,
              amount: entry.cost,
              source: sourceDocument ? "Ticket subido por el conductor" : "Registro de combustible",
              status: sourceDocument?.status === "approved" ? "Validada" : sourceDocument ? "Revisar" : "Sin justificante",
              sourceDocumentId: entry.sourceDocumentId,
              filePath: sourceDocument?.file_path ?? "",
              fileName: sourceDocument?.file_name ?? "",
              mimeType: sourceDocument?.mime_type ?? "",
            };
            return <tr key={entry.id || `${entry.date}-${entry.time}`}><td><strong>{formatDocumentDisplayDate(entry.date)}</strong></td><td><strong>{entry.time || "—"}</strong></td><td><span className="fuel-driver"><IconUsers size={14} /><strong>{assignment.driver}</strong></span></td><td><strong>{formatCurrency(entry.cost)}</strong></td><td>{formatCurrency(pricePerLiter)}</td><td>{sourceDocument ? <button type="button" className="fuel-invoice-button" onClick={() => onOpenInvoice(invoice)} aria-label={`Ver ticket de gasolina de ${selected.plate} del ${formatDocumentDisplayDate(entry.date)}`}><IconFileInvoice size={14} />Ver ticket</button> : <span className="fuel-invoice-missing">Sin ticket</span>}</td></tr>;
          })}</tbody>
        </table>
      </div>
      <footer className="fuel-detail__footer"><IconSparkles size={15} /><span>Cada importe procede del registro central. Cuando existe justificante, «Ver ticket» abre la imagen o PDF privado que subió el conductor.</span></footer>
    </section>
  );
}

function FuelExpenseReport({ stats, total }) {
  return (
    <section className="content-card report-table-card">
      <header className="card-header"><div><h2>Gasto de combustible</h2><p>Acumulado mensual de los cinco vehículos.</p></div><strong className="report-header-total">{formatCurrency(total)}</strong></header>
      <div className="table-scroll"><table className="module-table report-table"><thead><tr><th>Vehículo</th><th>Repostajes</th><th>Litros</th><th>Coste medio</th><th>Gasto mensual</th></tr></thead><tbody>{stats.map(({ vehicle, refuels, liters, cost }) => <tr key={vehicle.plate}><td><VehiclePlateLabel vehicleOrPlate={vehicle} className="report-vehicle-plate" /><small>{vehicle.model}</small></td><td>{refuels}</td><td>{liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</td><td>{formatCurrency(refuels ? cost / refuels : 0)}</td><td><strong>{formatCurrency(cost)}</strong></td></tr>)}</tbody></table></div>
    </section>
  );
}

function FuelIncomeReport({ rows, total, month, year, periodMenu, selectedDriverKey, selectedVehiclePlate, onSelectDriver, onSelectVehicle, onTogglePeriodMenu, onSelectMonth, onSelectYear }) {
  return (
    <section className="content-card report-table-card">
      <header className="card-header billing-report-header">
        <div className="billing-report-heading"><h2>Facturación</h2></div>
        <div className="billing-report-header__actions">
          <div className="report-chart-filters billing-period-filters" role="group" aria-label="Periodo de Facturación">
            <div className="report-period-dropdown" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) onTogglePeriodMenu(""); }}>
              <span>Mes</span>
              <button type="button" className="report-period-trigger" aria-haspopup="listbox" aria-expanded={periodMenu === "billing-month"} onClick={() => onTogglePeriodMenu(periodMenu === "billing-month" ? "" : "billing-month")}><span>{reportMonths[month]}</span><IconChevronDown size={13} /></button>
              {periodMenu === "billing-month" ? <div className="report-period-menu report-period-menu--months report-period-menu--wheel" role="listbox" aria-label="Seleccionar mes de Facturación">{reportMonths.map((monthLabel, index) => <button type="button" role="option" aria-selected={month === index} className={month === index ? "selected" : ""} onClick={() => onSelectMonth(index)} key={monthLabel}>{monthLabel}{month === index ? <IconCheck size={12} /> : null}</button>)}</div> : null}
            </div>
            <div className="report-period-dropdown" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) onTogglePeriodMenu(""); }}>
              <span>Año</span>
              <button type="button" className="report-period-trigger report-period-trigger--year" aria-haspopup="listbox" aria-expanded={periodMenu === "billing-year"} onClick={() => onTogglePeriodMenu(periodMenu === "billing-year" ? "" : "billing-year")}><span>{year}</span><IconChevronDown size={13} /></button>
              {periodMenu === "billing-year" ? <div className="report-period-menu report-period-menu--years report-period-menu--wheel" role="listbox" aria-label="Seleccionar año de Facturación">{reportYears.map((yearOption) => <button type="button" role="option" aria-selected={year === yearOption} className={year === yearOption ? "selected" : ""} onClick={() => onSelectYear(yearOption)} key={yearOption}>{yearOption}{year === yearOption ? <IconCheck size={12} /> : null}</button>)}</div> : null}
            </div>
          </div>
          <strong className="report-header-total report-header-total--green">{formatCurrency(total)}</strong>
        </div>
      </header>
      <div className="table-scroll report-income-table-wrap">
        <table className="module-table report-table report-income-table">
          <caption className="sr-only">Ingresos mensuales, viajes y vehículo asignado por conductor</caption>
          <colgroup><col className="report-income-table__driver" /><col className="report-income-table__vehicle" /><col className="report-income-table__trips" /><col className="report-income-table__revenue" /></colgroup>
          <thead><tr><th scope="col">Conductor</th><th scope="col">Vehículo</th><th scope="col">Viajes</th><th scope="col">Ingreso mensual</th></tr></thead>
          <tbody>{rows.map((row) => <tr className={`${selectedDriverKey === row.key ? "report-income-row--selected " : ""}${selectedVehiclePlate === row.plate ? "report-income-row--vehicle-selected" : ""}`} key={row.key}><td><button type="button" className="report-income-driver-button" onClick={() => onSelectDriver(row.key)} aria-expanded={selectedDriverKey === row.key} aria-controls="driver-billing-calendar"><span>{row.driver}</span><small>Ver calendario</small></button></td><td><button type="button" className="report-income-vehicle-button" onClick={() => onSelectVehicle(row.plate)} aria-expanded={selectedVehiclePlate === row.plate} aria-controls="vehicle-billing-summary" aria-label={`Ver facturación conjunta de ${row.plate}`}><VehiclePlateLabel vehicleOrPlate={row.plate} className="report-income-vehicle-plate" /><small>{row.model}</small></button></td><td><strong>{row.trips}</strong></td><td><strong>{formatCurrency(row.revenue)}</strong></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

function VehicleBillingSummary({ vehicle, rows, month, year }) {
  const total = rows.reduce((sum, row) => sum + row.revenue, 0);
  return (
    <section className="content-card vehicle-billing-summary" id="vehicle-billing-summary" aria-labelledby="vehicle-billing-summary-title">
      <header className="vehicle-billing-summary__header">
        <div><span className="vehicle-billing-summary__label"><IconCar size={15} />Facturación conjunta</span><h3 id="vehicle-billing-summary-title"><VehiclePlateLabel vehicleOrPlate={vehicle} className="vehicle-billing-summary__plate" /></h3><small>{vehicle.model} · {reportMonths[month]} {year}</small></div>
        <strong>{formatCurrency(total)}</strong>
      </header>
      <div className="vehicle-billing-summary__drivers">
        {rows.map((row) => <div key={row.key}><span><strong>{row.driver}</strong><small>{row.trips} viajes</small></span><strong>{formatCurrency(row.revenue)}</strong></div>)}
      </div>
    </section>
  );
}

function DriverBillingCalendar({ row, vehicle, month, year, documents = [], transactions = [], onOpenDocument, onClose }) {
  const calendarVehicle = vehicle ?? { plate: row.plate, model: row.model, drivers: [row.driver], fuelSchedule: [], monthlyFuel: [] };
  const calendarRows = getDriverCalendarRows(calendarVehicle, row, month, year, documents, transactions);
  const billingDays = new Map(calendarRows.filter((day) => day.billing > 0).map((day) => [day.day, day.billing]));
  const billingDocumentsByDay = new Map(calendarRows
    .map((day) => [day.day, day.documents.filter((document) => getDriverDocumentKind(document) === "billing")])
    .filter(([, dayDocuments]) => dayDocuments.length > 0));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = (new Date(year, month, 1).getDay() + 6) % 7;
  const calendarCells = [
    ...Array.from({ length: leadingDays }, (_, index) => ({ key: `leading-${index}`, empty: true })),
    ...Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1 })),
  ];

  return (
    <section className="content-card driver-billing-calendar" id="driver-billing-calendar" aria-labelledby="driver-billing-calendar-title">
      <header className="driver-billing-calendar__header">
        <div className="driver-billing-calendar__identity">
          <span className="avatar report-driver-avatar">{row.driver.slice(0, 2).toUpperCase()}</span>
          <span><strong id="driver-billing-calendar-title">{row.driver}</strong><VehiclePlateLabel vehicleOrPlate={row.plate} className="driver-billing-calendar__plate" /><small>{row.model}</small></span>
        </div>
        <div className="driver-billing-calendar__summary"><span><small>{reportMonths[month]} {year}</small><strong>{formatCurrency(row.revenue)}</strong></span><button type="button" onClick={onClose} aria-label={`Cerrar calendario de ${row.driver}`}><IconX size={17} /></button></div>
      </header>
      <div className="driver-billing-calendar__weekdays" aria-hidden="true">{calendarWeekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}</div>
      <div className="driver-billing-calendar__grid" role="grid" aria-label={`Facturación diaria de ${row.driver} en ${reportMonths[month]} de ${year}`}>
        {calendarCells.map((cell) => cell.empty
          ? <span className="driver-billing-day driver-billing-day--empty" aria-hidden="true" key={cell.key} />
          : (() => {
            const dayDocuments = billingDocumentsByDay.get(cell.day) ?? [];
            const hasBilling = billingDays.has(cell.day);
            return <div className={`driver-billing-day${hasBilling ? " driver-billing-day--active" : ""}${dayDocuments.length ? " driver-billing-day--documented" : ""}`} role="gridcell" aria-label={`${cell.day} de ${reportMonths[month]}: ${hasBilling ? formatCurrency(billingDays.get(cell.day)) : "sin facturación"}${dayDocuments.length ? `, ${dayDocuments.length} foto${dayDocuments.length === 1 ? "" : "s"} original${dayDocuments.length === 1 ? "" : "es"}` : ""}`} key={cell.key}><span>{cell.day}</span>{hasBilling ? <strong>{formatCurrency(billingDays.get(cell.day))}</strong> : <small>—</small>}{dayDocuments.length > 0 && onOpenDocument && <div className="driver-billing-day__documents" aria-label={`Fotos originales de ${cell.day} de ${reportMonths[month]}`}>{dayDocuments.map((document, index) => <button type="button" key={document.id} onClick={(event) => { event.stopPropagation(); onOpenDocument(document); }} aria-label={`Abrir foto original de Facturación ${index + 1}`} title={`Abrir foto original · ${document.file_name || "Documento"}`}><IconCamera size={11} /><span aria-hidden="true">{dayDocuments.length > 1 ? index + 1 : "Foto"}</span></button>)}</div>}</div>;
          })())}
      </div>
      <footer className="driver-billing-calendar__footer"><span><strong>{billingDays.size}</strong> días con facturación</span><span>Total del mes <strong>{formatCurrency(row.revenue)}</strong></span></footer>
    </section>
  );
}

function FuelDriversReport({ vehicles, selectedDriverKey, onSelectDriver }) {
  const professional = vehicles.filter((vehicle) => vehicle.use === "Profesional");
  return (
    <section className="report-drivers-grid" aria-label="Conductores y turnos profesionales">
      {professional.map((vehicle) => <article className="report-driver-vehicle" key={vehicle.plate}><header><span><IconCar size={18} /></span><div><VehiclePlateLabel vehicleOrPlate={vehicle} className="report-driver-vehicle__plate" /><small>{vehicle.model}</small></div></header><div>{vehicle.fuelSchedule.map((shift) => {
        const driverKey = `${vehicle.plate}-${shift.driver}`;
        return <button type="button" className={selectedDriverKey === driverKey ? "report-driver-shift report-driver-shift--selected" : "report-driver-shift"} onClick={() => onSelectDriver(driverKey)} aria-expanded={selectedDriverKey === driverKey} aria-controls="driver-billing-calendar" key={shift.label}><span className="avatar report-driver-avatar">{shift.driver.slice(0, 2).toUpperCase()}</span><span><strong>{shift.driver}</strong><small>{shift.label}</small></span><IconClock size={16} /></button>;
      })}</div></article>)}
    </section>
  );
}

function DriversView({ vehicles, driverEntries = [], transactions = [], documents = [], setModal, onSaveDriverDay, onDeleteDriverDocument, reportMonth: controlledReportMonth, reportYear: controlledReportYear, onReportMonthChange, onReportYearChange }) {
  const [internalReportMonth, setInternalReportMonth] = useState(() => new Date().getMonth());
  const [internalReportYear, setInternalReportYear] = useState(() => new Date().getFullYear());
  const reportMonth = controlledReportMonth ?? internalReportMonth;
  const reportYear = controlledReportYear ?? internalReportYear;
  const setReportMonth = onReportMonthChange ?? setInternalReportMonth;
  const setReportYear = onReportYearChange ?? setInternalReportYear;
  const [selectedDriverKey, setSelectedDriverKey] = useState("");
  const [selectedDay, setSelectedDay] = useState(null);
  const [calendarSwipeOffset, setCalendarSwipeOffset] = useState(0);
  const [calendarSwipeTransition, setCalendarSwipeTransition] = useState(false);
  const driverGridRef = useRef(null);
  const calendarSurfaceRef = useRef(null);
  const calendarTrackRef = useRef(null);
  const touchStartX = useRef(null);
  const calendarSwipeWidth = useRef(0);
  const pendingCalendarShift = useRef(0);
  const swipeResetTimer = useRef(null);
  const professionalVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.use === "Profesional"), [vehicles]);
  const periodFactor = getReportPeriodFactor(reportMonth, reportYear);
  const billingRows = useMemo(() => getDriverBillingRows(professionalVehicles, driverEntries, reportMonth, reportYear, documents), [professionalVehicles, driverEntries, reportMonth, reportYear, documents]);
  const fuelSummaries = useMemo(() => professionalVehicles.map((vehicle) => {
    const entries = transactions.filter((transaction) => {
      if (transaction.type !== "fuel" || transaction.vehicle_plate !== vehicle.plate) return false;
      const date = new Date(`${transaction.occurred_on}T12:00:00`);
      return date.getFullYear() === reportYear && date.getMonth() === reportMonth;
    }).map((transaction) => ({
      driverId: transaction.driver_id,
      date: transaction.occurred_on,
      liters: Number(transaction.metadata?.liters) || 0,
      cost: Number(transaction.amount) || 0,
    }));
    return {
      vehicle,
      liters: entries.reduce((sum, entry) => sum + entry.liters, 0),
      cost: entries.reduce((sum, entry) => sum + entry.cost, 0),
      refuels: entries.length,
    };
  }), [professionalVehicles, reportMonth, reportYear, transactions]);
  const driverRows = useMemo(() => billingRows.map((row) => {
    const vehicle = professionalVehicles.find((candidate) => candidate.plate === row.plate);
    const fuelEntries = transactions.filter((transaction) => {
      if (transaction.type !== "fuel" || transaction.driver_id !== row.driverId) return false;
      const date = new Date(`${transaction.occurred_on}T12:00:00`);
      return date.getFullYear() === reportYear && date.getMonth() === reportMonth;
    }).map((transaction) => ({ id: transaction.id, transactionId: transaction.id, sourceDocumentId: transaction.source_document_id, date: transaction.occurred_on, time: transaction.metadata?.time || "", liters: Number(transaction.metadata?.liters) || 0, cost: Number(transaction.amount) || 0 }));
    return {
      ...row,
      vehicle,
      fuelEntries,
      fuelLiters: fuelEntries.reduce((sum, entry) => sum + entry.liters, 0),
      fuelCost: fuelEntries.reduce((sum, entry) => sum + entry.cost, 0),
    };
  }), [billingRows, professionalVehicles, reportMonth, reportYear, transactions]);
  const selectedDriver = driverRows.find((row) => row.key === selectedDriverKey) ?? null;
  const calendarRows = useMemo(() => selectedDriver ? getDriverCalendarRows(selectedDriver.vehicle, selectedDriver, reportMonth, reportYear, documents, transactions) : [], [selectedDriver, reportMonth, reportYear, documents, transactions]);
  const periodKilometres = useMemo(() => calendarRows.reduce((sum, day) => sum + (Number(day.km) || 0), 0), [calendarRows]);
  const selectedDayDetail = calendarRows.find((row) => row.day === selectedDay) ?? null;
  const calendarPeriods = useMemo(() => {
    if (!selectedDriver) return [];
    return [-1, 0, 1].map((delta) => {
      const date = new Date(reportYear, reportMonth + delta, 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      const rows = getDriverCalendarRows(selectedDriver.vehicle, selectedDriver, month, year, documents, transactions);
      const leadingDays = (new Date(year, month, 1).getDay() + 6) % 7;
      return {
        key: `${year}-${month}`,
        delta,
        month,
        year,
        cells: [...Array.from({ length: leadingDays }, (_, index) => ({ key: `leading-${year}-${month}-${index}`, empty: true })), ...rows.map((row) => ({ ...row, key: `day-${year}-${month}-${row.day}` }))],
      };
    });
  }, [selectedDriver, reportMonth, reportYear, documents, transactions]);
  const totalBilling = billingRows.reduce((sum, row) => sum + row.revenue, 0);
  const totalFuel = fuelSummaries.reduce((sum, summary) => sum + summary.cost, 0);

  useEffect(() => {
    if (!selectedDriver) {
      setSelectedDay(null);
      return;
    }
    setSelectedDay((current) => current && calendarRows.some((row) => row.day === current)
      ? current
      : calendarRows.find((row) => row.active)?.day ?? 1);
  }, [selectedDriver?.key, reportMonth, reportYear]);

  useEffect(() => () => {
    if (swipeResetTimer.current) window.clearTimeout(swipeResetTimer.current);
  }, []);

  const selectDriver = (row) => {
    setSelectedDriverKey(row.key);
    const nextCalendarRows = getDriverCalendarRows(row.vehicle, row, reportMonth, reportYear, documents, transactions);
    setSelectedDay(nextCalendarRows.find((calendarRow) => calendarRow.active)?.day ?? 1);
  };
  const shiftMonth = (delta) => {
    const next = new Date(reportYear, reportMonth + delta, 1);
    setReportMonth(next.getMonth());
    setReportYear(next.getFullYear());
    setSelectedDay(null);
  };
  const setCalendarTrackOffset = (offset) => {
    calendarTrackRef.current?.style.setProperty("--calendar-swipe-offset", `${offset}px`);
  };
  const getCalendarSwipeWidth = () => {
    const width = calendarSurfaceRef.current?.clientWidth ?? 360;
    calendarSwipeWidth.current = width;
    return width;
  };
  const beginCalendarSwipe = (clientX) => {
    touchStartX.current = clientX ?? null;
    getCalendarSwipeWidth();
    pendingCalendarShift.current = 0;
    if (swipeResetTimer.current) window.clearTimeout(swipeResetTimer.current);
    setCalendarTrackOffset(0);
    setCalendarSwipeTransition(false);
    setCalendarSwipeOffset(0);
  };
  const moveCalendarSwipe = (clientX) => {
    if (touchStartX.current === null) return;
    const delta = (clientX ?? touchStartX.current) - touchStartX.current;
    const width = calendarSwipeWidth.current || 360;
    setCalendarTrackOffset(Math.max(-width, Math.min(width, delta)));
  };
  const settleCalendarSwipe = () => {
    if (swipeResetTimer.current) {
      window.clearTimeout(swipeResetTimer.current);
      swipeResetTimer.current = null;
    }
    const delta = pendingCalendarShift.current;
    pendingCalendarShift.current = 0;
    if (delta) shiftMonth(delta);
    setCalendarSwipeOffset(0);
    setCalendarSwipeTransition(false);
    setCalendarTrackOffset(0);
  };
  const endCalendarSwipe = (clientX) => {
    if (touchStartX.current === null) return;
    const delta = (clientX ?? touchStartX.current) - touchStartX.current;
    const width = calendarSwipeWidth.current || 360;
    touchStartX.current = null;
    if (Math.abs(delta) >= Math.min(80, Math.max(46, width * .14))) {
      pendingCalendarShift.current = delta < 0 ? 1 : -1;
      setCalendarSwipeTransition(true);
      setCalendarSwipeOffset(delta < 0 ? -width : width);
      setCalendarTrackOffset(delta < 0 ? -width : width);
      swipeResetTimer.current = window.setTimeout(settleCalendarSwipe, 380);
      return;
    }
    setCalendarSwipeTransition(true);
    setCalendarSwipeOffset(0);
    setCalendarTrackOffset(0);
  };
  const onCalendarPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (pendingCalendarShift.current) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    beginCalendarSwipe(event.clientX);
  };
  const onCalendarPointerMove = (event) => moveCalendarSwipe(event.clientX);
  const onCalendarPointerUp = (event) => endCalendarSwipe(event.clientX);
  const onCalendarPointerCancel = () => {
    touchStartX.current = null;
    pendingCalendarShift.current = 0;
    if (swipeResetTimer.current) window.clearTimeout(swipeResetTimer.current);
    setCalendarSwipeTransition(true);
    setCalendarSwipeOffset(0);
    setCalendarTrackOffset(0);
  };
  const onCalendarTrackTransitionEnd = (event) => {
    if (event.propertyName !== "transform") return;
    settleCalendarSwipe();
  };
  const scrollToDrivers = () => driverGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const openFuelInvoice = (entry, index) => {
    if (entry.sourceDocument) {
      openDriverSourceDocument(entry.sourceDocument);
      return;
    }
    const pricePerLiter = entry.liters ? entry.cost / entry.liters : 0;
    setModal({
      type: "invoice",
      item: {
        id: `PLG-${selectedDriver.plate.replace(/\s/g, "")}-${selectedDriver.driver.replace(/\s/g, "")}-${index + 1}`,
        provider: "Plenergy",
        date: entry.date,
        plate: selectedDriver.plate,
        driver: selectedDriver.driver,
        concept: `Repostaje de ${entry.liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L`,
        liters: entry.liters,
        pricePerLiter,
        amount: entry.cost,
        source: "Cuenta Plenergy",
        status: "Descargada",
      },
    });
  };
  const openDriverSourceDocument = (document) => {
    const fallbackDate = `${reportYear}-${String(reportMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    setModal({
      type: "driver-document",
      item: buildDriverDocumentModalItem(document, { driver: selectedDriver.driver, plate: selectedDriver.plate, fallbackDate }),
    });
  };
  const selectedDayDocuments = selectedDayDetail?.documents ?? [];
  const selectedDayBillingDocuments = selectedDayDocuments.filter((document) => getDriverDocumentKind(document) === "billing");
  const selectedDayFuelDocuments = selectedDayDocuments.filter((document) => ["fuel", "consumption"].includes(getDriverDocumentKind(document)));
  const selectedDayMileageDocuments = selectedDayDocuments.filter((document) => getDriverDocumentKind(document) === "mileage");
  const selectedDateKey = selectedDay ? `${reportYear}-${String(reportMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : "";
  const selectedBillingStats = selectedDayDetail?.billingStats ?? { connection: "", trips: 0, points: 0, baseNetAmount: 0, netAmount: 0, promotions: 0, tips: 0, total: 0, refunds: 0, cashCollected: 0 };
  const openDayEditor = (mode) => {
    if (!selectedDriver || !selectedDayDetail || !selectedDateKey) return;
    const modeDocuments = mode === "billing" ? selectedDayBillingDocuments : mode === "fuel" ? selectedDayFuelDocuments : selectedDayMileageDocuments;
    const recordType = mode === "billing" ? "billing" : mode === "fuel" ? "fuel" : "daily-km";
    setModal({
      type: "driver-day-edit",
      item: {
        mode,
        dateKey: selectedDateKey,
        driver: selectedDriver.driver,
        driverId: selectedDriver.driverId,
        vehiclePlate: selectedDriver.plate,
        detail: selectedDayDetail,
        documents: modeDocuments,
        onSave: (values) => onSaveDriverDay?.({ driverId: selectedDriver.driverId, vehiclePlate: selectedDriver.plate, dateKey: selectedDateKey, mode, amount: values.amount, liters: values.liters, dailyKm: values.dailyKm, odometerKm: values.odometerKm, dailyKmChanged: values.dailyKmChanged, odometerChanged: values.odometerChanged, notes: values.notes }),
        onDeleteDocument: (document) => onDeleteDriverDocument?.(document),
        onOpenDocument: openDriverSourceDocument,
        onAddDocument: (file) => setModal({ type: "document-processing", category: mode === "billing" ? "billing" : "consumption", source: "upload", file, selectedPlate: selectedDriver.plate, defaultDate: selectedDateKey, driverId: selectedDriver.driverId, recordType }),
      },
    });
  };
  const renderCalendarPage = (period) => (
    <div className="drivers-calendar-page" key={period.key}>
      {period.delta !== 0 && <div className="drivers-calendar-page__period">{reportMonths[period.month]} {period.year}</div>}
      <div className="drivers-calendar-weekdays" aria-hidden="true">{calendarWeekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}</div>
      <div className="drivers-calendar-grid" role="grid" aria-label={`Facturación y consumo de ${selectedDriver.driver} en ${reportMonths[period.month]} de ${period.year}`}>
        {period.cells.map((cell) => cell.empty
          ? <span className="drivers-calendar-day drivers-calendar-day--empty" aria-hidden="true" key={cell.key} />
          : <button type="button" className={`drivers-calendar-day${cell.billing > 0 ? " drivers-calendar-day--billing" : ""}${cell.fuelCost > 0 ? " drivers-calendar-day--fuel" : ""}${cell.km > 0 ? " drivers-calendar-day--mileage" : ""}${cell.documents?.length ? " drivers-calendar-day--document" : ""}${period.delta === 0 && selectedDay === cell.day ? " drivers-calendar-day--selected" : ""}`} role="gridcell" tabIndex={period.delta === 0 ? 0 : -1} onClick={() => period.delta === 0 && setSelectedDay(cell.day)} aria-label={`${cell.day} de ${reportMonths[period.month]}: ${formatCurrency(cell.billing)} de facturación, ${formatCurrency(cell.fuelCost)} de repostaje y ${formatKm(cell.km)} realizados${cell.documents?.length ? `, ${cell.documents.length} foto${cell.documents.length === 1 ? "" : "s"} original${cell.documents.length === 1 ? "" : "es"} archivada${cell.documents.length === 1 ? "" : "s"}` : ""}`} key={cell.key}><span>{cell.day}</span><span className="drivers-calendar-day__values">{cell.billing > 0 && <small className="drivers-calendar-day__billing">{formatShortCurrency(cell.billing)}</small>}{cell.fuelCost > 0 && <small className="drivers-calendar-day__fuel">-{formatShortCurrency(cell.fuelCost)}</small>}{cell.documents?.length > 0 && <small className="drivers-calendar-day__document" aria-hidden="true"><IconCamera size={10} />{cell.documents.length}</small>}</span></button>)}
      </div>
    </div>
  );

  return (
    <section className={`module-page drivers-page${selectedDriver ? " drivers-page--calendar-open" : ""}`}>
      <div className="drivers-summary-grid">
        <button type="button" className="drivers-summary-card drivers-summary-card--billing" onClick={scrollToDrivers}>
          <header><span className="drivers-summary-card__icon"><IconFileInvoice size={16} /></span><span><strong>Facturación</strong><small><span className="drivers-summary-card__period">{reportMonths[reportMonth]} {reportYear}</span> · 3 coches</small></span><strong className="drivers-summary-card__total">{formatCurrency(totalBilling)}</strong></header>
          <div>{professionalVehicles.map((vehicle) => { const total = billingRows.filter((row) => row.plate === vehicle.plate).reduce((sum, row) => sum + row.revenue, 0); return <span key={vehicle.plate}><VehiclePlateLabel vehicleOrPlate={vehicle} className="drivers-summary-card__vehicle-plate" /><strong className="drivers-summary-card__vehicle-total">{formatCurrency(total)}</strong></span>; })}</div>
        </button>
        <button type="button" className="drivers-summary-card drivers-summary-card--fuel" onClick={scrollToDrivers}>
          <header><span className="drivers-summary-card__icon"><IconGasStation size={16} /></span><span><strong>Consumo</strong><small><span className="drivers-summary-card__period">{reportMonths[reportMonth]} {reportYear}</span> · 3 coches</small></span><strong className="drivers-summary-card__total">{formatCurrency(totalFuel)}</strong></header>
          <div>{fuelSummaries.map((summary) => <span key={summary.vehicle.plate}><VehiclePlateLabel vehicleOrPlate={summary.vehicle} className="drivers-summary-card__vehicle-plate" /><strong className="drivers-summary-card__vehicle-total">{formatCurrency(summary.cost)}</strong></span>)}</div>
        </button>
      </div>

      <div ref={driverGridRef} className="drivers-list" aria-label="Seis conductores profesionales">
        {driverRows.map((row) => <button type="button" className={selectedDriverKey === row.key ? "driver-list-card driver-list-card--active" : "driver-list-card"} key={row.key} onClick={() => selectDriver(row)} aria-pressed={selectedDriverKey === row.key} aria-label={`Ver calendario de ${row.driver}`}>
          <span className="driver-list-card__identity"><strong>{row.driver}</strong><VehiclePlateLabel vehicleOrPlate={row.plate} className="driver-list-card__plate" /></span>
          <span className="driver-list-card__metric driver-list-card__metric--billing" aria-label={`Facturación ${formatCurrency(row.revenue)}`}><strong>{formatCurrency(row.revenue)}</strong></span>
          <span className="driver-list-card__metric driver-list-card__metric--fuel" aria-label={`Consumo ${formatCurrency(row.fuelCost)}`}><strong>{formatCurrency(row.fuelCost)}</strong></span>
        </button>)}
      </div>

      {selectedDriver && <section className="drivers-calendar-card" aria-labelledby="drivers-calendar-title">
        <header className="drivers-calendar-card__header">
          <button type="button" className="drivers-calendar-nav" onClick={() => shiftMonth(-1)} aria-label="Mes anterior"><IconChevronLeft size={18} /></button>
          <div><strong id="drivers-calendar-title">{selectedDriver.driver}</strong><small>{reportMonths[reportMonth]} {reportYear}</small></div>
          <div className="drivers-calendar-card__actions"><button type="button" className="drivers-calendar-nav" onClick={() => shiftMonth(1)} aria-label="Mes siguiente"><IconChevronRight size={18} /></button><button type="button" className="icon-button" onClick={() => setSelectedDriverKey("")} aria-label={`Cerrar calendario de ${selectedDriver.driver}`}><IconX size={17} /></button></div>
        </header>
        <div ref={calendarSurfaceRef} className="drivers-calendar-surface" onPointerDown={onCalendarPointerDown} onPointerMove={onCalendarPointerMove} onPointerUp={onCalendarPointerUp} onPointerCancel={onCalendarPointerCancel}>
          <div ref={calendarTrackRef} className="drivers-calendar-track" onTransitionEnd={onCalendarTrackTransitionEnd} style={{ "--calendar-swipe-offset": `${calendarSwipeOffset}px`, transition: calendarSwipeTransition ? "transform 280ms cubic-bezier(.22,.75,.3,1)" : "none" }}>
            {calendarPeriods.map(renderCalendarPage)}
          </div>
        </div>
      </section>}

      {selectedDriver && selectedDayDetail && <section className="driver-day-detail" aria-label={`Detalle de ${selectedDriver.driver}`}>
        <div className="driver-day-detail__columns">
          <article className="driver-day-panel driver-day-panel--billing">
            <header>
              <button type="button" className="driver-day-panel__heading-button" onClick={() => openDayEditor("billing")} aria-label="Editar Facturación del día"><IconFileInvoice size={17} /><strong>Facturación</strong></button>
              <DriverDayDocumentButtons compact documents={selectedDayBillingDocuments} onOpen={openDriverSourceDocument} onEdit={() => openDayEditor("billing")} />
            </header>
            <div className="driver-day-panel__metrics driver-day-panel__metrics--billing">
              <span><small>Conexión</small><strong>{selectedBillingStats.connection || "—"}</strong></span>
              <span><small>Viajes</small><strong>{selectedBillingStats.trips}</strong></span>
              <span><small>Puntos</small><strong>{selectedBillingStats.points}</strong></span>
              <span><small>Precio neto</small><strong>{formatCurrency(selectedBillingStats.netAmount)}</strong></span>
              <span><small>Propina</small><strong>{formatCurrency(selectedBillingStats.tips)}</strong></span>
              <span><small>Ganancias totales</small><strong>{formatCurrency(selectedBillingStats.total)}</strong></span>
              <span><small>Reembolsos</small><strong>{formatCurrency(selectedBillingStats.refunds)}</strong></span>
              <span><small>Efectivo cobrado</small><strong>{formatCurrency(selectedBillingStats.cashCollected)}</strong></span>
            </div>
          </article>
          <article className="driver-day-panel driver-day-panel--fuel">
            <header>
              <button type="button" className="driver-day-panel__heading-button" onClick={() => openDayEditor("fuel")} aria-label="Editar Repostaje del día"><IconGasStation size={17} /><strong>Repostaje</strong></button>
              <DriverDayDocumentButtons compact documents={selectedDayFuelDocuments} onOpen={openDriverSourceDocument} onEdit={() => openDayEditor("fuel")} />
            </header>
            <div className="driver-day-panel__metrics"><span><small>Importe total</small><strong>{formatCurrency(selectedDayDetail.fuelCost)}</strong></span><span><small>Repostajes</small><strong>{selectedDayDetail.fuelEntries.length}</strong></span></div>
            {selectedDayDetail.fuelEntries.length > 0 && <div className="driver-day-fuel-list">{selectedDayDetail.fuelEntries.map((entry, index) => <div key={`${entry.date}-${entry.time}-${index}`}><span><strong>{entry.time || "Repostaje"}</strong><small>{formatCurrency(entry.cost)}</small></span><button type="button" className="fuel-invoice-button drivers-day-invoice-button" onClick={() => openFuelInvoice(entry, index)}><IconFileInvoice size={13} />Factura</button></div>)}</div>}
          </article>
          <article className="driver-day-panel driver-day-panel--mileage">
            <header>
              <button type="button" className="driver-day-panel__heading-button" onClick={() => openDayEditor("mileage")} aria-label="Editar Kilómetros del día"><IconGauge size={17} /><strong>Kilómetros</strong></button>
              <DriverDayDocumentButtons compact documents={selectedDayMileageDocuments} onOpen={openDriverSourceDocument} onEdit={() => openDayEditor("mileage")} />
            </header>
            <div className="driver-day-panel__metrics"><span><small>Km diarios</small><strong>{formatKm(selectedDayDetail.km)}</strong></span><span><small>Total del mes</small><strong>{formatKm(periodKilometres)}</strong></span><span><small>Km acumulados</small><strong>{formatKm(selectedDayDetail.totalKm)}</strong></span></div>
          </article>
        </div>
      </section>}
    </section>
  );
}

function DriverDayDocumentButtons({ documents = [], onOpen, onEdit, compact = false }) {
  if (!documents.length) {
    if (onEdit) return <button type="button" className={`driver-day-panel__documents-empty${compact ? " driver-day-panel__documents-empty--header" : ""}`} onClick={onEdit} title="Añadir foto o documento"><IconCamera size={compact ? 15 : 14} /><span aria-hidden="true">{compact ? "0" : "Sin foto original archivada"}</span>{compact && <span className="sr-only">Añadir foto o documento</span>}</button>;
    return <span className={`driver-day-panel__documents-empty${compact ? " driver-day-panel__documents-empty--header" : ""}`} title="Sin foto original archivada"><IconCamera size={compact ? 15 : 14} /><span aria-hidden="true">{compact ? "0" : "Sin foto original archivada"}</span>{compact && <span className="sr-only">Sin foto original archivada</span>}</span>;
  }
  return <div className={`driver-day-panel__documents${compact ? " driver-day-panel__documents--header" : ""}`} aria-label="Fotos originales archivadas">{documents.map((document, index) => <button type="button" className={`driver-day-panel__document${compact ? " driver-day-panel__document--header" : ""}`} key={document.id} onClick={() => (onEdit ? onEdit(document) : onOpen?.(document))} aria-label={`${onEdit ? "Editar" : "Ver"} foto original de ${getDriverDocumentKindLabel(document)}`} title={`${onEdit ? "Editar" : "Ver"} ${getDriverDocumentKindLabel(document)} · ${document.file_name || "Foto original"}`}><IconCamera size={compact ? 15 : 14} />{compact ? <span aria-hidden="true">{documents.length > 1 ? index + 1 : "Foto"}</span> : <><span><strong>{getDriverDocumentKindLabel(document)}</strong><small>{document.file_name || "Ver foto original"}</small></span><IconChevronRight size={14} /></>}</button>)}</div>;
}

function DriverDayEditWorkflow({ item, onCancel }) {
  const mode = item.mode || "billing";
  const detail = item.detail ?? {};
  const [amount, setAmount] = useState(() => String(mode === "billing" ? Number(detail.billing) || 0 : Number(detail.fuelCost) || 0));
  const [liters, setLiters] = useState(() => String(Number(detail.fuelLiters) || 0));
  const [dailyKm, setDailyKm] = useState(() => String(Number(detail.km) || 0));
  const [odometerKm, setOdometerKm] = useState(() => String(Number(detail.totalKm) || 0));
  const [notes, setNotes] = useState(() => String(detail.notes || ""));
  const [documents, setDocuments] = useState(() => item.documents ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const label = mode === "billing" ? "Facturación" : mode === "fuel" ? "Repostaje" : "Kilómetros";
  const dateLabel = formatDocumentDisplayDate(item.dateKey);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await item.onSave?.({ amount, liters, dailyKm, odometerKm, dailyKmChanged: Number(dailyKm) !== (Number(detail.km) || 0), odometerChanged: Number(odometerKm) !== (Number(detail.totalKm) || 0), notes });
      onCancel();
    } catch (caughtError) {
      setError(caughtError?.message || "No se han podido guardar los cambios.");
      setSaving(false);
    }
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const validation = validateDocumentFile(file, "upload");
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    item.onAddDocument?.(file);
  };

  const removeDocument = async (document) => {
    if (!window.confirm(`¿Borrar ${document.file_name || "este documento"}?`)) return;
    setError("");
    try {
      await item.onDeleteDocument?.(document);
      setDocuments((current) => current.filter((candidate) => candidate.id !== document.id));
    } catch (caughtError) {
      setError(caughtError?.message || "No se ha podido borrar el documento.");
    }
  };

  return (
    <div className="driver-day-edit-workflow">
      <div className="driver-day-edit-context"><span>{item.driver} · {item.vehiclePlate}</span><strong>{label} · {dateLabel}</strong><small>El cambio se refleja en Conductores, Neto y en el vehículo asociado.</small></div>
      <div className="driver-day-edit-form">
        {(mode === "billing" || mode === "fuel") && <label>{mode === "billing" ? "Importe facturado" : "Importe del repostaje"}<div className="driver-day-edit-input"><input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /><i>€</i></div></label>}
        {mode === "fuel" && <label>Litros repostados<div className="driver-day-edit-input"><input type="number" min="0" step="0.01" value={liters} onChange={(event) => setLiters(event.target.value)} /><i>L</i></div></label>}
        {mode === "mileage" && <><label>Km diarios<div className="driver-day-edit-input"><input type="number" min="0" step="1" value={dailyKm} onChange={(event) => setDailyKm(event.target.value)} /><i>km</i></div></label><label>Kilometraje acumulado<div className="driver-day-edit-input"><input type="number" min="0" step="1" value={odometerKm} onChange={(event) => setOdometerKm(event.target.value)} /><i>km</i></div></label></>}
        <label className="driver-day-edit-form__wide">Notas del registro<textarea rows="2" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Añade una aclaración para este día (opcional)" /></label>
      </div>
      <section className="driver-day-edit-documents" aria-labelledby="driver-day-edit-documents-title">
        <header><div><strong id="driver-day-edit-documents-title">Documentos del día</strong><small>Las fotos originales quedan archivadas junto al registro.</small></div><button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}><IconUpload size={16} />Añadir documento</button><input ref={fileInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,.pdf,application/pdf" onChange={handleFile} /></header>
        {documents.length > 0 ? <div className="driver-day-edit-document-list">{documents.map((document) => <div className="driver-day-edit-document" key={document.id}><span><IconCamera size={16} /><strong>{getDriverDocumentKindLabel(document)}</strong><small>{document.file_name || "Documento original"}</small></span><div><button type="button" className="table-action" onClick={() => item.onOpenDocument?.(document)}>Ver</button><button type="button" className="table-action driver-day-edit-document__delete" onClick={() => removeDocument(document)}><IconTrash size={14} />Borrar</button></div></div>)}</div> : <p className="driver-day-edit-documents__empty"><IconCamera size={17} />No hay foto o documento archivado para este día.</p>}
      </section>
      {error && <p className="driver-day-edit-error" role="alert"><IconAlertTriangle size={16} />{error}</p>}
      <footer><button type="button" className="secondary-button" onClick={onCancel} disabled={saving}>Cancelar</button><button type="button" className="primary-button" onClick={save} disabled={saving}>{saving ? <IconRefresh className="document-processing-actions__spinner" size={17} /> : <IconCheck size={17} />}{saving ? "Guardando…" : "Aceptar"}</button></footer>
    </div>
  );
}

function ReadingsView({ setModal }) {
  const [readingFilter, setReadingFilter] = useState("Todas");
  const visible = readingSeed.filter((reading) => readingFilter === "Todas" || reading.status === readingFilter);
  return (
    <section className="module-page">
      <PageIntro eyebrow="WhatsApp + IA" title="Lecturas de kilometraje" description="Revisa la extracción automática antes de incorporarla al historial del vehículo." action={<button className="primary-button" onClick={() => setModal({ type: "reading" })}><IconUpload size={18} />Nueva lectura</button>} />
      <div className="metric-cards">
        <MetricCard icon={IconBrandWhatsapp} label="Recibidas hoy" value="8" detail="Última a las 22:08" />
        <MetricCard icon={IconAlertTriangle} label="Por revisar" value="2" detail="Confianza inferior al 95%" tone="amber" />
        <MetricCard icon={IconSparkles} label="Precisión media" value="97,1%" detail="Extracción automática" />
      </div>
      <section className="content-card">
        <header className="card-header"><div><h2>Bandeja de lecturas</h2><p>Imágenes recibidas por WhatsApp y procesadas automáticamente.</p></div><div className="segmented">{["Todas", "Revisar", "Validada"].map((name) => <button className={readingFilter === name ? "active" : ""} key={name} onClick={() => setReadingFilter(name)}>{name}</button>)}</div></header>
        <div className="table-scroll">
          <table className="module-table">
            <thead><tr><th>Lectura</th><th>Conductor</th><th>Vehículo</th><th>Odómetro total</th><th>Km diarios</th><th>Confianza IA</th><th>Estado</th><th /></tr></thead>
            <tbody>{visible.map((reading) => <tr key={reading.id}><td><strong>{reading.id}</strong><small>{reading.time}</small></td><td>{reading.driver}</td><td><strong>{reading.plate}</strong></td><td>{formatKm(reading.total)}</td><td>{formatKm(reading.daily)}</td><td><span className="confidence"><i style={{ width: `${reading.confidence}%` }} />{reading.confidence}%</span></td><td><StatusBadge status={reading.status} /></td><td><button className="table-action" onClick={() => setModal({ type: "reading-review", item: reading })}>Revisar<IconChevronRight size={16} /></button></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function InvoicesView({ invoices, setModal }) {
  const total = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const gestoriaCount = invoices.filter((invoice) => invoice.kind === "gestoria").length;
  const emailCount = invoices.filter((invoice) => String(invoice.source ?? "").includes("Correo")).length;
  const reviewCount = invoices.filter((invoice) => invoice.status === "Revisar").length;
  return (
    <section className="module-page">
      <PageIntro eyebrow="Correo de gestoría y taller" title="Facturas" description="Facturas recibidas, conceptos extraídos y asociación automática con cada matrícula y titular." action={<button className="primary-button" onClick={() => setModal({ type: "invoice-upload" })}><IconUpload size={18} />Subir factura</button>} />
      <div className="metric-cards">
        <MetricCard icon={IconCurrencyEuro} label="Gasto registrado" value={formatCurrency(total)} detail={`${invoices.length} documentos asociados`} />
        <MetricCard icon={IconMail} label="Recibidas por correo" value={emailCount} detail={`${gestoriaCount} de Gestoría Durán Rivas`} />
        <MetricCard icon={IconAlertTriangle} label="Requieren revisión" value={reviewCount} detail="Sin matrícula o asociación pendiente" tone="amber" />
      </div>
      <aside className="invoice-source-note" aria-label="Origen de las facturas de gestoría">
        <IconMail size={19} />
        <span><strong>Gestoría Durán Rivas</strong><small>Remitente: {gestoriaSender} · {gestoriaImportMeta.importedDocuments} documentos importados desde {gestoriaImportMeta.importedAccounts.join(" y ")}</small><small className="invoice-source-note__pending">Pendiente de conectar: {gestoriaImportMeta.pendingAccounts.join(" y ")}</small></span>
        <StatusBadge status={gestoriaImportMeta.pendingAccounts.length ? "Parcial" : "Asociada"} />
      </aside>
      <section className="content-card">
        <header className="card-header"><div><h2>Facturas recibidas</h2><p>Incluye cuotas mensuales y gastos extraordinarios, vinculados por titular y matrícula.</p></div><span className="source-label"><IconMail size={15} />Gmail · Gestoría</span></header>
        <div className="table-scroll">
          <table className="module-table">
            <thead><tr><th>Factura</th><th>Proveedor</th><th>Matrícula / titular</th><th>Concepto</th><th>Origen</th><th>Importe</th><th>Estado</th><th /></tr></thead>
            <tbody>{invoices.map((invoice) => <tr key={invoice.sourceDocumentId ?? invoice.id}><td><strong>{invoice.documentNumber ?? invoice.id}</strong><small>{invoice.date}{invoice.periodKey ? ` · Periodo ${invoice.periodKey}` : ""}</small></td><td>{invoice.provider}</td><td>{invoice.plate ? <VehiclePlateLabel vehicleOrPlate={invoice.plate} className="invoice-vehicle-plate" /> : <strong>Sin matrícula</strong>}{invoice.plateReference && <small>Referencia: {invoice.plateReference}</small>}{invoice.owner && <small>{invoice.owner.name}</small>}</td><td>{invoice.concept}</td><td><span className="source-label">{String(invoice.source ?? "").includes("Correo") ? <IconMail size={15} /> : invoice.source === "Foto" ? <IconCamera size={15} /> : <IconUpload size={15} />}{invoice.source}</span></td><td><strong>{formatCurrency(invoice.amount)}</strong></td><td><StatusBadge status={invoice.status} /></td><td><button className="table-action" onClick={() => setModal({ type: "invoice", item: invoice })}>Ver factura<IconChevronRight size={16} /></button></td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function LegacyMaintenanceView({ initialPlate, setModal, vehicles }) {
  const [workshopPlate, setWorkshopPlate] = useState(initialPlate);
  const schedule = vehicles;
  const nextServiceVehicle = [...vehicles].sort((a, b) => (a.nextServiceKm - a.odometer) - (b.nextServiceKm - b.odometer))[0];
  const workshopVehicle = vehicles.find((vehicle) => vehicle.plate === workshopPlate) ?? vehicles[0];
  const julyMaintenance = vehicles.flatMap((vehicle) => vehicle.maintenance).filter((item) => item.dateIso?.startsWith("2026-07") || item.date.toLocaleLowerCase("es").includes("jul 2026"));
  const julyTotal = julyMaintenance.reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    setWorkshopPlate(initialPlate);
  }, [initialPlate]);

  const showWorkshop = (plate) => {
    setWorkshopPlate(plate);
    window.setTimeout(() => document.getElementById("taller-vehiculo")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  };

  return (
    <section className="module-page">
      <PageIntro eyebrow="Plan preventivo" title="Mantenimiento y taller" description="Prioriza revisiones, consulta el historial completo y crea facturas desde una fotografía." action={<button className="primary-button" onClick={() => showWorkshop(nextServiceVehicle.plate)}><IconCalendar size={18} />Abrir próxima revisión</button>} />
      <div className="maintenance-layout">
        <section className="content-card schedule-card">
          <header className="card-header"><div><h2>Vehículos</h2><p>Profesionales primero y particulares después.</p></div></header>
          <div className="schedule-list">{schedule.map((vehicle, index) => {
            const remaining = vehicle.nextServiceKm - vehicle.odometer;
            return <button key={vehicle.plate} className="schedule-row" onClick={() => showWorkshop(vehicle.plate)}><span className={`schedule-index ${remaining <= 5000 ? "urgent" : ""}`}>{index + 1}</span><span><VehiclePlateLabel vehicleOrPlate={vehicle} className="schedule-vehicle-plate" /><small>{vehicle.model}</small></span><span><strong>{formatKm(remaining)}</strong><small>{vehicle.serviceDate}</small></span><IconChevronRight size={18} /></button>;
          })}</div>
        </section>
        <aside className="content-card maintenance-summary">
          <span className="metric-card__icon"><IconTools size={22} /></span>
          <h2>Resumen de julio</h2>
          <strong>{formatCurrency(julyTotal)}</strong>
          <p>{julyMaintenance.length} intervenciones registradas, incluidas las facturas creadas desde una fotografía.</p>
          <div><span>Preventivo</span><strong>68%</strong></div><div><span>Correctivo</span><strong>32%</strong></div>
        </aside>
      </div>
      <section className="content-card workshop-module" id="taller-vehiculo">
        <header className="card-header"><div><h2>Taller por vehículo</h2><p>Selecciona un coche para consultar intervenciones, conceptos e importes.</p></div><button className="primary-button" onClick={() => setModal({ type: "invoice-upload", plate: workshopVehicle.plate })}><IconCamera size={17} />Factura desde foto</button></header>
        <div className="workshop-module__layout">
          <nav className="workshop-vehicle-list" aria-label="Vehículos con historial de taller">
            {vehicles.map((vehicle) => {
              const latest = vehicle.maintenance[0];
              return <button className={vehicle.plate === workshopVehicle.plate ? "active" : ""} key={vehicle.plate} onClick={() => setWorkshopPlate(vehicle.plate)} aria-current={vehicle.plate === workshopVehicle.plate ? "true" : undefined}><span><VehiclePlateLabel vehicleOrPlate={vehicle} className="workshop-vehicle-plate" /><small>{vehicle.model}</small></span><span><strong>{formatCurrency(latest.amount)}</strong><small>{latest.concept}</small></span><IconChevronRight size={17} /></button>;
            })}
          </nav>
          <WorkshopHistory vehicle={workshopVehicle} />
        </div>
      </section>
      <section className="content-card">
        <header className="card-header"><div><h2>Últimas intervenciones</h2><p>Consulta rápida de fecha, kilometraje, concepto e importe.</p></div></header>
        <div className="table-scroll"><table className="module-table"><thead><tr><th>Vehículo</th><th>Fecha</th><th>Kilometraje</th><th>Concepto</th><th>Importe</th><th /></tr></thead><tbody>{vehicles.map((vehicle) => {
          const item = vehicle.maintenance[0];
          return <tr key={vehicle.plate}><td><VehiclePlateLabel vehicleOrPlate={vehicle} className="maintenance-table-plate" /><small>{vehicle.model}</small></td><td>{item.date}</td><td>{formatKm(item.km)}</td><td>{item.concept}</td><td><strong>{formatCurrency(item.amount)}</strong></td><td><button className="table-action" onClick={() => showWorkshop(vehicle.plate)}>Historial<IconChevronRight size={16} /></button></td></tr>;
        })}</tbody></table></div>
      </section>
    </section>
  );
}

function buildMaintenanceSearchRecords(vehicles, invoices) {
  return vehicles.flatMap((vehicle) => {
    const records = [...vehicle.maintenance].sort((a, b) => getMaintenanceDateValue(b) - getMaintenanceDateValue(a));
    const brand = getVehicleBrand(vehicle);
    return records.map((item, index) => {
      const invoice = getMaintenanceInvoice(item, vehicle, invoices);
      const invoiceDetails = invoice?.items?.flatMap((detail) => [detail.concept, detail.amount]) ?? [];
      const searchableFields = [
        brand,
        vehicle.plate,
        vehicle.model,
        vehicle.use,
        item.date,
        item.dateIso,
        formatMaintenanceDate(item),
        item.km,
        formatKm(item.km),
        item.concept,
        item.amount,
        formatCurrency(item.amount),
        invoice?.id,
        invoice?.date,
        invoice?.provider,
        invoice?.concept,
        invoice?.source,
        invoice?.status,
        invoice?.amount,
        ...invoiceDetails,
      ].filter(Boolean).join(" ");
      return {
        plate: vehicle.plate,
        model: vehicle.model,
        item,
        invoice,
        key: getMaintenanceRecordKey(item, index),
        searchText: normalizeText(searchableFields),
      };
    });
  });
}

function MaintenanceSearch({ query, open, suggestions, onQueryChange, onOpenChange, onSelect }) {
  useEffect(() => {
    if (!open) return undefined;
    const closeSearch = (event) => {
      if (!event.target.closest?.("[data-maintenance-search]")) onOpenChange(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("pointerdown", closeSearch);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeSearch);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onOpenChange, open]);

  return (
    <div className="maintenance-search" data-maintenance-search role="search">
      <IconSearch size={17} aria-hidden="true" />
      <input
        type="search"
        value={query}
        onChange={(event) => { onQueryChange(event.target.value); onOpenChange(true); }}
        onFocus={() => onOpenChange(Boolean(query.trim()))}
        placeholder="Buscar matrícula, concepto, fecha o factura"
        aria-label="Buscar en Mantenimiento"
        aria-autocomplete="list"
        aria-controls="mantenimiento-busqueda-sugerencias"
        aria-expanded={open && Boolean(query.trim())}
      />
      {query && <button type="button" className="maintenance-search__clear" onClick={() => { onQueryChange(""); onOpenChange(false); }} aria-label="Limpiar búsqueda"><IconX size={15} /></button>}
      {open && query.trim() && <div className="maintenance-search-suggestions" id="mantenimiento-busqueda-sugerencias" role="listbox" aria-label="Sugerencias de mantenimiento">
        {suggestions.length > 0 ? suggestions.map((record) => <button type="button" role="option" className="maintenance-search-suggestion" key={`${record.plate}-${record.key}`} onMouseDown={(event) => event.preventDefault()} onClick={() => onSelect(record)}>
          <span className="maintenance-search-suggestion__main"><strong>{record.item.concept}</strong><small>{record.plate} · {record.model}</small></span>
          <span className="maintenance-search-suggestion__meta"><strong>{formatMaintenanceDate(record.item)}</strong><small>{formatCurrency(record.item.amount)}</small></span>
          <span className="maintenance-search-suggestion__source">{record.invoice?.provider ?? record.invoice?.id ?? "Registro de mantenimiento"}</span>
        </button>) : <p className="maintenance-search-empty">No hay coincidencias en los registros de mantenimiento.</p>}
      </div>}
    </div>
  );
}

function MaintenanceReportPhoto({ report }) {
  const [state, setState] = useState({ status: "loading", url: "", message: "" });

  useEffect(() => {
    let active = true;
    if (!report?.photoPath) {
      setState({ status: "empty", url: "", message: "" });
      return undefined;
    }
    setState({ status: "loading", url: "", message: "" });
    createMaintenanceReportPhotoUrl(report.photoPath, 15 * 60)
      .then((url) => { if (active) setState(url ? { status: "ready", url, message: "" } : { status: "error", url: "", message: "Foto no disponible." }); })
      .catch((error) => { if (active) setState({ status: "error", url: "", message: error.message || "No se ha podido abrir la foto." }); });
    return () => { active = false; };
  }, [report?.photoPath]);

  if (state.status === "loading") return <span className="maintenance-report-photo maintenance-report-photo--loading">Cargando foto…</span>;
  if (state.status !== "ready") return <span className="maintenance-report-photo maintenance-report-photo--error">{state.message || "Sin foto"}</span>;
  return <a className="maintenance-report-photo" href={state.url} target="_blank" rel="noreferrer" aria-label={`Abrir foto de la incidencia ${report.photoName || ""}`}><img src={state.url} alt={`Foto de incidencia de ${report.vehiclePlate}`} loading="lazy" /><span><IconCamera size={14} />Abrir foto</span></a>;
}

function MaintenanceReportsDialog({ vehicle, reports = [], driverProfiles = [], onClose, onSave, onMarkReviewed }) {
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const photoInputRef = useRef(null);
  const driverNames = useMemo(() => new Map(driverProfiles.map((driver) => [driver.id, driver.full_name])), [driverProfiles]);
  const sortedReports = [...reports].sort((left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? "")));
  const pendingCount = sortedReports.filter((report) => report.status === "pending").length;

  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const choosePhoto = () => {
    const input = photoInputRef.current;
    if (!input) return;
    input.value = "";
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      // Algunos navegadores móviles solo permiten abrir el selector con click().
    }
    input.click();
  };

  const handlePhoto = (event) => {
    const nextFile = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!nextFile) return;
    const validation = validateMaintenancePhotoFile(nextFile);
    if (!validation.valid) {
      setMessage(validation.message);
      return;
    }
    setMessage("");
    setPhoto(nextFile);
  };

  const save = async (event) => {
    event.preventDefault();
    setMessage("");
    if (!note.trim() && !photo) {
      setMessage("Escribe la incidencia o añade una foto antes de guardar.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ vehiclePlate: vehicle.plate, note, photoFile: photo });
      setNote("");
      setPhoto(null);
    } catch (error) {
      setMessage(error.message || "No se ha podido guardar el aviso.");
    } finally {
      setSaving(false);
    }
  };

  const markReviewed = async (report) => {
    try {
      await onMarkReviewed?.(report.id, "reviewed");
    } catch (error) {
      setMessage(error.message || "No se ha podido actualizar el aviso.");
    }
  };

  return <div className="maintenance-reports-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="maintenance-reports-dialog" role="dialog" aria-modal="true" aria-labelledby="maintenance-reports-dialog-title">
      <header className="maintenance-reports-dialog__header">
        <div><span className="eyebrow">Avisos asociados a la matrícula</span><h2 id="maintenance-reports-dialog-title">Pendiente de revisión · <VehiclePlateLabel vehicleOrPlate={vehicle} /></h2><p>{pendingCount ? `${pendingCount} aviso${pendingCount === 1 ? "" : "s"} pendiente${pendingCount === 1 ? "" : "s"}` : "No hay avisos pendientes"}. Se conservan también los avisos revisados.</p></div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar avisos de mantenimiento"><IconX size={18} /></button>
      </header>
      <div className="maintenance-reports-dialog__list" aria-live="polite">
        {sortedReports.length === 0 && <div className="empty-state"><IconTool size={23} /><strong>Sin incidencias archivadas</strong><span>Los avisos de los conductores aparecerán aquí.</span></div>}
        {sortedReports.map((report) => <article className={`maintenance-report-card maintenance-report-card--${report.status}`} key={report.id}>
          <header><div><strong>{driverNames.get(report.reporterId) || "Administrador"}</strong><time dateTime={report.createdAt}>{formatMaintenanceReportDate(report.createdAt)}</time></div><StatusBadge status={report.status === "pending" ? "Pendiente" : report.status === "resolved" ? "Resuelto" : "Revisado"} /></header>
          {report.note && <p>{report.note}</p>}
          {report.photoPath && <MaintenanceReportPhoto report={report} />}
          {report.status === "pending" && <button type="button" className="maintenance-report-card__review" onClick={() => markReviewed(report)}><IconCheck size={14} />Marcar revisado</button>}
        </article>)}
      </div>
      <form className="maintenance-reports-dialog__form" onSubmit={save}>
        <div><strong>Añadir incidencia desde Administración</strong><small>Disponible para este coche, incluidos Lexus y Peugeot.</small></div>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows="3" placeholder="Describe qué debe revisarse, repararse o cambiarse…" aria-label="Nueva incidencia de mantenimiento" />
        <input ref={photoInputRef} className="sr-only" type="file" accept="image/*" capture="environment" aria-label="Fotografiar incidencia desde Administración" onChange={handlePhoto} />
        {photo && <div className="maintenance-reports-dialog__selected-file"><IconCamera size={14} /><span>{photo.name}</span><button type="button" onClick={() => setPhoto(null)} aria-label="Quitar foto seleccionada"><IconX size={13} /></button></div>}
        {message && <p className="maintenance-reports-dialog__message" role="alert">{message}</p>}
        <footer><button type="button" className="secondary-button" onClick={onClose}>Cerrar</button><button type="button" className="maintenance-report-camera-button" onClick={choosePhoto} disabled={saving}><IconCamera size={16} />Foto</button><button type="submit" className="primary-button" disabled={saving}><IconCheck size={16} />{saving ? "Guardando…" : "Guardar aviso"}</button></footer>
      </form>
    </section>
  </div>;
}

function formatMaintenanceReportDate(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "Fecha pendiente";
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date).replace(".", "");
}

function MaintenanceView({ initialPlate, invoices, setModal, vehicles, maintenanceSearchSelection, maintenanceReports = [], driverProfiles = [], onSaveMaintenanceReport, onMarkMaintenanceReportReviewed }) {
  const [workshopPlate, setWorkshopPlate] = useState(initialPlate);
  const [openMaintenanceKey, setOpenMaintenanceKey] = useState("");
  const [openConceptKey, setOpenConceptKey] = useState("");
  const [reportsPlate, setReportsPlate] = useState("");
  const longPressRef = useRef({ timer: null, triggered: false, startX: 0, startY: 0 });
  const pendingMaintenanceKeyRef = useRef("");
  const handledMaintenanceSearchRef = useRef("");
  const workshopVehicle = vehicles.find((vehicle) => vehicle.plate === workshopPlate) ?? vehicles[0];
  const selectedBrand = getVehicleBrand(workshopVehicle);
  const sortedMaintenance = [...workshopVehicle.maintenance].sort((a, b) => getMaintenanceDateValue(b) - getMaintenanceDateValue(a));
  const maintenanceRecords = sortedMaintenance.map((item, index) => {
    const invoice = getMaintenanceInvoice(item, workshopVehicle, invoices);
    const details = invoice?.items?.length ? invoice.items : [{ concept: item.concept, amount: item.amount }];
    return { item, invoice, details, key: getMaintenanceRecordKey(item, index) };
  });
  useEffect(() => {
    setWorkshopPlate(initialPlate);
  }, [initialPlate]);

  useEffect(() => {
    const pendingKey = pendingMaintenanceKeyRef.current;
    pendingMaintenanceKeyRef.current = "";
    setOpenMaintenanceKey(pendingKey);
    setOpenConceptKey("");
  }, [workshopVehicle.plate]);

  useEffect(() => {
    if (!maintenanceSearchSelection || handledMaintenanceSearchRef.current === maintenanceSearchSelection.selectionId) return;
    handledMaintenanceSearchRef.current = maintenanceSearchSelection.selectionId;
    setOpenConceptKey("");
    const revealRecord = () => {
      setOpenMaintenanceKey(maintenanceSearchSelection.key);
      window.setTimeout(() => document.getElementById(getMaintenanceEventDomId(maintenanceSearchSelection.plate, maintenanceSearchSelection.key))?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    };
    if (maintenanceSearchSelection.plate === workshopVehicle.plate) {
      revealRecord();
      return;
    }
    pendingMaintenanceKeyRef.current = maintenanceSearchSelection.key;
    setWorkshopPlate(maintenanceSearchSelection.plate);
    window.setTimeout(revealRecord, 80);
  }, [maintenanceSearchSelection]);

  useEffect(() => {
    if (!openConceptKey) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setOpenConceptKey(""); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [openConceptKey]);

  useEffect(() => () => window.clearTimeout(longPressRef.current.timer), []);

  const clearMaintenanceLongPressTimer = () => {
    if (longPressRef.current.timer) window.clearTimeout(longPressRef.current.timer);
    longPressRef.current.timer = null;
  };

  const startMaintenanceLongPress = (event, item) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    clearMaintenanceLongPressTimer();
    longPressRef.current.triggered = false;
    longPressRef.current.startX = event.clientX;
    longPressRef.current.startY = event.clientY;
    longPressRef.current.timer = window.setTimeout(() => {
      longPressRef.current.triggered = true;
      setOpenConceptKey("");
      setModal({
        type: "maintenance-edit",
        item: {
          ...item,
          plate: workshopVehicle.plate,
          vehiclePlate: workshopVehicle.plate,
          editKey: item.maintenanceEditKey || item.invoiceId,
        },
      });
      window.setTimeout(() => { longPressRef.current.triggered = false; }, 500);
    }, 2000);
  };

  const moveMaintenanceLongPress = (event) => {
    const distance = Math.hypot(event.clientX - longPressRef.current.startX, event.clientY - longPressRef.current.startY);
    if (distance > 12) clearMaintenanceLongPressTimer();
  };

  const finishMaintenanceLongPress = () => clearMaintenanceLongPressTimer();
  const suppressClickAfterLongPress = (event) => {
    if (!longPressRef.current.triggered) return;
    event.preventDefault();
    event.stopPropagation();
    longPressRef.current.triggered = false;
  };

  const selectWorkshopVehicle = (plate) => {
    setWorkshopPlate(plate);
    window.setTimeout(() => document.getElementById("historial-mantenimiento")?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 40);
  };

  return (
    <section className="module-page maintenance-page">
      <nav className="maintenance-vehicle-banners" aria-label="Vehículos de la flota">
        {vehicles.map((vehicle, index) => {
          const brand = getVehicleBrand(vehicle);
          const latest = [...vehicle.maintenance].sort((a, b) => getMaintenanceDateValue(b) - getMaintenanceDateValue(a))[0];
          const isActive = vehicle.plate === workshopVehicle.plate;
          const vehicleReports = maintenanceReports.filter((report) => report.vehiclePlate === vehicle.plate);
          const pendingReports = vehicleReports.filter((report) => report.status === "pending").length;
          return (
            <div className={`maintenance-vehicle-banner-row ${isActive ? "active" : ""}`} key={vehicle.plate} role="group" aria-label={`Tarjeta del coche ${vehicle.plate}`}>
              <button className={`maintenance-vehicle-banner ${isActive ? "active" : ""}`} onClick={() => selectWorkshopVehicle(vehicle.plate)} aria-label={`Abrir historial de ${vehicle.plate}, ${vehicle.model}`} aria-current={isActive ? "true" : undefined}>
                <span className="maintenance-vehicle-number">{index + 1}</span>
                <span className={`vehicle-brand-mark vehicle-brand-mark--${brand.toLocaleLowerCase("es")}`}><img src={vehicleBrandLogos[brand]} alt={`Logotipo de ${brand}`} /></span>
                <span className="maintenance-vehicle-identity"><small>{brand}</small><VehiclePlateLabel vehicleOrPlate={vehicle} className="maintenance-vehicle-plate" /><span>{vehicle.model}</span></span>
                <span className="maintenance-vehicle-type"><StatusBadge status={vehicle.use} /></span>
                <span className="maintenance-vehicle-latest"><small>Última actuación</small><strong>{latest ? formatMaintenanceDate(latest) : "Sin registros"}</strong><span>{latest?.concept ?? "—"}</span></span>
              </button>
              <button type="button" className={`maintenance-pending-review-button${pendingReports ? " has-pending" : ""}`} onClick={() => setReportsPlate(vehicle.plate)} aria-label={`Abrir pendientes de revisión de ${vehicle.plate}`}><IconAlertTriangle size={16} /><span>PENDIENTE DE REVISIÓN</span>{pendingReports > 0 && <b>{pendingReports}</b>}</button>
            </div>
          );
        })}
      </nav>
      <div className="maintenance-vehicle-divider" aria-hidden="true" />
      <section className="content-card maintenance-history-panel" id="historial-mantenimiento">
        <header className="maintenance-history-header">
          <div className="maintenance-history-vehicle">
            <span className={`vehicle-brand-mark vehicle-brand-mark--${selectedBrand.toLocaleLowerCase("es")}`}><img src={vehicleBrandLogos[selectedBrand]} alt="" /></span>
            <span><h2><VehiclePlateLabel vehicleOrPlate={workshopVehicle} className="maintenance-history-plate" /></h2></span>
          </div>
        </header>
        <div className="maintenance-history-scroll">
        <div className="maintenance-timeline" aria-label={`Historial de mantenimiento de ${workshopVehicle.plate}`}>
          <header className="maintenance-timeline-heading">
            <span><span className="maintenance-timeline-heading__icon"><IconTool size={14} /></span><strong>INTERVENCIONES REALIZADAS</strong></span>
          </header>
          {maintenanceRecords.length === 0 && <div className="empty-state"><IconTool size={22} /><strong>Sin mantenimientos registrados</strong><span>Las nuevas facturas e intervenciones aparecerán aquí.</span></div>}
          {maintenanceRecords.map(({ item, invoice, details, key }) => {
            const isOpen = openMaintenanceKey === key;
            const eventId = getMaintenanceEventDomId(workshopVehicle.plate, key);
            const detailId = `detail-${eventId}`;
            return (
              <article
                id={eventId}
                className={`maintenance-event ${isOpen ? "is-open" : ""} ${invoice ? "has-invoice" : "without-invoice"}`}
                key={key}
                title="Mantén pulsado 2 segundos para editar fecha y kilómetros"
                onPointerDown={(event) => startMaintenanceLongPress(event, item)}
                onPointerMove={moveMaintenanceLongPress}
                onPointerUp={finishMaintenanceLongPress}
                onPointerCancel={finishMaintenanceLongPress}
                onPointerLeave={finishMaintenanceLongPress}
                onClickCapture={suppressClickAfterLongPress}
                onContextMenu={(event) => event.preventDefault()}
              >
                <button className="maintenance-event-date" onClick={() => setOpenMaintenanceKey(isOpen ? "" : key)} aria-expanded={isOpen} aria-controls={detailId}>
                  <IconCalendar size={18} /><span><strong>{formatMaintenanceDate(item)}</strong><small>{formatKm(item.km)}</small></span><IconChevronDown className="maintenance-event-toggle" size={18} />
                </button>
                <div className="maintenance-event-summary"><small>Trabajo realizado</small><strong>{item.concept}</strong><span className="maintenance-event-summary__amount">{formatCurrency(item.amount)}</span></div>
                <div className="maintenance-event-invoice">
                  {invoice ? <button onClick={() => setModal({ type: "invoice", item: invoice })} aria-label={`Abrir factura ${invoice.id}`}><IconFileInvoice size={18} /><span><strong>Abrir factura</strong><small>{invoice.id}</small></span></button> : <span className="maintenance-invoice-unavailable"><IconFileInvoice size={18} /><span><strong>Sin factura</strong><small>No proporcionada</small></span></span>}
                </div>
                {isOpen && <div className="maintenance-event-detail" id={detailId}>
                  <header><strong>Trabajos realizados</strong><small>{invoice?.provider ?? "Registro de mantenimiento"}</small></header>
                  <div>{details.map((detail, index) => {
                    const conceptKey = `${key}-${index}`;
                    const conceptMatchId = `coincidencias-${workshopVehicle.plate.replace(/\s/g, "")}-${item.km}-${index}`;
                    const isConceptOpen = openConceptKey === conceptKey;
                    const normalizedConcept = normalizeText(detail.concept).trim();
                    const matches = maintenanceRecords.flatMap((record) => record.details
                      .filter((candidate) => normalizeText(candidate.concept).trim() === normalizedConcept)
                      .map((candidate) => ({
                        date: formatMaintenanceDate(record.item),
                        km: record.item.km,
                        concept: candidate.concept,
                        amount: Number(candidate.amount),
                      })));
                    return <div className={`maintenance-work-item ${isConceptOpen ? "is-open" : ""}`} key={`${detail.concept}-${index}`}>
                      <button type="button" className="maintenance-work-item__trigger" onClick={() => setOpenConceptKey(isConceptOpen ? "" : conceptKey)} aria-expanded={isConceptOpen} aria-controls={conceptMatchId} aria-label={`Ver todas las coincidencias de ${detail.concept}`}>
                        <span><IconCheck size={15} />{detail.concept}</span><span><strong>{formatCurrency(Number(detail.amount))}</strong><IconChevronDown size={16} /></span>
                      </button>
                      {isConceptOpen && <div className="maintenance-concept-matches" id={conceptMatchId}>
                        <header><strong>Coincidencias de «{detail.concept}»</strong><small>{matches.length} {matches.length === 1 ? "registro" : "registros"}</small></header>
                        <div role="table" aria-label={`Coincidencias de ${detail.concept}`}>
                          <div role="row" className="maintenance-concept-matches__head"><span role="columnheader">Fecha</span><span role="columnheader">Kilometraje</span><span role="columnheader">Concepto</span><span role="columnheader">Importe</span></div>
                          {matches.map((match, matchIndex) => <div role="row" key={`${match.date}-${match.km}-${matchIndex}`}><span role="cell"><strong>{match.date}</strong></span><span role="cell">{formatKm(match.km)}</span><span role="cell">{match.concept}</span><span role="cell"><strong>{formatCurrency(match.amount)}</strong></span></div>)}
                        </div>
                      </div>}
                    </div>;
                  })}</div>
                </div>}
              </article>
            );
          })}
        </div>
        </div>
      </section>
      {reportsPlate && <MaintenanceReportsDialog vehicle={vehicles.find((vehicle) => vehicle.plate === reportsPlate) ?? vehicles[0]} reports={maintenanceReports.filter((report) => report.vehiclePlate === reportsPlate)} driverProfiles={driverProfiles} onClose={() => setReportsPlate("")} onSave={onSaveMaintenanceReport} onMarkReviewed={onMarkMaintenanceReportReviewed} />}
    </section>
  );
}

function AutomationsView({ enabled, setEnabled, notify }) {
  const automations = [
    { id: "whatsapp", icon: IconBrandWhatsapp, title: "Lecturas de WhatsApp", description: "Recibe imágenes, identifica vehículo y conductor y extrae el odómetro.", metric: "8 procesadas hoy", tone: "whatsapp" },
    { id: "email", icon: IconMail, title: "Facturas por correo", description: "Lee adjuntos, extrae concepto e importe y propone el vehículo asociado.", metric: "4 recibidas hoy", tone: "mail" },
    { id: "openai", icon: IconSparkles, title: "Validación con OpenAI", description: "Contrasta los datos extraídos y deriva a revisión los casos de baja confianza.", metric: "97,1% confianza", tone: "ai" },
  ];
  return (
    <section className="module-page">
      <PageIntro eyebrow="Flujos conectados" title="Automatizaciones" description="Controla cómo entra la información y qué ocurre cuando necesita revisión humana." action={<button className="primary-button" onClick={() => notify("Ejecución de prueba completada correctamente")}><IconRefresh size={18} />Probar flujos</button>} />
      <div className="automation-grid">{automations.map((automation) => {
        const Icon = automation.icon;
        return <article className="automation-card" key={automation.id}><header><span className={`automation-icon automation-icon--${automation.tone}`}><Icon size={22} /></span><label className="switch"><input type="checkbox" checked={enabled[automation.id]} onChange={() => setEnabled((current) => ({ ...current, [automation.id]: !current[automation.id] }))} /><span /></label></header><h2>{automation.title}</h2><p>{automation.description}</p><footer><StatusBadge status={enabled[automation.id] ? "Activo" : "Pausado"} /><small>{automation.metric}</small></footer></article>;
      })}</div>
      <section className="content-card activity-card">
        <header className="card-header"><div><h2>Actividad reciente</h2><p>Últimas ejecuciones automáticas.</p></div></header>
        <div className="activity-timeline">
          <div><span><IconBrandWhatsapp size={17} /></span><p><strong>Lectura procesada · 5754 MJV</strong><small>Fernando · Confianza IA 98%</small></p><time>04:08</time></div>
          <div><span><IconMail size={17} /></span><p><strong>Factura asociada · 5043 MLC</strong><small>FAC-2026-1874 · Aceite y filtros</small></p><time>20:42</time></div>
          <div><span><IconAlertTriangle size={17} /></span><p><strong>Lectura enviada a revisión</strong><small>David García · Confianza IA 92%</small></p><time>19:05</time></div>
        </div>
      </section>
    </section>
  );
}

function SettingsView({ settings, setSettings, notify }) {
  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  return (
    <section className="module-page settings-page">
      <PageIntro eyebrow="Configuración" title="Ajustes" description="Define los datos generales, umbrales de aviso y criterios de revisión automática." />
      <div className="settings-grid">
        <section className="content-card settings-card"><header><IconBuildingStore size={20} /><div><h2>Organización</h2><p>Datos visibles en informes y comunicaciones.</p></div></header><div className="settings-brand-preview"><img src="/brand/sobre-ruedas-logo.png" alt="Logotipo de SOBRE RUEDAS" /><span><strong>Logotipo de empresa</strong><small>Identidad visual activa en la aplicación</small></span></div><label>Nombre de la flota<input value={settings.company} onChange={(event) => update("company", event.target.value)} /></label><label>Correo de gestión<input type="email" value={settings.email} onChange={(event) => update("email", event.target.value)} /></label></section>
        <section className="content-card settings-card"><header><IconAlertTriangle size={20} /><div><h2>Alertas</h2><p>Cuándo debe intervenir el gestor.</p></div></header><label>Avisar antes de la revisión<div className="input-suffix"><input type="number" value={settings.serviceWarning} onChange={(event) => update("serviceWarning", event.target.value)} /><span>km</span></div></label><label>Revisar si la confianza baja de<div className="input-suffix"><input type="number" value={settings.lowConfidence} onChange={(event) => update("lowConfidence", event.target.value)} /><span>%</span></div></label></section>
        <section className="content-card settings-card"><header><IconShieldCheck size={20} /><div><h2>Seguridad</h2><p>Acceso y trazabilidad de cambios.</p></div></header><div className="settings-row"><span><strong>Registro de auditoría</strong><small>Conservar cambios durante 12 meses</small></span><StatusBadge status="Activo" /></div><div className="settings-row"><span><strong>Doble validación</strong><small>Para importes superiores a 1.000 €</small></span><StatusBadge status="Activo" /></div></section>
      </div>
      <UberIntegrationCard notify={notify} />
      <footer className="settings-actions"><button className="secondary-button" onClick={() => notify("Cambios descartados")}>Descartar</button><button className="primary-button" onClick={() => notify("Ajustes guardados")}><IconCheck size={18} />Guardar ajustes</button></footer>
    </section>
  );
}

function UberIntegrationCard({ notify }) {
  const [status, setStatus] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/uber/diagnostics", { headers: { Accept: "application/json" } });
      const payload = await response.json();
      setDiagnostics(payload);
      if (!response.ok) notify(payload.message || "No se pudo analizar el acceso de Uber");
    } catch (error) {
      setDiagnostics({ connected: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/uber/status", { headers: { Accept: "application/json" } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudo consultar Uber");
      setStatus(payload);
      if (payload.hasSession) await runDiagnostics();
    } catch (error) {
      setStatus({ configured: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/uber/disconnect", { method: "POST", headers: { Accept: "application/json" } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "No se pudo desconectar Uber");
      setDiagnostics(null);
      await refreshStatus();
      notify(payload.message || "Cuenta de Uber desconectada");
    } catch (error) {
      notify(error.message || "No se pudo desconectar la cuenta de Uber");
      setLoading(false);
    }
  };

  useEffect(() => { refreshStatus(); }, []);

  const configured = status?.configured;
  const connected = status?.hasSession || diagnostics?.connected;
  return (
    <section className="content-card settings-card settings-card--uber">
      <header><IconBrandUber size={20} /><div><h2>Uber Developer</h2><p>Conecta la cuenta de los conductores y analiza viajes, pagos y perfil desde el servidor.</p></div></header>
      <div className="uber-connection-status"><IconKey size={16} /><span><strong>{configured ? "Credenciales protegidas configuradas" : "Falta configurar las credenciales"}</strong><small>UBER_CLIENT_ID, UBER_CLIENT_SECRET y UBER_REDIRECT_URI se guardan solo en Vercel.</small></span><StatusBadge status={connected ? "Conectado" : configured ? "Listo" : "Pendiente"} /></div>
      <div className="uber-scope-list"><span>Permisos previstos</span><strong>partner.accounts · partner.payments · partner.trips</strong></div>
      {diagnostics?.access && <div className="uber-diagnostics" aria-live="polite"><strong>Diagnóstico de acceso</strong>{diagnostics.access.map((item) => <div key={item.id}><span>{item.label}<small>{item.scope}</small></span><StatusBadge status={item.ok ? "Disponible" : `HTTP ${item.status}`} /></div>)}</div>}
      {diagnostics?.message && <p className="uber-inline-message">{diagnostics.message}</p>}
      <footer className="uber-card-actions"><button className="secondary-button" type="button" onClick={refreshStatus} disabled={loading}><IconRefresh size={16} />Actualizar</button>{configured && !connected && <button className="primary-button" type="button" onClick={() => { window.location.assign("/api/uber/authorize"); }}><IconBrandUber size={16} />Conectar Uber</button>}{connected && <><button className="secondary-button" type="button" onClick={disconnect} disabled={loading}><IconX size={16} />Desconectar</button><button className="primary-button" type="button" onClick={runDiagnostics} disabled={loading}><IconSearch size={16} />Analizar acceso</button></>}</footer>
      <a className="uber-privacy-link" href="/privacidad" target="_blank" rel="noreferrer">Ver política de privacidad de SOBRE RUEDAS</a>
      <small className="uber-security-note">Nunca pegues aquí el secreto: el navegador no lo recibe y el repositorio no lo almacena.</small>
    </section>
  );
}

function HelpView({ openFaq, setOpenFaq, setModal }) {
  const faqs = [
    ["¿Cómo llega una lectura desde WhatsApp?", "El conductor envía la imagen al número de empresa. La automatización identifica matrícula y conductor, extrae kilómetros y marca los casos dudosos para revisión."],
    ["¿Cómo se asocia una factura a un vehículo?", "SOBRE RUEDAS lee el adjunto del correo, detecta matrícula, taller, concepto e importe y propone una asociación antes de incorporarla al historial."],
    ["¿Puedo corregir un dato extraído?", "Sí. Desde Lecturas o Facturas puedes abrir la revisión, corregir cualquier campo y validar el registro conservando la trazabilidad."],
  ];
  return (
    <section className="module-page help-page">
      <PageIntro eyebrow="Centro de ayuda" title="¿En qué podemos ayudarte?" description="Guías rápidas para gestionar lecturas, facturas y revisiones." action={<button className="primary-button" onClick={() => setModal({ type: "support" })}><IconMessageCircle size={18} />Contactar soporte</button>} />
      <div className="help-grid">
        <section className="content-card faq-card"><header className="card-header"><div><h2>Preguntas frecuentes</h2><p>Respuestas sobre los flujos principales.</p></div></header>{faqs.map(([question, answer], index) => <article key={question}><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span>{question}</span>{openFaq === index ? <IconChevronUp size={19} /> : <IconChevronDown size={19} />}</button>{openFaq === index && <p>{answer}</p>}</article>)}</section>
        <aside className="content-card support-card"><span><IconHelpCircle size={25} /></span><h2>Soporte SOBRE RUEDAS</h2><p>Si una lectura, factura o mantenimiento no cuadra, revisamos el caso contigo.</p><div><IconClock size={18} /><span><strong>Lunes a viernes</strong><small>09:00–18:00</small></span></div><div><IconMail size={18} /><span><strong>soporte@sobreruedas.es</strong><small>Respuesta en menos de 4 horas</small></span></div><button className="secondary-button" onClick={() => setModal({ type: "support" })}>Abrir consulta</button></aside>
      </div>
    </section>
  );
}

function VehicleInspector({ selected, selectedDriver, selectedActivity, invoices, transactions = [], inspectorTab, setInspectorTab, setInspectorOpen, setModal, selectDriver, openShift, setOpenShift, notify }) {
  const remaining = selected.nextServiceKm - selected.odometer;
  return (
    <aside className="inspector" aria-label={`Detalle de ${selected.plate}`}>
      <header className="inspector-header"><div><span className="inspector-eyebrow">Vehículo seleccionado</span><VehiclePlateLabel vehicleOrPlate={selected} className="inspector-vehicle-plate" /><small>{selected.model}</small><UseBadge value={selected.use} /></div><button className="icon-button" aria-label="Cerrar detalle" onClick={() => setInspectorOpen(false)}><IconX size={21} /></button></header>
      {selected.use === "Profesional" ? (
        <div className="inspector-driver-picker"><span>Conductor</span><div>{selected.drivers.map((driver) => <button className={selectedDriver === driver ? "driver-pill driver-pill--active" : "driver-pill"} key={driver} onClick={() => selectDriver(selected, driver)}>{driver}</button>)}</div></div>
      ) : <div className="inspector-no-driver"><IconHome size={18} /><span>Sin conductor asociado</span></div>}
      <div className="inspector-tabs" role="tablist" aria-label="Información del vehículo">
        <button role="tab" aria-selected={inspectorTab === "Turnos"} className={inspectorTab === "Turnos" ? "active" : ""} onClick={() => setInspectorTab("Turnos")}>Actividad</button>
        <button role="tab" aria-selected={inspectorTab === "Mantenimiento"} className={inspectorTab === "Mantenimiento" ? "active" : ""} onClick={() => setInspectorTab("Mantenimiento")}>Mantenimiento</button>
        <button role="tab" aria-selected={inspectorTab === "Gasolina"} className={inspectorTab === "Gasolina" ? "active" : ""} onClick={() => setInspectorTab("Gasolina")}>Gasolina</button>
        <button role="tab" aria-selected={inspectorTab === "Gastos"} className={inspectorTab === "Gastos" ? "active" : ""} onClick={() => setInspectorTab("Gastos")}>Gastos</button>
      </div>
      <div className="inspector-scroll">
        {inspectorTab === "Turnos" && (
          <>
            <section className="driver-summary">
              <header><span><IconClock size={17} /><strong>{selected.use === "Profesional" ? selectedDriver : "Uso particular"}</strong></span><small>Hoy · {selectedActivity.time}</small></header>
              <div className="driver-metrics"><div><span>Km hoy</span><strong>{formatKm(selectedActivity.km)}</strong></div><div><span>Repostaje</span><strong>{formatCurrency(selectedActivity.cost)}</strong></div><div><span>Facturación</span><strong>{formatCurrency(selectedActivity.revenue)}</strong></div></div>
              <div className="billing-summary"><span>Acumulado mensual</span><strong>{formatCurrency(selectedActivity.monthRevenue)}</strong><small>{selectedActivity.monthTrips} viajes · Efectivo hoy {formatCurrency(selectedActivity.cash)}</small></div>
            </section>
            {selected.plate === "5043 MLC" && selected.use === "Profesional" && <figure className="odometer-proof"><img src="/assets/odometer-210735.jpg" alt={`Odómetro de ${selected.plate} con ${selected.odometer} kilómetros`} /><figcaption><IconBrandWhatsapp size={17} /><span><strong>Imagen recibida por WhatsApp</strong><small>Hoy · {selectedActivity.sentAt ?? "19:02"} · Confianza IA {selectedActivity.confidence ?? 98}%</small></span></figcaption></figure>}
            {selected.use === "Profesional" ? (
              <section className="shifts-section"><header><div><h2>Parte del conductor</h2><p>Datos del turno seleccionado</p></div><StatusBadge status="Recibido" /></header>{selected.shifts.filter((shift) => shift.driver === selectedDriver).map((shift) => {
                const expanded = openShift === shift.id;
                const consumption = (shift.liters / shift.km) * 100;
                return <article className={`shift-card ${shift.alert ? "shift-card--alert" : ""}`} key={shift.id}><button className="shift-toggle" onClick={() => setOpenShift(expanded ? "" : shift.id)} aria-expanded={expanded}><span className="shift-icon"><IconClock size={17} /></span><span><strong>{shift.label}</strong><small>{shift.time}</small></span><span><strong>{shift.km} km</strong><small>{formatCurrency(shift.cost)}</small></span>{expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}</button>{expanded && <div className="shift-detail"><div className="shift-metrics"><div><span>Km inicio</span><strong>{formatKm(shift.start)}</strong></div><div><span>Total acumulado</span><strong>{formatKm(shift.end)}</strong></div><div><span>Litros</span><strong>{shift.liters.toLocaleString("es-ES")} L</strong></div><div><span>Consumo</span><strong>{consumption.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L/100</strong></div></div>{shift.alert && <div className="inline-alert"><IconAlertTriangle size={16} /><span><strong>Consumo superior al habitual</strong>Revisar antes de validar.</span></div>}<button className="secondary-button full-button" onClick={() => notify(`Turno de ${shift.driver} validado`)}><IconCheck size={17} />Validar turno</button></div>}</article>;
              })}</section>
            ) : <section className="domestic-note"><IconHome size={21} /><span><strong>Uso particular</strong>Registro diario individual sin parte de turno obligatorio.</span></section>}
          </>
        )}
        {inspectorTab === "Mantenimiento" && <VehicleMaintenanceLedger vehicle={selected} invoices={invoices} onOpenInvoice={(invoice) => setModal({ type: "invoice", item: invoice })} />}
        {inspectorTab === "Gasolina" && <VehicleFuelLedger vehicle={selected} />}
        {inspectorTab === "Gastos" && <VehicleExpenses vehicle={selected} transactions={transactions} />}
        <section className="next-service"><span className={remaining <= 4500 ? "urgent" : ""}><IconTools size={18} /><strong>{formatKm(remaining)} restantes</strong></span><p>{selected.serviceDate} · objetivo {formatKm(selected.nextServiceKm)}</p></section>
      </div>
    </aside>
  );
}

function VehicleMaintenanceLedger({ vehicle, invoices, onOpenInvoice }) {
  const rows = maintenanceConceptRows.map((category) => {
    const maintenance = vehicle.maintenance.find((item) => matchesMaintenanceConcept(item.concept, category.matches));
    const invoiceMatches = (item) =>
      item.kind !== "gestoria" &&
      item.plate === vehicle.plate &&
      (matchesMaintenanceConcept(item.concept, category.matches) || item.items?.some((line) => matchesMaintenanceConcept(line.concept, category.matches)));
    const invoice = invoices.find((item) => invoiceMatches(item) && (!maintenance || item.date === maintenance.date))
      ?? invoices.find(invoiceMatches);
    const invoiceLine = invoice?.items?.find((line) => matchesMaintenanceConcept(line.concept, category.matches));
    return {
      ...category,
      maintenance,
      invoice,
      date: maintenance?.date ?? invoice?.date,
      amount: invoiceLine?.amount ?? maintenance?.amount ?? invoice?.amount,
    };
  });
  const registered = rows.filter((row) => row.date || row.invoice).length;

  return (
    <section className="inspector-ledger inspector-maintenance-ledger">
      <header className="inspector-ledger-heading">
        <span><IconTools size={18} /><strong>Mantenimiento por concepto</strong></span>
        <small>{registered} de {rows.length} registrados</small>
      </header>
      <div className="inspector-ledger-summary">
        <span>Historial de <VehiclePlateLabel vehicleOrPlate={vehicle} className="inspector-ledger__plate" /></span>
        <strong>{vehicle.maintenance.length} intervenciones</strong>
        <small>Último registro por cada concepto</small>
      </div>
      <div className="inspector-ledger-scroll">
        <table className="inspector-ledger-table">
          <caption className="sr-only">Mantenimiento de {vehicle.plate} organizado por concepto, fecha y factura</caption>
          <thead><tr><th>Concepto</th><th>Fecha</th><th>Factura</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className={!row.date && !row.invoice ? "is-empty" : ""}>
                <td><strong>{row.label}</strong>{row.maintenance && normalizeText(row.maintenance.concept) !== normalizeText(row.label) && <small>{row.maintenance.concept}</small>}</td>
                <td>{row.date ? <><strong>{row.date}</strong>{row.maintenance?.km && <small>{formatKm(row.maintenance.km)}</small>}</> : <span>—</span>}</td>
                <td>{row.invoice ? <><button className="invoice-link-button" onClick={() => onOpenInvoice(row.invoice)} aria-label={`Ver factura ${row.invoice.id} de ${row.label}`}><IconFileInvoice size={14} />Ver</button><small>{row.amount != null ? formatCurrency(Number(row.amount)) : row.invoice.id}</small></> : <span>—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="inspector-ledger-note">Selecciona «Ver» para consultar el documento y su desglose.</p>
    </section>
  );
}

function VehicleFuelLedger({ vehicle }) {
  const entries = vehicle.monthlyFuel ?? [];
  const totalLiters = entries.reduce((sum, entry) => sum + (entry.liters ?? 0), 0);
  const totalCost = entries.reduce((sum, entry) => sum + (entry.cost ?? 0), 0);
  const averagePrice = totalLiters > 0 ? totalCost / totalLiters : 0;

  return (
    <section className="inspector-ledger fuel-ledger">
      <header className="inspector-ledger-heading">
        <span><IconGasStation size={18} /><strong>Gasolina</strong></span>
        <small>Julio 2026</small>
      </header>
      {vehicle.fuelSchedule?.length > 0 && (
        <div className="fuel-schedule-strip" aria-label={`Turnos de combustible de ${vehicle.plate}`}>
          {vehicle.fuelSchedule.map((shift) => <span key={shift.label}><strong>{shift.driver}</strong><small>{shift.label}</small></span>)}
        </div>
      )}
      <div className="fuel-ledger-summary">
        <div><span>Consumo mensual</span><strong>{totalLiters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</strong></div>
        <div><span>Gasto mensual</span><strong>{formatCurrency(totalCost)}</strong></div>
      </div>
      <div className="fuel-ledger-meta"><span><strong>{entries.length}</strong> repostajes</span><span>Media <strong>{formatCurrency(averagePrice)}/L</strong></span></div>
      <div className="fuel-daily-heading"><strong>Repostajes diarios</strong><small>Asignados automáticamente según la hora</small></div>
      <div className="inspector-ledger-scroll">
        <table className="inspector-ledger-table fuel-ledger-table">
          <caption className="sr-only">Repostajes de julio de 2026 para {vehicle.plate}, asignados por horario a cada conductor</caption>
          <thead><tr><th>Fecha y hora</th><th>Conductor</th><th>Litros</th><th>Importe</th></tr></thead>
          <tbody>
            {entries.map((entry) => {
              const assignment = getFuelAssignment(vehicle, entry);
              return (
              <tr key={`${entry.date}-${entry.time}`}>
                <td><strong>{entry.date.replace(" 2026", "")}</strong><small>{entry.time}</small></td>
                <td><strong>{assignment.driver}</strong><small>{assignment.label}</small></td>
                <td><strong>{entry.liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</strong></td>
                <td><strong>{formatCurrency(entry.cost)}</strong></td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
      <p className="inspector-ledger-note">El conductor se determina por la hora del repostaje y el turno configurado para este coche.</p>
    </section>
  );
}

function WorkshopHistory({ vehicle, onCreateInvoice }) {
  const counts = vehicle.maintenance.reduce((result, item) => ({ ...result, [item.concept]: (result[item.concept] ?? 0) + 1 }), {});
  const total = vehicle.maintenance.reduce((sum, item) => sum + item.amount, 0);
  return (
    <section className="workshop-history">
      <header><span><IconHistory size={18} /><strong>Historial de taller</strong></span><small>{vehicle.maintenance.length} intervenciones</small></header>
      <div className="workshop-total"><span>Importe registrado</span><strong>{formatCurrency(total)}</strong></div>
      {onCreateInvoice && <button className="secondary-button workshop-invoice-button" onClick={onCreateInvoice}><IconCamera size={17} />Crear factura desde una foto</button>}
      <div className="maintenance-table" role="table" aria-label={`Historial de taller de ${vehicle.plate}`}>
        {vehicle.maintenance.map((item) => <div className="maintenance-row" role="row" key={`${item.date}-${item.concept}`}><span><strong>{item.date}</strong><small>{formatKm(item.km)}</small></span><span><strong>{item.concept}</strong>{counts[item.concept] > 1 && <small className="repeat-mark">{counts[item.concept]} veces</small>}</span><strong>{formatCurrency(item.amount)}</strong></div>)}
      </div>
    </section>
  );
}

function VehicleExpenses({ vehicle, transactions = [] }) {
  const reportMonth = 6;
  const reportYear = 2026;
  const periodFactor = getReportPeriodFactor(reportMonth, reportYear);
  const periodStart = `${reportYear}-${String(reportMonth + 1).padStart(2, "0")}-01`;
  const periodTransactions = transactions.filter((transaction) => String(transaction.occurred_on ?? "").startsWith(periodStart.slice(0, 7)) && transaction.vehicle_plate === vehicle.plate);
  const transactionTotal = (type) => periodTransactions.filter((transaction) => transaction.type === type).reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
  const fuelAmount = transactionTotal("fuel") || getFuelCostForPeriod(vehicle, reportMonth, reportYear);
  const maintenanceAmount = transactionTotal("maintenance") || getMaintenanceAmountForPeriod(vehicle, reportMonth, reportYear);
  const gestoriaAmount = getGestoriaExpenseForPeriod(vehicle.plate, reportYear, reportMonth);
  const leasingAmount = getLeasingAmountForPeriod(vehicle.plate, reportYear, reportMonth);
  const licenseLoanAmount = getLicenseLoanAmountForPeriod(vehicle.plate);
  const inspectionAmount = getAnnualRecurringExpenseAmount("inspection", vehicle.plate, reportMonth);
  const driverRevenue = vehicle.use === "Profesional"
    ? vehicle.drivers.slice(0, 2).map((driver) => ({ driver, amount: Number(((getDriverDay(vehicle, driver).monthRevenue ?? 0) * periodFactor).toFixed(2)) }))
    : [];
  const commissionAmount = Number(driverRevenue.reduce((sum, entry) => sum + calculateNetDriverCommission(entry.driver, entry.amount), 0).toFixed(2));
  const intracommunityVatRate = getIntracommunityVatRateForPeriod(reportYear, reportMonth);
  const intracommunityVatAmount = Number((driverRevenue.reduce((sum, entry) => sum + entry.amount, 0) * intracommunityVatRate).toFixed(2));
  const payrollAmount = vehicle.use === "Profesional"
    ? Number(vehicle.drivers.slice(0, 2).reduce((sum, driver) => sum + getImportedPayrollForPeriod(driver, reportYear, reportMonth), 0).toFixed(2))
    : 0;
  const socialSecurityAmount = vehicle.use === "Profesional"
    ? [0, 1, 2].reduce((sum, index) => sum + getNetSocialSecurityAmount(vehicle.plate, index), 0)
    : 0;
  const amountsByKey = {
    fuel: fuelAmount,
    workshop: maintenanceAmount,
    accounting: gestoriaAmount,
    leasing: leasingAmount,
    "license-loan": licenseLoanAmount,
    inspection: inspectionAmount,
    "social-security": socialSecurityAmount,
    payroll: payrollAmount,
    "driver-commission": commissionAmount,
    "eu-vat": intracommunityVatAmount,
  };
  const expenses = expenseCategories.map((category) => ({ ...category, cadence: category.canonicalKey === "leasing" ? getLeasingCadence(vehicle.plate, reportYear, reportMonth) : category.canonicalKey === "license-loan" ? getLicenseLoanCadence(vehicle.plate) : category.canonicalKey === "inspection" ? getAnnualRecurringExpenseCadence("inspection") : category.canonicalKey === "eu-vat" ? (intracommunityVatRate > 0 ? `${Math.round(intracommunityVatRate * 100)}% desde enero de 2025` : "0% anterior a enero de 2025") : category.cadence, amount: Number((amountsByKey[category.canonicalKey] ?? 0).toFixed(2)) }));
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const operating = expenses.filter((expense) => ["fuel", "workshop", "driver-commission"].includes(expense.canonicalKey) || ["Limpieza coche", "Varios"].includes(expense.label)).reduce((sum, expense) => sum + expense.amount, 0);
  const fixed = total - operating;
  const totalRevenue = driverRevenue.reduce((sum, entry) => sum + entry.amount, 0);
  const profitMargin = totalRevenue - total;
  const marginPercent = totalRevenue > 0 ? (profitMargin / totalRevenue) * 100 : 0;

  return (
    <section className="vehicle-expenses">
      <header>
        <div><span><IconCurrencyEuro size={18} /><strong>Gastos del vehículo</strong></span><small>Julio 2026</small></div>
      </header>
      <div className="vehicle-margin-summary">
        <div><span>Facturación conjunta</span><strong>{formatCurrency(totalRevenue)}</strong><small>Dos conductores</small></div>
        <i>−</i>
        <div><span>Gastos del coche</span><strong>{formatCurrency(total)}</strong><small>Todos los conceptos</small></div>
        <i>=</i>
        <div className={profitMargin >= 0 ? "positive" : "negative"}><span>Margen de beneficio</span><strong>{formatCurrency(profitMargin)}</strong><small>{totalRevenue > 0 ? `${marginPercent.toLocaleString("es-ES", { maximumFractionDigits: 1 })}% sobre facturación` : "Sin facturación asignada"}</small></div>
      </div>
      <div className="driver-revenue-summary">
        <header><span>Facturación mensual por conductor</span><strong>{formatCurrency(totalRevenue)}</strong></header>
        {driverRevenue.map((entry) => <div key={entry.driver}><span>{entry.driver}</span><strong>{formatCurrency(entry.amount)}</strong></div>)}
      </div>
      <div className="expense-breakdown"><div><span>Fijos y fiscales</span><strong>{formatCurrency(fixed)}</strong></div><div><span>Operativos</span><strong>{formatCurrency(operating)}</strong></div></div>
      <div className="expense-table" role="table" aria-label={`Gastos de ${vehicle.plate} en julio de 2026`}>
        <div className="expense-row expense-row--header" role="row"><span>Categoría</span><span>Periodo</span><span>Importe</span></div>
        {expenses.map((expense) => <div className="expense-row" role="row" key={expense.canonicalKey ?? expense.label}><span role="cell"><strong>{expense.label}</strong></span><span role="cell"><small>{expense.amount === 0 && expense.label === "Nóminas" ? "Añadir manualmente" : expense.amount === 0 && expense.label === "Gestoría" ? "Sin factura en el periodo" : expense.amount === 0 ? "No aplica" : expense.cadence}</small></span><strong role="cell" className={expense.amount === 0 ? "expense-zero" : ""}>{formatCurrency(expense.amount)}</strong></div>)}
      </div>
      <p className="expense-note">Importes asociados únicamente a {vehicle.plate}. Los trimestrales y anuales muestran el pago registrado en el periodo.</p>
    </section>
  );
}

function AppModalV2({ modal, onClose, notify, onSaveInvoice, onSaveDocument, onSaveMaintenance, vehicles }) {
  const item = modal.item;
  const itemOwner = item?.owner ?? getVehicleOwner(item);
  const isReading = modal.type === "reading-review";
  const isInvoice = modal.type === "invoice";
  const isGestoriaInvoice = isInvoice && item?.kind === "gestoria";
  const isFuelInvoice = isInvoice && (item?.kind === "fuel" || item?.source === "Cuenta Plenergy");
  const isDriverDocument = modal.type === "driver-document";
  const isPhotoInvoice = modal.type === "invoice-upload";
  const isDocumentProcessing = modal.type === "document-processing";
  const isMaintenanceEdit = modal.type === "maintenance-edit";
  const isDriverDayEdit = modal.type === "driver-day-edit";
  const titles = { reading: "Registrar una lectura", "reading-review": "Revisar lectura", "invoice-upload": "Crear factura desde una foto", invoice: "Detalle de factura", "driver-document": "Foto original del conductor", "driver-day-edit": "Editar registro del día", "maintenance-edit": "Editar intervención", support: "Contactar con soporte" };
  const complete = (message) => { notify(message); onClose(); };
  if (isDocumentProcessing) titles[modal.type] = `${documentCategoryLabels[modal.category] ?? "Documento"} · Análisis IA`;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`modal ${isPhotoInvoice ? "modal--invoice-photo" : ""}${isDocumentProcessing ? " modal--document-processing" : ""}${isDriverDocument ? " modal--driver-document" : ""}${isDriverDayEdit ? " modal--driver-day-edit" : ""}${isMaintenanceEdit ? " modal--maintenance-edit" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header><div><span>{isDriverDocument ? "ARCHIVO DEL DÍA" : "Acción rápida"}</span><h2 id="modal-title">{isFuelInvoice ? "Ticket de gasolina" : isGestoriaInvoice ? "Factura de gestoría" : titles[modal.type]}</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar ventana"><IconX size={21} /></button></header>
        {isReading && <><div className="review-banner"><IconSparkles size={21} /><span><strong>Extracción completada</strong><small>Confianza IA {item.confidence}% · Revisa antes de validar</small></span></div><div className="form-grid"><label>Vehículo<input defaultValue={item.plate} /></label><label>Conductor<input defaultValue={item.driver} /></label><label>Odómetro total<input defaultValue={item.total} /></label><label>Kilómetros diarios<input defaultValue={item.daily} /></label></div></>}
        {isInvoice && <><div className="invoice-preview"><IconFileInvoice size={30} /><span><strong>{item.documentNumber ?? item.id}</strong><small>{item.provider} · {item.date}</small></span><strong>{formatCurrency(item.amount)}</strong></div>{item.imageSrc ? <figure className="invoice-document-photo"><img src={item.imageSrc} alt={`Documento de ${item.provider} para ${item.plate || item.plateReference || "la flota"}, ${item.date}`} /><figcaption>Documento adjunto · vista previa</figcaption></figure> : item.filePath ? <PrivateDocumentAttachment item={item} /> : null}{isGestoriaInvoice && !item.imageSrc && !item.filePath && <div className="invoice-source-file"><IconMail size={17} /><span><strong>Adjunto rescatado del correo</strong><small>{item.sourceFile || "Archivo de Gestoría Durán Rivas"} · {item.sourceAccount}</small></span></div>}<dl><div><dt>Vehículo</dt><dd>{item.plate || `Sin matrícula${item.plateReference ? ` · ref. ${item.plateReference}` : ""}`}</dd></div>{itemOwner && <div><dt>Propietario</dt><dd>{itemOwner.name}<small>{[itemOwner.dni ? `DNI ${itemOwner.dni}` : "", itemOwner.location].filter(Boolean).join(" · ")}</small></dd></div>}{item.driver && <div><dt>Conductor</dt><dd>{item.driver}</dd></div>}{item.km && <div><dt>Kilometraje</dt><dd>{formatKm(item.km)}</dd></div>}{item.liters && <div><dt>Litros</dt><dd>{item.liters.toLocaleString("es-ES", { maximumFractionDigits: 1 })} L</dd></div>}{item.pricePerLiter && <div><dt>Precio/litro</dt><dd>{formatCurrency(item.pricePerLiter)}</dd></div>}<div><dt>Concepto</dt><dd>{item.concept}</dd></div>{item.periodKey && <div><dt>Periodo imputado</dt><dd>{item.periodKey}</dd></div>}<div><dt>Origen</dt><dd>{item.source}</dd></div><div><dt>Estado</dt><dd><StatusBadge status={item.status} /></dd></div></dl>{item.items?.length > 0 && <InvoiceLinesTable date={item.date} items={item.items} />}</>}
        {isDriverDocument && <><div className="driver-document-context"><IconCamera size={20} /><span><strong>{item.concept}</strong><small>{item.driver} · {item.date} · {item.fileName}</small></span></div><PrivateDocumentAttachment item={item} /></>}
        {isDriverDayEdit && <DriverDayEditWorkflow item={item} onCancel={onClose} />}
        {isMaintenanceEdit && <MaintenanceEditWorkflow item={item} onCancel={onClose} onSave={(values) => { const saved = onSaveMaintenance?.(values); if (saved !== false) complete("Intervención actualizada y reordenada por fecha"); }} />}
        {modal.type === "reading" && <div className="upload-zone"><IconBrandWhatsapp size={30} /><strong>Añadir lectura manual</strong><p>Selecciona una imagen del odómetro o introduce los datos manualmente.</p><button className="secondary-button"><IconUpload size={17} />Seleccionar imagen</button></div>}
        {isPhotoInvoice && <InvoicePhotoWorkflow initialPlate={modal.plate} vehicles={vehicles} onCancel={onClose} onSave={async (invoice) => { const saved = await onSaveInvoice(invoice); if (saved !== false) complete("Factura guardada; Mantenimiento y Gastos se han actualizado"); }} />}
        {isDocumentProcessing && <DocumentProcessingWorkflow category={modal.category} source={modal.source} file={modal.file} defaultVehicle={modal.selectedPlate} defaultDate={modal.defaultDate} recordType={modal.recordType} driverId={modal.driverId} onCancel={onClose} onSave={async (document) => { const saved = await onSaveDocument({ ...document, recordType: modal.recordType || document.recordType }); if (saved === false || saved?.ok === false) return saved; complete("Documento procesado y guardado"); return { ok: true }; }} />}
        {modal.type === "support" && <div className="support-form"><label>Asunto<input placeholder="Describe brevemente el problema" /></label><label>Mensaje<textarea placeholder="Cuéntanos qué necesitas revisar" rows={5} /></label></div>}
        {!isPhotoInvoice && !isDocumentProcessing && !isDriverDocument && !isDriverDayEdit && !isMaintenanceEdit && <footer><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={() => complete(isReading ? "Lectura validada correctamente" : isFuelInvoice ? "Ticket de gasolina revisado" : isInvoice ? "Factura revisada" : modal.type === "support" ? "Consulta enviada a soporte" : "Archivo preparado para procesar")}><IconCheck size={18} />{isReading ? "Validar lectura" : isFuelInvoice ? "Cerrar ticket" : isInvoice ? "Marcar revisada" : modal.type === "support" ? "Enviar consulta" : "Continuar"}</button></footer>}
      </section>
    </div>
  );
}

function PrivateDocumentAttachment({ item }) {
  const [state, setState] = useState({ status: "loading", url: "", message: "" });
  useEffect(() => {
    let active = true;
    if (!supabase || !item.filePath) {
      setState({ status: "error", url: "", message: "El justificante no está disponible." });
      return undefined;
    }
    supabase.storage.from("documents").createSignedUrl(item.filePath, 10 * 60)
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data?.signedUrl) setState({ status: "error", url: "", message: error?.message || "No se ha podido abrir el justificante." });
        else setState({ status: "ready", url: data.signedUrl, message: "" });
      })
      .catch((error) => { if (active) setState({ status: "error", url: "", message: error.message || "No se ha podido abrir el justificante." }); });
    return () => { active = false; };
  }, [item.filePath]);

  if (state.status === "loading") return <div className="invoice-private-document invoice-private-document--loading" role="status"><IconSparkles size={18} /><span><strong>Preparando justificante privado</strong><small>{item.fileName || "Documento del conductor"}</small></span></div>;
  if (state.status === "error") return <div className="invoice-private-document invoice-private-document--error" role="alert"><IconAlertTriangle size={18} /><span><strong>No se ha podido mostrar el justificante</strong><small>{state.message}</small></span></div>;
  const isImage = String(item.mimeType ?? "").startsWith("image/");
  if (isImage) return <figure className="invoice-document-photo invoice-document-photo--private"><a href={state.url} target="_blank" rel="noreferrer" aria-label={`Abrir justificante original ${item.fileName || ""}`}><img src={state.url} alt={`Ticket original de ${item.provider} para ${item.plate}, ${item.date}`} /></a><figcaption><span>Justificante original archivado</span><a href={state.url} target="_blank" rel="noreferrer">Abrir a tamaño completo</a></figcaption></figure>;
  return <div className="invoice-private-document"><IconFileInvoice size={20} /><span><strong>Justificante original archivado</strong><small>{item.fileName || "Documento PDF"}</small></span><a href={state.url} target="_blank" rel="noreferrer">Abrir documento</a></div>;
}

function DriverBillingMonthTick({ x, y, payload }) {
  const month = payload?.payload?.shortLabel ?? String(payload?.value ?? "").split(" ")[0];
  const year = payload?.payload?.year ?? String(payload?.value ?? "").split(" ").slice(-1)[0];
  const shortYear = String(year).slice(-2);
  const verticalLabel = `${String(month).toUpperCase()} ${shortYear}`;
  return (
    <g className="driver-billing-month-tick" transform={`translate(${x},${y + 9}) rotate(-90)`}>
      <text x="0" y="0" textAnchor="end" fill="#526783" fontSize="18" fontWeight="900" letterSpacing="0.2">
        {verticalLabel}
      </text>
    </g>
  );
}

function DriverBillingBarValueLabel({ x, y, width, height, value }) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || !Number.isFinite(Number(x)) || !Number.isFinite(Number(y)) || !Number.isFinite(Number(width)) || !Number.isFinite(Number(height))) return null;
  const centerX = Number(x) + Number(width) / 2;
  const centerY = Number(y) + Number(height) / 2;
  const label = formatCurrency(numericValue);
  const fontSize = Math.max(9, Math.min(21, Number(width) * 0.6, Number(height) * 0.18));
  return (
    <text
      x={centerX}
      y={centerY}
      fill="#fff"
      fontSize={fontSize}
      fontWeight="900"
      textAnchor="middle"
      dominantBaseline="central"
      transform={`rotate(-90 ${centerX} ${centerY})`}
      style={{ paintOrder: "stroke", stroke: "rgba(10,55,132,.28)", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" }}
    >
      {label}
    </text>
  );
}

function MaintenanceEditWorkflow({ item, onCancel, onSave }) {
  const [dateIso, setDateIso] = useState(() => item.dateIso || getMaintenanceDateInputValue(item));
  const [km, setKm] = useState(() => Number.isFinite(Number(item.km)) ? Number(item.km) : "");
  const [error, setError] = useState("");

  const save = () => {
    const normalizedKm = Number(km);
    if (!isMaintenanceDate(dateIso)) {
      setError("Introduce una fecha válida para la intervención.");
      return;
    }
    if (!Number.isFinite(normalizedKm) || normalizedKm < 0) {
      setError("Introduce un kilometraje válido igual o superior a cero.");
      return;
    }
    setError("");
    onSave({ editKey: item.editKey || item.maintenanceEditKey || item.invoiceId, dateIso, km: normalizedKm });
  };

  return (
    <div className="maintenance-edit-workflow">
      <div className="maintenance-edit-context">
        <span>Intervención seleccionada</span>
        <strong>{item.concept}</strong>
        <small>{item.plate || item.vehiclePlate} · {formatCurrency(Number(item.amount) || 0)}</small>
      </div>
      <p className="maintenance-edit-help">Modifica la fecha o los kilómetros. Al guardar, la intervención volverá a colocarse automáticamente en el orden cronológico del historial.</p>
      <div className="maintenance-edit-form">
        <label>Fecha de la intervención<input type="date" value={dateIso} onChange={(event) => setDateIso(event.target.value)} /></label>
        <label>Kilómetros del vehículo<input type="number" min="0" step="1" value={km} onChange={(event) => setKm(event.target.value)} /></label>
      </div>
      {error && <p className="maintenance-edit-error" role="alert">{error}</p>}
      <footer><button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button><button type="button" className="primary-button" onClick={save}><IconCheck size={18} />Guardar cambios</button></footer>
    </div>
  );
}

function DriverCircleReviewDialog({ review, profile, driverId, onClose, onSave }) {
  const category = review.recordKey === "billing" ? "billing" : "consumption";
  return <div className="modal-backdrop" role="presentation">
    <section className="modal modal--document-processing modal--driver-document-review" role="dialog" aria-modal="true" aria-labelledby="driver-circle-review-title">
      <header className="modal__header"><div><span>REGISTRO DEL CONDUCTOR</span><h2 id="driver-circle-review-title">Revisar documento</h2><p>{profile.full_name} · {canonicalizeVehiclePlate(profile.vehicle_plate)}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar revisión"><IconX size={19} /></button></header>
      <DocumentProcessingWorkflow category={category} source="upload" file={review.file} defaultVehicle={canonicalizeVehiclePlate(profile.vehicle_plate)} defaultDate={review.defaultDate} recordType={review.recordKey} driverId={driverId} onCancel={onClose} onSave={onSave} />
    </section>
  </div>;
}

function DocumentProcessingWorkflow({ category, source, file, defaultVehicle, defaultDate = "", recordType = "", driverId = "", onCancel, onSave }) {
  const controllerRef = useRef(null);
  const [stage, setStage] = useState("processing");
  const [progress, setProgress] = useState(5);
  const [previewUrl, setPreviewUrl] = useState("");
  const [preparedFile, setPreparedFile] = useState(file);
  const [fields, setFields] = useState(() => normalizeDocumentAnalysis(category, null, defaultVehicle));
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [saveState, setSaveState] = useState({ saving: false, message: "" });
  const [dateEditOpen, setDateEditOpen] = useState(false);
  const [dateWasEdited, setDateWasEdited] = useState(false);
  const applyContextDefaults = useCallback((nextFields) => {
    const normalizedRecordType = normalizeText(recordType);
    const isDriverBilling = category === "billing" && ["billing", "billing_daily"].includes(normalizedRecordType);
    const isDriverFuel = category === "consumption" && normalizedRecordType === "fuel";
    const isDriverDailyKm = category === "consumption" && ["daily-km", "partial-1", "kilometraje diario", "km diarios"].includes(normalizedRecordType);
    const isDriverTotalKm = category === "consumption" && ["total-km", "total", "odometer", "odometro", "kilometraje total", "km acumulados"].includes(normalizedRecordType);
    const isDriverConsumption = category === "consumption" && ["consumption", "consumption rate", "consumption_rate", "consumo"].includes(normalizedRecordType);
    const isDriverCapture = isDriverBilling || isDriverFuel || isDriverDailyKm || isDriverTotalKm || isDriverConsumption;

    // A document's printed date is useful for audit, but it must not silently
    // move a driver's entry to another day. Keep the capture/upload date in
    // the editable date field; an explicit edit later is preserved by state.
    if (isDriverCapture && defaultDate) {
      return nextFields.map((field) => {
        if (field.key === "date") return { ...field, value: defaultDate, confidence: 100 };
        if (isDriverConsumption && field.key === "consumptionCount" && (field.value === "" || field.value === null || field.value === undefined)) return { ...field, value: 1, confidence: 100 };
        return field;
      });
    }

    const dateKeys = category === "billing" ? ["serviceDate", "issueDate", "date", "periodStart"] : ["date"];
    const hasDetectedDate = nextFields.some((field) => dateKeys.includes(field.key) && field.value);
    const detectedDate = nextFields.find((field) => ["date", "serviceDate", "issueDate", "periodStart"].includes(field.key) && field.value)?.value;
    const fallbackDate = defaultDate && !hasDetectedDate ? defaultDate : "";
    const defaultDateKey = isDriverBilling || category === "consumption" ? "date" : "serviceDate";
    const shouldApplyDateDefaults = isDriverBilling || Boolean(defaultDate && !hasDetectedDate);
    if (!shouldApplyDateDefaults && !isDriverConsumption) return nextFields;
    return nextFields.map((field) => {
      if (shouldApplyDateDefaults && field.key === defaultDateKey && !field.value) return { ...field, value: detectedDate || fallbackDate };
      if (isDriverConsumption && field.key === "consumptionCount" && (field.value === "" || field.value === null || field.value === undefined)) return { ...field, value: 1, confidence: 100 };
      return field;
    });
  }, [category, defaultDate, recordType]);

  useEffect(() => {
    const isImage = validateDocumentFile(file, source).kind === "image";
    if (!isImage) return undefined;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, source]);

  const runAnalysis = useCallback(async () => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setStage("processing");
    setProgress(8);
    setError(null);
    try {
      const validation = validateDocumentFile(file, source);
      if (!validation.valid) {
        const validationError = new Error(validation.message);
        validationError.code = "INVALID_DOCUMENT";
        throw validationError;
      }
      if (navigator.onLine === false) {
        const offlineError = new Error("No hay conexión. Conéctate a internet para enviar el documento a la IA.");
        offlineError.code = "OFFLINE";
        throw offlineError;
      }
      setProgress(20);
      const optimized = await prepareDocumentFile(file);
      if (controller.signal.aborted) return;
      setPreparedFile(optimized);
      setProgress(35);
      const dataUrl = await readFileAsDataUrl(optimized);
      if (controller.signal.aborted) return;
      if (new TextEncoder().encode(dataUrl).byteLength > documentMaxRequestSize) {
        const sizeError = new Error("El documento sigue siendo demasiado grande después de optimizarlo. Usa una imagen más pequeña o un PDF ligero.");
        sizeError.code = "DOCUMENT_TOO_LARGE";
        throw sizeError;
      }
      setProgress(48);
      const response = await fetch("/api/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ category, fileName: optimized.name, fileType: optimized.type || file.type, dataUrl }),
        signal: controller.signal,
      });
      let responseBody = null;
      try {
        responseBody = await response.json();
      } catch {
        responseBody = null;
      }
      if (!response.ok) {
        const serviceError = new Error(responseBody?.message || "No se ha podido analizar el documento.");
        serviceError.code = responseBody?.code || `HTTP_${response.status}`;
        throw serviceError;
      }
      if (controller.signal.aborted) return;
      setProgress(82);
      setAnalysis(responseBody);
      const normalizedFields = applyContextDefaults(normalizeDocumentAnalysis(category, responseBody, defaultVehicle));
      setFields(category === "billing" && ["billing", "billing_daily"].includes(normalizeText(recordType))
        ? normalizeDriverBillingAnalysisFields(normalizedFields)
        : normalizedFields);
      setProgress(100);
      setStage("review");
    } catch (caughtError) {
      if (controller.signal.aborted || caughtError?.name === "AbortError") {
        setStage("cancelled");
        setError({ code: "CANCELLED", message: "Has cancelado el análisis. No se ha guardado ningún dato." });
      } else {
        setStage("error");
        setError({ code: caughtError?.code || "PROCESSING_ERROR", message: caughtError?.message || "No se ha podido procesar el documento." });
      }
    }
  }, [applyContextDefaults, category, defaultVehicle, file, recordType, source]);

  useEffect(() => {
    runAnalysis();
    return () => controllerRef.current?.abort();
  }, [runAnalysis]);

  const normalizedRecordType = normalizeText(recordType);
  const isDriverFuelReview = category === "consumption" && normalizedRecordType === "fuel";
  const isDriverDailyKmReview = category === "consumption" && ["daily-km", "partial-1", "kilometraje diario", "km diarios"].includes(normalizedRecordType);
  const isDriverTotalKmReview = category === "consumption" && ["total-km", "total", "odometer", "odometro", "kilometraje total", "km acumulados"].includes(normalizedRecordType);
  const isDriverMileageReview = isDriverDailyKmReview || isDriverTotalKmReview;
  const isDriverConsumptionReview = category === "consumption" && ["consumption", "consumption rate", "consumption_rate", "consumo"].includes(normalizedRecordType);
  const isDriverBillingReview = category === "billing" && ["billing", "billing_daily"].includes(normalizedRecordType);
  const isDriverCaptureReview = isDriverFuelReview || isDriverMileageReview || isDriverConsumptionReview || isDriverBillingReview;
  const isOptionalDriverDateReview = isDriverCaptureReview && !isDriverFuelReview && !isDriverBillingReview;
  const driverDateField = fields.find((field) => field.key === "date");
  const driverBillingReviewLabels = { date: "Día", connection: "Conexión", trips: "Viajes", points: "Puntos", netAmount: "Precio neto", promotions: "Promociones", tips: "Propina", refunds: "Reembolsos", cashCollected: "Efectivo cobrado" };
  const driverBillingReviewKeys = ["date", "connection", "trips", "points", "netAmount", "promotions", "tips", "refunds", "cashCollected"];
  const driverMileageReviewKeys = isDriverDailyKmReview ? ["dailyKm", "vehicle"] : ["odometerKm", "vehicle"];
  const driverMileageReviewLabels = { dailyKm: "Kilometraje diario", odometerKm: "Kilómetros acumulados", vehicle: "Vehículo" };
  const driverConsumptionReviewKeys = ["consumption", "vehicle", "consumptionCount"];
  const driverConsumptionReviewLabels = { consumption: "Consumo registrado", vehicle: "Vehículo", consumptionCount: "Cantidad de consumos registrados en este día" };
  const reviewFields = isDriverFuelReview
    ? fields.filter((field) => field.key === "date" || field.key === "cost").map((field) => field.key === "cost" ? { ...field, label: "Importe total" } : field)
    : isDriverMileageReview
      ? driverMileageReviewKeys.map((key) => fields.find((field) => field.key === key)).filter(Boolean).map((field) => ({ ...field, label: driverMileageReviewLabels[field.key] ?? field.label }))
    : isDriverConsumptionReview
      ? driverConsumptionReviewKeys.map((key) => fields.find((field) => field.key === key)).filter(Boolean).map((field) => ({ ...field, label: driverConsumptionReviewLabels[field.key] ?? field.label }))
    : isDriverBillingReview
      ? driverBillingReviewKeys.map((key) => fields.find((field) => field.key === key)).filter(Boolean).map((field) => ({ ...field, label: driverBillingReviewLabels[field.key] ?? field.label }))
      : fields.filter((field) => !["baseNetAmount", "promotions", "consumptionCount"].includes(field.key));
  const workflowLabel = isDriverFuelReview ? "Repostaje" : isDriverDailyKmReview ? "Kilómetros diarios" : isDriverTotalKmReview ? "Kilómetros acumulados" : isDriverConsumptionReview ? "Consumo registrado" : documentCategoryLabels[category];
  const lowConfidenceFields = reviewFields.filter((field) => field.confidence < 80);
  const overallConfidence = Math.round(Number(analysis?.overallConfidence) || (reviewFields.length ? reviewFields.reduce((total, field) => total + field.confidence, 0) / reviewFields.length : 0));
  const updateField = (key, value) => setFields((current) => {
    let next = current.map((field) => field.key === key ? { ...field, value } : field);
    if (!isDriverBillingReview) return next;
    const fieldAmount = (fieldKey) => getDriverDocumentNumber(next.find((field) => field.key === fieldKey)?.value);
    if (key === "netAmount") {
      const finalNetAmount = Math.max(0, fieldAmount("netAmount"));
      const promotions = fieldAmount("promotions");
      next = next.map((field) => field.key === "baseNetAmount" ? { ...field, value: Number(Math.max(0, finalNetAmount - promotions).toFixed(2)) } : field);
      next = next.map((field) => field.key === "total" ? { ...field, value: Number((finalNetAmount + fieldAmount("tips")).toFixed(2)) } : field);
    } else if (key === "promotions") {
      const baseNetField = next.find((field) => field.key === "baseNetAmount");
      const baseNetAmount = baseNetField?.value === "" || baseNetField?.value === null || baseNetField?.value === undefined ? fieldAmount("netAmount") : fieldAmount("baseNetAmount");
      const finalNetAmount = Number((baseNetAmount + fieldAmount("promotions")).toFixed(2));
      next = next.map((field) => field.key === "baseNetAmount" ? { ...field, value: baseNetAmount } : field);
      next = next.map((field) => field.key === "netAmount" ? { ...field, value: finalNetAmount } : field);
      next = next.map((field) => field.key === "total" ? { ...field, value: Number((finalNetAmount + fieldAmount("tips")).toFixed(2)) } : field);
    } else if (key === "tips") {
      next = next.map((field) => field.key === "total" ? { ...field, value: Number((fieldAmount("netAmount") + fieldAmount("tips")).toFixed(2)) } : field);
    }
    return next;
  });
  const stopAnalysis = () => {
    controllerRef.current?.abort();
    setError({ code: "CANCELLED", message: "Has cancelado el análisis. No se ha guardado ningún dato." });
    setStage("cancelled");
  };
  const save = async () => {
    if (saveState.saving) return;
    setSaveState({ saving: true, message: "" });
    try {
      const result = await onSave({
        id: `DOC-${String(Date.now()).slice(-8)}`,
        category,
        driverId,
        source,
        file: preparedFile,
        originalFile: file,
        vehiclePlate: defaultVehicle,
        fileName: preparedFile?.name || file.name,
        fileType: preparedFile?.type || file.type,
        fields: fieldsToRecord(fields),
        fieldConfidence: Object.fromEntries(fields.map((field) => [field.key, field.confidence])),
        overallConfidence,
        warnings: analysis?.warnings ?? [],
        lowConfidence: lowConfidenceFields.length > 0,
        recordType,
        dateWasEdited,
      });
      if (result === false || result?.ok === false) {
        setSaveState({ saving: false, message: result?.message || "No se han podido guardar los cambios. Revisa los datos e inténtalo de nuevo." });
      }
    } catch (caughtError) {
      setSaveState({ saving: false, message: caughtError?.message || "No se han podido guardar los cambios." });
    }
  };

  const renderPreview = () => previewUrl
    ? <img src={previewUrl} alt={`Vista previa de ${file.name}`} />
    : <span className="document-processing-preview__file"><IconFileInvoice size={34} /><strong>Documento PDF</strong></span>;

  return (
    <div className="document-processing-workflow">
      <header className="document-processing-file">
        <span className="document-processing-file__icon">{category === "billing" ? <IconFileInvoice size={20} /> : isDriverMileageReview ? <IconGauge size={20} /> : isDriverConsumptionReview ? <IconChartBar size={20} /> : <IconGasStation size={20} />}</span>
        <span><strong>{file.name}</strong><small>{workflowLabel} · {formatFileSize(file.size)} · {source === "camera" ? "Cámara" : "Selector del dispositivo"}</small></span>
      </header>

      {stage === "processing" && <section className="document-processing-state" aria-live="polite">
        <span className="document-processing-state__spinner"><IconSparkles size={26} /></span>
        <strong>Analizando documento con IA</strong>
        <p>Preparando la imagen, ejecutando OCR y clasificando los campos de {workflowLabel.toLocaleLowerCase("es")}.</p>
        <div className="document-processing-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}><i style={{ width: `${progress}%` }} /></div>
        <small>{progress < 40 ? "Optimizando archivo…" : progress < 80 ? "Extrayendo información…" : "Preparando la revisión…"} {progress}%</small>
      </section>}

      {stage === "error" && <section className="document-processing-state document-processing-state--error" role="alert">
        <span className="document-processing-state__spinner"><IconAlertTriangle size={26} /></span>
        <strong>{error?.code === "AI_NOT_CONFIGURED" ? "Servicio de IA no configurado" : "No se ha podido procesar"}</strong>
        <p>{error?.message}</p>
        {error?.code === "OFFLINE" && <small>Comprueba la conexión antes de volver a intentarlo.</small>}
        {error?.code === "AI_NOT_CONFIGURED" && <small>El servidor necesita la variable OPENAI_API_KEY para analizar documentos.</small>}
        <button type="button" className="secondary-button" onClick={runAnalysis}><IconRefresh size={17} />Reintentar</button>
      </section>}

      {stage === "cancelled" && <section className="document-processing-state document-processing-state--cancelled" role="status">
        <span className="document-processing-state__spinner"><IconX size={26} /></span>
        <strong>Análisis cancelado</strong>
        <p>{error?.message}</p>
        <button type="button" className="secondary-button" onClick={runAnalysis}><IconRefresh size={17} />Volver a analizar</button>
      </section>}

      {stage === "review" && <section className="document-review-layout">
        <aside className="document-review-preview">
          {renderPreview()}
          <span><strong>Extracción completada</strong><small>Confianza general {overallConfidence}%</small></span>
        </aside>
        <div className="document-review-fields">
          {lowConfidenceFields.length > 0 && <div className="document-review-warning" role="status"><IconAlertTriangle size={17} /><span><strong>Revisión necesaria</strong><small>Los campos marcados en ámbar tienen una confianza inferior al 80%.</small></span></div>}
          <div className="document-review-heading"><div><h3>{isDriverFuelReview ? "Importe del repostaje" : isDriverDailyKmReview ? "Kilometraje diario" : isDriverTotalKmReview ? "Kilómetros acumulados" : isDriverConsumptionReview ? "Consumo registrado" : isDriverBillingReview ? "Estadísticas del día" : "Datos clasificados"}</h3><p>{isDriverFuelReview ? "Comprueba la fecha y el importe total antes de archivarlo." : isDriverMileageReview ? "Comprueba el kilometraje y el vehículo antes de archivarlo." : isDriverConsumptionReview ? "Comprueba el consumo, el vehículo y la cantidad registrada para este día." : isDriverBillingReview ? "Comprueba estos datos de la captura antes de archivarlos." : "Revisa y corrige antes de guardarlos en la aplicación."}</p></div><span className="document-review-confidence">{overallConfidence}% IA</span></div>
          {isOptionalDriverDateReview && <div className="document-review-date-control">
            {!dateEditOpen
              ? <button type="button" className="secondary-button" onClick={() => setDateEditOpen(true)}>Cambiar fecha</button>
              : <label className="document-review-date-control__field"><span><strong>Fecha del registro</strong><small>Solo cambia la fecha si este documento corresponde a otro día.</small></span><input type="date" value={driverDateField?.value ?? defaultDate} disabled={saveState.saving} onChange={(event) => { setDateWasEdited(true); updateField("date", event.target.value); }} /></label>}
          </div>}
          <div className="document-fields-grid">
            {reviewFields.map((field) => {
              const low = field.confidence < 80;
              const value = field.value ?? "";
              return <label className={`document-field${low ? " document-field--low-confidence" : ""}`} key={field.key}>
                <span><strong>{field.label}</strong><small>{field.confidence}%{low ? " · Revisar" : ""}</small></span>
                {field.suffix ? <div className="document-field__input"><input type={field.type} min={field.min} step={field.step} value={value} placeholder={field.placeholder} disabled={saveState.saving} onChange={(event) => { if (field.key === "date") setDateWasEdited(true); updateField(field.key, event.target.value); }} /><i>{field.suffix}</i></div> : <input type={field.type} min={field.min} step={field.step} value={value} placeholder={field.placeholder} disabled={saveState.saving} onChange={(event) => { if (field.key === "date") setDateWasEdited(true); updateField(field.key, event.target.value); }} />}
              </label>;
            })}
          </div>
          {analysis?.warnings?.length > 0 && <div className="document-review-notes"><strong>Avisos de la IA</strong><ul>{analysis.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul></div>}
        </div>
      </section>}

      {saveState.message && <div className="document-processing-save-error" role="alert"><IconAlertTriangle size={17} /><span>{saveState.message}</span></div>}
      <footer className="document-processing-actions">
        <button type="button" className="secondary-button" disabled={saveState.saving} onClick={stage === "processing" ? stopAnalysis : onCancel}>{stage === "processing" ? "Detener análisis" : "Cancelar"}</button>
        {stage === "review" && <button type="button" className="primary-button" disabled={saveState.saving} onClick={save}>{saveState.saving ? <IconRefresh className="document-processing-actions__spinner" size={18} /> : <IconCheck size={18} />}{saveState.saving ? "Guardando cambios…" : "Guardar cambios"}</button>}
        {(stage === "error" || stage === "cancelled") && <button type="button" className="primary-button" onClick={onCancel}>Cerrar</button>}
      </footer>
    </div>
  );
}

function InvoiceLinesTable({ date, items }) {
  return (
    <section className="invoice-lines-detail">
      <header><div><h3>Conceptos de la factura</h3><p>Desglose detectado en el documento.</p></div><strong>{formatCurrency(items.reduce((sum, line) => sum + Number(line.amount), 0))}</strong></header>
      <div className="invoice-lines-scroll">
        <table>
          <caption className="sr-only">Conceptos y precios de la factura</caption>
          <thead><tr><th>Fecha</th><th>Concepto</th><th>Precio</th></tr></thead>
          <tbody>{items.map((line, index) => <tr key={`${line.concept}-${index}`}><td>{date}</td><td>{line.concept}</td><td><strong>{formatCurrency(Number(line.amount))}</strong></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

function InvoicePhotoWorkflow({ initialPlate, vehicles, onCancel, onSave }) {
  const [stage, setStage] = useState("upload");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [date, setDate] = useState("2026-07-28");
  const [provider, setProvider] = useState("Taller AutoRápido S.L.");
  const [plate, setPlate] = useState(initialPlate ?? vehicles[0].plate);
  const [odometer, setOdometer] = useState(() => vehicles.find((vehicle) => vehicle.plate === (initialPlate ?? vehicles[0].plate))?.odometer ?? 0);
  const [lines, setLines] = useState([
    { id: "photo-line-1", concept: "Aceite motor 5W30", amount: 79.9 },
    { id: "photo-line-2", concept: "Filtro de aceite", amount: 18.5 },
    { id: "photo-line-3", concept: "Mano de obra", amount: 52 },
  ]);

  const total = lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const valid = provider.trim() && plate && lines.length > 0 && lines.every((line) => line.concept.trim() && Number(line.amount) >= 0);

  const preparePhoto = (file) => {
    if (!file) return;
    const validation = validateDocumentFile(file, "upload");
    if (!validation.valid || validation.kind !== "image") {
      setError(validation.valid ? "Selecciona una imagen JPG, PNG o WEBP para la factura." : validation.message);
      return;
    }
    setError("");
    setSelectedFile(file);
    setFileName(file.name);
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setPreview(String(reader.result));
      setStage("review");
    });
    reader.addEventListener("error", () => setError("No se ha podido leer la fotografía. Elige otra imagen e inténtalo de nuevo."));
    reader.readAsDataURL(file);
  };

  const updateLine = (id, field, value) => {
    setLines((current) => current.map((line) => line.id === id ? { ...line, [field]: field === "amount" ? Number(value) : value } : line));
  };

  const save = () => {
    const concepts = lines.map((line) => line.concept.trim());
    const compactConcept = concepts.length > 2 ? `${concepts.slice(0, 2).join(", ")} +${concepts.length - 2}` : concepts.join(", ");
    const displayDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`)).replace(".", "");
    onSave({
      id: `FAC-${date.slice(0, 4)}-${String(Date.now()).slice(-4)}`,
      date: displayDate,
      provider: provider.trim(),
      plate,
      km: Number(odometer),
      dateIso: date,
      concept: compactConcept,
      amount: total,
      source: "Foto",
      status: "Revisar",
      items: lines.map(({ concept, amount }) => ({ concept: concept.trim(), amount: Number(amount) })),
      file: selectedFile,
    });
  };

  if (stage === "upload") {
    return (
      <div className="invoice-photo-upload">
        <div className="upload-zone">
          <span className="upload-zone__icon"><IconCamera size={29} /></span>
          <strong>Fotografía la factura del taller</strong>
          <p>La imagen se procesará para detectar la fecha, el vehículo y cada concepto con su precio. Podrás corregirlo todo antes de guardarlo.</p>
          <div className="photo-actions">
            <label className="primary-button" htmlFor="invoice-camera"><IconCamera size={18} />Hacer una foto</label>
            <input id="invoice-camera" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => preparePhoto(event.target.files?.[0])} />
            <label className="secondary-button" htmlFor="invoice-gallery"><IconUpload size={17} />Elegir imagen</label>
            <input id="invoice-gallery" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => preparePhoto(event.target.files?.[0])} />
          </div>
          {error && <p className="invoice-photo-error" role="alert">{error}</p>}
          <button className="text-button" onClick={() => { setFileName("factura_taller_28-07-2026.jpg"); setStage("review"); }}>Probar con una factura de ejemplo</button>
        </div>
        <div className="invoice-workflow-actions"><button className="secondary-button" onClick={onCancel}>Cancelar</button></div>
      </div>
    );
  }

  return (
    <div className="invoice-photo-review">
      <div className="photo-review-layout">
        <aside className="photo-preview">
          {preview ? <img src={preview} alt="Fotografía de la factura seleccionada" /> : <span className="photo-preview__placeholder"><IconFileInvoice size={34} /><strong>Factura de ejemplo</strong></span>}
          <div><IconCamera size={17} /><span><strong>{fileName}</strong><small>Imagen preparada para revisión</small></span></div>
          <button className="text-button" onClick={() => { setError(""); setStage("upload"); }}>Cambiar fotografía</button>
        </aside>

        <section className="invoice-extraction">
          <div className="review-banner"><IconSparkles size={21} /><span><strong>Extracción completada</strong><small>Confianza IA 96% · Revisa los datos antes de guardar</small></span></div>
          <div className="invoice-meta-grid">
            <label>Fecha de factura<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
            <label>Vehículo<select value={plate} onChange={(event) => { const nextPlate = event.target.value; setPlate(nextPlate); setOdometer(vehicles.find((vehicle) => vehicle.plate === nextPlate)?.odometer ?? 0); }}>{vehicles.map((vehicle) => <option key={vehicle.plate} value={vehicle.plate}>{vehicle.plate} · {vehicle.model}</option>)}</select></label>
            <label>Kilometraje del vehículo<input type="number" min="0" step="1" value={odometer} onChange={(event) => setOdometer(event.target.value)} /></label>
            <label className="invoice-provider-field">Taller<input value={provider} onChange={(event) => setProvider(event.target.value)} /></label>
          </div>

          <div className="extracted-lines-header"><div><h3>Conceptos detectados</h3><p>Edita, elimina o añade líneas.</p></div><button className="secondary-button compact-button" onClick={() => setLines((current) => [...current, { id: `photo-line-${Date.now()}`, concept: "", amount: 0 }])}><IconPlus size={16} />Añadir concepto</button></div>
          <div className="invoice-lines-scroll">
            <table className="editable-invoice-table">
              <caption className="sr-only">Conceptos y precios extraídos de la fotografía</caption>
              <thead><tr><th>Fecha</th><th>Concepto</th><th>Precio</th><th><span className="sr-only">Eliminar</span></th></tr></thead>
              <tbody>{lines.map((line) => <tr key={line.id}><td><time dateTime={date}>{new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${date}T12:00:00`))}</time></td><td><input aria-label={`Concepto ${line.id}`} value={line.concept} onChange={(event) => updateLine(line.id, "concept", event.target.value)} /></td><td><label className="price-input"><input aria-label={`Precio de ${line.concept || "nuevo concepto"}`} type="number" min="0" step="0.01" value={line.amount} onChange={(event) => updateLine(line.id, "amount", event.target.value)} /><span>€</span></label></td><td><button className="icon-button delete-line-button" onClick={() => setLines((current) => current.filter((candidate) => candidate.id !== line.id))} aria-label={`Eliminar ${line.concept || "concepto"}`}><IconTrash size={17} /></button></td></tr>)}</tbody>
              <tfoot><tr><td colSpan={2}>Total factura</td><td colSpan={2}><strong>{formatCurrency(total)}</strong></td></tr></tfoot>
            </table>
          </div>
        </section>
      </div>
      <div className="invoice-workflow-actions"><button className="secondary-button" onClick={onCancel}>Cancelar</button><button className="primary-button" disabled={!valid} onClick={save}><IconCheck size={18} />Guardar factura</button></div>
    </div>
  );
}

function AppModal({ modal, onClose, notify }) {
  const item = modal.item;
  const isReading = modal.type === "reading-review";
  const isInvoice = modal.type === "invoice";
  const titles = { reading: "Registrar una lectura", "reading-review": "Revisar lectura", "invoice-upload": "Subir factura", invoice: "Detalle de factura", support: "Contactar con soporte" };
  const complete = (message) => { notify(message); onClose(); };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header><div><span>Acción rápida</span><h2 id="modal-title">{titles[modal.type]}</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar ventana"><IconX size={21} /></button></header>
        {isReading && <><div className="review-banner"><IconSparkles size={21} /><span><strong>Extracción completada</strong><small>Confianza IA {item.confidence}% · Revisa antes de validar</small></span></div><div className="form-grid"><label>Vehículo<input defaultValue={item.plate} /></label><label>Conductor<input defaultValue={item.driver} /></label><label>Odómetro total<input defaultValue={item.total} /></label><label>Kilómetros diarios<input defaultValue={item.daily} /></label></div></>}
        {isInvoice && <><div className="invoice-preview"><IconFileInvoice size={30} /><span><strong>{item.id}</strong><small>{item.provider} · {item.date}</small></span><strong>{formatCurrency(item.amount)}</strong></div><dl><div><dt>Vehículo</dt><dd>{item.plate}</dd></div><div><dt>Concepto</dt><dd>{item.concept}</dd></div><div><dt>Origen</dt><dd>{item.source}</dd></div><div><dt>Estado</dt><dd><StatusBadge status={item.status} /></dd></div></dl></>}
        {modal.type === "reading" && <div className="upload-zone"><IconBrandWhatsapp size={30} /><strong>Añadir lectura manual</strong><p>Selecciona una imagen del odómetro o introduce los datos manualmente.</p><button className="secondary-button"><IconUpload size={17} />Seleccionar imagen</button></div>}
        {modal.type === "invoice-upload" && <div className="upload-zone"><IconFileInvoice size={30} /><strong>Subir factura del taller</strong><p>Formatos PDF, JPG o PNG. SOBRE RUEDAS propondrá vehículo, concepto e importe.</p><button className="secondary-button"><IconUpload size={17} />Seleccionar archivo</button></div>}
        {modal.type === "support" && <div className="support-form"><label>Asunto<input placeholder="Describe brevemente el problema" /></label><label>Mensaje<textarea placeholder="Cuéntanos qué necesitas revisar" rows={5} /></label></div>}
        <footer><button className="secondary-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={() => complete(isReading ? "Lectura validada correctamente" : isInvoice ? "Factura revisada" : modal.type === "support" ? "Consulta enviada a soporte" : "Archivo preparado para procesar")}><IconCheck size={18} />{isReading ? "Validar lectura" : isInvoice ? "Marcar revisada" : modal.type === "support" ? "Enviar consulta" : "Continuar"}</button></footer>
      </section>
    </div>
  );
}
