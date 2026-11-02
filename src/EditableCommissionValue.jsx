import { useState } from "react";

export default function EditableCommissionValue({ label, value, formatted, manual, signed = false, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async (automatic = false) => {
    const text = draft.trim().replace(/\s|€/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
    const number = Number(text);
    if (!automatic && (!/^-?\d+(\.\d{1,2})?$/.test(text) || !Number.isFinite(number) || (!signed && number < 0))) { setError("Introduce un importe válido."); return; }
    setBusy(true); setError("");
    try { await onSave(automatic ? null : number); setEditing(false); }
    catch (failure) { setError(failure.message || "No se pudo guardar."); }
    finally { setBusy(false); }
  };
  return <><button type="button" className="commission-value-trigger" aria-label={`Editar ${label}`} onClick={() => { setDraft(String(value)); setError(""); setEditing(true); }}><span>{label}{manual && <small> · Manual</small>}</span><strong>{formatted}</strong></button>
    {editing && <form className="commission-value-editor" aria-label={`Modificar ${label}`} onSubmit={(event) => { event.preventDefault(); if (!busy) save(); }}>
      <input autoFocus aria-label={label} type="text" inputMode="decimal" value={draft} disabled={busy} onChange={(event) => setDraft(event.target.value)} />
      <button disabled={busy} type="submit">{busy ? "Guardando…" : "Guardar"}</button><button disabled={busy} type="button" onClick={() => setEditing(false)}>Cancelar</button>
      {manual && <button disabled={busy} type="button" onClick={() => save(true)}>Automático</button>}
      {error && <small role="alert">{error}</small>}
    </form>}</>;
}
