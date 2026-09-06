// Private sidecars use the same owner/date directory and RLS as the original.
// This works on Supabase Free without the paid image transformation endpoint.
export const thumbnailPath = (path) => `${path}.thumbnail.webp`;

export async function createStorageThumbnail(file) {
  if (!/^image\/(jpeg|png|webp|gif|avif|bmp)$/i.test(file?.type ?? "") || typeof createImageBitmap !== "function") return null;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 480 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.65));
  } catch {
    // An unsupported image must not prevent saving the original receipt.
    return null;
  } finally {
    bitmap?.close();
  }
}
