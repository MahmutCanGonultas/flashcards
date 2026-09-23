import { defineConfig } from "vitest/config";

// Unit tests for the pure logic in src/lib; no browser, no PWA plugin.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
