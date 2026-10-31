import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  server: { host: "127.0.0.1", hmr: { host: "127.0.0.1" }, cors: false },
  preview: { host: "127.0.0.1", cors: false },
  build: { sourcemap: false, rollupOptions: { input: "index.html" } },
});
