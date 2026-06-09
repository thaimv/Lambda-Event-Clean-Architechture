import { config } from 'dotenv';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

const testReportsPath = './__test_reports__/e2e';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/e2e/**/*.e2e-spec.ts'],
    reporters: ['default', 'junit'],
    outputFile: `${testReportsPath}/junit.xml`,
    // E2E tests invoke deployed Lambda functions — run serially to avoid
    // CloudWatch Live Tail session conflicts and shared resource races.
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    // Allow for Lambda cold starts + CloudWatch log flush wait.
    testTimeout: 120000, // 2 min per test
    hookTimeout: 60000, // 1 min for beforeAll/afterAll
    env: {
      ...config({ path: './envs/.env.e2e' }).parsed,
    },
  },
});
