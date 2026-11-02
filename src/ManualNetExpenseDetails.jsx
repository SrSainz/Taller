import {useState} from "react";
import { IconCamera, IconTrash, IconPencil } from "@tabler/icons-react";
import "./manualNetExpenseDetails.css";

const currency = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const dateLabel = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "")
  ? value.split("-").reverse().join("/") : "No registrada";

export default function ManualNetExpenseDetails({ entries, plate, periodLabel, onOpenPhoto, onRemoveExpense, onEditExpense, dateRange }) {
  const [draft,setDraft]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
  async function save(event){event.preventDefault();if(busy||!draft)return;const amount=Number(String(draft.amount).replace(",","."));if(!draft.label.trim()||!Number.isFinite(amount)||amount<=0||draft.date<dateRange.min||draft.date>dateRange.max){setError("Indica concepto, fecha del periodo e importe mayor que cero.");return;}setBusy(true);setError("");try{await onEditExpense(draft.id,{label:draft.label.trim(),amount:Number(amount.toFixed(2)),date:draft.date});setDraft(null);}catch(cause){setError(cause.message||"No se pudo guardar el gasto.");}finally{setBusy(false);}}
  return <section className="net-manual-details" aria-label="Gastos añadidos manualmente">
    <h3>Gastos añadidos manualmente</h3>
    {entries.map((entry) => <article className="net-manual-details__entry" key={entry.id} aria-label={`Gasto manual: ${entry.label}`}>
      <header><strong>{entry.label}</strong><strong>{currency.format(entry.amount)}</strong></header>
      <dl>
        <div><dt>Día del gasto</dt><dd>{dateLabel(entry.date)}</dd></div>
        <div><dt>Vehículo</dt><dd>{plate}</dd></div>
        <div><dt>Categoría</dt><dd>{entry.category || entry.label}</dd></div>
        <div><dt>Periodo</dt><dd>{periodLabel}</dd></div>
      </dl>
      {draft?.id===entry.id&&<form className="net-manual-details__editor" onSubmit={save}>
        <label>Concepto<input required maxLength={160} value={draft.label} disabled={busy} onChange={event=>setDraft({...draft,label:event.target.value})}/></label>
        <label>Día del gasto<input required type="date" min={dateRange.min} max={dateRange.max} value={draft.date} disabled={busy} onChange={event=>setDraft({...draft,date:event.target.value})}/></label>
        <label>Importe<input required type="number" min="0.01" step="0.01" inputMode="decimal" value={draft.amount} disabled={busy} onChange={event=>setDraft({...draft,amount:event.target.value})}/></label>
        {error&&<p role="alert">{error}</p>}<div><button type="button" disabled={busy} onClick={()=>setDraft(null)}>Cancelar</button><button type="submit" disabled={busy}>{busy?'Guardando…':'Guardar gasto'}</button></div>
      </form>}
      <footer>
        <div>{entry.manualPhotos?.length ? entry.manualPhotos.map((photo, index) => <button type="button" className="net-detail-card__photo-action" onClick={() => onOpenPhoto(photo)} aria-label={`Ver justificante ${index + 1} de ${entry.label}`} key={photo.path}><IconCamera size={16} />Ver justificante{entry.manualPhotos.length > 1 ? ` ${index + 1}` : ""}</button>) : <small>Sin justificante adjunto</small>}</div>
        <button type="button" disabled={busy} onClick={()=>{setError('');setDraft({id:entry.id,label:entry.label,amount:String(entry.amount),date:entry.date||dateRange.min});}} aria-label={`Editar gasto manual de ${entry.label}`}><IconPencil size={16}/>Editar</button>
        <button type="button" disabled={busy} className="net-manual-details__remove" onClick={() => onRemoveExpense(entry.id)} aria-label={`Eliminar gasto manual de ${entry.label} del ${dateLabel(entry.date)}`}><IconTrash size={16} /></button>
      </footer>
    </article>)}
  </section>;
}
