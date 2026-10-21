import { getDocumentMimeType, prepareDocumentFile, validateDocumentFile, validateSelectedDocumentFile } from "./documentAnalysis.js";
import { hashDocumentFile } from "./transactions.js";

export const maxMaintenanceDocuments = 20;
export const getSupportingDocuments = (document) => {
  const entries = document?.extracted_data?.supportingDocuments;
  const prefix = document?.owner_id && document?.category ? `${document.owner_id}/${document.category}/` : "";
  return Array.isArray(entries) ? entries.filter((entry) => typeof entry?.path === "string" && entry.path
    && !entry.path.includes("..") && !entry.path.includes("\\") && (!prefix || entry.path.startsWith(prefix))) : [];
};

// Upload sequentially to avoid retaining several full-resolution phone images.
// The record is changed only after the complete batch succeeds.
export async function archiveDocumentAttachments({ document, files = [], createPath, upload, remove, persist, prepare = prepareDocumentFile, hash = hashDocumentFile }) {
  const attachments = getSupportingDocuments(document);
  if (attachments.length + files.length + 1 > maxMaintenanceDocuments) throw new Error(`Puedes guardar hasta ${maxMaintenanceDocuments} documentos por actuación.`);
  const hashes = new Set([document.file_hash, ...attachments.map((entry) => entry.hash)].filter(Boolean));
  const uploaded = [];
  try {
    for (const file of files) {
      const validation = validateSelectedDocumentFile(file);
      if (!validation.valid) throw new Error(`${file.name}: ${validation.message}`);
      const fileHash = await hash(file);
      if (fileHash && hashes.has(fileHash)) continue;
      const stored = await prepare(file);
      const preparedValidation = validateDocumentFile(stored);
      if (!preparedValidation.valid) throw new Error(`${file.name}: ${preparedValidation.message}`);
      if (preparedValidation.kind === "image" && stored.type !== "image/webp") throw new Error(`${file.name}: no se ha podido convertir la fotografía a WebP.`);
      const path = createPath(stored);
      await upload(path, stored);
      uploaded.push({ path, name: stored.name, mimeType: getDocumentMimeType(stored), size: stored.size, hash: fileHash });
      if (fileHash) hashes.add(fileHash);
    }
    return await persist([...attachments, ...uploaded]);
  } catch (error) {
    if (uploaded.length) {
      try { await remove(uploaded.map((entry) => entry.path)); }
      catch { error.message += " No se han podido limpiar todos los archivos temporales; avisa al administrador."; }
    }
    throw error;
  }
}
