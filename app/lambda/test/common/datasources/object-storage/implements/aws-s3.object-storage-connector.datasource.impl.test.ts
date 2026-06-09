import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import { AwsS3ObjectStorageConnectorDatasource } from '@common/datasources/object-storage/implements/aws-s3.object-storage-connector.datasource.impl';
import { AwsS3ObjectStorageDatasource } from '@common/datasources/object-storage/implements/aws-s3.object-storage.datasource.impl';
import { BadRequestError } from '@common/errors/bad-request-error';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

const stsMock = mockClient(STSClient);

vi.mock('@common/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe('AwsS3ObjectStorageConnectorDatasource', () => {
  let connector: AwsS3ObjectStorageConnectorDatasource;

  const config = {
    roleArn: 'arn:aws:iam::123456789012:role/CrossAccountRole',
    region: 'ap-northeast-1',
    sessionName: 'test-session',
  };

  beforeEach(() => {
    stsMock.reset();
    connector = new AwsS3ObjectStorageConnectorDatasource(createMockAppConfig());
  });

  test('connects via STS assume role and returns S3 storage adapter', async () => {
    const expiration = new Date(Date.now() + 60 * 60 * 1000);
    stsMock.on(AssumeRoleCommand).resolves({
      Credentials: {
        AccessKeyId: 'access-key',
        SecretAccessKey: 'secret-key',
        SessionToken: 'session-token',
        Expiration: expiration,
      },
    });

    const storage = await connector.connect(config);

    expect(storage).toBeInstanceOf(AwsS3ObjectStorageDatasource);
    expect(stsMock.commandCalls(AssumeRoleCommand)[0].args[0].input).toMatchObject({
      RoleArn: config.roleArn,
      RoleSessionName: config.sessionName,
    });
  });

  test('reuses cached storage when credentials are still valid', async () => {
    const expiration = new Date(Date.now() + 60 * 60 * 1000);
    stsMock.on(AssumeRoleCommand).resolves({
      Credentials: {
        AccessKeyId: 'access-key',
        SecretAccessKey: 'secret-key',
        SessionToken: 'session-token',
        Expiration: expiration,
      },
    });

    const first = await connector.connect(config);
    const second = await connector.connect(config);

    expect(first).toBe(second);
    expect(stsMock.commandCalls(AssumeRoleCommand)).toHaveLength(1);
  });

  test('throws BadRequestError when assume role returns no credentials', async () => {
    stsMock.on(AssumeRoleCommand).resolves({});

    await expect(connector.connect(config)).rejects.toBeInstanceOf(BadRequestError);
  });

  test('uses default session name when sessionName is omitted', async () => {
    const expiration = new Date(Date.now() + 60 * 60 * 1000);
    stsMock.on(AssumeRoleCommand).resolves({
      Credentials: {
        AccessKeyId: 'access-key',
        SecretAccessKey: 'secret-key',
        SessionToken: 'session-token',
        Expiration: expiration,
      },
    });

    await connector.connect({
      roleArn: config.roleArn,
      region: config.region,
    });

    expect(stsMock.commandCalls(AssumeRoleCommand)[0].args[0].input.RoleSessionName).toBe(
      'cross-account-object-storage-session',
    );
  });
});
