import { HttpMethod } from '@common/constants/rest-api.const';
import type { IApiGatewayDatasource } from '@common/datasources/api-gateway/api-gateway.datasource';
import type { ICacheDatasource } from '@common/datasources/cache/cache.datasource';
import { BadRequestError } from '@common/errors/bad-request-error';
import type { AppConfig } from '@lambda/config/app.config';
import type { JwtSigningKey } from '@lambda/jwt-authorizer/models/jwt-signing-key.model';
import { JwtSigningKeyRepo } from '@lambda/jwt-authorizer/repos/implements/jwt-signing-key.repo.impl';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockAppConfig = {
  cognitoUserPoolConfig: {
    jwksUrl: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test/.well-known/jwks.json',
  },
} as AppConfig;

describe('JwtSigningKeyRepo', () => {
  let cacheMock: ICacheDatasource;
  let invokeMock: ReturnType<typeof vi.fn>;
  let apiGatewayMock: IApiGatewayDatasource;
  let getMock: ReturnType<typeof vi.fn>;
  let setMock: ReturnType<typeof vi.fn>;
  let repo: JwtSigningKeyRepo;

  const sampleJwk: JwtSigningKey = {
    kty: 'RSA',
    kid: 'test-kid',
    use: 'sig',
    n: 'modulus',
    e: 'AQAB',
    alg: 'RS256',
  };

  beforeEach(() => {
    getMock = vi.fn();
    setMock = vi.fn();
    invokeMock = vi.fn();

    cacheMock = { get: getMock, set: setMock, delete: vi.fn(), clear: vi.fn() };
    apiGatewayMock = { invoke: invokeMock };

    repo = new JwtSigningKeyRepo(mockAppConfig, apiGatewayMock, cacheMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSigningKey', () => {
    it('should return JWK from cache if present', async () => {
      getMock.mockResolvedValueOnce(sampleJwk);
      const jwk = await repo.getSigningKey('test-kid');
      expect(jwk).toEqual(sampleJwk);
      expect(getMock).toHaveBeenCalledWith('jwk-kid:test-kid');
      expect(invokeMock).not.toHaveBeenCalled();
    });

    it('should fetch JWKS from Cognito on cache miss and cache all keys', async () => {
      getMock.mockResolvedValueOnce(null);
      invokeMock.mockResolvedValueOnce({
        keys: [
          { ...sampleJwk, kid: 'test-kid' },
          { ...sampleJwk, kid: 'other-kid' },
        ],
      });
      const jwk = await repo.getSigningKey('test-kid');
      expect(invokeMock).toHaveBeenCalledWith(
        'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test/.well-known/jwks.json',
        HttpMethod.GET,
      );
      expect(setMock).toHaveBeenCalledWith('jwk-kid:test-kid', { ...sampleJwk, kid: 'test-kid' });
      expect(setMock).toHaveBeenCalledWith('jwk-kid:other-kid', expect.any(Object));
      expect(jwk).toEqual({ ...sampleJwk, kid: 'test-kid' });

      getMock.mockResolvedValueOnce(null);
      invokeMock.mockResolvedValueOnce({
        keys: [
          { ...sampleJwk, kid: 'other-kid2' },
          { ...sampleJwk, kid: 'other-kid3' },
        ],
      });

      const jwk2 = await repo.getSigningKey('other-kid3');
      expect(setMock).toHaveBeenCalledWith('jwk-kid:other-kid2', expect.any(Object));
      expect(setMock).toHaveBeenCalledWith('jwk-kid:other-kid3', expect.any(Object));
      expect(jwk2).toEqual({ ...sampleJwk, kid: 'other-kid3' });
    });

    it('should return undefined if JWK not found after fetching', async () => {
      getMock.mockResolvedValueOnce(null);
      invokeMock.mockResolvedValueOnce({ keys: [{ ...sampleJwk, kid: 'other-kid' }] });
      const jwk = await repo.getSigningKey('missing-kid');
      expect(jwk).toBeUndefined();
      expect(setMock).toHaveBeenCalledWith('jwk-kid:other-kid', expect.any(Object));
    });

    it('should propagate error when api gateway invoke fails', async () => {
      getMock.mockResolvedValueOnce(null);
      const error = new BadRequestError('call-api-gateway-failed: 404', '');
      invokeMock.mockRejectedValueOnce(error);

      await expect(repo.getSigningKey('test-kid')).rejects.toBe(error);
    });

    it('should fall back to JWKS when cache read fails', async () => {
      getMock.mockRejectedValueOnce(new Error('Connection error: Timeout'));
      invokeMock.mockResolvedValueOnce({ keys: [sampleJwk] });

      const jwk = await repo.getSigningKey('test-kid');

      expect(jwk).toEqual(sampleJwk);
      expect(invokeMock).toHaveBeenCalled();
    });

    it('should still return JWK when cache write fails', async () => {
      getMock.mockResolvedValueOnce(null);
      invokeMock.mockResolvedValueOnce({ keys: [sampleJwk] });
      setMock.mockRejectedValueOnce(new Error('Connection error: Timeout'));

      const jwk = await repo.getSigningKey('test-kid');

      expect(jwk).toEqual(sampleJwk);
    });
  });
});
