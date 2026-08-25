import { getVercelOidcToken } from "@vercel/oidc";

const MAX_DATA_URL_BYTES = 4 * 1024 * 1024;
const structuredExtractionAddendum = "Prioriza siempre la fecha impresa, el importe total pagado, la matricula visible y el proveedor. En documentos de consumo identifica tambien combustible, gasolinera y numero de ticket y, si el documento indica expresamente que agrupa varios repostajes o consumos del mismo dia, devuelve ese numero en consumptionCount; si no lo indica, devuelve null. En capturas de facturacion separa precio neto base, promociones, facturacion total, efectivo cobrado y propinas; no sumes la propina al precio neto. Devuelve null cuando un campo no sea legible y no inventes valores.";

const billingSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    company: { type: ["string", "null"] },
    invoiceNumber: { type: ["string", "null"] },
    issueDate: { type: ["string", "null"] },
    serviceDate: { type: ["string", "null"] },
    date: { type: ["string", "null"] },
    periodStart: { type: ["string", "null"] },
    periodEnd: { type: ["string", "null"] },
    taxBase: { type: ["number", "null"] },
    vat: { type: ["number", "null"] },
    total: { type: ["number", "null"] },
    baseNetAmount: { type: ["number", "null"] },
    netAmount: { type: ["number", "null"] },
    promotions: { type: ["number", "null"] },
    cashCollected: { type: ["number", "null"] },
    tips: { type: ["number", "null"] },
    connection: { type: ["string", "null"] },
    points: { type: ["number", "null"] },
    refunds: { type: ["number", "null"] },
    tolls: { type: ["number", "null"] },
    washExpenses: { type: ["number", "null"] },
    otherExpenses: { type: ["number", "null"] },
    trips: { type: ["number", "null"] },
    concept: { type: ["string", "null"] },
    expenseCategory: { type: ["string", "null"] },
    vehicle: { type: ["string", "null"] },
  },
  required: ["company", "invoiceNumber", "issueDate", "serviceDate", "date", "periodStart", "periodEnd", "taxBase", "vat", "total", "baseNetAmount", "netAmount", "promotions", "cashCollected", "tips", "connection", "points", "refunds", "tolls", "washExpenses", "otherExpenses", "trips", "concept", "expenseCategory", "vehicle"],
};

const consumptionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    date: { type: ["string", "null"] },
    supplyType: { type: ["string", "null"] },
    fuelType: { type: ["string", "null"] },
    provider: { type: ["string", "null"] },
    invoiceNumber: { type: ["string", "null"] },
    consumptionPeriod: { type: ["string", "null"] },
    consumption: { type: ["number", "null"] },
    consumptionCount: { type: ["number", "null"] },
    dailyKm: { type: ["number", "null"] },
    odometerKm: { type: ["number", "null"] },
    unit: { type: ["string", "null"] },
    cost: { type: ["number", "null"] },
    costPerUnit: { type: ["number", "null"] },
    vehicle: { type: ["string", "null"] },
  },
  required: ["date", "supplyType", "fuelType", "provider", "invoiceNumber", "consumptionPeriod", "consumption", "consumptionCount", "dailyKm", "odometerKm", "unit", "cost", "costPerUnit", "vehicle"],
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

