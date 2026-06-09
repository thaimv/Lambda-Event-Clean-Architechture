// @ts-nocheck — template file; path aliases resolve correctly in generated output under app/lambda/test/
import { logger } from '@common/logger';
import type { I<RepoInterface> } from '@lambda/<lambda-name>/repos/<repo-interface>.repo';
import { <UseCaseClass> } from '@lambda/<lambda-name>/usecases/implements/<name>.uc.impl';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@common/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('<UseCaseClass>', () => {
  let useCase: <UseCaseClass>;
  let <repoMethod>Mock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    <repoMethod>Mock = vi.fn();
    const repo = { <repoMethod>: <repoMethod>Mock } as I<RepoInterface>;
    useCase = new <UseCaseClass>(repo);
  });

  // --- Happy Path ---

  it('executes business logic and logs result', async () => {
    // Arrange
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    <repoMethod>Mock.mockResolvedValue(/* expected return value */);

    // Act
    await useCase.execute(/* args */);

    // Assert
    expect(<repoMethod>Mock).toHaveBeenCalledWith(
      expect.objectContaining({}),
    );
    expect(logger.info).toHaveBeenCalledWith(
      'expected log message',
      expect.objectContaining({}),
    );

    vi.useRealTimers();
  });

  // --- Error Propagation ---

  it('propagates repo error', async () => {
    <repoMethod>Mock.mockRejectedValue(new Error('DB error'));

    await expect(useCase.execute(/* args */)).rejects.toThrow('DB error');
  });
});
