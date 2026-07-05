import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "enums/index": "src/enums/index.ts",
    "models/index": "src/models/index.ts",
  },
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  bundle: true,
  platform: "node",
  dts: false,
});
