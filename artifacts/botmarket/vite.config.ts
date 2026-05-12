import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

// In production (Railway build) use sensible defaults; in dev require them.
const rawPort = process.env.PORT ?? (isProduction ? "8080" : undefined);
const basePath = process.env.BASE_PATH ?? (isProduction ? "/" : undefined);

if (!isProduction) {
  if (!rawPort) {
    throw new Error("PORT environment variable is required but was not provided.");
  }
  if (!basePath) {
    throw new Error("BASE_PATH environment variable is required but was not provided.");
  }
}

const port = Number(rawPort ?? "8080");

const plugins: any[] = [react(), tailwindcss()];

if (!isProduction) {
  // Replit-only dev plugins
  const { default: runtimeErrorOverlay } = await import("@replit/vite-plugin-runtime-error-modal");
  plugins.push(runtimeErrorOverlay());

  if (process.env.REPL_ID !== undefined) {
    plugins.push(
      await import("@replit/vite-plugin-cartographer").then((m) =>
        m.cartographer({ root: path.resolve(import.meta.dirname, "..") })
      ),
      await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
    );
  }
}

export default defineConfig({
  base: basePath ?? "/",
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
