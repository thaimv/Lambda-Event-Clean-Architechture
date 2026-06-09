import {
  DynamoDBClient as DynamoDBClientSdk,
  type DynamoDBClientConfigType,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DI } from '@common/constants/di.const';
import type { IDynamoDBClientDatasource } from '@common/datasources/dynamodb/dynamodb-client.datasource';
import type { DynamoDbDocumentClient } from '@common/types/datasources/dynamodb.type';
import type { AppConfig } from '@lambda/config/app.config';
import { inject, injectable } from 'inversify';

/**
 * Provides a DynamoDB Document Client (high-level) via DI.
 * Handles attribute marshalling/unmarshalling automatically.
 */
@injectable()
export class DynamoDBClientDatasource implements IDynamoDBClientDatasource {
  private readonly ddbDocClient: DynamoDBDocumentClient;

  constructor(
    @inject(DI.APP_CONFIG)
    appConfig: AppConfig,
  ) {
    const params: DynamoDBClientConfigType = {
      region: appConfig.awsConfig.region,
    };

    if (appConfig.isLocal || appConfig.isTest) {
      params.endpoint = appConfig.dynamoDBConfig.endpoint;
    }

    this.ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClientSdk(params));
  }

  getClient(): DynamoDbDocumentClient {
    return this.ddbDocClient;
  }
}
