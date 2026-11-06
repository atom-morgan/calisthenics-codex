import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // `server-only` throws outside Next's server bundle; tests import
    // src/server directly.
    // An absolute path: the package's `exports` map hides empty.js by name.
    alias: {
      "server-only": fileURLToPath(
        new URL("node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
