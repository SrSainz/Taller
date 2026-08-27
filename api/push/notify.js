import { timingSafeEqual } from "node:crypto";
import webpush from "web-push";

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
};

const readBody = async (req) => {
  if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString("utf8"));
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const secretsMatch = (received, expected) => {
  const receivedBuffer = Buffer.from(String(received ?? ""));
  const expectedBuffer = Buffer.from(String(expected ?? ""));
  return receivedBuffer.length === expectedBuffer.length
    && receivedBuffer.length > 0
    && timingSafeEqual(receivedBuffer, expectedBuffer);
};

const cleanSubscription = (subscription) => {
  const endpoint = typeof subscription?.endpoint === "string" ? subscription.endpoint.trim() : "";
  const p256dh = typeof subscription?.keys?.p256dh === "string" ? subscription.keys.p256dh.trim() : "";
  const auth = typeof subscription?.keys?.auth === "string" ? subscription.keys.auth.trim() : "";
  if (!/^https:\/\//i.test(endpoint) || !p256dh || !auth) return null;
  return { endpoint, keys: { p256dh, auth } };
};

const categoryLabels = {
  billing: "facturación",
  consumption: "consumo",
  maintenance: "mantenimiento",
};

const notificationFor = (payload) => {
  const actor = payload.actorName ? ` de ${payload.actorName}` : "";
  const plate = payload.vehiclePlate ? ` · ${payload.vehiclePlate}` : "";
  if (payload.eventType === "document") {
    const category = categoryLabels[payload.category] || "documentación";
    return {
      title: "SOBRE RUEDAS · Nuevo documento",
      body: `Se ha recibido un documento de ${category}${actor}${plate}.`,
      url: "/#/facturas",
    };
  }
  if (payload.eventType === "maintenance") {
    return {
      title: "SOBRE RUEDAS · Aviso de mantenimiento",
      body: `Hay un nuevo aviso de mantenimiento${actor}${plate}.`,
      url: "/#/mantenimiento",
    };
  }
  if (payload.eventType === "profile") {
    return {
      title: "SOBRE RUEDAS · Accesos actualizados",
      body: "Se ha actualizado un perfil o un permiso de acceso.",
      url: "/#/administracion",
    };
  }
  return {
    title: "SOBRE RUEDAS · Datos actualizados",
    body: `Se han actualizado datos de la flota${actor}${plate}.`,
    url: "/#/informes",
  };
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Método no permitido" });
  }

  const webhookSecret = process.env.SOBRE_RUEDAS_PUSH_WEBHOOK_SECRET?.trim() || "";
  if (!webhookSecret) return json(res, 503, { error: "El aviso push no está configurado." });
  if (!secretsMatch(req.headers["x-sobre-ruedas-webhook-secret"], webhookSecret)) {
    return json(res, 401, { error: "No autorizado" });
  }

  if (!process.env.VAPID_PUBLIC_KEY?.trim() || !process.env.VAPID_PRIVATE_KEY?.trim()) {
    return json(res, 503, { error: "Faltan las claves del servicio de avisos push." });
  }

  let payload;
  try {
    payload = await readBody(req);
  } catch {
    return json(res, 400, { error: "El aviso recibido no contiene un JSON válido." });
  }

  const subscriptions = [...new Map((Array.isArray(payload?.subscriptions) ? payload.subscriptions : [])
    .map(cleanSubscription)
    .filter(Boolean)
    .map((subscription) => [subscription.endpoint, subscription])).values()].slice(0, 100);
  if (subscriptions.length === 0) return json(res, 200, { ok: true, sent: 0 });

  const contact = process.env.WEB_PUSH_CONTACT_EMAIL?.trim() || "mailto:flota@sobreruedas.es";
  webpush.setVapidDetails(contact.startsWith("mailto:") ? contact : `mailto:${contact}`, process.env.VAPID_PUBLIC_KEY.trim(), process.env.VAPID_PRIVATE_KEY.trim());
  const message = notificationFor(payload);
  const body = JSON.stringify({
    ...message,
    tag: "sobre-ruedas-app-change",
    icon: "/icons/sobre-ruedas-192.png?v=20260805",
    badge: "/icons/sobre-ruedas-maskable-192.png?v=20260805",
    eventId: payload.eventId || `${payload.table || "app"}-${Date.now()}`,
  });
  const results = await Promise.allSettled(subscriptions.map((subscription) => webpush.sendNotification(subscription, body, { ttl: 300, urgency: "high" })));
  const sent = results.filter((result) => result.status === "fulfilled").length;
  const expired = results.filter((result) => result.status === "rejected" && [404, 410].includes(result.reason?.statusCode)).length;
  return json(res, 200, { ok: true, sent, failed: results.length - sent, expired });
}
