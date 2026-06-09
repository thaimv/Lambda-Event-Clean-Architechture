import type { IDBClientDatasource } from '@common/datasources/database/db-client.datasource';
import { UserRepo } from '@lambda/delete-user/repos/implements/user.repo.impl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('DeleteUser UserRepo', () => {
  let repo: UserRepo;
  let mockDBClient: IDBClientDatasource;
  let deleteManyMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    deleteManyMock = vi.fn();
    mockDBClient = {
      getClient: vi.fn().mockResolvedValue({
        user: { deleteMany: deleteManyMock },
      }),
    } as unknown as IDBClientDatasource;

    repo = new UserRepo(mockDBClient);
  });

  it('deletes soft-deleted users before cutoff datetime', async () => {
    const cutoffDatetime = new Date('2025-01-01T00:00:00.000Z');
    deleteManyMock.mockResolvedValue({ count: 5 });

    const result = await repo.deleteSoftDeletedUsersBefore(cutoffDatetime);

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: {
        deleteDatetime: {
          not: null,
          lte: cutoffDatetime,
        },
      },
    });
    expect(result).toBe(5);
  });
});
