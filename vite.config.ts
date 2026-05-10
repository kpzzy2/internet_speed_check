import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const WORKER_URL = "https://speedtest-worker.sdjjm95.workers.dev";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/ping": { target: WORKER_URL, changeOrigin: true, headers: { "Cache-Control": "no-store", "Pragma": "no-cache" } },
      "/download": { target: WORKER_URL, changeOrigin: true, headers: { "Cache-Control": "no-store", "Pragma": "no-cache" } },
      "/upload": { target: WORKER_URL, changeOrigin: true, headers: { "Cache-Control": "no-store", "Pragma": "no-cache" } },
    },
  },
});
