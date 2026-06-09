import type {
  DeleteIdentitiesOutput,
  GetOpenIdTokenOutput,
} from '@common/types/datasources/cognito.type';

/**
 * Interface for Cognito Identity datasource operations
 */
export interface ICognitoIdentityDatasource {
  /**
   * Delete Cognito identities
   * @param identityIds - List of Identity IDs to delete
   * @returns Promise resolving to DeleteIdentitiesOutput
   */
  deleteIdentities(identityIds: string[]): Promise<DeleteIdentitiesOutput>;

  /**
   * Resolve a Cognito Identity Pool identity from a User Pool ID token.
   * @param idToken - Cognito User Pool ID token
   * @returns Promise resolving to identityId and the same ID token for downstream logins
   */
  getIdentityForUserPoolToken(idToken: string): Promise<GetOpenIdTokenOutput>;
}
