import type { Pipe } from '@common/lambda/pipeline';
import { Pipeline } from '@common/lambda/pipeline';
import { LambdaErrorHandlingPipe } from '@common/lambda/pipes/error-handling.pipe';
import { LambdaLoggingPipe } from '@common/lambda/pipes/logging.pipe';
import { SuccessResponse } from '@common/responses/success.response';
import type {
  LambdaExecutionInput,
  LambdaExecutionOutput,
  LambdaHandler,
} from '@common/types/lambda.type';
import type { Context } from 'aws-lambda';

/**
 * Generic Lambda wrapper class to standardize AWS Lambda handlers.
 */
export class Lambda<TInput, TOutput> {
  constructor(
    protected readonly handler: LambdaHandler<TInput, TOutput>,
    protected readonly pipes: Pipe<
      LambdaExecutionInput<TInput>,
      LambdaExecutionOutput<TOutput>
    >[] = [
      new LambdaLoggingPipe<TInput, TOutput>(),
      new LambdaErrorHandlingPipe<TInput, TOutput>(),
    ],
  ) {}

  createHandler() {
    return async (input: TInput, context: Context) => {
      const res = await new Pipeline<LambdaExecutionInput<TInput>, LambdaExecutionOutput<TOutput>>()
        .send({ input, context })
        .through(this.pipes)
        .then(async (passable) => {
          const data = await this.handler(passable.input, passable.context);
          const output =
            data instanceof SuccessResponse ? data.render() : new SuccessResponse(data).render();

          return { output };
        });

      return res.output;
    };
  }
}
