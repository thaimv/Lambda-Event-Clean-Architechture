import { DynamoDBClient as DynamoDbClientSdk } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient as DynamoDBDocumentClientSdk } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClientDatasource } from '@common/datasources/dynamodb/implements/dynamodb-client.datasource.impl';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

vi.mock('@aws-sdk/client-dynamodb');
vi.mock('@aws-sdk/lib-dynamodb');

describe('DynamoDBClientDatasource', () => {
  const mockDocClient = {
    send: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockDocClient.send = vi.fn();

    DynamoDBDocumentClientSdk.from = vi.fn().mockReturnValue(mockDocClient);
  });

  describe('constructor', () => {
    it('should create a DynamoDBDocumentClient with default configuration', () => {
      const provider = new DynamoDBClientDatasource(createMockAppConfig({ region: 'us-east-1' }));

      expect(DynamoDbClientSdk).toHaveBeenCalledWith({
        region: 'us-east-1',
        endpoint: 'http://localhost:8000',
      });
      expect(DynamoDBDocumentClientSdk.from).toHaveBeenCalled();
      expect(provider.getClient()).toStrictEqual(mockDocClient);
    });
  });

  describe('getClient', () => {
    it('should return the DynamoDB document client instance', () => {
      const provider = new DynamoDBClientDatasource(createMockAppConfig({ region: 'us-east-1' }));

      const result = provider.getClient();

      expect(result).toStrictEqual(mockDocClient);
    });
  });
});
