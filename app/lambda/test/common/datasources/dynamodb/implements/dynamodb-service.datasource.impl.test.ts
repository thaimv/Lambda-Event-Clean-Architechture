import { QueryCommand, UpdateCommand, type UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import type { IDynamoDBClientDatasource } from '@common/datasources/dynamodb/dynamodb-client.datasource';
import { DynamoDBServiceDatasource } from '@common/datasources/dynamodb/implements/dynamodb-service.datasource.impl';
import type {
  DynamoDbDocumentQueryInput,
  DynamoDbDocumentUpdateInput,
} from '@common/types/datasources/dynamodb.type';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

describe('DynamoDBServiceDatasource', () => {
  type DocClientSend = (command: QueryCommand | UpdateCommand) => Promise<{ Items?: unknown[] }>;
  type MockDocClient = { send: Mock<DocClientSend> };

  let service: DynamoDBServiceDatasource;
  let mockDdbDocClient: MockDocClient;
  let mockDbClient: IDynamoDBClientDatasource;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDdbDocClient = { send: vi.fn() };
    mockDbClient = { getClient: vi.fn().mockReturnValue(mockDdbDocClient) };
    service = new DynamoDBServiceDatasource(mockDbClient);
  });

  describe('sendQueryCommand', () => {
    it('should execute a query and return items', async () => {
      const mockItems = [{ id: '1' }];
      mockDdbDocClient.send.mockResolvedValue({ Items: mockItems });

      const input: DynamoDbDocumentQueryInput = {
        TableName: 'TestTable',
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeValues: { ':pk': 'test-pk' },
      };

      const result = await service.sendQueryCommand(input);

      expect(result).toStrictEqual(mockItems);
      const sentCommand = mockDdbDocClient.send.mock.calls[0][0];
      expect(sentCommand).toBeInstanceOf(QueryCommand);
      expect(sentCommand.input).toEqual(input);
    });

    it('should return empty array when query result has no items', async () => {
      mockDdbDocClient.send.mockResolvedValue({});

      const result = await service.sendQueryCommand({
        TableName: 'TestTable',
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeValues: { ':pk': 'test-pk' },
      });

      expect(result).toEqual([]);
    });
  });

  describe('sendUpdateCommand', () => {
    it('should execute an update command', async () => {
      mockDdbDocClient.send.mockResolvedValue({});

      const input: DynamoDbDocumentUpdateInput = {
        TableName: 'TestTable',
        Key: { pk: 'test-pk' },
        UpdateExpression: 'SET #v = :v',
        ExpressionAttributeValues: { ':v': 123 },
      };

      await service.sendUpdateCommand(input);

      const sentCommand = mockDdbDocClient.send.mock.calls[0][0];
      expect(sentCommand).toBeInstanceOf(UpdateCommand);
      expect(sentCommand.input).toStrictEqual(input as UpdateCommandInput);
    });
  });
});
