import { APP_CONST } from '@common/constants/app.const';
import { PrismaDBClientDatasource } from '@common/datasources/database/implements/prisma-db-client.datasource.impl';
import type { ISecretsManagerDatasource } from '@common/datasources/secrets-manager/secrets-manager.datasource';
import { InternalServerError } from '@common/errors/internal-server-error';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from '@prisma/client/runtime/library';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

const connectMock = vi.fn();
const disconnectMock = vi.fn();
const prismaInstance = {
  $connect: connectMock,
  $disconnect: disconnectMock,
};

type AllOperationsHandler = (params: {
  operation: string;
  model: string;
  args: unknown;
  query: (args: unknown) => Promise<unknown>;
}) => Promise<unknown>;

let allOperationsHandler: AllOperationsHandler | undefined;

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $extends: vi.fn(({ query }: { query: { $allOperations: AllOperationsHandler } }) => {
      allOperationsHandler = query.$allOperations;
      return prismaInstance;
    }),
  })),
}));

vi.mock('inversify', () => ({
  injectable: () => (target: unknown) => target,
  inject: () => () => undefined,
}));

vi.mock('@common/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('PrismaDBClientDatasource', () => {
  let secretsManager: ISecretsManagerDatasource;
  let client: PrismaDBClientDatasource;
  let mockAppConfig = createMockAppConfig();

  beforeEach(() => {
    vi.clearAllMocks();
    allOperationsHandler = undefined;
    connectMock.mockResolvedValue(undefined);
    disconnectMock.mockResolvedValue(undefined);
    mockAppConfig = createMockAppConfig();
    process.env.NODE_ENV = APP_CONST.ENVIRONMENTS.TEST;
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.DATABASE_URL_REPLICA = 'postgresql://user:pass@replica:5432/db';

    secretsManager = {
      getSecretValue: vi.fn(),
    };
    client = new PrismaDBClientDatasource(mockAppConfig, secretsManager);
  });

  it('returns cached prisma client on subsequent calls', async () => {
    const first = await client.getClient();
    const second = await client.getClient();

    expect(first).toBe(second);
    expect(connectMock).toHaveBeenCalledOnce();
    expect(secretsManager.getSecretValue).not.toHaveBeenCalled();
  });

  it('loads database credentials from secrets manager in non-test env', async () => {
    vi.resetModules();
    process.env.NODE_ENV = APP_CONST.ENVIRONMENTS.DEV;
    process.env.RDS_PROXY_ENDPOINT = 'proxy.example.com';
    process.env.RDS_SECRET_ARN = 'arn:aws:secretsmanager:secret';

    const { PrismaDBClientDatasource: DevPrismaDBClient } =
      await import('@common/datasources/database/implements/prisma-db-client.datasource.impl');
    const devSecretsManager = {
      getSecretValue: vi.fn().mockResolvedValue({
        username: 'db-user',
        password: 'p@ss',
        port: 5432,
        dbname: 'app',
        schema: 'public',
        replicaHost: 'replica.example.com',
      }),
    };
    const devClient = new DevPrismaDBClient(
      createMockAppConfig({
        nodeEnv: APP_CONST.ENVIRONMENTS.DEV,
        proxyEndpoint: 'proxy.example.com',
        rdsSecretArn: 'arn:aws:secretsmanager:secret',
      }),
      devSecretsManager,
    );

    await devClient.getClient();

    expect(devSecretsManager.getSecretValue).toHaveBeenCalledOnce();
    expect(connectMock).toHaveBeenCalledOnce();
  });

  it('uses replica fallback and default schema when secrets omit optional fields', async () => {
    vi.resetModules();
    process.env.NODE_ENV = APP_CONST.ENVIRONMENTS.DEV;
    process.env.RDS_PROXY_ENDPOINT = 'proxy.example.com';
    process.env.RDS_SECRET_ARN = 'arn:aws:secretsmanager:secret';

    const { PrismaDBClientDatasource: DevPrismaDBClient } =
      await import('@common/datasources/database/implements/prisma-db-client.datasource.impl');
    const devSecretsManager = {
      getSecretValue: vi.fn().mockResolvedValue({
        username: 'db-user',
        password: 'p@ss/w@rd',
        port: 5432,
        dbname: 'app',
      }),
    };
    const devClient = new DevPrismaDBClient(
      createMockAppConfig({
        nodeEnv: APP_CONST.ENVIRONMENTS.DEV,
        proxyEndpoint: 'proxy.example.com',
        rdsSecretArn: 'arn:aws:secretsmanager:secret',
      }),
      devSecretsManager,
    );

    await devClient.getClient();

    expect(devSecretsManager.getSecretValue).toHaveBeenCalledOnce();
  });

  it('throws InternalServerError after max connection retries', async () => {
    vi.useFakeTimers();
    connectMock.mockRejectedValue(
      new PrismaClientInitializationError('connection failed', 'P1001'),
    );

    const assertion = expect(client.getClient()).rejects.toBeInstanceOf(InternalServerError);
    await vi.runAllTimersAsync();
    await assertion;
    vi.useRealTimers();
  });

  it('logs DATABASE_ERROR when connect fails with a generic error', async () => {
    vi.useFakeTimers();
    connectMock.mockRejectedValue(new Error('generic db failure'));

    const assertion = expect(client.getClient()).rejects.toBeInstanceOf(InternalServerError);
    await vi.runAllTimersAsync();
    await assertion;
    vi.useRealTimers();
  });

  it('retries prisma query after P1000 authentication error', async () => {
    await client.getClient();
    expect(allOperationsHandler).toBeDefined();

    const authError = new PrismaClientKnownRequestError('auth failed', {
      code: 'P1000',
      clientVersion: 'test',
    });
    const queryFn = vi.fn().mockRejectedValueOnce(authError).mockResolvedValueOnce('ok');

    const result = await allOperationsHandler!({
      operation: 'findMany',
      model: 'User',
      args: {},
      query: queryFn,
    });

    expect(result).toBe('ok');
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(disconnectMock).toHaveBeenCalled();
  });

  it('rethrows non-authentication query errors', async () => {
    await client.getClient();

    const queryFn = vi.fn().mockRejectedValue(new Error('query failed'));

    await expect(
      allOperationsHandler!({
        operation: 'findMany',
        model: 'User',
        args: {},
        query: queryFn,
      }),
    ).rejects.toThrow('query failed');
  });

  it('waits for in-progress invalidation when invalidateClient is called concurrently', async () => {
    await client.getClient();
    disconnectMock.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 20)));

    const clientAny = client as unknown as {
      invalidateClient: () => Promise<void>;
    };

    await Promise.all([clientAny.invalidateClient(), clientAny.invalidateClient()]);

    expect(disconnectMock).toHaveBeenCalledOnce();
  });

  it('continues invalidation when disconnect fails', async () => {
    await client.getClient();
    disconnectMock.mockRejectedValueOnce(new Error('disconnect failed'));

    const clientAny = client as unknown as {
      performInvalidation: () => Promise<void>;
      dbClient: unknown;
    };

    await clientAny.performInvalidation();

    expect(clientAny.dbClient).toBeNull();
  });
});
