/// <reference types="node" />

import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { defineConfig } from "tsup";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  sourcemap: true,
  clean: true,
  bundle: true,
  platform: "node",

  esbuildOptions(options) {
    options.alias = {
      "@": resolve(__dirname, "src"),
    };
  },
});
