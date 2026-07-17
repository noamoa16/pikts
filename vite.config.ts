import { defineConfig } from "vite";

const babylonPrefix = "@babylonjs/core/";

function isBabylonModule(id: string): boolean {
  return id === "@babylonjs/core" || id.startsWith(babylonPrefix);
}

export default defineConfig({
  base: "./",
  build: {
    outDir: "docs",
    emptyOutDir: true,
    rolldownOptions: {
      external: isBabylonModule,
      output: {
        paths: (id) => (isBabylonModule(id) ? "../babylon.js" : id),
      },
    },
  },
});
