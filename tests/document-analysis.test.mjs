import assert from "node:assert/strict";
import test from "node:test";
import handler from "../api/analyze-document.js";

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
  delete process.env.OPENAI_API_KEY;
  try {
    const result = await invoke({ method: "POST", body: { category: "billing", fileName: "factura.jpg", fileType: "image/jpeg", dataUrl: "data:image/jpeg;base64,AA==" } });
    assert.equal(result.statusCode, 503);
    assert.equal(result.json.code, "AI_NOT_CONFIGURED");
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
  }
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
