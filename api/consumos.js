import { requireActiveUser } from "./_require-active-user.js";

const noCache = { "Cache-Control": "private, no-store, max-age=0" };
const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export function summarizeVercelCharges(jsonl) {
  const services = new Map();
  let currency = "";
  for (const line of String(jsonl).split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    if (currency && row.BillingCurrency !== currency) throw new Error("Las monedas de Vercel no coinciden.");
    currency = row.BillingCurrency || currency;
    const service = String(row.ServiceName || row.ServiceCategory || "Otros");
    services.set(service, (services.get(service) || 0) + asNumber(row.BilledCost));
  }
  return { currency: currency || null, total: [...services.values()].reduce((sum, amount) => sum + amount, 0), services: [...services].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount) };
}

export function summarizeSupabaseUsage(payload) {
  const rows = Array.isArray(payload?.result) ? payload.result : [];
  const fields = ["total_auth_requests", "total_realtime_requests", "total_rest_requests", "total_storage_requests"];
  const counts = Object.fromEntries(fields.map((field) => [field, rows.reduce((sum, row) => sum + asNumber(row[field]), 0)]));
  return { ...counts, total: Object.values(counts).reduce((sum, value) => sum + value, 0), from: rows[0]?.timestamp || null, to: rows.at(-1)?.timestamp || null };
}

async function verifyAdmin(req) {
  const access = await requireActiveUser(req);
  if (access.status) return access;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  try {
    const response = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(access.userId)}&select=role`, {
      headers: { authorization: req.headers.authorization, apikey: key }, cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { status: 503, message: "No se pudo verificar el permiso de administrador." };
    const rows = await response.json();
    return rows?.[0]?.role === "admin" ? access : { status: 403, message: "Solo el administrador puede consultar consumos." };
  } catch {
    return { status: 503, message: "No se pudo verificar el permiso de administrador." };
  }
}

async function readVercel(from, to) {
  const token = process.env.VERCEL_USAGE_TOKEN;
  const teamId = process.env.VERCEL_USAGE_TEAM_ID;
  if (!token || !teamId) return { status: "unconfigured", message: "Falta el token de lectura de Vercel o el identificador del equipo." };
  const url = new URL("https://api.vercel.com/v1/billing/charges");
  url.search = new URLSearchParams({ teamId, from, to }).toString();
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!response.ok) return { status: "error", message: response.status === 404 ? "Vercel no ofrece los cargos por API para este equipo Hobby. Consulta el uso actualizado en su panel." : response.status === 403 ? "Vercel no autoriza a este token a leer la facturación del equipo." : `No se pudo consultar Vercel (${response.status}).` };
    const data = summarizeVercelCharges(await response.text());
    return { status: "ready", scope: "equipo", ...data };
  } catch {
    return { status: "error", message: "No se pudo conectar con Vercel." };
  }
}

async function readSupabase() {
  const token = process.env.SUPABASE_MANAGEMENT_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF;
  if (!token || !projectRef) return { status: "unconfigured", message: "Falta el token de lectura de Supabase o la referencia del proyecto." };
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/analytics/endpoints/usage.api-counts`, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return { status: "error", message: response.status === 403 ? "Supabase no autoriza a este token a leer las métricas del proyecto." : `No se pudo consultar Supabase (${response.status}).` };
    return { status: "ready", scope: "proyecto", ...summarizeSupabaseUsage(await response.json()) };
  } catch {
    return { status: "error", message: "No se pudo conectar con Supabase." };
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", noCache["Cache-Control"]);
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido." });
  const access = await verifyAdmin(req);
  if (access.status) return res.status(access.status).json({ error: access.message });
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const to = now.toISOString();
  const [vercel, supabase] = await Promise.all([readVercel(from, to), readSupabase()]);
  return res.status(200).json({ checkedAt: to, vercelPeriodStart: from, vercel, supabase });
}
