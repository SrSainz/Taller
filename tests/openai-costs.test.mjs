import test from "node:test";
import assert from "node:assert/strict";
import handler, { summarizeOpenAICosts } from "../api/consumos.js";

const today = Date.UTC(2026, 9, 18) / 1000;
const bucket = (start, value, currency = "usd") => ({ start_time: start, end_time: start + 86400, results: [{ amount: { value, currency } }] });
const makeResponse = () => ({ setHeader() {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test("suma importes oficiales de OpenAI sin convertir USD en euros ni confundir mes y día", () => {
  assert.deepEqual(summarizeOpenAICosts([bucket(today - 86400, "0.63"), bucket(today, "0.04")], today), { total: 0.67, today: 0.04, currency: "USD" });
  assert.equal(summarizeOpenAICosts([bucket(today - 86400, 1)], today).today, null);
  assert.deepEqual(summarizeOpenAICosts([{ start_time: today, results: [] }], today), { total: 0, today: 0, currency: "USD" });
});

test("rechaza respuestas incompletas y monedas diferentes", () => {
  for (const data of [[], [{ start_time: today }], [bucket(today, null)], [bucket(today, "no-number")], [bucket(today, 1, "usd"), bucket(today, 2, "eur")]]) {
    assert.throws(() => summarizeOpenAICosts(data, today));
  }
});

async function withProvider(callback) {
  const originalFetch = globalThis.fetch;
  const keys = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY", "OPENAI_USAGE_ADMIN_KEY", "OPENAI_USAGE_PROJECT_ID", "OPENAI_API_KEY", "SUPABASE_MANAGEMENT_TOKEN", "SUPABASE_PROJECT_REF"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  Object.assign(process.env, { VITE_SUPABASE_URL: "https://project.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "publishable", OPENAI_USAGE_ADMIN_KEY: "private-usage-key", OPENAI_USAGE_PROJECT_ID: "proj-test", OPENAI_API_KEY: "private-model-key" });
  delete process.env.SUPABASE_MANAGEMENT_TOKEN;
  delete process.env.SUPABASE_PROJECT_REF;
  let provider;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    const address = String(url);
    if (address.endsWith("/auth/v1/user")) return Response.json({ id: "admin-id" });
    if (address.includes("profiles")) return Response.json([{ active: true, role: "admin" }]);
    if (address.includes("admin_storage_usage_bytes")) return Response.json(24_000_000);
    if (address.startsWith("https://api.openai.com/")) { calls.push({ url: new URL(address), init }); return provider(url, init); }
    throw new Error("Unexpected request");
  };
  const request = { method: "GET", query: { provider: "supabase" }, headers: { authorization: "Bearer admin-session" } };
  try {
    await callback({ calls, setProvider: value => { provider = value; }, run: async () => { const response = makeResponse(); await handler(request, response); return response.body; } });
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of keys) if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key];
  }
}

test("el servidor recorre las páginas, filtra el proyecto y nunca devuelve credenciales", async () => withProvider(async ({ calls, setProvider, run }) => {
  setProvider(url => Response.json({ data: [bucket(today, calls.length === 1 ? "0.63" : "0.04")], has_more: calls.length === 1, next_page: calls.length === 1 ? "next-page" : null }));
  const result = await run();
  assert.equal(result.openai.status, "ready");
  assert.equal(result.openai.total, 0.67);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url.searchParams.get("limit"), "31");
  assert.equal(calls[0].url.searchParams.get("project_ids"), "proj-test");
  assert.equal(calls[1].url.searchParams.get("page"), "next-page");
  assert.equal(calls[0].init.headers.Authorization, "Bearer private-usage-key");
  assert.equal(calls[0].init.cache, "no-store");
  assert.doesNotMatch(JSON.stringify(result), /private-usage-key|private-model-key/);
}));

test("una página fallida o repetida nunca muestra un gasto parcial", async () => withProvider(async ({ setProvider, run }) => {
  setProvider(() => Response.json({ data: [bucket(today, 0.5)], has_more: true, next_page: "same-cursor" }));
  assert.equal((await run()).openai.status, "unavailable");
  setProvider(() => new Response("forbidden", { status: 403 }));
  const result = await run();
  assert.equal(result.openai.status, "error");
  assert.equal(result.openai.total, undefined);
  assert.equal(result.supabaseStorage.status, "ready");
}));

test("sin clave de costes no reutiliza la clave que analiza documentos", async () => withProvider(async ({ calls, run }) => {
  delete process.env.OPENAI_USAGE_ADMIN_KEY;
  const result = await run();
  assert.equal(result.openai.status, "unconfigured");
  assert.equal(result.openai.total, undefined);
  assert.equal(calls.length, 0);
}));
