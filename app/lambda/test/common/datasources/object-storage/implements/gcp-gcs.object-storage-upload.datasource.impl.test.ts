import { GcpGcsObjectStorageUploadDatasource } from '@common/datasources/object-storage/implements/gcp-gcs.object-storage-upload.datasource.impl';
import type { ISecretsManagerDatasource } from '@common/datasources/secrets-manager/secrets-manager.datasource';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

const saveMock = vi.fn();
const createWriteStreamMock = vi.fn();
const fileMock = { save: saveMock, createWriteStream: createWriteStreamMock };
const bucketMock = { file: vi.fn(() => fileMock) };
const storageMock = { bucket: vi.fn(() => bucketMock) };

vi.mock('@google-cloud/storage', () => ({
  Storage: vi.fn().mockImplementation(() => storageMock),
}));

vi.mock('google-auth-library', () => ({
  GoogleAuth: vi.fn().mockImplementation(() => ({
    getClient: vi.fn().mockResolvedValue({}),
  })),
}));

vi.mock('@common/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock('inversify', () => ({
  injectable: () => (target: unknown) => target,
  inject: () => () => undefined,
}));

describe('GcpGcsObjectStorageUploadDatasource', () => {
  let datasource: GcpGcsObjectStorageUploadDatasource;
  let secretsManager: ISecretsManagerDatasource;

  beforeEach(() => {
    vi.clearAllMocks();
    secretsManager = {
      getSecretValue: vi.fn().mockResolvedValue({ client_email: 'test@example.com' }),
    };
    datasource = new GcpGcsObjectStorageUploadDatasource(secretsManager, createMockAppConfig());
  });

  test('uploadFile saves buffer to GCS', async () => {
    saveMock.mockResolvedValue(undefined);

    await datasource.uploadFile('bucket-name', 'path/file.bin', Buffer.from('data'));

    expect(secretsManager.getSecretValue).toHaveBeenCalledOnce();
    expect(storageMock.bucket).toHaveBeenCalledWith('bucket-name');
    expect(bucketMock.file).toHaveBeenCalledWith('path/file.bin');
    expect(saveMock).toHaveBeenCalledWith(Buffer.from('data'), {
      metadata: { contentType: 'application/octet-stream' },
    });
  });

  test('reuses cached storage client on subsequent uploads', async () => {
    saveMock.mockResolvedValue(undefined);

    await datasource.uploadFile('bucket-name', 'path/a.bin', Buffer.from('a'));
    await datasource.uploadFile('bucket-name', 'path/b.bin', Buffer.from('b'));

    expect(secretsManager.getSecretValue).toHaveBeenCalledOnce();
  });

  test('uploadFileWithStream resolves when write stream finishes', async () => {
    const handlers: Record<string, (error?: Error) => void> = {};
    createWriteStreamMock.mockImplementation(() => ({
      on: vi.fn((event: string, handler: (error?: Error) => void) => {
        handlers[event] = handler;
        if (event === 'finish') {
          handler();
        }
      }),
    }));

    const pipeMock = vi.fn();
    const stream = {
      pipe: pipeMock,
    };

    await datasource.uploadFileWithStream('bucket-name', 'path/file.bin', stream as never);

    expect(createWriteStreamMock).toHaveBeenCalledWith({
      metadata: { contentType: 'application/octet-stream' },
    });
    expect(pipeMock).toHaveBeenCalledOnce();
  });

  test('uploadFileWithStream rejects when write stream errors', async () => {
    createWriteStreamMock.mockImplementation(() => ({
      on: vi.fn((event: string, handler: (error?: Error) => void) => {
        if (event === 'error') {
          handler(new Error('upload failed'));
        }
      }),
    }));

    const stream = { pipe: vi.fn() };

    await expect(
      datasource.uploadFileWithStream('bucket-name', 'path/file.bin', stream as never),
    ).rejects.toThrow('upload failed');
  });
});
