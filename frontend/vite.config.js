import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    sourcemap: false,

    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // React ecosystem
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "react-vendor";
            }

            // Material UI
            if (
              id.includes("@mui") ||
              id.includes("@emotion")
            ) {
              return "mui-vendor";
            }

            // Charts
            if (id.includes("recharts")) {
              return "charts";
            }

            // HTTP
            if (id.includes("axios")) {
              return "network";
            }

            // Icons
            if (id.includes("react-icons")) {
              return "icons";
            }

            // Everything else
            return "vendor";
          }
        },
      },
    },
  },
});