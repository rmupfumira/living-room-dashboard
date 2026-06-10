import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config — JS-only, LAN-friendly dev server.
// Manual chunks keep the lucide-react payload in its own cacheable file so it
// survives small edits to app code.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  build: {
    target: "es2022",
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          icons: ["lucide-react"],
        },
      },
    },
  },
});
