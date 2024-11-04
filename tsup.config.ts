import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  shims: true,
  cjsInterop: true,
  dts: true,
  sourcemap: true,
  entry: ["./src/index.ts"]
}));
