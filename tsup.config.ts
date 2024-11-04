import { defineConfig } from "tsup";

export default defineConfig(() => ({
  shims: true,
  cjsInterop: true,
  dts: true,
  sourcemap: true,
  entry: ["./src/index.ts"],
}));
