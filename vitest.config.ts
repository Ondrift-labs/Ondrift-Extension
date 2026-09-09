import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "src/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
