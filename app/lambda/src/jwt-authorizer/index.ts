import { ERROR_MESSAGE, RESULT_CODE } from '@common/constants/response.const';
import { BaseError } from '@common/errors/base-error';
import { UnauthorizedError } from '@common/errors/unauthorized-error';
import { logger } from '@common/logger';
import { bootstrapApplication, getInstance } from '@lambda/config/di/di.config';
import { JWT_AUTHORIZER_DI_CONST } from '@lambda/jwt-authorizer/consts';
import { JwtAuthorizerModule } from '@lambda/jwt-authorizer/module';
import type { JwtAuthorizerPresenter } from '@lambda/jwt-authorizer/presenter/index.presenter';
import type { APIGatewayRequestAuthorizerEvent } from 'aws-lambda';

bootstrapApplication(JwtAuthorizerModule);

/**
 * Lambda function handler for API Gateway custom authorizer.
 * Must return a raw IAM policy (not SuccessResponse) and throw for unauthorized.
 * Reference: https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html
 * @param event APIGateway request authorizer event.
 */
export const handler = async (event: APIGatewayRequestAuthorizerEvent) => {
  logger.info('JWT authorizer', { methodArn: event.methodArn });
  try {
    const presenter = getInstance<JwtAuthorizerPresenter>(JWT_AUTHORIZER_DI_CONST.Presenter);
    return await presenter.handle(event);
  } catch (e) {
    const error = e as Error;
    logger.error(error.message, {
      code: error instanceof BaseError ? error.code : RESULT_CODE.UNAUTHORIZED,
      stacktrace: error.stack,
    });
    throw new UnauthorizedError(ERROR_MESSAGE.UNAUTHORIZED);
  }
};
