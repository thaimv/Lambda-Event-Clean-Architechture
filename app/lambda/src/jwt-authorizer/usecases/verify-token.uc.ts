import type { VerifyTokenRequestDto } from '@lambda/jwt-authorizer/dtos/requests/verify-token.request.dto';
import type { AuthorizerResult } from '@lambda/jwt-authorizer/models/authorizer-result.model';

export interface IVerifyTokenUseCase {
  execute(request: VerifyTokenRequestDto): Promise<AuthorizerResult>;
}
