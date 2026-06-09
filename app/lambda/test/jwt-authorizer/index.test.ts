import { ERROR_MESSAGE, RESULT_CODE } from '@common/constants/response.const';
import { NotFoundError } from '@common/errors/notfound-error';
import { UnauthorizedError } from '@common/errors/unauthorized-error';
import { logger } from '@common/logger';
import { handler } from '@lambda/jwt-authorizer';
import { describe, test, expect, vi, beforeEach } from 'vitest';

const mockHandle = vi.fn();

vi.mock('@lambda/config/di/di.config', () => ({
  bootstrapApplication: vi.fn(),
  getInstance: vi.fn(() => ({ handle: mockHandle })),
}));

vi.mock('@common/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const FAKE_KID = 'test-kid';
const FAKE_ALG = 'RS256';
const FAKE_PAYLOAD = {
  iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
  token_use: 'id',
  aud: 'test-client-id',
  sub: 'user123',
};
const FAKE_HEADER = { alg: FAKE_ALG, kid: FAKE_KID };

function makeEvent(header = FAKE_HEADER, payload = FAKE_PAYLOAD) {
  const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const token = [encode(header), encode(payload), 'signature'].join('.');
  return {
    headers: { cookie: `project_access_token=${token}` },
    methodArn: 'test1:test2:test3:test4:test5:test6',
    type: 'REQUEST',
    resource: '/',
    path: '/',
    httpMethod: 'GET',
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    pathParameters: null,
    stageVariables: null,
    requestContext: {},
  };
}

describe('jwt authorizer handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('success: delegates to presenter and returns policy', async () => {
    const mockPolicy = {
      principalId: '',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: 'test1:test2:test3:test4:test5:test6',
          },
        ],
      },
    };
    mockHandle.mockResolvedValue(mockPolicy);

    const result = await handler(makeEvent());

    expect(result).not.toBeNull();
    expect(result!.policyDocument.Statement[0].Effect).toBe('Allow');
    expect(result!.policyDocument.Statement[0].Resource).toBe(
      'test1:test2:test3:test4:test5:test6',
    );
    expect(mockHandle).toHaveBeenCalled();
  });

  test('throws UnauthorizedError when presenter throws', async () => {
    mockHandle.mockRejectedValue(new UnauthorizedError('Invalid token issuer'));

    await expect(handler(makeEvent())).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(handler(makeEvent())).rejects.toThrow(ERROR_MESSAGE.UNAUTHORIZED);
  });

  test('throws UnauthorizedError when presenter throws key not found', async () => {
    mockHandle.mockRejectedValue(new NotFoundError('Signing public key not found'));

    await expect(handler(makeEvent())).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(handler(makeEvent())).rejects.toThrow(ERROR_MESSAGE.UNAUTHORIZED);
  });

  test('logs BaseError code when presenter throws typed error', async () => {
    mockHandle.mockRejectedValue(new NotFoundError('Signing public key not found'));

    await expect(handler(makeEvent())).rejects.toThrow(ERROR_MESSAGE.UNAUTHORIZED);

    expect(logger.error).toHaveBeenCalledWith(
      'Signing public key not found',
      expect.objectContaining({ code: RESULT_CODE.NOT_FOUND }),
    );
  });

  test('logs generic error code when presenter throws non-BaseError', async () => {
    mockHandle.mockRejectedValue(new Error('unexpected failure'));

    await expect(handler(makeEvent())).rejects.toThrow(ERROR_MESSAGE.UNAUTHORIZED);

    expect(logger.error).toHaveBeenCalledWith(
      'unexpected failure',
      expect.objectContaining({ code: RESULT_CODE.UNAUTHORIZED }),
    );
  });
});
