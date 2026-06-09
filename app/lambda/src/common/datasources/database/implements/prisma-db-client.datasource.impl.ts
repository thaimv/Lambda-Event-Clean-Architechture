import { DI } from '@common/constants/di.const';
import { RESULT_CODE } from '@common/constants/response.const';
import type { IDBClientDatasource } from '@common/datasources/database/db-client.datasource';
import type { ISecretsManagerDatasource } from '@common/datasources/secrets-manager/secrets-manager.datasource';
import { InternalServerError } from '@common/errors/internal-server-error';
import { logger } from '@common/logger';
import type { DatabaseSecrets } from '@common/types/datasources/database.type';
import type { DatabaseClient } from '@common/types/datasources/database.type';
import type { AppConfig } from '@lambda/config/app.config';
import { PrismaClient } from '@prisma/client';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from '@prisma/client/runtime/library';
import { inject, injectable } from 'inversify';

/**
 * Responsible for managing database connections. (Postgres via Prisma)
 */
@injectable()
export class PrismaDBClientDatasource implements IDBClientDatasource {
  private dbClient: PrismaClient | null = null;
  private retries: number = 0;
  private refreshPromise: Promise<void> | null = null;

  constructor(
    @inject(DI.APP_CONFIG)
    private readonly appConfig: AppConfig,
    @inject(DI.SECRETS_MANAGER_DATASOURCE)
    private readonly secretsManager: ISecretsManagerDatasource,
  ) {}

  private buildDbUrl(dbSecretsVal: DatabaseSecrets, host: string, connectionLimit: number) {
    return (
      'postgresql://' +
      dbSecretsVal.username +
      ':' +
      encodeURIComponent(dbSecretsVal.password) +
      '@' +
      host +
      ':' +
      dbSecretsVal.port +
      '/' +
      dbSecretsVal.dbname +
      '?schema=' +
      (dbSecretsVal.schema || 'public') +
      '&connection_limit=' +
      connectionLimit
    );
  }

  /**
   * Checks if an error is an authentication error caused by secret rotation (P1000)
   * @param error The error to check
   * @returns true if the error is P1000 authentication error
   */
  private isAuthenticationError(error: any): boolean {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P1000') {
      logger.info(`Authentication error detected: ${error.code}`);
      return true;
    }
    return false;
  }

  /**
   * Executes a query with exponential backoff retry on authentication errors
   */
  private async retryWithBackoff<T>(
    queryFn: () => Promise<T>,
    model: string | undefined,
    operation: string,
  ): Promise<T> {
    const maxRetries = this.appConfig.dbConfig.maxRetries;
    try {
      return await queryFn();
    } catch (error) {
      logger.warn(
        `[Attempt ${this.retries + 1}/${maxRetries + 1}] Query failed for ${model}.${operation}`,
        {
          errorType: error?.constructor?.name,
          error: (error as Error)?.message,
        },
      );

      if (!this.isAuthenticationError(error)) {
        throw error;
      }

      logger.info(`[Retry ${this.retries + 1}/${maxRetries}] Refreshing connection...`);
      await this.invalidateClient();
      await this.getClient();
      return this.retryWithBackoff(queryFn, model, operation);
    }
  }

  /**
   * Invalidates the current Prisma client and prepares for reconnection.
   * Uses promise-based locking to prevent concurrent invalidations.
   */
  private async invalidateClient(): Promise<void> {
    // If refresh already in progress, wait for it to complete
    if (this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    this.refreshPromise = this.performInvalidation();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Performs the actual client invalidation by disconnecting and resetting state
   */
  private async performInvalidation(): Promise<void> {
    if (this.dbClient) {
      try {
        await (this.dbClient as PrismaClient).$disconnect();
        logger.info('Disconnected old Prisma client due to auth error');
      } catch (error) {
        logger.warn('Error disconnecting old client', { error });
      }
    }

    this.dbClient = null;
    this.retries = 0;
  }

  private async getDbUrls() {
    const dbConfig = this.appConfig.dbConfig;

    if (this.appConfig.isLocal || this.appConfig.isTest) {
      return {
        dbUrl: dbConfig.dbUrl,
        dbUrlReplica: dbConfig.dbUrlReplica,
      };
    }

    const dbSecretsVal = await this.secretsManager.getSecretValue<DatabaseSecrets>({
      SecretId: this.appConfig.secretManagerKeys.RDS_SECRET_ARN,
    });

    const dbUrl = this.buildDbUrl(dbSecretsVal, dbConfig.proxyEndpoint, dbConfig.connectionLimit);
    const dbUrlReplica = this.buildDbUrl(
      dbSecretsVal,
      dbConfig.proxyEndpointReplica,
      dbConfig.connectionLimit,
    );

    return { dbUrl, dbUrlReplica };
  }

  private async initPrismaClient(): Promise<PrismaClient> {
    const { dbUrl } = await this.getDbUrls();

    // Create Prisma client instance with logging enabled
    const self = this as any;
    const prisma = new PrismaClient({
      datasourceUrl: dbUrl,
      log: [{ level: 'query', emit: 'event' }, 'info', 'warn', 'error'],
    }).$extends({
      query: {
        $allOperations({
          operation,
          model,
          args,
          query,
        }: {
          operation: string;
          model?: string;
          args: any;
          query: (args: any) => Promise<any>;
        }) {
          return self.retryWithBackoff(() => query(args), model, operation);
        },
      },
    });

    // Log query execution details to stdout
    // Issue: Stop logging queries for now to make sure not have sensitive information in logs (https://chat.google.com/room/AAAAgD8yR24/-SR2D8KY81c/PV2JzUQT9NQ?cls=10)
    // prisma.$on('query', (e) => {
    //   process.stdout.write(`[Prisma Query] (${e.duration}ms):\n${e.query} -- ${e.params}\n`);
    // });

    return prisma as any;
  }

  async getClient(): Promise<DatabaseClient> {
    if (this.dbClient) return this.dbClient;

    try {
      this.dbClient = await this.initPrismaClient();
      await this.dbClient.$connect();
      return this.dbClient;
    } catch (error) {
      const backOffMs = this.appConfig.dbConfig.backOffMs;
      const errorStacktrace = (error as Error).stack?.split('\n').map((m) => m.trim());
      const logCode =
        error instanceof PrismaClientInitializationError
          ? RESULT_CODE.DATABASE_URL_NOT_FOUND
          : RESULT_CODE.INTERNAL_SERVER_ERROR;

      if (this.retries < this.appConfig.dbConfig.maxRetries) {
        this.retries += 1;
        logger.warn(
          `[Retry ${this.retries}/${this.appConfig.dbConfig.maxRetries}] Authentication failed. Retrying in ${backOffMs}ms...`,
        );

        this.dbClient = null;

        await new Promise((r) => setTimeout(r, backOffMs));
        // retry
        return await this.getClient();
      }

      logger.error((error as Error).message, {
        code: logCode,
        stacktrace: errorStacktrace,
      });

      throw new InternalServerError((error as Error).message);
    }
  }
}
