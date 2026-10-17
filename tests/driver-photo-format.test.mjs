import assert from "node:assert/strict";
import test from "node:test";
import { prepareDocumentFile, prepareDriverPhotoFile, validateSelectedDocumentFile } from "../src/documentAnalysis.js";

test("las fotos HEIC del iPhone se aceptan para convertir, pero no se envían sin conversión", async () => {
  const photo = new File(["heic"], "IMG_1234.HEIC", { type: "image/heic" });
  assert.equal(validateSelectedDocumentFile(photo).valid, true);
  assert.equal(validateSelectedDocumentFile(photo).kind, "image");
  assert.equal(validateSelectedDocumentFile(new File(["x"], "foto.gif", { type: "image/gif" })).valid, false);
});

test("Safari puede convertir HEIC mediante Image cuando createImageBitmap falla", async () => {
  const previous = { bitmap: globalThis.createImageBitmap, document: globalThis.document, Image: globalThis.Image, URL: globalThis.URL };
  let revoked = false;
  globalThis.createImageBitmap = async () => { throw new Error("unsupported"); };
  globalThis.Image = class { naturalWidth = 2400; naturalHeight = 1200; set src(_) { queueMicrotask(() => this.onload()); } };
  globalThis.URL = { createObjectURL: () => "blob:photo", revokeObjectURL: () => { revoked = true; } };
  globalThis.document = { createElement: () => ({ getContext: () => ({ drawImage() {} }), toBlob: (callback, type) => callback(new Blob(["webp"], { type })) }) };
  try {
    const photo = new File(["heic"], "IMG_1234.HEIC", { type: "image/heic" });
    const result = await prepareDriverPhotoFile(photo);
    assert.equal(result.name, "IMG_1234.webp");
    assert.equal(result.type, "image/webp");
    assert.equal(revoked, true);
  } finally {
    globalThis.createImageBitmap = previous.bitmap;
    globalThis.document = previous.document;
    globalThis.Image = previous.Image;
    globalThis.URL = previous.URL;
  }
});

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

test("las imágenes del administrador también se convierten a WebP y los PDF permanecen intactos", async () => {
  const previousBitmap = globalThis.createImageBitmap;
  const previousDocument = globalThis.document;
  globalThis.createImageBitmap = async () => ({ width: 800, height: 600, close() {} });
  globalThis.document = { createElement: () => ({
    getContext: () => ({ drawImage() {} }),
    toBlob: (callback, type) => callback(new Blob(["webp-admin"], { type })),
  }) };
  try {
    const original = new File(["png-admin"], "factura.png", { type: "image/png" });
    const prepared = await prepareDocumentFile(original);
    assert.equal(prepared.name, "factura.webp");
    assert.equal(prepared.type, "image/webp");
    assert.equal(await prepared.text(), "webp-admin");
    const pdf = new File(["%PDF"], "factura.pdf", { type: "application/pdf" });
    assert.equal(await prepareDocumentFile(pdf), pdf);
  } finally {
    globalThis.createImageBitmap = previousBitmap;
    globalThis.document = previousDocument;
  }
});
