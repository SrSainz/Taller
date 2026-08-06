import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

const clearDevelopmentServiceWorkers = async () => {
  const registrations = await navigator.serviceWorker.getRegistrations();
  const removed = await Promise.all(registrations.map((registration) => registration.unregister()));
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.filter((name) => name.startsWith("sobre-ruedas-shell-")).map((name) => caches.delete(name)));
  if (removed.some(Boolean)) window.location.reload();
};

const watchProductionServiceWorker = async () => {
  const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
  const applyWaitingWorker = (worker) => {
    if (!worker) return;
    worker.postMessage({ type: "SKIP_WAITING" });
  };

  if (registration.waiting) applyWaitingWorker(registration.waiting);
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) applyWaitingWorker(worker);
    });
  });

  const checkForUpdate = () => registration.update().catch(() => {});
  checkForUpdate();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkForUpdate();
  });
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (import.meta.env.PROD) {
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
      watchProductionServiceWorker().catch(() => {});
    } else {
      clearDevelopmentServiceWorkers().catch(() => {});
    }
  });
}
