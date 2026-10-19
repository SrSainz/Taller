import { IconCamera, IconTrash } from "@tabler/icons-react";
import "./manualNetExpenseDetails.css";

const currency = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const dateLabel = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "")
  ? value.split("-").reverse().join("/") : "No registrada";

export default function ManualNetExpenseDetails({ entries, plate, periodLabel, onOpenPhoto, onRemoveExpense }) {
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
      <footer>
        <div>{entry.manualPhotos?.length ? entry.manualPhotos.map((photo, index) => <button type="button" className="net-detail-card__photo-action" onClick={() => onOpenPhoto(photo)} aria-label={`Ver justificante ${index + 1} de ${entry.label}`} key={photo.path}><IconCamera size={16} />Ver justificante{entry.manualPhotos.length > 1 ? ` ${index + 1}` : ""}</button>) : <small>Sin justificante adjunto</small>}</div>
        <button type="button" className="net-manual-details__remove" onClick={() => onRemoveExpense(entry.id)} aria-label={`Eliminar gasto manual de ${entry.label} del ${dateLabel(entry.date)}`}><IconTrash size={16} /></button>
      </footer>
    </article>)}
  </section>;
}
