import { getAccessToken, getConfig, json } from "./_lib.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { message: "Método no permitido" });
  }
  const config = getConfig();
  const hasToken = Boolean(getAccessToken(req));
  return json(res, 200, {
    configured: Boolean(config.clientId && config.clientSecret),
    hasClientId: Boolean(config.clientId),
    hasClientSecret: Boolean(config.clientSecret),
    redirectConfigured: Boolean(config.redirectUri),
    redirectUri: config.redirectUri ? "configurada" : "se calcula para este dominio",
    scopes: config.scopes,
    hasSession: hasToken,
    mode: "uber_driver_oauth",
    message: hasToken ? "Cuenta de conductor conectada" : config.clientId && config.clientSecret ? "Listo para conectar una cuenta de conductor" : "Añade las credenciales de Uber en las variables de entorno del servidor",
  });
}
