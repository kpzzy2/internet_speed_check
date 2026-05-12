import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const WORKER_URL = "https://speedtest-worker.sdjjm95.workers.dev";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (!env.VITE_API_URL) {
    throw new Error("VITE_API_URL이 설정되지 않았습니다. .env 파일을 확인하세요.");
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/ping": { target: WORKER_URL, changeOrigin: true, ws: true },
        "/download": { target: WORKER_URL, changeOrigin: true, headers: { "Cache-Control": "no-store", "Pragma": "no-cache" } },
        "/upload": { target: WORKER_URL, changeOrigin: true, headers: { "Cache-Control": "no-store", "Pragma": "no-cache" } },
      },
    },
  };
});
