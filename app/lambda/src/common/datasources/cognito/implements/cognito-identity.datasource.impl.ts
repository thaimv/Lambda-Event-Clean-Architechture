import {
  CognitoIdentityClient,
  DeleteIdentitiesCommand,
  GetIdCommand,
} from '@aws-sdk/client-cognito-identity';
import { DI } from '@common/constants/di.const';
import type { ICognitoIdentityDatasource } from '@common/datasources/cognito/cognito-identity.datasource';
import type {
  DeleteIdentitiesOutput,
  GetOpenIdTokenOutput,
} from '@common/types/datasources/cognito.type';
import type { AppConfig } from '@lambda/config/app.config';
import { inject, injectable } from 'inversify';

/**
 * Implementation of Cognito Identity datasource
 */
@injectable()
export class CognitoIdentityDatasource implements ICognitoIdentityDatasource {
  private readonly client: CognitoIdentityClient;

  constructor(
    @inject(DI.APP_CONFIG)
    private readonly appConfig: AppConfig,
  ) {
    this.client = new CognitoIdentityClient({
      region: appConfig.awsConfig.region,
    });
  }

  /**
   * Delete Cognito identities
   */
  async deleteIdentities(identityIds: string[]): Promise<DeleteIdentitiesOutput> {
    return this.client.send(
      new DeleteIdentitiesCommand({
        IdentityIdsToDelete: identityIds,
      }),
    );
  }

  /**
   * Resolve a Cognito Identity Pool identity from a User Pool ID token.
   */
  async getIdentityForUserPoolToken(idToken: string): Promise<GetOpenIdTokenOutput> {
    const { identityPoolId, userPoolLoginProvider } = this.appConfig.cognitoIdentityConfig;
    const logins = { [userPoolLoginProvider]: idToken };

    const response = await this.client.send(
      new GetIdCommand({
        IdentityPoolId: identityPoolId,
        Logins: logins,
      }),
    );

    return {
      identityId: response.IdentityId ?? '',
      token: idToken,
    };
  }
}