export const buildSchema = (category) => {
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

export const buildPrompt = (category) => {
  if (category === "billing") {
    return `Analiza este documento de facturación usando visión y OCR. Devuelve solo el JSON solicitado. Extrae sin inventar: empresa, número de factura, fechas de emisión y servicio, base imponible, IVA, total, importe neto, promociones o bonos, efectivo o efectivo cobrado, propinas, conexión, viajes, puntos, reembolsos, peajes, lavados, otros gastos, concepto, categoría de gasto y matrícula o referencia de vehículo si aparecen. En una captura diaria de estadísticas de un conductor, extrae exactamente: la fecha o día visible en la parte superior en date o serviceDate; el texto de duración en connection (por ejemplo, 9 h 21 m); viajes en trips; puntos en points; la cifra rotulada "Precio neto" antes de promociones en baseNetAmount; la suma de baseNetAmount y promotions en netAmount; promociones, bonos o incentivos en promotions, usando 0 si se indica expresamente que no hay promociones; Propina en tips; Ganancias totales en total; Reembolsos en refunds; y Efectivo cobrado en cashCollected, conservando el signo negativo si aparece. El Precio neto final que usará la aplicación es baseNetAmount + promotions. No confundas Precio neto con Ganancias totales, no sumes la propina al Precio neto y no la sumes a cashCollected. En una factura que no sea una captura diaria, usa netAmount para el importe neto impreso y deja baseNetAmount y promotions en null salvo que aparezcan claramente. La fecha debe proceder exclusivamente del texto visible del documento, nunca de la fecha actual, de la subida ni del nombre del archivo. Si el documento representa la actividad de un día, usa ese día en serviceDate; usa issueDate para la fecha de emisión impresa. Extrae en cashCollected únicamente la cifra rotulada como "Efectivo", "Efectivo cobrado" o equivalente inequívoco; no uses el total facturado como sustituto si ese dato no aparece. Extrae en tips únicamente la cifra rotulada como "Propina" o "Propinas"; no la confundas con el precio neto o las ganancias totales. Extrae tolls, washExpenses y otherExpenses solo cuando esos conceptos estén expresamente identificados. Las fechas deben estar en formato ISO YYYY-MM-DD cuando sea posible. Los importes deben ser números en euros, sin símbolo. Si un dato no aparece devuelve null. Clasifica la categoría de gasto con una etiqueta corta en español. Asigna una confianza de 0 a 100 a cada campo y añade avisos para cualquier dato dudoso, ilegible o calculado.`;
  }
  return `Analiza este documento de consumo, repostaje o lectura del vehículo usando visión y OCR. Devuelve solo el JSON solicitado. Extrae sin inventar: fecha, tipo de suministro, periodo de consumo, consumo registrado, cantidad de consumos registrados en este día solo si el documento indica expresamente que agrupa más de uno, kilómetros diarios si aparecen, kilometraje acumulado del cuentakilómetros si aparece, unidad, coste y coste por unidad. En un ticket o factura de gasolina, date debe ser la fecha de operación o factura impresa en el documento, nunca la fecha actual, la fecha de subida ni la del nombre del archivo. En ese caso, cost debe ser el importe TOTAL finalmente pagado de la factura; no uses la base imponible, los impuestos aislados, los litros ni el precio por litro. Para una foto del cuadro del coche, identifica el número de kilómetros mostrado y úsalo en odometerKm; si se muestra una distancia del día, úsala en dailyKm. Las fechas deben estar en formato ISO YYYY-MM-DD cuando sea posible. Los importes deben ser números en euros y el consumo y kilometrajes números, sin símbolos. Si un dato no aparece devuelve null. Asigna una confianza de 0 a 100 a cada campo y añade avisos para cualquier dato dudoso, ilegible o calculado.`;
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

  const directOpenAiKey = process.env.OPENAI_API_KEY?.trim();
  let requestOidcToken = "";
  if (process.env.VERCEL && !directOpenAiKey && !process.env.AI_GATEWAY_API_KEY?.trim() && !process.env.VERCEL_OIDC_TOKEN?.trim()) {
    try {
      requestOidcToken = (await getVercelOidcToken())?.trim() || "";
    } catch {
      requestOidcToken = "";
    }
  }
  const gatewayToken = process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim() || requestOidcToken;
  const aiToken = directOpenAiKey || gatewayToken;
  if (!aiToken) {
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

  const content = [{ type: "input_text", text: `${buildPrompt(category)} ${structuredExtractionAddendum}` }];
  if (fileType === "application/pdf" || fileName.toLocaleLowerCase("es").endsWith(".pdf")) {
    content.push({ type: "input_file", filename: fileName, file_data: dataUrl });
  } else {
    content.push({ type: "input_image", image_url: dataUrl, detail: "high" });
  }

  const usesGateway = !directOpenAiKey;
  const openAiResponse = await fetch(usesGateway ? "https://ai-gateway.vercel.sh/v1/responses" : "https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${aiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_DOCUMENT_MODEL?.trim() || (usesGateway ? "openai/gpt-5.4" : "gpt-4.1-mini"),
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
