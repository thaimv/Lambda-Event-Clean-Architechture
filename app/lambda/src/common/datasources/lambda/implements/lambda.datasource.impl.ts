import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DI } from '@common/constants/di.const';
import type { ILambdaDatasource } from '@common/datasources/lambda/lambda.datasource';
import type { LambdaInvokeInput, LambdaInvokeOutput } from '@common/types/datasources/lambda.type';
import type { AppConfig } from '@lambda/config/app.config';
import { inject, injectable } from 'inversify';

@injectable()
export class LambdaDatasource implements ILambdaDatasource {
  private readonly client: LambdaClient;

  constructor(
    @inject(DI.APP_CONFIG)
    appConfig: AppConfig,
  ) {
    this.client = new LambdaClient({
      region: appConfig.awsConfig.region,
    });
  }

  async invoke(input: LambdaInvokeInput): Promise<LambdaInvokeOutput> {
    return this.client.send(new InvokeCommand(input));
  }

  async invokeLambdaAsync(functionName: string, payload: unknown): Promise<void> {
    await this.invoke({
      FunctionName: functionName,
      InvocationType: 'Event',
      Payload: JSON.stringify(payload),
    });
  }

  async invokeLambdaSync<T>(functionName: string, payload: unknown): Promise<T> {
    const response = await this.invoke({
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload),
    });

    if (response.FunctionError) {
      throw new Error(
        `Lambda function ${functionName} returned an error: ${response.FunctionError}`,
      );
    }

    const payloadString = response.Payload ? Buffer.from(response.Payload).toString('utf-8') : '{}';

    return JSON.parse(payloadString) as T;
  }
}
