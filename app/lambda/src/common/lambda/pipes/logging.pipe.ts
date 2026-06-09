import type { NextFunction } from '@common/lambda/pipeline';
import { logger, primaryLogger } from '@common/logger';
import type { LambdaExecutionInput, LambdaExecutionOutput } from '@common/types/lambda.type';
import { getLambdaRequestLogInput } from '@common/utils/lambda-request-log.util';

/**
 * Pipe that logs the input and output of a Lambda execution
 * according to the standardized API log format
 */
export class LambdaLoggingPipe<TInput, TOutput> {
  async handle(
    passable: LambdaExecutionInput<TInput>,
    next: NextFunction<LambdaExecutionInput<TInput>, LambdaExecutionOutput<TOutput>>,
  ): Promise<LambdaExecutionOutput<TOutput>> {
    logger.addContext(passable.context);
    primaryLogger.addContext(passable.context);

    const res = await next(passable);

    primaryLogger.info(res.output.result.message, {
      apiName: passable.context.functionName,
      result: {
        ...res.output.result,
        status: res.error ? 'Failure' : 'Success',
      },
      input: getLambdaRequestLogInput(passable.input),
      output: res.output.data ?? res.output.error,
      error: res.error ? { message: res.error.message, trace: res.error.stack } : undefined,
    });

    return res;
  }
}
