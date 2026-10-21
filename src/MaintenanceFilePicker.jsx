import { useRef, useState } from "react";
import { IconCamera, IconUpload, IconX } from "@tabler/icons-react";
import { validateSelectedDocumentFile } from "./documentAnalysis.js";
import { maxMaintenanceDocuments } from "./documentAttachments.js";
import "./maintenanceAttachments.css";

export default function MaintenanceFilePicker({ files, onChange, disabled = false, existingCount = 1 }) {
  const cameraRef = useRef(null), filesRef = useRef(null);
  const [error, setError] = useState("");
  const addFiles = (event) => {
    const selected = [...(event.target.files ?? [])];
    event.target.value = "";
    if (disabled || !selected.length) return;
    const invalid = selected.find((file) => !validateSelectedDocumentFile(file).valid);
    if (invalid) { setError(`${invalid.name}: ${validateSelectedDocumentFile(invalid).message}`); return; }
    // Phone cameras can reuse names and timestamps for different pictures.
    // Deduplicate by content at archive time, never by filename alone.
    const combined = [...files, ...selected];
    if (combined.length + existingCount > maxMaintenanceDocuments) { setError(`Máximo ${maxMaintenanceDocuments} documentos por actuación.`); return; }
    setError(""); onChange(combined);
  };
  return <div className="maintenance-attachments-picker">
    <div className="maintenance-attachments-picker__actions">
      <button type="button" className="secondary-button" onClick={() => cameraRef.current?.click()} disabled={disabled}><IconCamera size={17} />Añadir foto</button>
      <button type="button" className="secondary-button" onClick={() => filesRef.current?.click()} disabled={disabled}><IconUpload size={17} />Añadir archivos</button>
    </div>
    <input ref={cameraRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" capture="environment" aria-label="Añadir foto a la actuación" onChange={addFiles} disabled={disabled} />
    <input ref={filesRef} className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf,.pdf" aria-label="Añadir archivos a la actuación" onChange={addFiles} disabled={disabled} />
    {files.length > 0 && <ul>{files.map((file, index) => <li key={`${file.name}-${index}`}><span>{file.name}</span><button type="button" onClick={() => onChange(files.filter((_, candidate) => candidate !== index))} disabled={disabled} aria-label={`Quitar adjunto ${file.name}`}><IconX size={16} /></button></li>)}</ul>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
