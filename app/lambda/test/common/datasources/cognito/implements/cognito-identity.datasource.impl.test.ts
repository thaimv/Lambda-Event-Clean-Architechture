import {
  CognitoIdentityClient,
  DeleteIdentitiesCommand,
  GetIdCommand,
} from '@aws-sdk/client-cognito-identity';
import { CognitoIdentityDatasource } from '@common/datasources/cognito/implements/cognito-identity.datasource.impl';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockAppConfig } from '~/common/helpers/app-config.helper';

vi.mock('@aws-sdk/client-cognito-identity', () => ({
  CognitoIdentityClient: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
  })),
  DeleteIdentitiesCommand: vi.fn(),
  GetIdCommand: vi.fn(),
}));

vi.mock('inversify', () => ({
  injectable: () => (target: unknown) => target,
  inject: () => () => undefined,
}));

describe('CognitoIdentityDatasource', () => {
  let datasource: CognitoIdentityDatasource;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend = vi.fn();
    vi.mocked(CognitoIdentityClient).mockImplementation(
      () =>
        ({
          send: mockSend,
        }) as unknown as CognitoIdentityClient,
    );
    datasource = new CognitoIdentityDatasource(createMockAppConfig());
  });

  describe('deleteIdentities', () => {
    it('should delete multiple identities successfully', async () => {
      const identityIds = ['identity-1', 'identity-2'];
      mockSend.mockResolvedValue({ UnprocessedIdentityIds: [] });

      const result = await datasource.deleteIdentities(identityIds);

      expect(DeleteIdentitiesCommand).toHaveBeenCalledWith({
        IdentityIdsToDelete: identityIds,
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(result.UnprocessedIdentityIds).toEqual([]);
    });

    it('should return unprocessed identities when deletion fails', async () => {
      const identityIds = ['identity-1'];
      const unprocessed = [{ IdentityId: 'identity-1', ErrorCode: 'AccessDenied' }];
      mockSend.mockResolvedValue({ UnprocessedIdentityIds: unprocessed });

      const result = await datasource.deleteIdentities(identityIds);

      expect(result.UnprocessedIdentityIds).toEqual(unprocessed);
    });

    it('should throw error when client send fails', async () => {
      const identityIds = ['identity-1'];
      const error = new Error('Network error');
      mockSend.mockRejectedValue(error);

      await expect(datasource.deleteIdentities(identityIds)).rejects.toThrow('Network error');
    });

    it('should delete single identity', async () => {
      const identityIds = ['single-identity'];
      mockSend.mockResolvedValue({ UnprocessedIdentityIds: [] });

      await datasource.deleteIdentities(identityIds);

      expect(DeleteIdentitiesCommand).toHaveBeenCalledWith({
        IdentityIdsToDelete: ['single-identity'],
      });
    });

    it('should handle empty array', async () => {
      mockSend.mockResolvedValue({ UnprocessedIdentityIds: [] });

      const result = await datasource.deleteIdentities([]);

      expect(DeleteIdentitiesCommand).toHaveBeenCalledWith({
        IdentityIdsToDelete: [],
      });
      expect(result.UnprocessedIdentityIds).toEqual([]);
    });
  });

  describe('getIdentityForUserPoolToken', () => {
    it('should return identity id and echo the user pool id token', async () => {
      mockSend.mockResolvedValue({
        IdentityId: 'identity-123',
      });

      const result = await datasource.getIdentityForUserPoolToken('user-pool-id-token');

      expect(GetIdCommand).toHaveBeenCalledWith({
        IdentityPoolId: 'test-identity-pool',
        Logins: {
          'cognito-idp.us-east-1.amazonaws.com/us-east-1_test': 'user-pool-id-token',
        },
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        identityId: 'identity-123',
        token: 'user-pool-id-token',
      });
    });

    it('should default missing identity id to empty string', async () => {
      mockSend.mockResolvedValue({});

      const result = await datasource.getIdentityForUserPoolToken('user-pool-id-token');

      expect(result).toEqual({
        identityId: '',
        token: 'user-pool-id-token',
      });
    });
  });
});
