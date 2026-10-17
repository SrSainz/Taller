import test from "node:test";
import assert from "node:assert/strict";
import handler, { summarizeSupabaseUsage, summarizeVercelCharges } from "../api/consumos.js";

const makeResponse = () => ({
  statusCode: 200,
  headers: {},
  setHeader(key, value) { this.headers[key] = value; },
  status(code) { this.statusCode = code; return this; },
  json(value) { this.body = value; return this; },
});

test("separates Vercel services and Supabase request types without inventing values", () => {
  assert.deepEqual(summarizeVercelCharges([
    JSON.stringify({ ServiceName: "Functions", BilledCost: "2.5", BillingCurrency: "USD" }),
    JSON.stringify({ ServiceName: "Functions", BilledCost: "1.5", BillingCurrency: "USD" }),
    JSON.stringify({ ServiceName: "Bandwidth", BilledCost: "3", BillingCurrency: "USD" }),
  ].join("\n")), { currency: "USD", total: 7, services: [{ name: "Functions", amount: 4 }, { name: "Bandwidth", amount: 3 }] });
  assert.equal(summarizeSupabaseUsage({ result: [{ total_rest_requests: 10, total_auth_requests: 2 }, { total_storage_requests: 3 }] }).total, 15);
});

test("Supabase distingue un cero real de métricas vacías o fallidas y ordena el periodo", () => {
  assert.throws(() => summarizeSupabaseUsage({ result: [] }), /todavía no/);
  assert.throws(() => summarizeSupabaseUsage({ result: [{}] }), /todavía no/);
  assert.throws(() => summarizeSupabaseUsage({ result: [], error: "analytics unavailable" }), /no ha podido/);
  const result = summarizeSupabaseUsage({ result: [
    { timestamp: "2026-10-17T18:00:00Z", total_rest_requests: 0, total_auth_requests: 0, total_storage_requests: 0, total_realtime_requests: 0 },
    { timestamp: "2026-10-17T17:00:00Z", total_rest_requests: 0 },
  ] });
  assert.equal(result.total, 0);
  assert.equal(result.from, "2026-10-17T17:00:00Z");
  assert.equal(result.to, "2026-10-17T18:00:00Z");
  assert.equal(summarizeSupabaseUsage({ result: [{ total_rest_requests: 8 }] }).total_auth_requests, null);
});

test("consumption API refuses requests without a verified session", async () => {
  const response = makeResponse();
  await handler({ method: "GET", headers: {} }, response);
  assert.equal(response.statusCode, 401);
  assert.match(response.headers["Cache-Control"], /no-store/);
});

test("consumption API rejects non-admin users before querying either provider", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.VITE_SUPABASE_URL;
  const originalKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  process.env.VITE_SUPABASE_URL = "https://project.supabase.co";
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = "test-publishable";
  const seen = [];
  globalThis.fetch = async (url) => {
    seen.push(String(url));
    if (String(url).endsWith("/auth/v1/user")) return new Response(JSON.stringify({ id: "user-id" }), { status: 200 });
    if (String(url).includes("profiles")) return new Response(JSON.stringify([{ active: true, role: "driver" }]), { status: 200 });
    throw new Error("Provider queried before authorization");
  };
  try {
    const response = makeResponse();
    await handler({ method: "GET", headers: { authorization: "Bearer test-jwt" } }, response);
    assert.equal(response.statusCode, 403);
    assert.equal(seen.length, 3);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.VITE_SUPABASE_URL; else process.env.VITE_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY; else process.env.VITE_SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
});

test("verified admin receives provider data but never receives provider tokens", async () => {
  const originalFetch = globalThis.fetch;
  const names = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY", "VERCEL_USAGE_TOKEN", "VERCEL_USAGE_TEAM_ID", "SUPABASE_MANAGEMENT_TOKEN", "SUPABASE_PROJECT_REF"];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  Object.assign(process.env, {
    VITE_SUPABASE_URL: "https://project.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "publishable",
    VERCEL_USAGE_TOKEN: "vercel-secret", VERCEL_USAGE_TEAM_ID: "team-test",
    SUPABASE_MANAGEMENT_TOKEN: "supabase-secret", SUPABASE_PROJECT_REF: "project-ref",
  });
  globalThis.fetch = async (url) => {
    const value = String(url);
    if (value.endsWith("/auth/v1/user")) return new Response(JSON.stringify({ id: "admin-id" }), { status: 200 });
    if (value.includes("profiles")) return new Response(JSON.stringify([{ active: true, role: "admin" }]), { status: 200 });
    if (value.includes("billing/charges")) return new Response(JSON.stringify({ ServiceName: "Functions", BilledCost: 4, BillingCurrency: "USD" }), { status: 200 });
    if (value.includes("usage.api-counts")) {
      assert.equal(new URL(value).searchParams.get("interval"), "1day");
      return new Response(JSON.stringify({ result: [{ total_rest_requests: 12, total_auth_requests: 3, total_storage_requests: 2, total_realtime_requests: 1 }] }), { status: 200 });
    }
    if (value.includes("admin_storage_usage_bytes")) return new Response(JSON.stringify(24_000_000), { status: 200 });
    throw new Error("Unexpected request");
  };
  try {
    const response = makeResponse();
    await handler({ method: "GET", headers: { authorization: "Bearer admin-jwt" } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.vercel.total, 4);
    assert.equal(response.body.supabase.total, 18);
    assert.equal(response.body.supabaseStorage.usedBytes, 24_000_000);
    assert.equal(response.body.supabaseStorage.remainingBytes, 976_000_000);
    assert.equal(response.body.supabaseStorage.remainingPercent, 97.6);
    assert.doesNotMatch(JSON.stringify(response.body), /vercel-secret|supabase-secret/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name];
  }
});

