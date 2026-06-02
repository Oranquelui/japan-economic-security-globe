import path from "node:path";

import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "**/.worktrees/**"]
  },
  resolve: {
    alias: {
      "server-only": path.resolve(__dirname, "test/mocks/server-only.ts")
    }
  }
});
