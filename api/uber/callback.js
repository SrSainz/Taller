import { getConfig, getRedirectUri, json, redirect, sealToken, verifyState, UBER_TOKEN_URL } from "./_lib.js";

function settingsRedirect(req, query) {
  const forwardedProto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${host ? `${forwardedProto}://${host}` : ""}/?${query}#/ajustes`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { message: "Método no permitido" });
  }
  const config = getConfig();
  const { code, state, error } = req.query || {};
  if (error) return redirect(res, settingsRedirect(req, `uber_error=${encodeURIComponent(error)}`));
  if (!code || !verifyState(state, config.clientSecret)) return redirect(res, settingsRedirect(req, "uber_error=state_invalido"));
  try {
    const form = new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, grant_type: "authorization_code", redirect_uri: getRedirectUri(req), code });
    const response = await fetch(UBER_TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: form, signal: AbortSignal.timeout(12000) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.access_token) return redirect(res, settingsRedirect(req, "uber_error=token_no_obtenido"));
    const maxAge = Math.min(Number(payload.expires_in) || 2_592_000, 2_592_000);
    const cookie = `uber_access=${encodeURIComponent(sealToken(payload, config.clientSecret))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
    return redirect(res, settingsRedirect(req, "uber=connected"), { "Set-Cookie": cookie });
  } catch {
    return redirect(res, settingsRedirect(req, "uber_error=conexion"));
  }
}
