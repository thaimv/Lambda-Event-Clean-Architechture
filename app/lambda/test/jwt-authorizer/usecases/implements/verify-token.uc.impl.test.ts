import { NotFoundError } from '@common/errors/notfound-error';
import { UnauthorizedError } from '@common/errors/unauthorized-error';
import type { AppConfig } from '@lambda/config/app.config';
import type { IJwtSigningKeyRepo } from '@lambda/jwt-authorizer/repos/jwt-signing-key.repo';
import { VerifyTokenUseCase } from '@lambda/jwt-authorizer/usecases/implements/verify-token.uc.impl';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('jsonwebtoken');
vi.mock('jwk-to-pem');

const mockAppConfig = {
  cognitoUserPoolConfig: {
    issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
    clientId: 'test-client-id',
  },
} as AppConfig;

const FAKE_KID = 'test-kid';
const FAKE_ALG = 'RS256';
const FAKE_JWK = { kty: 'RSA', kid: FAKE_KID, n: 'n', e: 'e' };
const FAKE_PEM = '-----BEGIN PUBLIC KEY-----\nFAKE\n-----END PUBLIC KEY-----';
const FAKE_PAYLOAD = {
  iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
  token_use: 'id',
  aud: 'test-client-id',
  sub: 'user123',
};
const FAKE_HEADER = { alg: FAKE_ALG, kid: FAKE_KID };
const METHOD_ARN = 'test1:test2:test3:test4:test5:test6';

function makeJwt(header = FAKE_HEADER, payload = FAKE_PAYLOAD) {
  const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  return [encode(header), encode(payload), 'signature'].join('.');
}

function makeRequest(token: string) {
  return {
    token,
    methodArn: METHOD_ARN,
  };
}

describe('VerifyTokenUseCase', () => {
  let useCase: VerifyTokenUseCase;
  let mockJwtSigningKeyRepo: IJwtSigningKeyRepo;
  let getSigningKeyMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    getSigningKeyMock = vi.fn().mockResolvedValue(FAKE_JWK);
    mockJwtSigningKeyRepo = { getSigningKey: getSigningKeyMock };
    useCase = new VerifyTokenUseCase(mockJwtSigningKeyRepo, mockAppConfig);
    (jwkToPem as unknown as ReturnType<typeof vi.fn>).mockReturnValue(FAKE_PEM);
    (jwt.verify as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {});
  });

  it('verifies a valid token and returns allow policy', async () => {
    const token = makeJwt();
    const result = await useCase.execute(makeRequest(token));

    expect(getSigningKeyMock).toHaveBeenCalledWith(FAKE_KID);
    expect(jwkToPem).toHaveBeenCalledWith(FAKE_JWK);
    expect(jwt.verify).toHaveBeenCalledWith(token, FAKE_PEM, { algorithms: [FAKE_ALG] });
    expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
    expect(result.policyDocument.Statement[0].Resource).toBe(METHOD_ARN);
  });

  it('throws UnauthorizedError if issuer does not match', async () => {
    const token = makeJwt(FAKE_HEADER, { ...FAKE_PAYLOAD, iss: 'https://invalid-issuer' });
    await expect(useCase.execute(makeRequest(token))).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(useCase.execute(makeRequest(token))).rejects.toThrow('Invalid token issuer');
  });

  it('throws UnauthorizedError if token_use is not id', async () => {
    const token = makeJwt(FAKE_HEADER, { ...FAKE_PAYLOAD, token_use: 'access' });
    await expect(useCase.execute(makeRequest(token))).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(useCase.execute(makeRequest(token))).rejects.toThrow('Invalid token use');
  });

  it('throws UnauthorizedError if audience does not match', async () => {
    const token = makeJwt(FAKE_HEADER, { ...FAKE_PAYLOAD, aud: 'wrong-client-id' });
    await expect(useCase.execute(makeRequest(token))).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(useCase.execute(makeRequest(token))).rejects.toThrow('Invalid token audience');
  });

  it('accepts audience provided as an array containing the client id', async () => {
    const token = makeJwt(FAKE_HEADER, {
      ...FAKE_PAYLOAD,
      aud: ['other-client-id', 'test-client-id'],
    });

    const result = await useCase.execute(makeRequest(token));

    expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
  });

  it('throws NotFoundError if signing public key not found', async () => {
    getSigningKeyMock.mockResolvedValue(undefined);
    const token = makeJwt();
    await expect(useCase.execute(makeRequest(token))).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCase.execute(makeRequest(token))).rejects.toThrow(
      'Signing public key not found',
    );
  });

  it('throws UnauthorizedError if token format is invalid', async () => {
    await expect(useCase.execute(makeRequest('invalid-token'))).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    await expect(useCase.execute(makeRequest('invalid-token'))).rejects.toThrow(
      'Invalid token format',
    );
  });

  it('throws UnauthorizedError if jwt.verify throws', async () => {
    (jwt.verify as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('invalid signature');
    });
    const token = makeJwt();
    await expect(useCase.execute(makeRequest(token))).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(useCase.execute(makeRequest(token))).rejects.toThrow('Invalid token signature');
  });
});
