import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_BASE lets CI override the public base path. For GitHub Pages at
// martinherje.github.io/legal-embedding-viz/, set VITE_BASE=/legal-embedding-viz/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? "/",
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
