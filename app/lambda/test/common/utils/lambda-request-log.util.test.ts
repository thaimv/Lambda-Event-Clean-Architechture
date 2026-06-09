import { getLambdaRequestLogInput } from '@common/utils/lambda-request-log.util';
import { describe, expect, test } from 'vitest';

describe('getLambdaRequestLogInput', () => {
  test('should return non-API Gateway input as-is', () => {
    const directInput = { userId: '123', action: 'sync' };
    expect(getLambdaRequestLogInput(null)).toBeNull();
    expect(getLambdaRequestLogInput('plain-text')).toBe('plain-text');
    expect(getLambdaRequestLogInput({ missing: 'api-fields' })).toEqual({ missing: 'api-fields' });

    const sqsInput = {
      Records: [
        {
          messageId: 'msg-1',
          receiptHandle: 'handle-1',
          body: JSON.stringify({ orderId: '42' }),
          eventSource: 'aws:sqs',
        },
      ],
    };

    expect(getLambdaRequestLogInput(directInput)).toBe(directInput);
    expect(getLambdaRequestLogInput(sqsInput)).toBe(sqsInput);
  });

  test('should extract API Gateway body, query, and path parameters', () => {
    const input = getLambdaRequestLogInput({
      httpMethod: 'POST',
      path: '/users',
      body: JSON.stringify({ name: 'demo' }),
      queryStringParameters: { page: '1' },
      pathParameters: { id: '123' },
      headers: { Authorization: 'secret' },
      requestContext: { identity: { sourceIp: '1.2.3.4' } },
    });

    expect(input).toEqual({
      body: { name: 'demo' },
      queryStringParameters: { page: '1' },
      pathParameters: { id: '123' },
    });
  });

  test('should omit empty API Gateway body values', () => {
    expect(
      getLambdaRequestLogInput({
        httpMethod: 'GET',
        path: '/users',
        body: null,
      }),
    ).toEqual({});

    expect(
      getLambdaRequestLogInput({
        httpMethod: 'GET',
        path: '/users',
        body: '',
      }),
    ).toEqual({});
  });

  test('should keep raw body when JSON parsing fails', () => {
    expect(
      getLambdaRequestLogInput({
        httpMethod: 'POST',
        path: '/users',
        body: 'not-json',
      }),
    ).toEqual({ body: 'not-json' });
  });

  test('should support HTTP API v2 path and method fields', () => {
    expect(
      getLambdaRequestLogInput({
        rawPath: '/users',
        requestContext: {
          http: { method: 'GET', path: '/users' },
        },
        body: JSON.stringify({ ok: true }),
      }),
    ).toEqual({ body: { ok: true } });
  });

  test('should resolve API Gateway path from requestContext.http only', () => {
    expect(
      getLambdaRequestLogInput({
        requestContext: {
          http: { method: 'PATCH', path: '/users/1' },
        },
      }),
    ).toEqual({});
  });
});
