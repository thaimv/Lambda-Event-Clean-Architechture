import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { DI } from '@common/constants/di.const';
import { ERROR_MESSAGE } from '@common/constants/response.const';
import type { ISecretsManagerDatasource } from '@common/datasources/secrets-manager/secrets-manager.datasource';
import { SecretsNotFoundError } from '@common/errors/secrets-notfound-error';
import type { GetSecretInput } from '@common/types/datasources/secrets-manager.type';
import type { AppConfig } from '@lambda/config/app.config';
import { inject, injectable } from 'inversify';

@injectable()
export class SecretsManagerDatasource implements ISecretsManagerDatasource {
  private readonly client: SecretsManagerClient;

  constructor(
    @inject(DI.APP_CONFIG)
    appConfig: AppConfig,
  ) {
    this.client = new SecretsManagerClient({ region: appConfig.awsConfig.region });
  }

  async getSecretValue<T>(input: GetSecretInput): Promise<T> {
    const response = await this.client.send(new GetSecretValueCommand({ ...input }));
    const { SecretString, SecretBinary } = response;

    let secret: string;
    if (SecretString) {
      secret = SecretString;
    } else if (SecretBinary) {
      secret = Buffer.from(SecretBinary).toString('utf-8');
    } else {
      throw new SecretsNotFoundError(ERROR_MESSAGE.SECRETS_NOT_FOUND);
    }

    return JSON.parse(secret) as T;
  }
}
