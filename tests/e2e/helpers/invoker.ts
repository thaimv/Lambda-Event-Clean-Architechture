import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';

type AwsConfig = {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
};

export type AuthorizerResultPayload = {
  principalId: string;
  policyDocument: {
    Version: string;
    Statement: { Action: string; Effect: 'Allow' | 'Deny'; Resource: string }[];
  };
};

export type LambdaInvokeResult = {
  /** HTTP status from Lambda service (200 = invocation accepted, 4xx/5xx = infra error) */
  statusCode: number | undefined;
  /** Set when the Lambda handler throws (e.g. authorizer Unauthorized) */
  functionError?: string;
  /** Parsed `result` field from Lambda response payload */
  result?: { code: string; message: string };
  /** Parsed `error` field from Lambda response payload (present on domain errors) */
  error?: { error_message: string; error_detail: unknown };
  /** Parsed IAM policy when the handler returns an authorizer result */
  authorizer?: AuthorizerResultPayload;
  /** Full raw response payload string for custom assertions */
  rawPayload: string;
};

export class Invoker {
  private readonly client: LambdaClient;

  constructor(private readonly awsConfig: AwsConfig) {
    this.client = new LambdaClient({
      region: awsConfig.region,
      credentials: awsConfig.credentials,
    });
  }

  /**
   * Invokes a deployed Lambda function synchronously and returns parsed response.
   *
   * @param functionArn ARN or name of the Lambda function
   * @param event       Raw event payload (defaults to empty object)
   */
  async invoke(
    functionArn: string,
    event: Record<string, unknown> = {},
  ): Promise<LambdaInvokeResult> {
    const command = new InvokeCommand({
      FunctionName: functionArn,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(event),
    });

    const response = await this.client.send(command);
    const rawPayload = response.Payload ? Buffer.from(response.Payload).toString() : '';

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(rawPayload);
    } catch {
      // non-JSON payload — rawPayload still available
    }

    const authorizer =
      !response.FunctionError && parsed.policyDocument
        ? (parsed as AuthorizerResultPayload)
        : undefined;

    return {
      statusCode: response.StatusCode,
      functionError: response.FunctionError,
      result: parsed.result as LambdaInvokeResult['result'],
      error: parsed.error as LambdaInvokeResult['error'],
      authorizer,
      rawPayload,
    };
  }
}
