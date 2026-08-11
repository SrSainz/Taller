const MAX_DATA_URL_BYTES = 4 * 1024 * 1024;

const billingSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    company: { type: ["string", "null"] },
    invoiceNumber: { type: ["string", "null"] },
    issueDate: { type: ["string", "null"] },
    serviceDate: { type: ["string", "null"] },
    taxBase: { type: ["number", "null"] },
    vat: { type: ["number", "null"] },
    total: { type: ["number", "null"] },
    netAmount: { type: ["number", "null"] },
    concept: { type: ["string", "null"] },
    expenseCategory: { type: ["string", "null"] },
    vehicle: { type: ["string", "null"] },
  },
  required: ["company", "invoiceNumber", "issueDate", "serviceDate", "taxBase", "vat", "total", "netAmount", "concept", "expenseCategory", "vehicle"],
};

const consumptionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    date: { type: ["string", "null"] },
    supplyType: { type: ["string", "null"] },
    consumptionPeriod: { type: ["string", "null"] },
    consumption: { type: ["number", "null"] },
    unit: { type: ["string", "null"] },
    cost: { type: ["number", "null"] },
    costPerUnit: { type: ["number", "null"] },
  },
  required: ["date", "supplyType", "consumptionPeriod", "consumption", "unit", "cost", "costPerUnit"],
};

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
};

const readBody = async (req) => {
  if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString("utf8"));
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const fieldConfidenceSchema = (schema) => ({
  type: "object",
  additionalProperties: false,
  properties: Object.fromEntries(Object.keys(schema.properties).map((key) => [key, { type: "number" }])),
  required: Object.keys(schema.properties),
});

const buildSchema = (category) => {
  const fields = category === "billing" ? billingSchema : consumptionSchema;
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      category: { type: "string", enum: [category] },
      documentType: { type: "string" },
      fields,
      confidence: fieldConfidenceSchema(fields),
      overallConfidence: { type: "number" },
      warnings: { type: "array", items: { type: "string" } },
    },
    required: ["category", "documentType", "fields", "confidence", "overallConfidence", "warnings"],
  };
};

const buildPrompt = (category) => {
  if (category === "billing") {
    return `Analiza este documento de facturación usando visión y OCR. Devuelve solo el JSON solicitado. Extrae sin inventar: empresa, número de factura, fechas de emisión y servicio, base imponible, IVA, total, importe neto, concepto, categoría de gasto y matrícula o referencia de vehículo si aparece. Las fechas deben estar en formato ISO YYYY-MM-DD cuando sea posible. Los importes deben ser números en euros, sin símbolo. Si un dato no aparece devuelve null. Clasifica la categoría de gasto con una etiqueta corta en español. Asigna una confianza de 0 a 100 a cada campo y añade avisos para cualquier dato dudoso, ilegible o calculado.`;
  }
  return `Analiza este documento de consumo usando visión y OCR. Devuelve solo el JSON solicitado. Extrae sin inventar: fecha, tipo de suministro, periodo de consumo, consumo registrado, unidad, coste y coste por unidad. Las fechas deben estar en formato ISO YYYY-MM-DD cuando sea posible. Los importes deben ser números en euros y el consumo un número, sin símbolos. Si un dato no aparece devuelve null. Asigna una confianza de 0 a 100 a cada campo y añade avisos para cualquier dato dudoso, ilegible o calculado.`;
};

const extractOutputText = (body) => {
  if (typeof body?.output_text === "string") return body.output_text;
  return (body?.output ?? []).flatMap((item) => item?.content ?? []).map((content) => content?.text ?? "").filter(Boolean).join("\n");
};

const parseModelOutput = (body) => {
  const text = extractOutputText(body).trim();
  if (!text) throw new Error("La IA no ha devuelto datos estructurados.");
  try {
    return JSON.parse(text);
  } catch {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd <= jsonStart) throw new Error("La IA ha devuelto una respuesta no válida.");
    return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  }
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return json(res, 405, { code: "METHOD_NOT_ALLOWED", message: "Método no permitido." });
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return json(res, 503, { code: "AI_NOT_CONFIGURED", message: "El servicio de IA no está configurado en el servidor." });
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { code: "INVALID_JSON", message: "La solicitud no contiene un JSON válido." });
  }

  const category = body?.category;
  const dataUrl = body?.dataUrl;
  const fileName = String(body?.fileName || "documento");
  const fileType = String(body?.fileType || "");
  if (!Object.hasOwn({ billing: true, consumption: true }, category) || typeof dataUrl !== "string" || !/^data:(?:image\/(?:jpeg|png|webp)|application\/pdf);base64,/i.test(dataUrl)) {
    return json(res, 400, { code: "INVALID_DOCUMENT", message: "Faltan el tipo de registro o el documento." });
  }
  if (Buffer.byteLength(dataUrl, "utf8") > MAX_DATA_URL_BYTES) {
    return json(res, 413, { code: "DOCUMENT_TOO_LARGE", message: "El documento preparado supera el límite de procesamiento." });
  }

  const content = [{ type: "input_text", text: buildPrompt(category) }];
  if (fileType === "application/pdf" || fileName.toLocaleLowerCase("es").endsWith(".pdf")) {
    content.push({ type: "input_file", filename: fileName, file_data: dataUrl });
  } else {
    content.push({ type: "input_image", image_url: dataUrl, detail: "high" });
  }

  const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_DOCUMENT_MODEL?.trim() || "gpt-4.1-mini",
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: "fleet_document_extraction", strict: true, schema: buildSchema(category) } },
    }),
    signal: AbortSignal.timeout(45000),
  });
  const responseText = await openAiResponse.text();
  let responseBody;
  try {
    responseBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseBody = null;
  }
  if (!openAiResponse.ok) {
    console.error("OpenAI document analysis failed", openAiResponse.status, responseBody?.error?.code || "unknown");
    return json(res, 502, { code: "AI_REQUEST_FAILED", message: "No se ha podido analizar el documento. Inténtalo de nuevo." });
  }

  try {
    const extraction = parseModelOutput(responseBody);
    return json(res, 200, {
      ...extraction,
      analyzedAt: new Date().toISOString(),
      provider: "openai",
    });
  } catch (error) {
    console.error("OpenAI document analysis returned invalid JSON", error.message);
    return json(res, 502, { code: "AI_INVALID_RESPONSE", message: "La IA no ha devuelto una extracción válida. Inténtalo de nuevo." });
  }
}
