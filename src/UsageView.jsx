import { useCallback, useEffect, useState } from "react";
import { IconRefresh } from "@tabler/icons-react";
import { supabase } from "./supabase";

const count = (value) => new Intl.NumberFormat("es-ES").format(Number(value) || 0);
const money = (value, currency) => new Intl.NumberFormat("es-ES", { style: "currency", currency: currency || "USD" }).format(Number(value) || 0);
const readableDate = (value) => value ? new Date(value).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" }) : "";

export default function UsageView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Vuelve a iniciar sesión para consultar los consumos.");
      const response = await fetch("/api/consumos", { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudieron consultar los consumos.");
      setData(payload);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return <section className="usage-page" aria-label="Consumos de Vercel y Supabase">
    <header className="usage-page__header"><div><h1>Consumos</h1><p>Datos consultados directamente a Vercel y Supabase. Solo para el administrador.</p></div><button type="button" onClick={refresh} disabled={loading}><IconRefresh size={17} />Actualizar</button></header>
    {loading && !data && <p role="status">Consultando consumos…</p>}
    {error && <p className="usage-page__error" role="alert">{error}</p>}
    {data && <div className="usage-page__grid">
      <article className="usage-card"><h2>Vercel</h2><p className="usage-card__scope">Equipo completo · desde {readableDate(data.vercelPeriodStart)} hasta {readableDate(data.checkedAt)}</p>
        {data.vercel.status === "ready" ? <><strong className="usage-card__value">{money(data.vercel.total, data.vercel.currency)}</strong><p>Importe facturable registrado este mes. Incluye todos los proyectos del equipo, no solo SOBRE RUEDAS.</p><ul>{data.vercel.services.map((service) => <li key={service.name}><span>{service.name}</span><b>{money(service.amount, data.vercel.currency)}</b></li>)}</ul></> : <p className="usage-card__warning">{data.vercel.message}</p>}
      </article>
      <article className="usage-card"><h2>Supabase</h2><p className="usage-card__scope">Proyecto SOBRE RUEDAS · solicitudes API registradas por Supabase</p>
        {data.supabase.status === "ready" ? <><strong className="usage-card__value">{count(data.supabase.total)}</strong><p>Solicitudes registradas{data.supabase.from && data.supabase.to ? ` entre ${readableDate(data.supabase.from)} y ${readableDate(data.supabase.to)}` : " en el intervalo devuelto por Supabase"}. No representa el importe facturado.</p><ul><li><span>Base de datos (REST)</span><b>{count(data.supabase.total_rest_requests)}</b></li><li><span>Autenticación</span><b>{count(data.supabase.total_auth_requests)}</b></li><li><span>Almacenamiento</span><b>{count(data.supabase.total_storage_requests)}</b></li><li><span>Tiempo real</span><b>{count(data.supabase.total_realtime_requests)}</b></li></ul></> : <p className="usage-card__warning">{data.supabase.message}</p>}
      </article>
    </div>}
    {data && <p className="usage-page__updated">Consultado: {readableDate(data.checkedAt)}. Las métricas de ambos proveedores usan periodos distintos.</p>}
  </section>;
}
