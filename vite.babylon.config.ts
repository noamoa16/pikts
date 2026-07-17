import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "docs",
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "src/vendor/babylon.ts"),
      formats: ["es"],
      fileName: () => "babylon.js",
    },
    rolldownOptions: {
      output: {
        codeSplitting: false,
      },
    },
  },
});
