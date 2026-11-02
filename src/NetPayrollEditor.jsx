import { useEffect, useState } from "react";

export default function NetPayrollEditor({ driver, amount, onSave }) {
  const [draft, setDraft] = useState(String(amount ?? 0));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => { setDraft(String(amount ?? 0)); }, [amount]);
  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    const text = draft.trim().replace(/\s|€/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
    const value = Number(text);
    if (!/^\d+(\.\d{1,2})?$/.test(text) || !Number.isFinite(value) || value < 0 || value > 9999999999.99) {
      setFailed(true); setMessage("Introduce una nómina válida, incluido 0."); return;
    }
    setSaving(true); setMessage(""); setFailed(false);
    try {
      await onSave(Math.round(value * 100) / 100);
      setMessage("Nómina guardada para este mes.");
    } catch (error) {
      setFailed(true); setMessage(error.message || "No se pudo guardar la nómina. Vuelve a intentarlo.");
    } finally { setSaving(false); }
  };
  return <form className="net-payroll-editor" aria-label={`Editar nómina de ${driver}`} onSubmit={save}>
    <strong>{driver}</strong>
    <label><span className="sr-only">Nómina de {driver}</span><input type="text" inputMode="decimal" aria-label={`Nómina de ${driver}`} value={draft} disabled={saving} onChange={(event) => { setDraft(event.target.value); setMessage(""); }} /><span aria-hidden="true">€</span></label>
    <button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
    {message && <small role={failed ? "alert" : "status"} className={failed ? "is-error" : ""}>{message}</small>}
  </form>;
}
