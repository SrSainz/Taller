import { useState } from "react";

export default function EditableCommissionText({ value, name, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async (restore = false) => {
    if (busy) return;
    setBusy(true); setError("");
    try { await onSave(restore ? null : draft); setEditing(false); }
    catch (failure) { setError(failure.message || "No se pudo guardar el texto."); }
    finally { setBusy(false); }
  };
  return <span className="commission-text-control">
    <button type="button" className="commission-text-trigger" aria-label={`Cambiar texto de ${name}`} title="Editar texto" onClick={() => { setDraft(value); setError(""); setEditing(true); }}>{value}<i aria-hidden="true">✎</i></button>
    {editing && <form className="commission-text-editor" aria-label={`Modificar texto de ${name}`} onSubmit={(event) => { event.preventDefault(); save(); }}>
      <input autoFocus type="text" aria-label={`Texto de ${name}`} maxLength={80} value={draft} disabled={busy} onChange={(event) => setDraft(event.target.value)} />
      <button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</button><button type="button" disabled={busy} onClick={() => setEditing(false)}>Cancelar</button><button type="button" disabled={busy} onClick={() => save(true)}>Restaurar texto</button>
      {error && <small role="alert">{error}</small>}
    </form>}
  </span>;
}
