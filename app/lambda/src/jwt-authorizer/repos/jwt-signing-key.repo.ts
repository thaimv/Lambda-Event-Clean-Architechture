import type { JwtSigningKey } from '@lambda/jwt-authorizer/models/jwt-signing-key.model';

export interface IJwtSigningKeyRepo {
  getSigningKey(kid: string): Promise<JwtSigningKey | undefined>;
}
