import assert from "node:assert/strict";
import test from "node:test";
import { prepareDriverPhotoFile } from "../src/documentAnalysis.js";

test("las fotos del conductor se archivan como WebP con nombre y MIME coherentes", async () => {
  const previousBitmap = globalThis.createImageBitmap;
  const previousDocument = globalThis.document;
  let canvas;
  globalThis.createImageBitmap = async () => ({ width: 2400, height: 1200, close() {} });
  globalThis.document = { createElement: () => (canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage() {} }),
    toBlob: (callback, type) => callback(new Blob(["webp-image"], { type })),
  }) };
  try {
    const original = new File(["jpeg-camera-image"], "ticket.jpeg", { type: "image/jpeg" });
    const prepared = await prepareDriverPhotoFile(original);
    assert.equal(prepared.name, "ticket.webp");
    assert.equal(prepared.type, "image/webp");
    assert.equal(canvas.width, 1800);
    assert.equal(canvas.height, 900);
    assert.equal(await prepared.text(), "webp-image");
    assert.equal(original.name, "ticket.jpeg");
  } finally {
    globalThis.createImageBitmap = previousBitmap;
    globalThis.document = previousDocument;
  }
});

test("un PDF se mantiene intacto y un navegador sin codificador WebP da un error claro", async () => {
  const pdf = new File(["%PDF"], "factura.pdf", { type: "application/pdf" });
  assert.equal(await prepareDriverPhotoFile(pdf), pdf);
  const previousBitmap = globalThis.createImageBitmap;
  const previousDocument = globalThis.document;
  globalThis.createImageBitmap = async () => ({ width: 10, height: 10, close() {} });
  globalThis.document = { createElement: () => ({ getContext: () => ({ drawImage() {} }), toBlob: (callback) => callback(new Blob(["png"], { type: "image/png" })) }) };
  try {
    const photo = new File(["jpeg"], "foto.jpg", { type: "image/jpeg" });
    await assert.rejects(prepareDriverPhotoFile(photo), /WebP/);
  } finally {
    globalThis.createImageBitmap = previousBitmap;
    globalThis.document = previousDocument;
  }
});
