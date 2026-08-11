import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import analyzeDocument from "./api/analyze-document.js";

const useDocumentAnalysisApi = (server) => {
  server.middlewares.use("/api/analyze-document", (request, response, next) => {
    if (!["POST", "OPTIONS"].includes(request.method)) return next();
    Promise.resolve(analyzeDocument(request, response)).catch(next);
  });
};

export default defineConfig({
  build: {
    outDir: "dist/client",
    assetsInlineLimit: 100000,
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    port: 5174,
    strictPort: true,
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4174,
    strictPort: true,
  },
  plugins: [react(), {
    name: "local-document-analysis-api",
    configureServer: useDocumentAnalysisApi,
    configurePreviewServer: useDocumentAnalysisApi,
  }],
});
