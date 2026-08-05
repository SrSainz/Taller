import { getConfig, getRedirectUri, json, redirect, signState, UBER_AUTH_URL } from "./_lib.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { message: "Método no permitido" });
  }
  const config = getConfig();
  const redirectUri = getRedirectUri(req);
  if (!config.clientId || !config.clientSecret || !redirectUri) {
    return json(res, 503, { message: "Faltan UBER_CLIENT_ID, UBER_CLIENT_SECRET o UBER_REDIRECT_URI en el servidor" });
  }
  const state = signState(`${Date.now()}-${Math.random().toString(36).slice(2)}`, config.clientSecret);
  const params = new URLSearchParams({ client_id: config.clientId, redirect_uri: redirectUri, response_type: "code", scope: config.scopes.join(" "), state });
  return redirect(res, `${UBER_AUTH_URL}?${params.toString()}`);
}
