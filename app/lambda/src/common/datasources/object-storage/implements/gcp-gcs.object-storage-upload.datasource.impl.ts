import type { Readable } from 'stream';

import { DI } from '@common/constants/di.const';
import type { IObjectStorageUploadDatasource } from '@common/datasources/object-storage/object-storage-upload.datasource';
import type { ISecretsManagerDatasource } from '@common/datasources/secrets-manager/secrets-manager.datasource';
import { logger } from '@common/logger';
import { Storage } from '@google-cloud/storage';
import type { AppConfig } from '@lambda/config/app.config';
import { GoogleAuth } from 'google-auth-library';
import { inject, injectable } from 'inversify';

type GcsCredentials = Record<string, unknown>;

/**
 * GCP GCS adapter for object storage upload operations.
 */
@injectable()
export class GcpGcsObjectStorageUploadDatasource implements IObjectStorageUploadDatasource {
  private storageInstance: Storage | null = null;

  constructor(
    @inject(DI.SECRETS_MANAGER_DATASOURCE)
    private readonly secretsManager: ISecretsManagerDatasource,
    @inject(DI.APP_CONFIG)
    private readonly appConfig: AppConfig,
  ) {}

  private async getCredentials(): Promise<GcsCredentials> {
    return this.secretsManager.getSecretValue<GcsCredentials>({
      SecretId: this.appConfig.secretManagerKeys.GCS_SECRET_NAME!,
      VersionStage: 'AWSCURRENT',
    });
  }

  private async getStorage(): Promise<Storage> {
    if (this.storageInstance) {
      return this.storageInstance;
    }

    const credentials = await this.getCredentials();

    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
      credentials: credentials,
    });

    const authClient = await auth.getClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.storageInstance = new Storage({ authClient: authClient as any });
    return this.storageInstance;
  }

  async uploadFileWithStream(
    bucketName: string,
    filePath: string,
    stream: Readable,
  ): Promise<void> {
    logger.debug(`Starting object storage upload to bucket: ${bucketName}, path: ${filePath}`);

    const storage = await this.getStorage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    const writeStream = file.createWriteStream({
      metadata: {
        contentType: 'application/octet-stream',
      },
    });

    await new Promise<void>((resolve, reject) => {
      writeStream.on('error', (error: Error) => {
        logger.error(`Object storage upload error: ${error.message}`);
        reject(error);
      });

      writeStream.on('finish', () => {
        logger.debug(`Successfully uploaded to object storage: ${bucketName}/${filePath}`);
        resolve();
      });

      stream.pipe(writeStream);
    });
  }

  async uploadFile(bucketName: string, filePath: string, buffer: Buffer): Promise<void> {
    logger.debug(
      `Starting object storage buffer upload to bucket: ${bucketName}, path: ${filePath}`,
    );

    const storage = await this.getStorage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        contentType: 'application/octet-stream',
      },
    });

    logger.debug(`Successfully uploaded buffer to object storage: ${bucketName}/${filePath}`);
  }
}
