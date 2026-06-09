import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { ERROR_MESSAGE } from '@common/constants/response.const';
import { SecretsManagerDatasource } from '@common/datasources/secrets-manager/implements/secrets-manager.datasource.impl';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, test } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

const secretsMock = mockClient(SecretsManagerClient);

describe('SecretsManagerDatasource', () => {
  let datasource: SecretsManagerDatasource;

  beforeEach(() => {
    secretsMock.reset();
    datasource = new SecretsManagerDatasource(createMockAppConfig());
  });

  test('returns parsed secret from SecretString', async () => {
    secretsMock.on(GetSecretValueCommand).resolves({
      SecretString: JSON.stringify({ username: 'user', password: 'pass' }),
    });

    const result = await datasource.getSecretValue<{ username: string; password: string }>({
      SecretId: 'test-secret',
    });

    expect(result).toEqual({ username: 'user', password: 'pass' });
  });

  test('returns parsed secret from SecretBinary', async () => {
    secretsMock.on(GetSecretValueCommand).resolves({
      SecretBinary: Buffer.from(JSON.stringify({ key: 'value' })),
    });

    const result = await datasource.getSecretValue<{ key: string }>({
      SecretId: 'binary-secret',
    });

    expect(result).toEqual({ key: 'value' });
  });

  test('throws SecretsNotFoundError when secret payload is empty', async () => {
    secretsMock.on(GetSecretValueCommand).resolves({});

    await expect(datasource.getSecretValue({ SecretId: 'missing-secret' })).rejects.toMatchObject({
      message: ERROR_MESSAGE.SECRETS_NOT_FOUND,
      code: 'ES-002',
    });
  });
});
