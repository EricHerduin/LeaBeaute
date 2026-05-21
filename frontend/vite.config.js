import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ isSsrBuild }) => ({
  base: "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // manualChunks ne s'applique qu'au build client (pas SSR)
        manualChunks: isSsrBuild ? undefined : {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          motion: ["framer-motion"],
          ui: ["sonner", "react-helmet-async"],
        },
      },
    },
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Bundler les modules CJS dans le bundle SSR (évite l'erreur ESM Node v25)
  ssr: {
    noExternal: ["react-helmet-async", "sonner"],
  },
  server: {
    host: "0.0.0.0",
    port: 3005,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
}));
