import { QueryCommand, UpdateCommand, type DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DI } from '@common/constants/di.const';
import type { IDynamoDBClientDatasource } from '@common/datasources/dynamodb/dynamodb-client.datasource';
import type { IDynamoDBServiceDatasource } from '@common/datasources/dynamodb/dynamodb-service.datasource';
import type {
  DynamoDbDocumentClient,
  DynamoDbDocumentQueryInput,
  DynamoDbDocumentUpdateInput,
} from '@common/types/datasources/dynamodb.type';
import { inject, injectable } from 'inversify';

/**
 * High-level DynamoDB service using DynamoDBDocumentClient.
 * Handles attribute marshalling/unmarshalling automatically.
 */
@injectable()
export class DynamoDBServiceDatasource implements IDynamoDBServiceDatasource {
  private readonly ddbDocClient: DynamoDbDocumentClient;

  constructor(
    @inject(DI.DYNAMODB_CLIENT_DATASOURCE)
    dbClient: IDynamoDBClientDatasource,
  ) {
    this.ddbDocClient = dbClient.getClient();
  }

  private get docClient(): DynamoDBDocumentClient {
    return this.ddbDocClient as DynamoDBDocumentClient;
  }

  async sendQueryCommand<TItem = Record<string, unknown>>(
    input: DynamoDbDocumentQueryInput,
  ): Promise<TItem[]> {
    const result = await this.docClient.send(
      new QueryCommand(input as ConstructorParameters<typeof QueryCommand>[0]),
    );
    return (result.Items as TItem[]) ?? [];
  }

  async sendUpdateCommand(input: DynamoDbDocumentUpdateInput): Promise<void> {
    await this.docClient.send(
      new UpdateCommand(input as ConstructorParameters<typeof UpdateCommand>[0]),
    );
  }
}
