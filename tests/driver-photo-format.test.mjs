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
  let drawnSize;
  globalThis.createImageBitmap = async () => ({ width: 2400, height: 1200, close() {} });
  globalThis.document = { createElement: () => (canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage(_image, _x, _y, width, height) { drawnSize = [width, height]; } }),
    toBlob: (callback, type) => callback(new Blob(["webp-image"], { type })),
  }) };
  try {
    const original = new File(["jpeg-camera-image"], "ticket.jpeg", { type: "image/jpeg" });
    const prepared = await prepareDriverPhotoFile(original);
    assert.equal(prepared.name, "ticket.webp");
    assert.equal(prepared.type, "image/webp");
    assert.deepEqual(drawnSize, [1800, 900]);
    assert.equal(canvas.width, 1);
    assert.equal(canvas.height, 1);
    assert.equal(await prepared.text(), "webp-image");
    assert.equal(original.name, "ticket.jpeg");
  } finally {
    globalThis.createImageBitmap = previousBitmap;
    globalThis.document = previousDocument;
  }
});

test("Safari que devuelve PNG usa el codificador alternativo sin modificar el PDF", async () => {
  const pdf = new File(["%PDF"], "factura.pdf", { type: "application/pdf" });
  assert.equal(await prepareDriverPhotoFile(pdf), pdf);
  const previousBitmap = globalThis.createImageBitmap;
  const previousDocument = globalThis.document;
  globalThis.createImageBitmap = async () => ({ width: 10, height: 10, close() {} });
  const pixels = { data: new Uint8ClampedArray(400), width: 10, height: 10 };
  globalThis.document = { createElement: () => ({ getContext: () => ({ drawImage() {}, getImageData: () => pixels }), toBlob: (callback) => callback(new Blob(["png"], { type: "image/png" })) }) };
  try {
    const photo = new File(["jpeg"], "foto.jpg", { type: "image/jpeg" });
    let calls = 0;
    const encodeWebp = async (imageData) => { assert.equal(imageData, pixels); calls++; return new Blob(["webp"], { type: "image/webp" }); };
    const result = await prepareDocumentFile(photo, { encodeWebp });
    assert.equal(result.type, "image/webp");
    assert.equal(result.name, "foto.webp");
    assert.equal(calls, 1);
    await assert.rejects(prepareDocumentFile(photo, { encodeWebp: async () => { throw new Error("codec unavailable"); } }), /WebP/);
    assert.equal(photo.type, "image/jpeg");
  } finally {
    globalThis.createImageBitmap = previousBitmap;
    globalThis.document = previousDocument;
  }
});

test("la selección permite fotos grandes del iPhone sin relajar el límite de 30 MB", async () => {
  for (const [name, type] of [["IMG_001.jpeg", "image/jpeg"], ["IMG_002.HEIC", "image/heic"]]) {
    assert.equal(validateSelectedDocumentFile({ name, type, size: 20 * 1024 * 1024 }).valid, true);
    const oversized = { name, type, size: 31 * 1024 * 1024 };
    assert.equal(validateSelectedDocumentFile(oversized).valid, false);
    assert.equal(await prepareDocumentFile(oversized), oversized);
  }
  const heic = new File(["heic"], "IMG_001.HEIC", { type: "image/heic" });
  assert.equal(await prepareDocumentFile(heic, { allowHeic: false }), heic);
});

test("los fallos nativos de toBlob también activan el codificador alternativo", async () => {
  const previous = { bitmap: globalThis.createImageBitmap, document: globalThis.document };
  let calls = 0;
  globalThis.createImageBitmap = async () => ({ width: 10, height: 10, close() {} });
  try {
    for (const toBlob of [(callback) => callback(null), () => { throw new Error("not supported"); }]) {
      globalThis.document = { createElement: () => ({ getContext: () => ({ drawImage() {}, getImageData: () => ({ data: new Uint8ClampedArray(400), width: 10, height: 10 }) }), toBlob }) };
      const result = await prepareDocumentFile(new File(["jpeg"], "foto.jpg", { type: "image/jpeg" }), { encodeWebp: async () => { calls++; return new Blob(["webp"], { type: "image/webp" }); } });
      assert.equal(result.type, "image/webp");
    }
    assert.equal(calls, 2);
  } finally {
    globalThis.createImageBitmap = previous.bitmap;
    globalThis.document = previous.document;
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
