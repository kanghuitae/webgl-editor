import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@pagegl/builder-core": resolve(__dirname, "../../packages/builder-core/src")
    }
  }
});
