import { DI } from '@common/constants/di.const';
import type { IDBClientDatasource } from '@common/datasources/database/db-client.datasource';
import type { User } from '@common/models/user.model';
import type { IUserRepo } from '@common/repos/user/user.repo';
import type { PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';

@injectable()
export class UserRepo implements IUserRepo {
  constructor(
    @inject(DI.DB_CLIENT_DATASOURCE)
    private readonly dbClient: IDBClientDatasource,
  ) {}

  async getUser(cognitoId: string): Promise<User | null> {
    const client = (await this.dbClient.getClient()) as PrismaClient;

    return await client.user.findFirst({
      where: {
        cognitoId,
      },
    });
  }
}
