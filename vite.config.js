import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // WSL 밖(윈도우 브라우저)에서도 접속할 수 있게
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
