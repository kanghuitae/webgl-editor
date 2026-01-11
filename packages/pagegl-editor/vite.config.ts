import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: resolve(__dirname, "demo"),
  server: {
    fs: {
      allow: [resolve(__dirname)]
    }
  }
});
