import assert from "node:assert/strict";
import test from "node:test";
import handler, { buildPrompt, buildSchema } from "../api/analyze-document.js";

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
});

test("anchors fuel totals and collected cash to the printed document date", () => {
  const fuelPrompt = buildPrompt("consumption");
  const billingPrompt = buildPrompt("billing");
  assert.match(fuelPrompt, /fecha de operación o factura impresa/i);
  assert.match(fuelPrompt, /importe TOTAL finalmente pagado/i);
  assert.match(billingPrompt, /Efectivo cobrado/i);
  assert.match(billingPrompt, /no uses el total facturado como sustituto/i);
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
