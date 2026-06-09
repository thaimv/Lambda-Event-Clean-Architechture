import { ValidationError } from '@common/errors/validation-error';
import { getAccessTokenFromRequest } from '@common/utils/access-token.util';
import { JWT_AUTHORIZER_DI_CONST } from '@lambda/jwt-authorizer/consts';
import { VerifyTokenRequestSchema } from '@lambda/jwt-authorizer/dtos/requests/verify-token.request.dto';
import type { AuthorizerResult } from '@lambda/jwt-authorizer/models/authorizer-result.model';
import type { IVerifyTokenUseCase } from '@lambda/jwt-authorizer/usecases/verify-token.uc';
import type { APIGatewayRequestAuthorizerEvent } from 'aws-lambda';
import { inject, injectable } from 'inversify';

@injectable()
export class JwtAuthorizerPresenter {
  constructor(
    @inject(JWT_AUTHORIZER_DI_CONST.VerifyTokenUseCase)
    private readonly useCase: IVerifyTokenUseCase,
  ) {}

  async handle(event: APIGatewayRequestAuthorizerEvent): Promise<AuthorizerResult> {
    const token = getAccessTokenFromRequest(event);

    const parsed = VerifyTokenRequestSchema.safeParse({
      token,
      methodArn: event.methodArn,
    });
    if (!parsed.success) {
      throw new ValidationError(parsed.error.message);
    }

    return this.useCase.execute(parsed.data);
  }
}
