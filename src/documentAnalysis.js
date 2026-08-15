export const documentCategoryLabels = {
  billing: "Facturación",
  consumption: "Consumo",
};

export const documentFieldDefinitions = {
  billing: [
    { key: "company", label: "Empresa", type: "text", placeholder: "Empresa emisora" },
    { key: "invoiceNumber", label: "Número de factura", type: "text", placeholder: "Número o referencia" },
    { key: "issueDate", label: "Fecha de factura", type: "date" },
    { key: "serviceDate", label: "Fecha del servicio", type: "date" },
    { key: "date", label: "Fecha del registro", type: "date" },
    { key: "periodStart", label: "Inicio del periodo", type: "date" },
    { key: "periodEnd", label: "Fin del periodo", type: "date" },
    { key: "taxBase", label: "Base imponible", type: "number", suffix: "€", step: "0.01" },
    { key: "vat", label: "IVA", type: "number", suffix: "€", step: "0.01" },
    { key: "total", label: "Total", type: "number", suffix: "€", step: "0.01" },
    { key: "netAmount", label: "Importe neto", type: "number", suffix: "€", step: "0.01" },
    { key: "cashCollected", label: "Efectivo cobrado", type: "number", suffix: "€", step: "0.01" },
    { key: "tips", label: "Propinas", type: "number", suffix: "€", step: "0.01" },
    { key: "tolls", label: "Peajes", type: "number", suffix: "€", step: "0.01" },
    { key: "washExpenses", label: "Lavados", type: "number", suffix: "€", step: "0.01" },
    { key: "otherExpenses", label: "Otros gastos", type: "number", suffix: "€", step: "0.01" },
    { key: "trips", label: "Viajes", type: "number", step: "1" },
    { key: "concept", label: "Concepto", type: "text", placeholder: "Descripción del servicio" },
    { key: "expenseCategory", label: "Categoría de gasto", type: "text", placeholder: "Taller, combustible..." },
    { key: "vehicle", label: "Vehículo", type: "text", placeholder: "Matrícula o referencia" },
  ],
  consumption: [
    { key: "date", label: "Fecha", type: "date" },
    { key: "supplyType", label: "Tipo de suministro", type: "text", placeholder: "Combustible, electricidad..." },
    { key: "consumptionPeriod", label: "Periodo de consumo", type: "text", placeholder: "Julio 2026" },
    { key: "fuelType", label: "Combustible", type: "text", placeholder: "Gasolina, diésel..." },
    { key: "provider", label: "Gasolinera", type: "text", placeholder: "Estación de servicio" },
    { key: "invoiceNumber", label: "Número de ticket", type: "text", placeholder: "Número o referencia" },
    { key: "consumption", label: "Consumo registrado", type: "number", step: "0.01" },
    { key: "dailyKm", label: "Kilómetros diarios", type: "number", step: "0.01" },
    { key: "odometerKm", label: "Kilometraje acumulado", type: "number", step: "1" },
    { key: "unit", label: "Unidad", type: "text", placeholder: "L, kWh..." },
    { key: "cost", label: "Coste", type: "number", suffix: "€", step: "0.01" },
    { key: "costPerUnit", label: "Coste por unidad", type: "number", suffix: "€", step: "0.0001" },
    { key: "vehicle", label: "Vehículo", type: "text", placeholder: "Matrícula o referencia" },
  ],
};

export const documentMaxFileSize = 12 * 1024 * 1024;
export const documentMaxRequestSize = 3.2 * 1024 * 1024;

const allowedImageExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

const getExtension = (fileName = "") => String(fileName).split(".").pop()?.toLocaleLowerCase("es") ?? "";

export const getDocumentKind = (file) => {
  const extension = getExtension(file?.name);
  if (file?.type === "application/pdf" || extension === "pdf") return "pdf";
  if (file?.type?.startsWith("image/") || allowedImageExtensions.has(extension)) return "image";
  return "unsupported";
};

export const validateDocumentFile = (file, source = "upload") => {
  if (!file) return { valid: false, message: "No se ha seleccionado ningún archivo." };
  const kind = getDocumentKind(file);
  if (source === "camera" && kind !== "image") return { valid: false, message: "La cámara solo puede entregar imágenes compatibles." };
  if (kind === "unsupported") return { valid: false, message: "Archivo no compatible. Selecciona una imagen JPG, PNG o WEBP, o un documento PDF." };
  if (file.size > documentMaxFileSize) return { valid: false, message: "El archivo supera el límite de 12 MB. Elige un documento más ligero." };
  return { valid: true, kind };
};

export const prepareDocumentFile = async (file) => {
  const validation = validateDocumentFile(file);
  if (!validation.valid || validation.kind !== "image" || typeof createImageBitmap !== "function" || typeof document === "undefined") return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const maxDimension = 1800;
    const scale = Math.min(1, maxDimension / bitmap.width, maxDimension / bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob || (blob.size >= file.size && scale === 1)) return file;
    const baseName = String(file.name || "documento").replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } finally {
    bitmap?.close?.();
  }
};

export const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => resolve(String(reader.result)));
  reader.addEventListener("error", () => reject(new Error("No se ha podido leer el archivo.")));
  reader.readAsDataURL(file);
});

const clampConfidence = (value) => Math.max(0, Math.min(100, Number.isFinite(Number(value)) ? Number(value) : 0));

export const normalizeDocumentAnalysis = (category, analysis, defaultVehicle = "") => {
  const fields = documentFieldDefinitions[category] ?? [];
  return fields.map((definition) => {
    const extracted = analysis?.fields?.[definition.key];
    const rawValue = extracted && typeof extracted === "object" && "value" in extracted ? extracted.value : extracted;
    const fallbackValue = definition.key === "vehicle" ? defaultVehicle : "";
    return {
      ...definition,
      value: rawValue === null || rawValue === undefined || rawValue === "" ? fallbackValue : rawValue,
      confidence: clampConfidence(extracted?.confidence ?? analysis?.confidence?.[definition.key]),
    };
  });
};

export const fieldsToRecord = (fields = []) => Object.fromEntries(fields.map(({ key, value }) => [key, value]));

export const formatFileSize = (value) => {
  const size = Number(value) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toLocaleString("es-ES", { maximumFractionDigits: 1 })} KB`;
  return `${(size / (1024 * 1024)).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`;
};
