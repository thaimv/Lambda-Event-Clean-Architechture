import { DELETE_USER_SOFT_DELETE_RETENTION_YEARS } from '@common/constants/app.const';
import { logger } from '@common/logger';
import type { IUserRepo } from '@lambda/delete-user/repos/user.repo';
import { DeleteUserUseCase } from '@lambda/delete-user/usecases/implements/delete-user.uc.impl';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@common/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('DeleteUserUseCase', () => {
  let useCase: DeleteUserUseCase;
  let deleteSoftDeletedUsersBeforeMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    deleteSoftDeletedUsersBeforeMock = vi.fn();
    const repo = { deleteSoftDeletedUsersBefore: deleteSoftDeletedUsersBeforeMock } as IUserRepo;
    useCase = new DeleteUserUseCase(repo);
  });

  it('deletes soft-deleted users before retention cutoff and logs result', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-06T00:00:00.000Z'));
    deleteSoftDeletedUsersBeforeMock.mockResolvedValue(3);

    await useCase.execute();

    const expectedCutoff = new Date('2026-06-06T00:00:00.000Z');
    expectedCutoff.setFullYear(
      expectedCutoff.getFullYear() - DELETE_USER_SOFT_DELETE_RETENTION_YEARS,
    );

    expect(deleteSoftDeletedUsersBeforeMock).toHaveBeenCalledWith(expectedCutoff);
    expect(logger.info).toHaveBeenCalledWith('Deleted soft-deleted users from user_information', {
      retentionYears: DELETE_USER_SOFT_DELETE_RETENTION_YEARS,
      cutoffDatetime: expectedCutoff.toISOString(),
      deletedCount: 3,
    });

    vi.useRealTimers();
  });
});
