import encode, { init } from "@jsquash/webp/encode.js";
import wasmUrl from "@jsquash/webp/codec/enc/webp_enc.wasm?url";
import simdWasmUrl from "@jsquash/webp/codec/enc/webp_enc_simd.wasm?url";

let ready;

// Some Safari versions read WebP but return PNG from canvas.toBlob(). Load
// our local encoder only when the native encoder cannot produce WebP.
export async function encodeWebP(imageData) {
  if (!ready) {
    ready = init(undefined, {
      locateFile: (path) => path.endsWith("webp_enc_simd.wasm") ? simdWasmUrl : wasmUrl,
    }).catch((error) => { ready = null; throw error; });
  }
  await ready;
  const bytes = await encode(imageData, { quality: 78, method: 4 });
  const header = new Uint8Array(bytes, 0, Math.min(12, bytes.byteLength));
  if (header.length !== 12 || String.fromCharCode(...header.subarray(0, 4)) !== "RIFF" || String.fromCharCode(...header.subarray(8, 12)) !== "WEBP") {
    throw new Error("El codificador no ha generado una imagen WebP válida.");
  }
  return new Blob([bytes], { type: "image/webp" });
}
