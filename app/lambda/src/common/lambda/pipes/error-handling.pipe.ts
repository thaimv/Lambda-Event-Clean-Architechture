import { ERROR_MESSAGE } from '@common/constants/response.const';
import { BaseError } from '@common/errors/base-error';
import { InternalServerError } from '@common/errors/internal-server-error';
import { ValidationError } from '@common/errors/validation-error';
import type { NextFunction } from '@common/lambda/pipeline';
import { ErrorResponse } from '@common/responses/error.response';
import type { LambdaExecutionInput, LambdaExecutionOutput } from '@common/types/lambda.type';
import { ZodError } from 'zod';

/**
 * Pipe that handles errors during Lambda execution
 */
export class LambdaErrorHandlingPipe<TInput, TOutput> {
  async handle(
    passable: LambdaExecutionInput<TInput>,
    next: NextFunction<LambdaExecutionInput<TInput>, LambdaExecutionOutput<TOutput>>,
  ): Promise<LambdaExecutionOutput<TOutput>> {
    try {
      return await next(passable);
    } catch (error) {
      const appError = this.transformError(error as Error);
      const response = ErrorResponse.fromError(appError).render();

      return {
        output: response,
        error: error as Error,
      };
    }
  }

  transformError(error: Error): BaseError {
    if (error instanceof ZodError) {
      const errorFields = error.issues.map((e) => `${e.path} - ${e.message}`).join(', ');

      return new ValidationError(`Failed to validate: ${errorFields}`, error.flatten().fieldErrors);
    }

    if (error instanceof BaseError) {
      return error;
    }

    return new InternalServerError(ERROR_MESSAGE.INTERNAL_SERVER_ERROR);
  }
}
