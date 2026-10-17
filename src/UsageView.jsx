import { useCallback, useEffect, useRef, useState } from "react";
import { IconRefresh } from "@tabler/icons-react";
import { supabase } from "./supabase";

const count = (value) => value === null || value === undefined ? "—" : new Intl.NumberFormat("es-ES").format(value);
const readableDate = (value) => value ? new Date(value).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" }) : "";
const mb = (bytes) => `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(Number(bytes) / 1_000_000)} MB`;
const percent = (value) => `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value)} %`;
const money = (value, currency = "USD") => new Intl.NumberFormat("es-ES", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value);
const month = (value) => value ? new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(value)) : "mes actual";

export default function UsageView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);
  const lastRefresh = useRef(0);
  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Vuelve a iniciar sesión para consultar los consumos.");
      const response = await fetch("/api/consumos?provider=supabase", { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store", signal: AbortSignal.timeout(25000) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudieron consultar los consumos.");
      setData(payload);
    } catch (cause) {
      setError(cause.message);
    } finally {
      inFlight.current = false;
      lastRefresh.current = Date.now();
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const refreshVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRefresh.current >= 30000) void refresh();
    };
    const timer = window.setInterval(refreshVisible, 60000);
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [refresh]);
  return <section className="usage-page" aria-label="Consumos de Supabase y OpenAI">
    <header className="usage-page__header"><div><h1>Consumos</h1><p>Uso de Supabase y gasto de la API de OpenAI. Solo para el administrador.</p></div><button type="button" onClick={refresh} disabled={loading}><IconRefresh size={17} />{loading ? "Actualizando…" : "Actualizar"}</button></header>
    {loading && !data && <p role="status">Consultando consumos…</p>}
    {error && <p className="usage-page__error" role="alert">{error}</p>}
    {data && <div className="usage-page__grid usage-page__grid--supabase">
      <article className="usage-card"><h2>OpenAI · API</h2>
        {data.openai?.status === "ready" ? <><p className="usage-card__scope">{data.openai.scope === "proyecto" ? "Proyecto configurado" : "Organización completa"} · {month(data.openai.from)} · periodo UTC</p><strong className="usage-card__value">{money(data.openai.total, data.openai.currency)}</strong><p>Gasto acumulado del mes. {data.openai.today === null ? "El gasto de hoy aún no está consolidado." : `Hoy: ${money(data.openai.today, data.openai.currency)}.`} Los costes pueden llegar con retraso y no representan el saldo de crédito disponible.</p></> : <p className="usage-card__warning">{data.openai?.message || "No se ha podido consultar el gasto de OpenAI."}</p>}
        <a href="https://platform.openai.com/settings/organization/billing/overview" target="_blank" rel="noopener noreferrer">Ver facturación y saldo en OpenAI</a>
      </article>
      <article className="usage-card"><h2>Supabase</h2><p className="usage-card__scope">Proyecto SOBRE RUEDAS · solicitudes API registradas por Supabase</p>
        <div className="usage-storage"><h3>Archivos almacenados ahora</h3>{data.supabaseStorage?.status === "ready" ? <><strong className="usage-storage__amount">{mb(data.supabaseStorage.usedBytes)} usados <span>de {mb(data.supabaseStorage.quotaBytes)}</span></strong><div className="usage-storage__track" role="progressbar" aria-label="Almacenamiento utilizado en Supabase" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, 100 - data.supabaseStorage.remainingPercent)}><span style={{ width: `${Math.min(100, 100 - data.supabaseStorage.remainingPercent)}%` }} /></div><p><b>{mb(data.supabaseStorage.remainingBytes)} disponibles · {percent(data.supabaseStorage.remainingPercent)} libre</b></p><p className="usage-storage__note">Espacio actual de los archivos de SOBRE RUEDAS respecto a 1.000 MB del plan Free. La cuota se comparte con otros proyectos de la organización. El panel de Supabase muestra una media del periodo, que puede ser mayor después de borrar fotos.</p></> : <p className="usage-card__warning">{data.supabaseStorage?.message || "No se ha podido consultar el espacio de los archivos."}</p>}</div>
        <h3>Solicitudes de las últimas 24 horas</h3>
        {data.supabase.status === "ready" ? <><strong className="usage-card__value">{count(data.supabase.total)}</strong><p>Solicitudes contabilizadas{data.supabase.from && data.supabase.to ? ` entre ${readableDate(data.supabase.from)} y ${readableDate(data.supabase.to)}` : " por Supabase"}. Estas métricas pueden llegar con retraso.</p><ul><li><span>Base de datos (REST)</span><b>{count(data.supabase.total_rest_requests)}</b></li><li><span>Autenticación</span><b>{count(data.supabase.total_auth_requests)}</b></li><li><span>Almacenamiento</span><b>{count(data.supabase.total_storage_requests)}</b></li><li><span>Tiempo real</span><b>{count(data.supabase.total_realtime_requests)}</b></li></ul></> : <p className="usage-card__warning">{data.supabase.message}</p>}
      </article>
    </div>}
    {data && <p className="usage-page__updated" role="status">Última consulta: {readableDate(data.checkedAt)}. Actualización automática cada minuto mientras esta pantalla esté visible.</p>}
  </section>;
}
