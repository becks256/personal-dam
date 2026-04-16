// dam/vitest.config.mjs
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.mjs'],
    globals: true,
    passWithNoTests: true,
  },
});
