// filepath: vite.config.server.ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist/server",
    ssr: true,
    target: "node16",
    rollupOptions: {
      input: "./src/app.server.ts",
    },
  },
});
