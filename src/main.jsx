import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[app-error-boundary]", error, errorInfo);
  }

  reloadApplication = () => {
    window.location.reload();
  };

  goToHome = () => {
    window.location.hash = "#/informes";
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="app-error-screen" role="alert">
        <section className="app-error-panel">
          <span className="app-error-panel__logo"><img src="/brand/sobre-ruedas-logo.png" alt="" /></span>
          <span className="app-error-panel__eyebrow">RECUPERACIÓN DE LA APLICACIÓN</span>
          <h1>La aplicación necesita recargarse</h1>
          <p>Se ha producido un error inesperado en esta pantalla. Tus datos guardados en el servidor no se han borrado.</p>
          <div className="app-error-panel__actions">
            <button type="button" className="primary-button" onClick={this.reloadApplication}>Recargar aplicación</button>
            <button type="button" className="secondary-button" onClick={this.goToHome}>Ir al inicio</button>
          </div>
          <small>Si el problema se repite, vuelve a intentarlo desde el inicio para recuperar la sesión.</small>
        </section>
      </main>
    );
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
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
