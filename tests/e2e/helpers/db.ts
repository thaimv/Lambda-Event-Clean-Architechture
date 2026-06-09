import { PrismaClient } from '@prisma/client';

/**
 * Direct Prisma client for E2E test DB assertions.
 * Use `app.db.client` inside tests to verify database state after Lambda invocations.
 *
 * Requires DATABASE_URL in envs/.env.e2e.
 */
export class DbClient {
  private _client?: PrismaClient;

  async connect(): Promise<void> {
    this._client = new PrismaClient();
    await this._client.$connect();
  }

  async disconnect(): Promise<void> {
    await this._client?.$disconnect();
    this._client = undefined;
  }

  get client(): PrismaClient {
    if (!this._client) throw new Error('DbClient not connected. Ensure bootstrap() was called.');
    return this._client;
  }
}
