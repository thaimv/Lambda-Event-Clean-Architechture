import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const testReportsPath = './__test_reports__/unit-test';

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {},
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['.github/**', '.cursor/**', 'node_modules/**', 'out/**', 'build/**'],
    reporters: ['default', 'junit'],
    outputFile: `${testReportsPath}/junit.xml`,
    setupFiles: ['./vitest.setup.mjs'],
    // Disable Date.now mocking (CDK/AWS SDK compatibility).
    globals: true,
    unstubGlobals: true,
    fakeTimers: false,
    // Run serially to avoid file conflicts in CDK snapshot tests.
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Increase timeout to reduce file-lock related flakes.
    testTimeout: 60000, // 1 minutes
    hookTimeout: 30000,
    coverage: {
      include: ['app/lambda/src/*', 'lib/*'],
      exclude: [
        'app/lambda/src/config/*',
        'app/lambda/src/common/constants/*',
        'app/lambda/src/common/types/*',
        'app/lambda/src/common/decorators/*',
        'app/lambda/src/common/datasources/*/*.datasource.ts',
        'app/lambda/src/common/repos/*/*.repo.ts*',
        'app/lambda/src/*/usecases/*.uc.ts',
        'app/lambda/src/*/repos/*.repo.ts',
        'app/lambda/src/*/dtos/responses/*',
        'app/lambda/src/*/models/*',
        'app/lambda/src/*/module.ts',
        'app/lambda/src/*/consts.ts',
      ],
      reporter: ['cobertura', 'text', 'json', 'html'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
      reportsDirectory: `${testReportsPath}/coverage`,
    },
  },
});
