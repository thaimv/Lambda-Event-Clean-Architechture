import type { LambdaInvokeInput, LambdaInvokeOutput } from '@common/types/datasources/lambda.type';

export interface ILambdaDatasource {
  invoke(input: LambdaInvokeInput): Promise<LambdaInvokeOutput>;

  invokeLambdaAsync(functionName: string, payload: unknown): Promise<void>;

  invokeLambdaSync<T>(functionName: string, payload: unknown): Promise<T>;
}
