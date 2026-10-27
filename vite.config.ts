import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
  plugins: [react(), themePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(root, "client/src"),
      "@shared": path.resolve(root, "shared"),
    },
  },
  root: path.resolve(root, "client"),
  build: { outDir: path.resolve(root, "dist"), emptyOutDir: true },
});
