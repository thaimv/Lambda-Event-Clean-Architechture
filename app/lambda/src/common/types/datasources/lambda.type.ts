export type LambdaInvokeInput = {
  FunctionName: string;
  InvocationType?: 'Event' | 'RequestResponse' | 'DryRun';
  Payload?: Uint8Array | string;
  ClientContext?: string;
  Qualifier?: string;
};

export type LambdaInvokeOutput = {
  StatusCode?: number;
  Payload?: Uint8Array;
  FunctionError?: string;
  ExecutedVersion?: string;
  LogResult?: string;
};
