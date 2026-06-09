import { S3Client } from '@aws-sdk/client-s3';
import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import { DI } from '@common/constants/di.const';
import { ERROR_MESSAGE } from '@common/constants/response.const';
import { AwsS3ObjectStorageDatasource } from '@common/datasources/object-storage/implements/aws-s3.object-storage.datasource.impl';
import type {
  IObjectStorageConnectorDatasource,
  IObjectStorageDatasource,
} from '@common/datasources/object-storage/object-storage.datasource';
import { BadRequestError } from '@common/errors/bad-request-error';
import { logger } from '@common/logger';
import type {
  AssumeRoleOutput,
  ObjectStorageCrossAccountConfig,
} from '@common/types/datasources/object-storage.type';
import type { AppConfig } from '@lambda/config/app.config';
import { inject, injectable } from 'inversify';

/**
 * AWS S3 cross-account connector adapter.
 */
@injectable()
export class AwsS3ObjectStorageConnectorDatasource implements IObjectStorageConnectorDatasource {
  protected cachedClients: Map<string, { storage: IObjectStorageDatasource; expiration: Date }> =
    new Map();
  private gracePeriodMs = 15 * 60 * 1000;

  constructor(
    @inject(DI.APP_CONFIG)
    private readonly appConfig: AppConfig,
  ) {}

  async connect(config: ObjectStorageCrossAccountConfig): Promise<IObjectStorageDatasource> {
    const cacheKey = `${config.roleArn}|${config.region}|${config.sessionName}`;
    const cachedClient = this.cachedClients.get(cacheKey);

    const now = new Date();

    if (cachedClient) {
      const cachedExpiration = cachedClient.expiration;
      const diff = cachedExpiration.getTime() - now.getTime();
      logger.debug(`Cached object storage expiration in ${diff / 1000} seconds`);

      if (cachedExpiration > new Date(now.getTime() + this.gracePeriodMs)) {
        return cachedClient.storage;
      }
    }

    logger.debug('Cached object storage not found or expired, performing new connection');

    const { storage, expiration } = await this.performConnect(config);

    this.cachedClients.set(cacheKey, { storage, expiration });

    return storage;
  }

  private async performConnect(
    config: ObjectStorageCrossAccountConfig,
  ): Promise<{ storage: IObjectStorageDatasource; expiration: Date }> {
    const stsClient = new STSClient({ region: this.appConfig.awsConfig.region });

    const assumeRoleCommand = new AssumeRoleCommand({
      RoleArn: config.roleArn,
      RoleSessionName: config.sessionName || 'cross-account-object-storage-session',
      DurationSeconds: 3600,
    });

    const assumeRoleResponse: AssumeRoleOutput = await stsClient.send(assumeRoleCommand);

    if (!assumeRoleResponse.Credentials) {
      throw new BadRequestError(ERROR_MESSAGE.FAILED_TO_ASSUME_ROLE);
    }

    const credentials = assumeRoleResponse.Credentials;

    const s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: credentials.AccessKeyId!,
        secretAccessKey: credentials.SecretAccessKey!,
        sessionToken: credentials.SessionToken!,
      },
    });

    return {
      storage: AwsS3ObjectStorageDatasource.fromClient(s3Client),
      expiration: credentials.Expiration!,
    };
  }
}
