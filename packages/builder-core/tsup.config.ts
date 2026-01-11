import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2019",
  outDir: "dist",
  splitting: false,
  treeshake: true,
  platform: "browser",
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".js" };
  }
});
