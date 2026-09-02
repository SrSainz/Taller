import assert from "node:assert/strict";
import test from "node:test";
import handler, { buildPrompt, buildSchema } from "../api/analyze-document.js";
import { getDocumentKind, getDocumentMimeType, hasDriverBillingAmount, normalizeDocumentAnalysis, normalizeDriverBillingAnalysisFields, validateDocumentFile } from "../src/documentAnalysis.js";

const invoke = async (request) => {
  const response = {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) { this.headers[name] = value; },
    end(value = "") { this.body = value; },
  };
  await handler(request, response);
  return { ...response, json: response.body ? JSON.parse(response.body) : null };
};

test("does not accept documents when the server-side AI key is absent", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousGatewayKey = process.env.AI_GATEWAY_API_KEY;
  const previousOidcToken = process.env.VERCEL_OIDC_TOKEN;
  delete process.env.OPENAI_API_KEY;
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.VERCEL_OIDC_TOKEN;
  try {
    const result = await invoke({ method: "POST", body: { category: "billing", fileName: "factura.jpg", fileType: "image/jpeg", dataUrl: "data:image/jpeg;base64,AA==" } });
    assert.equal(result.statusCode, 503);
    assert.equal(result.json.code, "AI_NOT_CONFIGURED");
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
    if (previousGatewayKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
    else process.env.AI_GATEWAY_API_KEY = previousGatewayKey;
    if (previousOidcToken === undefined) delete process.env.VERCEL_OIDC_TOKEN;
    else process.env.VERCEL_OIDC_TOKEN = previousOidcToken;
  }
});

test("requires every nullable extraction field for strict structured output", () => {
  const billingFields = buildSchema("billing").properties.fields;
  const consumptionFields = buildSchema("consumption").properties.fields;
  assert.deepEqual(new Set(billingFields.required), new Set(Object.keys(billingFields.properties)));
  assert.deepEqual(new Set(consumptionFields.required), new Set(Object.keys(consumptionFields.properties)));
  assert.ok(Object.hasOwn(billingFields.properties, "baseNetAmount"));
  assert.ok(Object.hasOwn(billingFields.properties, "promotions"));
  assert.ok(Object.hasOwn(billingFields.properties, "odometerKm"));
});

test("anchors fuel totals and collected cash to the printed document date", () => {
  const fuelPrompt = buildPrompt("consumption");
  const billingPrompt = buildPrompt("billing");
  assert.match(fuelPrompt, /fecha de operación o factura impresa/i);
  assert.match(fuelPrompt, /importe TOTAL finalmente pagado/i);
  assert.match(billingPrompt, /Efectivo cobrado/i);
  assert.match(billingPrompt, /no uses el total facturado como sustituto/i);
  assert.match(billingPrompt, /Propina/i);
  assert.match(billingPrompt, /no la sumes a cashCollected/i);
  assert.match(billingPrompt, /baseNetAmount \+ promotions/i);
});

test("normaliza el Precio neto de una captura con promociones", () => {
  const fields = normalizeDocumentAnalysis("billing", { fields: { baseNetAmount: 100, netAmount: 100, promotions: 7.5, tips: 2, total: 102 } });
  const normalized = normalizeDriverBillingAnalysisFields(fields);
  const values = Object.fromEntries(normalized.map(({ key, value }) => [key, value]));
  assert.equal(values.baseNetAmount, 100);
  assert.equal(values.promotions, 7.5);
  assert.equal(values.netAmount, 107.5);
  assert.equal(values.total, 109.5);
});

test("detecta importes de facturación sin depender de variables de renderizado", () => {
  assert.equal(hasDriverBillingAmount({ netAmount: 0 }), true);
  assert.equal(hasDriverBillingAmount({ baseNetAmount: 246.94, promotions: 12.5 }), true);
  assert.equal(hasDriverBillingAmount({ total: 247.94 }), true);
  assert.equal(hasDriverBillingAmount({}), false);
});

test("rejects invalid document payloads before calling the AI provider", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-only-placeholder";
  try {
    const result = await invoke({ method: "POST", body: { category: "unknown", fileName: "factura.txt", fileType: "text/plain", dataUrl: "data:text/plain;base64,AA==" } });
    assert.equal(result.statusCode, 400);
    assert.equal(result.json.code, "INVALID_DOCUMENT");
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("acepta solo los formatos que el Storage y la IA pueden procesar", () => {
  assert.equal(getDocumentMimeType({ name: "ticket.JPG", type: "" }), "image/jpeg");
  assert.equal(getDocumentKind({ name: "factura.pdf", type: "application/octet-stream" }), "pdf");
  assert.equal(getDocumentKind({ name: "foto.gif", type: "image/gif" }), "unsupported");
  assert.equal(getDocumentKind({ name: "foto.heic", type: "image/heic" }), "unsupported");
  assert.equal(validateDocumentFile({ name: "foto.svg", type: "image/svg+xml", size: 120 }).valid, false);
});

test("devuelve un error controlado si el proveedor de IA no responde", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "test-only-placeholder";
  globalThis.fetch = async () => { throw Object.assign(new Error("network down"), { name: "TypeError" }); };
  try {
    const result = await invoke({ method: "POST", body: { category: "billing", fileName: "factura.jpg", dataUrl: "data:image/jpeg;base64,AA==" } });
    assert.equal(result.statusCode, 502);
    assert.equal(result.json.code, "AI_UNAVAILABLE");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});

test("rechaza solicitudes demasiado grandes antes de llamar al proveedor", async () => {
  const previousKey = process.env.OPENAI_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.OPENAI_API_KEY = "test-only-placeholder";
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error("should not be called"); };
  try {
    const result = await invoke({ method: "POST", body: { category: "billing", fileName: "factura.jpg", dataUrl: `data:image/jpeg;base64,${"A".repeat(5 * 1024 * 1024)}` } });
    assert.equal(result.statusCode, 413);
    assert.equal(result.json.code, "REQUEST_TOO_LARGE");
    assert.equal(called, false);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
});
