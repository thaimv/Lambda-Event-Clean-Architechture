import { GraphQLDatasource } from '@common/datasources/graphql/implements/graphql.datasource.impl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

// Mock logger
vi.mock('@common/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('GraphQLDatasource', () => {
  let graphQLDatasource: GraphQLDatasource;
  let mockInvokeLambda: ReturnType<typeof vi.fn>;

  const createSuccessPayload = (data: unknown) => {
    const response = JSON.stringify({ data, success: true });
    return new TextEncoder().encode(response);
  };

  const createErrorPayload = (errors: Array<{ message: string }>) => {
    const response = JSON.stringify({ errors });
    return new TextEncoder().encode(response);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockInvokeLambda = vi.fn();
    graphQLDatasource = new GraphQLDatasource(
      { invoke: mockInvokeLambda } as any,
      createMockAppConfig({
        graphqlApiArn: 'arn:aws:lambda:ap-northeast-1:123456789012:function:test-graphql',
      }),
    );
  });

  describe('invokeMutation', () => {
    it('should invoke mutation successfully', async () => {
      const mockData = { postPushNotification: { success: true, message: 'Notification sent' } };
      mockInvokeLambda.mockResolvedValueOnce({
        StatusCode: 200,
        Payload: createSuccessPayload(mockData),
      });

      const result = await graphQLDatasource.invokeMutation(
        'postPushNotification',
        {
          notificationTemplateId: 'test-template-id',
          cognitoSub: '550e8400-e29b-41d4-a716-446655440000',
          replacementParameters: { displayName: 'My Item' },
        },
        ['success', 'message'],
        { username: 'test-user', cognitoIdentityAuthProvider: 'test-provider' },
      );

      expect(mockInvokeLambda).toHaveBeenCalledWith({
        FunctionName: 'arn:aws:lambda:ap-northeast-1:123456789012:function:test-graphql',
        InvocationType: 'RequestResponse',
        Payload: expect.stringContaining('"parentTypeName":"Mutation"'),
      });
      expect(result).toEqual({ data: mockData, success: true });
    });

    it('should invoke mutation without identity', async () => {
      const mockData = { someMutation: { result: 'ok' } };
      mockInvokeLambda.mockResolvedValueOnce({
        StatusCode: 200,
        Payload: createSuccessPayload(mockData),
      });

      const result = await graphQLDatasource.invokeMutation('someMutation', { arg1: 'value1' }, [
        'result',
      ]);

      expect(result).toEqual({ data: mockData, success: true });

      // Check that identity has empty strings when not provided
      const callArgs = JSON.parse(mockInvokeLambda.mock.calls[0][0].Payload);
      expect(callArgs.identity).toEqual({
        cognitoIdentityAuthProvider: '',
        username: '',
      });
    });

    it('should throw error when Lambda returns non-200 status code', async () => {
      mockInvokeLambda.mockResolvedValueOnce({
        StatusCode: 500,
        Payload: undefined,
      });

      await expect(graphQLDatasource.invokeMutation('testMutation', {}, ['field'])).rejects.toThrow(
        'GraphQL Lambda invocation failed with status code: 500',
      );
    });

    it('should default missing status code to 500', async () => {
      mockInvokeLambda.mockResolvedValueOnce({
        Payload: undefined,
      });

      await expect(graphQLDatasource.invokeMutation('testMutation', {}, ['field'])).rejects.toThrow(
        'GraphQL Lambda invocation failed with status code: 500',
      );
    });

    it('should throw error when Lambda returns empty payload', async () => {
      mockInvokeLambda.mockResolvedValueOnce({
        StatusCode: 200,
        Payload: undefined,
      });

      await expect(graphQLDatasource.invokeMutation('testMutation', {}, ['field'])).rejects.toThrow(
        'GraphQL Lambda returned empty payload',
      );
    });

    it('should throw error when Lambda returns GraphQL errors', async () => {
      mockInvokeLambda.mockResolvedValueOnce({
        StatusCode: 200,
        Payload: createErrorPayload([
          { message: 'Field not found' },
          { message: 'Invalid argument' },
        ]),
      });

      await expect(graphQLDatasource.invokeMutation('testMutation', {}, ['field'])).rejects.toThrow(
        'GraphQL errors: Field not found, Invalid argument',
      );
    });

    it('should throw error when Lambda invocation fails', async () => {
      mockInvokeLambda.mockRejectedValueOnce(new Error('Lambda invocation failed'));

      await expect(graphQLDatasource.invokeMutation('testMutation', {}, ['field'])).rejects.toThrow(
        'Lambda invocation failed',
      );
    });

    it('should throw error when payload is invalid JSON', async () => {
      mockInvokeLambda.mockResolvedValueOnce({
        StatusCode: 200,
        Payload: new TextEncoder().encode('invalid json'),
      });

      await expect(graphQLDatasource.invokeMutation('testMutation', {}, ['field'])).rejects.toThrow(
        'Invalid response from GraphQL Lambda',
      );
    });
  });

  describe('invokeQuery', () => {
    it('should invoke query successfully', async () => {
      const mockData = { getResource: { resourceId: '123', displayName: 'My Item' } };
      mockInvokeLambda.mockResolvedValueOnce({
        StatusCode: 200,
        Payload: createSuccessPayload(mockData),
      });

      const result = await graphQLDatasource.invokeQuery(
        'getResource',
        { resourceId: '123' },
        ['resourceId', 'displayName'],
        { username: 'test-user' },
      );

      expect(mockInvokeLambda).toHaveBeenCalledWith({
        FunctionName: 'arn:aws:lambda:ap-northeast-1:123456789012:function:test-graphql',
        InvocationType: 'RequestResponse',
        Payload: expect.stringContaining('"parentTypeName":"Query"'),
      });
      expect(result).toEqual({ data: mockData, success: true });
    });

    it('should invoke query without identity', async () => {
      const mockData = { listItems: [] };
      mockInvokeLambda.mockResolvedValueOnce({
        StatusCode: 200,
        Payload: createSuccessPayload(mockData),
      });

      const result = await graphQLDatasource.invokeQuery('listItems', {}, ['items']);

      expect(result).toEqual({ data: mockData, success: true });
    });

    it('should throw error when query fails', async () => {
      mockInvokeLambda.mockResolvedValueOnce({
        StatusCode: 200,
        Payload: createErrorPayload([{ message: 'Query failed' }]),
      });

      await expect(graphQLDatasource.invokeQuery('testQuery', {}, ['field'])).rejects.toThrow(
        'GraphQL errors: Query failed',
      );
    });
  });

  describe('payload structure', () => {
    it('should build correct payload structure for Lambda invocation', async () => {
      mockInvokeLambda.mockResolvedValueOnce({
        StatusCode: 200,
        Payload: createSuccessPayload({ test: true }),
      });

      await graphQLDatasource.invokeMutation(
        'testField',
        { arg1: 'value1', arg2: 123 },
        ['field1', 'field2', 'nested.field'],
        { username: 'user123', cognitoIdentityAuthProvider: 'provider123' },
      );

      const payload = JSON.parse(mockInvokeLambda.mock.calls[0][0].Payload);

      expect(payload.field).toBe('testField');
      expect(payload.arguments).toEqual({ arg1: 'value1', arg2: 123 });
      expect(payload.source).toBeNull();
      expect(payload.parentTypeName).toBe('Mutation');
      expect(payload.variables).toEqual({});
      expect(payload.selectionSetList).toEqual(['field1', 'field2', 'nested.field']);
      expect(payload.selectionSetGraphQL).toBe('{ field1 field2 nested.field }');
      expect(payload.identity).toEqual({
        cognitoIdentityAuthProvider: 'provider123',
        username: 'user123',
      });
      expect(payload.request.headers).toBeDefined();
      expect(payload.request.headers['content-type']).toBe('application/json');
    });

    it('should generate unique request ID for each invocation', async () => {
      mockInvokeLambda.mockResolvedValue({
        StatusCode: 200,
        Payload: createSuccessPayload({ test: true }),
      });

      await graphQLDatasource.invokeMutation('test1', {}, ['field']);
      await graphQLDatasource.invokeMutation('test2', {}, ['field']);

      const payload1 = JSON.parse(mockInvokeLambda.mock.calls[0][0].Payload);
      const payload2 = JSON.parse(mockInvokeLambda.mock.calls[1][0].Payload);

      expect(payload1.request.headers['x-amzn-requestid']).toBeDefined();
      expect(payload2.request.headers['x-amzn-requestid']).toBeDefined();
      // Request IDs should be different
      expect(payload1.request.headers['x-amzn-requestid']).not.toBe(
        payload2.request.headers['x-amzn-requestid'],
      );
    });
  });
});
