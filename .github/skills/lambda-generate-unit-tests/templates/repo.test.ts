// @ts-nocheck — template file; path aliases resolve correctly in generated output under app/lambda/test/
import type { IDBClientDatasource } from '@common/datasources/database/db-client.datasource';
import { <RepoClass> } from '@lambda/<lambda-name>/repos/implements/<name>.repo.impl';
import { beforeEach, describe, it, expect, vi } from 'vitest';

describe('<RepoClass>', () => {
  let repo: <RepoClass>;
  let mockDBClient: IDBClientDatasource;
  let <dbMethod>Mock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    <dbMethod>Mock = vi.fn();
    mockDBClient = {
      getClient: vi.fn().mockResolvedValue({
        // Prisma model (camelCase)
        tableName: { <dbMethod>: <dbMethod>Mock },
      }),
    } as unknown as IDBClientDatasource;

    repo = new <RepoClass>(mockDBClient);
  });

  // --- Happy Path ---

  it('calls Prisma with correct query and returns mapped result', async () => {
    // Arrange
    const input = new Date('2025-01-01T00:00:00.000Z');
    <dbMethod>Mock.mockResolvedValue({ count: 5 });

    // Act
    const result = await repo.<repoMethod>(input);

    // Assert
    expect(<dbMethod>Mock).toHaveBeenCalledWith({
      where: expect.objectContaining({}),
    });
    expect(result).toBe(5);
  });

  // --- Error Propagation ---

  it('propagates DB error', async () => {
    mockDBClient.getClient = vi.fn().mockRejectedValue(new Error('DB error'));

    await expect(repo.<repoMethod>(new Date())).rejects.toThrow('DB error');
  });
});
