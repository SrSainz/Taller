import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const DEFAULT_SCOPES = ["partner.accounts", "partner.payments", "partner.trips"];
export const UBER_AUTH_URL = "https://auth.uber.com/oauth/v2/authorize";
export const UBER_TOKEN_URL = "https://auth.uber.com/oauth/v2/token";
export const UBER_API_URL = "https://api.uber.com";

export function getConfig() {
  const scopes = (process.env.UBER_SCOPES || DEFAULT_SCOPES.join(" ")).split(/[ ,]+/).filter(Boolean);
  return {
    clientId: process.env.UBER_CLIENT_ID?.trim() || "",
    clientSecret: process.env.UBER_CLIENT_SECRET?.trim() || "",
    redirectUri: process.env.UBER_REDIRECT_URI?.trim() || "",
    scopes,
  };
}

export function getRedirectUri(req) {
  const configured = getConfig().redirectUri;
  if (configured) return configured;
  const forwardedProto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return host ? `${forwardedProto}://${host}/api/uber/callback` : "";
}

export function json(res, status, payload, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(payload));
}

export function redirect(res, location, headers = {}) {
  res.statusCode = 302;
  res.setHeader("Location", location);
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  res.end();
}

export function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return index < 0 ? [part, ""] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}

export function signState(value, secret) {
  const signature = createHmac("sha256", secret).update(value).digest("base64url");
  return `${value}.${signature}`;
}

export function verifyState(value, secret) {
  const [payload, signature] = String(value || "").split(".");
  if (!payload || !signature) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer) && Number(payload.split("-")[0]) > Date.now() - 10 * 60 * 1000;
}

function cryptoKey(secret) {
  return createHash("sha256").update(secret).digest();
}

export function sealToken(token, secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", cryptoKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(token), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((value) => value.toString("base64url")).join(".");
}

export function unsealToken(value, secret) {
  try {
    const [ivValue, tagValue, encryptedValue] = String(value || "").split(".");
    const decipher = createDecipheriv("aes-256-gcm", cryptoKey(secret), Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
    return JSON.parse(plaintext);
  } catch {
    return null;
  }
}

export function getAccessToken(req) {
  const config = getConfig();
  const cookie = parseCookies(req).uber_access;
  return (cookie && config.clientSecret ? unsealToken(cookie, config.clientSecret)?.access_token : "") || process.env.UBER_ACCESS_TOKEN?.trim() || "";
}

export async function uberFetch(path, token, searchParams = {}) {
  const url = new URL(`${UBER_API_URL}${path}`);
  Object.entries(searchParams).forEach(([key, value]) => { if (value !== undefined && value !== "") url.searchParams.set(key, String(value)); });
  const response = await fetch(url, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(12000) });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  return { response, body };
}
