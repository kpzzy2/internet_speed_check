import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "internet-speed-check",
  brand: {
    displayName: "인터넷 속도 측정",
    primaryColor: "#333333",
    icon: "https://static.toss.im/appsintoss/36797/c6c66b30-b185-41f7-8ee4-2dce95ec960b.png", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
