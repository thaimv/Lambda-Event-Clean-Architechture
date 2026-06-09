import { AthenaClient, GetQueryResultsCommand } from '@aws-sdk/client-athena';
import { DI } from '@common/constants/di.const';
import type { IAthenaDatasource } from '@common/datasources/athena/athena.datasource';
import type { QueryResultsInput, QueryResultsOutput } from '@common/types/datasources/athena.type';
import type { AppConfig } from '@lambda/config/app.config';
import { inject, injectable } from 'inversify';

@injectable()
export class AthenaDatasource implements IAthenaDatasource {
  private readonly client: AthenaClient;

  constructor(
    @inject(DI.APP_CONFIG)
    appConfig: AppConfig,
  ) {
    this.client = new AthenaClient({ region: appConfig.awsConfig.region });
  }

  async getQueryResults(input: QueryResultsInput): Promise<QueryResultsOutput> {
    return this.client.send(new GetQueryResultsCommand(input));
  }
}
