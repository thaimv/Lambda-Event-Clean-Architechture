import { DI } from '@common/constants/di.const';
import type { IDBClientDatasource } from '@common/datasources/database/db-client.datasource';
import type { IUserRepo } from '@lambda/delete-user/repos/user.repo';
import type { PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';

@injectable()
export class UserRepo implements IUserRepo {
  constructor(
    @inject(DI.DB_CLIENT_DATASOURCE)
    private readonly dbClient: IDBClientDatasource,
  ) {}

  async deleteSoftDeletedUsersBefore(cutoffDatetime: Date): Promise<number> {
    const client = (await this.dbClient.getClient()) as PrismaClient;

    const deleted = await client.user.deleteMany({
      where: {
        deleteDatetime: {
          not: null,
          lte: cutoffDatetime,
        },
      },
    });

    return deleted.count;
  }
}
