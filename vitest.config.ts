import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["server/playbookMapper.ts", "server/threatIngestion.ts"],
    },
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
});
