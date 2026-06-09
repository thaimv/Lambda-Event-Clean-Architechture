import type {
  DynamoDbDocumentQueryInput,
  DynamoDbDocumentUpdateInput,
  DynamoDbItem,
} from '@common/types/datasources/dynamodb.type';

export interface IDynamoDBServiceDatasource {
  sendQueryCommand<TItem = DynamoDbItem>(input: DynamoDbDocumentQueryInput): Promise<TItem[]>;
  sendUpdateCommand(input: DynamoDbDocumentUpdateInput): Promise<void>;
}
