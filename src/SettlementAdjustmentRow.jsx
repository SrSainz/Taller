import { useEffect, useState } from "react";

export default function SettlementAdjustmentRow({ label, value = 0, formatted, defaultSign = 1, onSave }) {
  const [sign, setSign] = useState(value ? Math.sign(value) : defaultSign);
  const [draft, setDraft] = useState(String(Math.abs(value)));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => { setDraft(String(Math.abs(value))); setSign(value ? Math.sign(value) : defaultSign); }, [value, defaultSign]);
  const submit = async (event) => {
    event.preventDefault(); if (busy) return;
    const text = draft.trim().replace(/\s|€/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
    const number = Number(text);
    if (!/^\d+(\.\d{1,2})?$/.test(text) || !Number.isFinite(number)) { setFailed(true); setMessage("Introduce un importe válido."); return; }
    setBusy(true); setMessage(""); setFailed(false);
    try { await onSave(Math.round(number * 100) / 100 * sign); setMessage("Guardado para este mes."); }
    catch (error) { setFailed(true); setMessage(error.message || "No se pudo guardar."); }
    finally { setBusy(false); }
  };
  return <div className="driver-commission-sheet__settlement">
    <header><strong>{label}</strong><strong>{value > 0 ? "+" : ""}{formatted}</strong></header>
    <form aria-label={`Ajustar ${label}`} onSubmit={submit}>
      <select aria-label={`Operación de ${label}`} disabled={busy} value={sign} onChange={(event) => { setSign(Number(event.target.value)); setMessage(""); }}><option value={-1}>− Restar</option><option value={1}>+ Sumar</option></select>
      <input aria-label={`Importe de ${label}`} type="text" inputMode="decimal" disabled={busy} value={draft} onChange={(event) => { setDraft(event.target.value); setMessage(""); }} />
      <button type="submit" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</button>
    </form>
    {message && <small role={failed ? "alert" : "status"}>{message}</small>}
  </div>;
}
