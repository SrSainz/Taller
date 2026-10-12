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
    if (value.includes("usage.api-counts")) return new Response(JSON.stringify({ result: [{ total_rest_requests: 12, total_auth_requests: 3, total_storage_requests: 2, total_realtime_requests: 1 }] }), { status: 200 });
    throw new Error("Unexpected request");
  };
  try {
    const response = makeResponse();
    await handler({ method: "GET", headers: { authorization: "Bearer admin-jwt" } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.vercel.total, 4);
    assert.equal(response.body.supabase.total, 18);
    assert.doesNotMatch(JSON.stringify(response.body), /vercel-secret|supabase-secret/);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name];
  }
});
