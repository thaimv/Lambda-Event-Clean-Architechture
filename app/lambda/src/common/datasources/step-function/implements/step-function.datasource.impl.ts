import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { DI } from '@common/constants/di.const';
import type { IStepFunctionDatasource } from '@common/datasources/step-function/step-function.datasource';
import type {
  StartExecutionInput,
  StartExecutionOutput,
} from '@common/types/datasources/step-function.type';
import type { AppConfig } from '@lambda/config/app.config';
import { inject, injectable } from 'inversify';

@injectable()
export class StepFunctionDatasource implements IStepFunctionDatasource {
  private readonly client: SFNClient;

  constructor(
    @inject(DI.APP_CONFIG)
    appConfig: AppConfig,
  ) {
    this.client = new SFNClient({ region: appConfig.awsConfig.region });
  }

  async startExecution(input: StartExecutionInput): Promise<StartExecutionOutput> {
    const command = new StartExecutionCommand(input);
    return this.client.send(command);
  }
}
