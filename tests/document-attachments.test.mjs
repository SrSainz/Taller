import test from "node:test";
import assert from "node:assert/strict";
import { archiveDocumentAttachments, getSupportingDocuments, maxMaintenanceDocuments } from "../src/documentAttachments.js";

const pdf = (name, content = name) => new File([content], name, { type: "application/pdf" });
const fixture = (overrides = {}) => {
  const uploaded = [], removed = [];
  let persisted;
  return {
    uploaded, removed, get persisted() { return persisted; },
    options: {
      document: { file_hash: "main", extracted_data: { total: 125, serviceDate: "2026-10-21", vehicle: "5043 MLC" } },
      createPath: file => `owner/billing/2026-10-21/${file.name}`,
      hash: file => file.text(), prepare: async file => file,
      upload: async (path, file) => uploaded.push({ path, file }),
      remove: async paths => removed.push(...paths),
      persist: async entries => { persisted = entries; return entries; }, ...overrides,
    },
  };
};

test("varios PDF se conservan intactos en una sola actuación", async () => {
  const state = fixture(), first = pdf("factura.pdf"), second = pdf("presupuesto.pdf");
  const result = await archiveDocumentAttachments({ ...state.options, files: [first, second] });
  assert.equal(result.length, 2);
  assert.equal(state.uploaded[0].file, first);
  assert.equal(state.uploaded[1].file, second);
  assert.equal(state.options.document.extracted_data.total, 125);
});

test("las fotos se convierten a WebP antes de archivarse y nunca se guarda un PNG como WebP", async () => {
  const jpg = new File(["original"], "IMG_1.jpeg", { type: "image/jpeg" });
  const webp = new File(["encoded"], "IMG_1.webp", { type: "image/webp" });
  const state = fixture({ prepare: async () => webp });
  await archiveDocumentAttachments({ ...state.options, files: [jpg] });
  assert.equal(state.uploaded[0].file.type, "image/webp");
  assert.equal(state.persisted[0].name, "IMG_1.webp");
  assert.equal(state.persisted[0].mimeType, "image/webp");
  const invalid = fixture({ prepare: async () => new File(["png"], "wrong.png", { type: "image/png" }) });
  await assert.rejects(archiveDocumentAttachments({ ...invalid.options, files: [jpg] }), /WebP/);
  assert.equal(invalid.uploaded.length, 0);
});

test("no duplica el documento principal ni un adjunto ya archivado", async () => {
  const previous = { path: "old.pdf", name: "old.pdf", hash: "old" };
  const state = fixture({ document: { file_hash: "main", extracted_data: { supportingDocuments: [previous] } } });
  const result = await archiveDocumentAttachments({ ...state.options, files: [pdf("main.pdf", "main"), pdf("old-copy.pdf", "old"), pdf("new.pdf", "new"), pdf("new-copy.pdf", "new")] });
  assert.equal(state.uploaded.length, 1);
  assert.equal(result.length, 2);
  assert.equal(result[0], previous);
});

test("un fallo de un archivo limpia los anteriores y no modifica la actuación", async () => {
  const state = fixture({ upload: async (path) => { if (path.endsWith("fail.pdf")) throw new Error("upload failed"); } });
  await assert.rejects(archiveDocumentAttachments({ ...state.options, files: [pdf("ok.pdf"), pdf("fail.pdf")] }), /upload failed/);
  assert.equal(state.persisted, undefined);
  assert.deepEqual(state.removed, ["owner/billing/2026-10-21/ok.pdf"]);
});

test("un fallo al guardar metadatos limpia solo los adjuntos nuevos", async () => {
  const state = fixture({ document: { extracted_data: { supportingDocuments: [{ path: "old.pdf" }] } }, persist: async () => { throw new Error("database failed"); } });
  await assert.rejects(archiveDocumentAttachments({ ...state.options, files: [pdf("new.pdf")] }), /database failed/);
  assert.deepEqual(state.removed, ["owner/billing/2026-10-21/new.pdf"]);
});

test("respeta el límite del lote y los documentos anteriores sin adjuntos", async () => {
  const state = fixture();
  await assert.rejects(archiveDocumentAttachments({ ...state.options, files: Array.from({ length: maxMaintenanceDocuments }, (_, i) => pdf(`${i}.pdf`)) }), /20/);
  assert.equal(state.uploaded.length, 0);
  assert.deepEqual(getSupportingDocuments({ extracted_data: { total: 45 } }), []);
  assert.deepEqual(getSupportingDocuments({ extracted_data: { supportingDocuments: [null, { name: "bad" }, { path: "ok.pdf" }] } }), [{ path: "ok.pdf" }]);
});

test("los metadatos de un adjunto no pueden apuntar a archivos de otra cuenta", () => {
  const document = { owner_id: "driver-a", category: "billing", extracted_data: { supportingDocuments: [
    { path: "driver-a/billing/2026-10-21/ok.webp" },
    { path: "driver-b/billing/2026-10-21/private.webp" },
    { path: "driver-a/billing/../private.webp" },
  ] } };
  assert.deepEqual(getSupportingDocuments(document), [{ path: "driver-a/billing/2026-10-21/ok.webp" }]);
});

test("si el dispositivo no ofrece hash, no se descartan los siguientes archivos", async () => {
  const state = fixture({ hash: async () => "" });
  await archiveDocumentAttachments({ ...state.options, files: [pdf("first.pdf"), pdf("second.pdf")] });
  assert.equal(state.uploaded.length, 2);
});
