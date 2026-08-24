import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const apiPort = loadEnv(mode, "../..", "").PORT;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      proxy: {
        "/health": `http://api:${apiPort}`,
        "/api": `http://api:${apiPort}`,
      },
    },
  };
});
