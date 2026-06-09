import { DI } from '@common/constants/di.const';
import { NotFoundError } from '@common/errors/notfound-error';
import { UnauthorizedError } from '@common/errors/unauthorized-error';
import type { AppConfig } from '@lambda/config/app.config';
import { AUTHORIZER_POLICY_CONST, JWT_AUTHORIZER_DI_CONST } from '@lambda/jwt-authorizer/consts';
import type { VerifyTokenRequestDto } from '@lambda/jwt-authorizer/dtos/requests/verify-token.request.dto';
import type { AuthorizerResult } from '@lambda/jwt-authorizer/models/authorizer-result.model';
import type { IJwtSigningKeyRepo } from '@lambda/jwt-authorizer/repos/jwt-signing-key.repo';
import type { IVerifyTokenUseCase } from '@lambda/jwt-authorizer/usecases/verify-token.uc';
import { inject, injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

@injectable()
export class VerifyTokenUseCase implements IVerifyTokenUseCase {
  constructor(
    @inject(JWT_AUTHORIZER_DI_CONST.JwtSigningKeyRepo)
    private readonly jwtSigningKeyRepo: IJwtSigningKeyRepo,
    @inject(DI.APP_CONFIG)
    private readonly appConfig: AppConfig,
  ) {}

  async execute(request: VerifyTokenRequestDto): Promise<AuthorizerResult> {
    const tokens = request.token.split('.');

    let jwtPayload: Record<string, unknown>;
    let jwtHeader: Record<string, unknown>;
    try {
      jwtPayload = JSON.parse(Buffer.from(tokens[1], 'base64').toString());
      jwtHeader = JSON.parse(Buffer.from(tokens[0], 'base64').toString());
    } catch {
      throw new UnauthorizedError('Invalid token format');
    }

    const { issuer, clientId } = this.appConfig.cognitoUserPoolConfig;

    if (jwtPayload['iss'] !== issuer) {
      throw new UnauthorizedError('Invalid token issuer');
    }

    if (jwtPayload['token_use'] !== 'id') {
      throw new UnauthorizedError('Invalid token use');
    }

    const audience = jwtPayload['aud'];
    const audienceMatches =
      audience === clientId || (Array.isArray(audience) && audience.includes(clientId));
    if (!audienceMatches) {
      throw new UnauthorizedError('Invalid token audience');
    }

    const key = await this.jwtSigningKeyRepo.getSigningKey(jwtHeader['kid'] as string);
    if (!key) {
      throw new NotFoundError('Signing public key not found');
    }

    try {
      jwt.verify(request.token, jwkToPem(key as Parameters<typeof jwkToPem>[0]), {
        algorithms: [jwtHeader['alg'] as jwt.Algorithm],
      });
    } catch {
      throw new UnauthorizedError('Invalid token signature');
    }

    return this.buildAuthorizerResult('', 'Allow', request.methodArn);
  }

  private buildAuthorizerResult(
    principalId: string,
    effect: 'Allow' | 'Deny',
    resource: string,
  ): AuthorizerResult {
    return {
      principalId,
      policyDocument: {
        Version: AUTHORIZER_POLICY_CONST.VERSION,
        Statement: [{ Action: AUTHORIZER_POLICY_CONST.ACTION, Effect: effect, Resource: resource }],
      },
    };
  }
}
