import {
  CognitoIdentityClient,
  GetCredentialsForIdentityCommand,
  GetIdCommand,
} from '@aws-sdk/client-cognito-identity';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';

export type CognitoConfig = {
  region: string;
  userPoolId: string;
  clientId: string;
  identityPoolId: string;
};

export type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};

export type LoginResult = {
  credentials: AwsCredentials;
  idToken: string;
};

/** Decode Cognito User Pool `sub` claim from a JWT idToken. */
export function parseCognitoSubFromIdToken(idToken: string): string {
  const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString()) as {
    sub?: string;
  };

  if (!payload.sub) {
    throw new Error('Cognito idToken missing sub claim');
  }

  return payload.sub;
}

/**
 * Handles Cognito User Pool authentication and exchanges the resulting
 * idToken for temporary AWS credentials via Cognito Identity Pool.
 *
 * Flow:
 *   1. InitiateAuth (USER_PASSWORD_AUTH) → idToken
 *   2. GetId (Identity Pool) → identityId
 *   3. GetCredentialsForIdentity → { accessKeyId, secretAccessKey, sessionToken }
 */
export class CognitoAuth {
  constructor(private readonly config: CognitoConfig) {}

  async login(username: string, password: string): Promise<LoginResult> {
    const idToken = await this.getIdToken(username, password);
    const identityId = await this.getIdentityId(idToken);
    const credentials = await this.getCredentials(identityId, idToken);
    return { credentials, idToken };
  }

  /** Cognito User Pool idToken — for authorizer E2E (no Identity Pool exchange). */
  async getIdToken(username: string, password: string): Promise<string> {
    return this.fetchIdToken(username, password);
  }

  private async fetchIdToken(username: string, password: string): Promise<string> {
    const client = new CognitoIdentityProviderClient({ region: this.config.region });

    const { AuthenticationResult } = await client.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.config.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      }),
    );

    const idToken = AuthenticationResult?.IdToken;
    if (!idToken) throw new Error('Cognito login failed: no idToken in response');
    return idToken;
  }

  private async getIdentityId(idToken: string): Promise<string> {
    const client = new CognitoIdentityClient({ region: this.config.region });
    const loginKey = `cognito-idp.${this.config.region}.amazonaws.com/${this.config.userPoolId}`;

    const { IdentityId } = await client.send(
      new GetIdCommand({
        IdentityPoolId: this.config.identityPoolId,
        Logins: { [loginKey]: idToken },
      }),
    );

    if (!IdentityId) throw new Error('Cognito: could not retrieve Identity ID');
    return IdentityId;
  }

  private async getCredentials(identityId: string, idToken: string): Promise<AwsCredentials> {
    const client = new CognitoIdentityClient({ region: this.config.region });
    const loginKey = `cognito-idp.${this.config.region}.amazonaws.com/${this.config.userPoolId}`;

    const { Credentials } = await client.send(
      new GetCredentialsForIdentityCommand({
        IdentityId: identityId,
        Logins: { [loginKey]: idToken },
      }),
    );

    if (!Credentials?.AccessKeyId || !Credentials?.SecretKey) {
      throw new Error('Cognito: could not retrieve temporary AWS credentials');
    }

    return {
      accessKeyId: Credentials.AccessKeyId,
      secretAccessKey: Credentials.SecretKey,
      sessionToken: Credentials.SessionToken ?? '',
    };
  }
}
