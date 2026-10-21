import { useState } from "react";
import { appendDocumentAttachments } from "./supabase.js";
import { getSupportingDocuments } from "./documentAttachments.js";
import MaintenanceFilePicker from "./MaintenanceFilePicker.jsx";

export default function MaintenanceInvoiceAttachments({ document, renderAttachment, onUpdated }) {
  const [current, setCurrent] = useState(document);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const attachments = getSupportingDocuments(current);
  const save = async () => {
    if (saving || !files.length) return;
    setSaving(true); setMessage("");
    try {
      const saved = await appendDocumentAttachments(current.id, files);
      setCurrent(saved); setFiles([]); onUpdated?.(saved);
      setMessage("Adjuntos guardados en esta actuación. El importe no ha cambiado.");
    } catch (error) { setMessage(error.message || "No se han podido guardar los adjuntos."); }
    finally { setSaving(false); }
  };
  return <section className="maintenance-attachments" aria-label="Documentos de la actuación">
    <h3>Documentos de la actuación</h3>
    <p>Todos pertenecen al mismo día y vehículo. Añadir adjuntos no genera otro gasto.</p>
    {attachments.length > 0 && <ul>{attachments.map((entry, index) => <li key={entry.path}>{renderAttachment(entry, index)}</li>)}</ul>}
    <MaintenanceFilePicker files={files} onChange={setFiles} disabled={saving} existingCount={1 + attachments.length} />
    {files.length > 0 && <button type="button" className="primary-button" onClick={save} disabled={saving}>{saving ? "Guardando adjuntos…" : "Guardar adjuntos"}</button>}
    {message && <p role="status">{message}</p>}
  </section>;
}
