import { getAccessToken, getConfig, json, uberFetch } from "./_lib.js";

const endpointDefinitions = [
  { id: "profile", label: "Perfil del conductor", scope: "partner.accounts", path: "/v1/partners/me" },
  { id: "payments", label: "Pagos y ganancias", scope: "partner.payments", path: "/v1/partners/payments", countKey: "payments" },
  { id: "trips", label: "Historial de viajes", scope: "partner.trips", path: "/v1/partners/trips", countKey: "trips" },
];

function summarize(definition, result) {
  const body = result.body || {};
  const collection = definition.countKey ? body[definition.countKey] : null;
  return {
    id: definition.id,
    label: definition.label,
    scope: definition.scope,
    ok: result.response.ok,
    status: result.response.status,
    count: Array.isArray(collection) ? collection.length : Number(body.count) || 0,
    fields: body && typeof body === "object" ? Object.keys(body).slice(0, 12) : [],
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { message: "Método no permitido" });
  }
  const token = getAccessToken(req);
  const config = getConfig();
  if (!token) return json(res, 401, { connected: false, message: "Conecta primero una cuenta de conductor de Uber" });
  const access = await Promise.all(endpointDefinitions.map(async (definition) => {
    try {
      return summarize(definition, await uberFetch(definition.path, token, definition.id === "trips" ? { limit: 50 } : {}));
    } catch {
      return { id: definition.id, label: definition.label, scope: definition.scope, ok: false, status: 0, count: 0, fields: [] };
    }
  }));
  return json(res, 200, {
    connected: true,
    mode: "uber_driver_oauth",
    scopes: config.scopes,
    access,
    analyzedAt: new Date().toISOString(),
    message: "Análisis completado sin devolver tokens ni datos personales al navegador",
  });
}
