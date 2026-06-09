export type StartExecutionInput = {
  stateMachineArn: string;
  name?: string;
  input?: string;
  traceHeader?: string;
};

export type StartExecutionOutput = {
  executionArn?: string;
  startDate?: Date;
};
