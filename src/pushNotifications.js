import { supabase } from "./supabase";

const vapidPublicKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY ?? "";

const hasPushSupport = () => typeof window !== "undefined"
  && "Notification" in window
  && "serviceWorker" in navigator
  && "PushManager" in window;

const urlBase64ToUint8Array = (value) => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
};

const getCurrentSession = async () => {
  if (!supabase) throw new Error("Supabase no está configurado.");
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data?.session?.user?.id) throw new Error("La sesión ha caducado. Vuelve a entrar para activar los avisos.");
  return data.session;
};

const saveSubscription = async (subscription, session) => {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh ?? "";
  const auth = json.keys?.auth ?? "";
  if (!subscription.endpoint || !p256dh || !auth) throw new Error("El navegador no ha devuelto una suscripción válida.");
  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: session.user.id,
    endpoint: subscription.endpoint,
    p256dh,
    auth,
    user_agent: navigator.userAgent.slice(0, 500),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,endpoint" });
  if (error) throw error;
};

export const getPushNotificationState = async () => {
  if (!hasPushSupport()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription ? "enabled" : "idle";
  } catch {
    return "idle";
  }
};

export const enablePushNotifications = async () => {
  if (!hasPushSupport()) throw new Error("Este navegador no admite avisos push. En iPhone, instala primero la PWA desde Safari.");
  if (!vapidPublicKey) throw new Error("La clave pública de avisos todavía no está configurada en esta versión.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(permission === "denied"
      ? "Los avisos están bloqueados en el navegador. Permítelos en los ajustes de este sitio."
      : "No se ha concedido permiso para enviar avisos.");
  }
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }
  const session = await getCurrentSession();
  await saveSubscription(subscription, session);
  return subscription;
};

export const disablePushNotifications = async () => {
  if (!hasPushSupport() || !supabase) return;
  const session = await getCurrentSession();
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", session.user.id)
    .eq("endpoint", subscription.endpoint);
  if (error) throw error;
  await subscription.unsubscribe();
};
