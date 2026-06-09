import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { DI } from '@common/constants/di.const';
import type { ICloudWatchMetricsDatasource } from '@common/datasources/cloudwatch/cloudwatch-metrics.datasource';
import type {
  PutMetricDataInput,
  PutMetricDataOutput,
} from '@common/types/datasources/cloudwatch.type';
import type { AppConfig } from '@lambda/config/app.config';
import { inject, injectable } from 'inversify';

/**
 * CloudWatch Metrics provider implementation.
 */
@injectable()
export class CloudWatchMetricsDatasource implements ICloudWatchMetricsDatasource {
  private readonly client: CloudWatchClient;

  constructor(
    @inject(DI.APP_CONFIG)
    appConfig: AppConfig,
  ) {
    this.client = new CloudWatchClient({ region: appConfig.awsConfig.region });
  }

  /**
   * Put metric data to CloudWatch.
   */
  async putMetricData(input: PutMetricDataInput): Promise<PutMetricDataOutput> {
    const command = new PutMetricDataCommand(input);
    return await this.client.send(command);
  }
}
