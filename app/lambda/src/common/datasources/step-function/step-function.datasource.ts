import type {
  StartExecutionInput,
  StartExecutionOutput,
} from '@common/types/datasources/step-function.type';

export interface IStepFunctionDatasource {
  /**
   * Starts a Step Functions execution.
   * @param input - The input for starting a Step Functions execution.
   * @returns The result of the execution.
   */
  startExecution(input: StartExecutionInput): Promise<StartExecutionOutput>;
}
