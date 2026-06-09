import type { Response } from '@common/types/response.type';
import type { Context } from 'aws-lambda';

/**
 * @type LambdaHandler
 * @description Lambda handler type for Lambda class
 * @param {TInput} input - The input
 * @param {Context} context - The context
 * @returns {Promise<TOutput>} - The output
 */
export type LambdaHandler<TInput, TOutput = void> = (
  input: TInput,
  context: Context,
) => Promise<TOutput>;

export type LambdaExecutionInput<TInput> = {
  input: TInput;
  context: Context;
};

export type LambdaExecutionOutput<TOutput> = {
  output: Response<TOutput>;
  error?: Error;
};