test("explains unavailable Vercel billing without inventing a zero", async () => {
  const originalFetch = globalThis.fetch;
  const names = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY", "VERCEL_USAGE_TOKEN", "VERCEL_USAGE_TEAM_ID", "SUPABASE_MANAGEMENT_TOKEN", "SUPABASE_PROJECT_REF"];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  Object.assign(process.env, {
    VITE_SUPABASE_URL: "https://project.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "publishable",
    VERCEL_USAGE_TOKEN: "vercel-secret", VERCEL_USAGE_TEAM_ID: "team-test",
    SUPABASE_MANAGEMENT_TOKEN: "supabase-secret", SUPABASE_PROJECT_REF: "project-ref",
  });
  globalThis.fetch = async (url) => {
    const value = String(url);
    if (value.endsWith("/auth/v1/user")) return new Response(JSON.stringify({ id: "admin-id" }), { status: 200 });
    if (value.includes("profiles")) return new Response(JSON.stringify([{ active: true, role: "admin" }]), { status: 200 });
    if (value.includes("billing/charges")) return new Response("Not Found", { status: 404 });
    if (value.includes("usage.api-counts")) return new Response(JSON.stringify({ result: [] }), { status: 200 });
    if (value.includes("admin_storage_usage_bytes")) return new Response(JSON.stringify(24_000_000), { status: 200 });
    throw new Error("Unexpected request");
  };
  try {
    const response = makeResponse();
    await handler({ method: "GET", headers: { authorization: "Bearer admin-jwt" } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.vercel.status, "error");
    assert.match(response.body.vercel.message, /Hobby/);
    assert.equal(response.body.vercel.total, undefined);
    assert.equal(response.body.supabase.status, "unavailable");
    assert.equal(response.body.supabase.total, undefined);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name];
  }
});

test("Supabase se consulta sin esperar a Vercel y el espacio sigue disponible sin métricas de solicitudes", async () => {
  const originalFetch = globalThis.fetch;
  const names = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_MANAGEMENT_TOKEN", "SUPABASE_PROJECT_REF"];
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  Object.assign(process.env, { VITE_SUPABASE_URL: "https://project.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "publishable", SUPABASE_MANAGEMENT_TOKEN: "supabase-secret", SUPABASE_PROJECT_REF: "project-ref" });
  let storageResult = 28_276_152;
  globalThis.fetch = async (url, init) => {
    const value = String(url);
    if (value.endsWith("/auth/v1/user")) return Response.json({ id: "admin-id" });
    if (value.includes("profiles")) return Response.json([{ active: true, role: "admin" }]);
    if (value.includes("usage.api-counts")) return Response.json({ result: [], error: "temporarily unavailable" });
    if (value.includes("admin_storage_usage_bytes")) {
      assert.equal(init.headers.authorization, "Bearer admin-jwt");
      assert.equal(init.cache, "no-store");
      return Response.json(storageResult);
    }
    throw new Error("La pantalla de Supabase no debe consultar otro proveedor");
  };
  try {
    const request = { method: "GET", query: { provider: "supabase" }, headers: { authorization: "Bearer admin-jwt" } };
    const response = makeResponse();
    await handler(request, response);
    assert.equal(response.body.vercel, undefined);
    assert.equal(response.body.supabase.total, undefined);
    assert.equal(response.body.supabaseStorage.usedBytes, 28_276_152);
    assert.equal(response.body.supabaseStorage.remainingBytes, 971_723_848);
    storageResult = null;
    const invalidStorage = makeResponse();
    await handler(request, invalidStorage);
    assert.equal(invalidStorage.body.supabaseStorage.status, "error");
    assert.equal(invalidStorage.body.supabaseStorage.usedBytes, undefined);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name];
  }
});
