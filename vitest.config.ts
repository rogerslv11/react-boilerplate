import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const r = (p: string) => path.resolve(path.dirname(fileURLToPath(import.meta.url)), p);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'coverage'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.module.ts',
        'src/main.ts',
        'src/infrastructure/database/generated/**',
        'src/**/index.ts',
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'test/**',
        'prisma/**',
      ],
      thresholds: {
        branches: 50,
        functions: 60,
        lines: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': r('./src'),
      '@config': r('./src/config'),
      '@common': r('./src/common'),
      '@infrastructure': r('./src/infrastructure'),
      '@modules': r('./src/modules'),
      '@shared': r('./src/shared'),
    },
  },
});
