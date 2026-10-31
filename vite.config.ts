import { defineConfig, type Plugin } from "vite";
import { placeholders } from "./src/render.ts";
import { isReleased } from "./src/publication.ts";
import manifest from "./publication-manifest.json" with { type: "json" };
// Static, JavaScript-free sections are generated from src/content.ts at build time.
const sections = (): Plugin => ({
  name: "static-sections",
  transformIndexHtml(html) {
    const parts = placeholders((manifest.research as unknown[]).filter(isReleased));
    const out = html.replace(/<!--@([a-z-]+)-->/g, (_, k: string) => {
      if (!(k in parts)) throw new Error(`Unknown section placeholder: ${k}`);
      return parts[k];
    });
    if (/<!--@/.test(out)) throw new Error("Unreplaced section placeholder");
    return out;
  },
});
export default defineConfig({
  base: "./",
  plugins: [sections()],
  server: { host: "127.0.0.1", hmr: { host: "127.0.0.1" }, cors: false },
  preview: { host: "127.0.0.1", cors: false },
  build: { sourcemap: false, rollupOptions: { input: "index.html" } },
});
