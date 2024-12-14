import { defineConfig } from 'vitest/config'
import inspector from 'inspector'
import path from 'path'

// If we are debugging then extend the timeout to max value, otherwise use the default.
const testTimeout = inspector.url() ? 1e8 : 15e3

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*'],
      clean: true,
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
    include: ['test/**/*.test.mts'],
    reporters: ['verbose'],
    mockReset: true,
    restoreMocks: true,
    testTimeout,
    hookTimeout: testTimeout,
    teardownTimeout: testTimeout,
    pool: 'forks',
    globals: true,
    globalSetup: [path.join(import.meta.dirname, 'test/vitest/globalSetup.mts')],
    setupFiles: [path.join(import.meta.dirname, 'test/vitest/setup.mts')],
  },
  resolve: {
    alias: {
      '@src': path.resolve(import.meta.dirname, 'src'),
      '@test': path.resolve(import.meta.dirname, 'test'),
    },
  },
})
