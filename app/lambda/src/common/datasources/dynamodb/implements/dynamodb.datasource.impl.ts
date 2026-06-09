import {
  BatchWriteItemCommand,
  DeleteItemCommand,
  QueryCommand,
  ScanCommand,
  type DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DYNAMODB_BATCH_DELETE_MAX_RETRIES,
  DYNAMODB_BATCH_DELETE_RETRY_DELAY_MS,
  DYNAMODB_BATCH_WRITE_ITEM_SIZE,
} from '@common/constants/app.const';
import { DI } from '@common/constants/di.const';
import type { IDynamoDBDatasource } from '@common/datasources/dynamodb/dynamodb.datasource';
import { logger } from '@common/logger';
import type {
  AttributeValue,
  DynamoDbDeleteItemOutput,
  DynamoDbQueryInput,
  DynamoDbQueryOutput,
  DynamoDbRawClient,
  DynamoDbScanInput,
  DynamoDbScanOutput,
  WriteRequest,
} from '@common/types/datasources/dynamodb.type';
import { inject, injectable } from 'inversify';

const RETRYABLE_BATCH_DELETE_ERRORS = new Set([
  'ProvisionedThroughputExceededException',
  'RequestLimitExceeded',
  'ThrottlingException',
  'InternalServerError',
]);

/**
 * Low-level DynamoDB datasource.
 * Uses @aws-sdk/client-dynamodb directly with explicit AttributeValue marshalling.
 * For operations that need automatic marshalling, use IDynamoDBServiceDatasource instead.
 */
@injectable()
export class DynamoDBDatasource implements IDynamoDBDatasource {
  constructor(
    @inject(DI.DYNAMODB_RAW_CLIENT_DATASOURCE)
    private readonly client: DynamoDbRawClient,
  ) {}

  private get rawClient(): DynamoDBClient {
    return this.client as DynamoDBClient;
  }

  private async delayRetry(attempt: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, DYNAMODB_BATCH_DELETE_RETRY_DELAY_MS * 2 ** attempt);
    });
  }

  private isRetryableBatchDeleteError(error: unknown): boolean {
    return (
      error instanceof Error && 'name' in error && RETRYABLE_BATCH_DELETE_ERRORS.has(error.name)
    );
  }

  async deleteItem(
    tableName: string,
    key: Record<string, AttributeValue>,
  ): Promise<DynamoDbDeleteItemOutput> {
    return this.rawClient.send(
      new DeleteItemCommand({
        TableName: tableName,
        Key: key as unknown as ConstructorParameters<typeof DeleteItemCommand>[0]['Key'],
      }),
    );
  }

  async batchDeleteItems(tableName: string, keys: Record<string, AttributeValue>[]): Promise<void> {
    for (let i = 0; i < keys.length; i += DYNAMODB_BATCH_WRITE_ITEM_SIZE) {
      let pendingRequests: WriteRequest[] = keys
        .slice(i, i + DYNAMODB_BATCH_WRITE_ITEM_SIZE)
        .map((key) => ({
          DeleteRequest: { Key: key },
        }));

      for (let attempt = 0; pendingRequests.length > 0; attempt += 1) {
        const batchResult = await this.rawClient
          .send(
            new BatchWriteItemCommand({
              RequestItems: {
                [tableName]: pendingRequests as unknown as NonNullable<
                  ConstructorParameters<typeof BatchWriteItemCommand>[0]['RequestItems']
                >[string],
              },
            }),
          )
          .then(
            (result) => ({ ok: true as const, result }),
            (error) => ({ ok: false as const, error }),
          );

        if (!batchResult.ok) {
          const { error } = batchResult;
          if (
            attempt >= DYNAMODB_BATCH_DELETE_MAX_RETRIES ||
            !this.isRetryableBatchDeleteError(error)
          ) {
            throw error;
          }

          const retryableError = error as Error;
          logger.debug('Retrying DynamoDB batch delete after retryable error', {
            attempt: attempt + 1,
            errorName: retryableError.name,
            errorMessage: retryableError.message,
            maxRetries: DYNAMODB_BATCH_DELETE_MAX_RETRIES,
            pendingRequestCount: pendingRequests.length,
            tableName,
          });

          await this.delayRetry(attempt);
          continue;
        }

        pendingRequests =
          (batchResult.result.UnprocessedItems?.[tableName] as WriteRequest[] | undefined) ?? [];

        if (pendingRequests.length === 0) {
          break;
        }

        if (attempt >= DYNAMODB_BATCH_DELETE_MAX_RETRIES) {
          logger.error('DynamoDB batch delete exhausted retries for unprocessed items', {
            attemptedRequestCount: keys.slice(i, i + DYNAMODB_BATCH_WRITE_ITEM_SIZE).length,
            maxRetries: DYNAMODB_BATCH_DELETE_MAX_RETRIES,
            pendingRequestCount: pendingRequests.length,
            tableName,
          });

          throw new Error(
            `Batch delete returned ${pendingRequests.length} unprocessed items after ${attempt + 1} retries`,
          );
        }

        logger.debug('Retrying DynamoDB batch delete for unprocessed items', {
          attempt: attempt + 1,
          maxRetries: DYNAMODB_BATCH_DELETE_MAX_RETRIES,
          pendingRequestCount: pendingRequests.length,
          tableName,
        });

        await this.delayRetry(attempt);
      }
    }
  }

  async query(input: DynamoDbQueryInput): Promise<DynamoDbQueryOutput> {
    return this.rawClient.send(
      new QueryCommand(input as ConstructorParameters<typeof QueryCommand>[0]),
    );
  }

  async scan(input: DynamoDbScanInput): Promise<DynamoDbScanOutput> {
    return this.rawClient.send(
      new ScanCommand(input as ConstructorParameters<typeof ScanCommand>[0]),
    );
  }
}
