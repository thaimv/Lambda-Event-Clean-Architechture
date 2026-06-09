import type { IDBClientDatasource } from '@common/datasources/database/db-client.datasource';
import { PrismaTransactionRunnerDatasource } from '@common/datasources/database/implements/prisma-transaction-runner.datasource.impl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('inversify', () => ({
  injectable: () => (target: unknown) => target,
  inject: () => () => undefined,
}));

describe('PrismaTransactionRunnerDatasource', () => {
  let runner: PrismaTransactionRunnerDatasource;
  let transactionMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    transactionMock = vi.fn(async (callback: (tx: object) => Promise<unknown>) =>
      callback({ user: { deleteMany: vi.fn() } }),
    );

    const dbClient = {
      getClient: vi.fn().mockResolvedValue({
        $transaction: transactionMock,
      }),
    } as unknown as IDBClientDatasource;

    runner = new PrismaTransactionRunnerDatasource(dbClient);
  });

  it('runs callback inside prisma transaction', async () => {
    const callback = vi.fn(async () => 'done');

    const result = await runner.runInTransaction(callback);

    expect(result).toBe('done');
    expect(transactionMock).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledOnce();
  });
});
