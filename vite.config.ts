import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // allow Docker / Coolify
    port: 3000,
    allowedHosts: [
      ".sslip.io", // allow all Coolify generated domains
    ],
  },
  preview: {
    host: true,
    port: 3000,
    allowedHosts: [
      ".sslip.io",
    ],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
