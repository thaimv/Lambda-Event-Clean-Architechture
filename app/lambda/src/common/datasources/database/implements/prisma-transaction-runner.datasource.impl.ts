import { PRISMA_TRANSACTION_CONFIG } from '@common/constants/app.const';
import { DI } from '@common/constants/di.const';
import type { IDBClientDatasource } from '@common/datasources/database/db-client.datasource';
import type { ITransactionRunnerDatasource } from '@common/datasources/database/transaction-runner.datasource';
import type { DatabaseSession } from '@common/types/datasources/database.type';
import type { Prisma, PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';

@injectable()
export class PrismaTransactionRunnerDatasource implements ITransactionRunnerDatasource {
  constructor(
    @inject(DI.DB_CLIENT_DATASOURCE)
    private readonly dbClient: IDBClientDatasource,
  ) {}

  async runInTransaction<T>(callback: (tx: DatabaseSession) => Promise<T>): Promise<T> {
    const dbClient = (await this.dbClient.getClient()) as PrismaClient;

    return dbClient.$transaction(
      async (tx: Prisma.TransactionClient) => callback(tx as DatabaseSession),
      {
        maxWait: PRISMA_TRANSACTION_CONFIG.MAX_WAIT,
        timeout: PRISMA_TRANSACTION_CONFIG.TIMEOUT,
      },
    );
  }
}
