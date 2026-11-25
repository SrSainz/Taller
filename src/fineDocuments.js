export const maxFineDocuments = 20;

export const getFineDocuments = (fine) => {
  const documents = [
    { path: fine?.photo_path, name: fine?.photo_name, mimeType: fine?.photo_mime_type },
    ...(Array.isArray(fine?.attachments) ? fine.attachments : []),
  ];
  const seen = new Set();
  return documents.filter((document) => {
    if (!document?.path || document.path.includes("..") || document.path.includes("\\") || seen.has(document.path)) return false;
    if (fine.created_by && !document.path.startsWith(`${fine.created_by}/driver-fines/`)) return false;
    seen.add(document.path);
    return true;
  });
};

// Nothing is persisted until every file has uploaded. Failed batches are cleaned up.
export async function archiveFineDocuments({ files, prepare, upload, remove, persist }) {
  if (!files?.length || files.length > maxFineDocuments) throw new Error(`Adjunta entre 1 y ${maxFineDocuments} documentos por multa.`);
  const uploaded = [];
  try {
    for (const file of files) uploaded.push(await upload(await prepare(file)));
    return await persist(uploaded);
  } catch (error) {
    if (uploaded.length) {
      try { await remove(uploaded.map((document) => document.path)); }
      catch { error.message += " No se pudieron limpiar todos los archivos temporales."; }
    }
    throw error;
  }
}
